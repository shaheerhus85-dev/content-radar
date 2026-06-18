import { createHash } from 'node:crypto';
import { parseFeedXml } from './lib/feedParser.js';
import {
  buildFailedAiFields,
  buildSkippedAiFields,
  buildSummarizedAiFields,
  generateInsightForItem,
} from './lib/aiInsightService.js';

const MAX_ITEMS_PER_SOURCE = 10;
const FETCH_TIMEOUT_MS = 15_000;

const getBearerToken = (authorizationHeader) => {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
};

const hashUrl = (url) =>
  createHash('sha256').update(url.trim().toLowerCase()).digest('hex');

const fetchSourceText = async (url, sourceType = 'rss') => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const acceptsHtml = sourceType === 'webpage';

  try {
    const response = await fetch(url, {
      headers: {
        Accept: acceptsHtml
          ? 'text/html, application/xhtml+xml;q=0.9, */*;q=0.8'
          : 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'ContentRadar/1.0 (+https://github.com/shaheerhus85-dev/content-radar)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

const getFallbackUrl = (source) => (
  source.discoveredFrom || source.originalUrl || source.homepageUrl || source.url
);

const decodeHtmlEntities = (value) => (
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
);

const getAttributeValue = (html, tagPattern, attributeName) => {
  const tagMatch = html.match(tagPattern);
  if (!tagMatch?.[0]) return '';

  const attributeMatch = tagMatch[0].match(new RegExp(`${attributeName}=["']([^"']+)["']`, 'i'));
  return attributeMatch?.[1] ? decodeHtmlEntities(attributeMatch[1]).replace(/\s+/g, ' ').trim() : '';
};

const parseWebpageItem = (html, url) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  const canonicalUrl = getAttributeValue(html, /<link[^>]+rel=["']canonical["'][^>]*>/i, 'href')
    || getAttributeValue(html, /<link[^>]+href=["'][^"']+["'][^>]+rel=["']canonical["'][^>]*>/i, 'href');
  const resolvedUrl = canonicalUrl ? new URL(canonicalUrl, url).toString() : url;
  const title = titleMatch?.[1]
    ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim()
    : new URL(resolvedUrl).hostname;
  const rawSnippet = descriptionMatch?.[1]
    ? decodeHtmlEntities(descriptionMatch[1]).replace(/\s+/g, ' ').trim()
    : 'Website page saved for monitoring.';

  return [{
    title,
    url: resolvedUrl,
    publishedAt: null,
    rawSnippet,
    sourceType: 'webpage',
  }];
};

const getSafeSourceMessage = (status, reason) => {
  if (status === 'success') return 'Source refreshed successfully.';
  if (status === 'fallback') return 'Feed items were unavailable, so a webpage fallback was saved.';
  if (/filter/i.test(reason || '')) return 'No usable items matched the current source filters.';
  return 'No accessible feed or page metadata found. Try another URL or source.';
};

const summarizeRawSnippet = (rawSnippet) => {
  if (!rawSnippet) return 'Parsed source update ready for review.';
  return rawSnippet.length > 260 ? `${rawSnippet.slice(0, 257).trim()}...` : rawSnippet;
};

const getMaxItemsPerRefresh = (source) => {
  const configuredMax = Number(source.maxItemsPerRefresh);
  if (!Number.isFinite(configuredMax)) return MAX_ITEMS_PER_SOURCE;

  return Math.max(1, Math.min(50, Math.floor(configuredMax)));
};

const matchesPatternList = (item, patterns) => {
  if (!Array.isArray(patterns) || patterns.length === 0) return false;

  const searchableText = `${item.title || ''} ${item.url || ''} ${item.rawSnippet || ''}`.toLowerCase();
  return patterns.some((pattern) => {
    if (typeof pattern !== 'string' || !pattern.trim()) return false;
    return searchableText.includes(pattern.trim().toLowerCase());
  });
};

const applySourceFilters = (items, source) => {
  const includePatterns = Array.isArray(source.includePatterns) ? source.includePatterns : [];
  const excludePatterns = Array.isArray(source.excludePatterns) ? source.excludePatterns : [];

  return items.filter((item) => {
    if (includePatterns.length > 0 && !matchesPatternList(item, includePatterns)) {
      return false;
    }

    return !matchesPatternList(item, excludePatterns);
  });
};

const saveParsedItem = async ({
  adminDb,
  FieldValue,
  uid,
  sourceDoc,
  source,
  sourceName,
  item,
  sourceType,
}) => {
  const itemId = hashUrl(item.url);
  const itemRef = adminDb
    .collection('users')
    .doc(uid)
    .collection('items')
    .doc(itemId);
  const existingItem = await itemRef.get();

  if (existingItem.exists) {
    return {
      saved: false,
      duplicate: true,
      aiStatus: null,
      fromCache: false,
    };
  }

  const fallbackSummary = summarizeRawSnippet(item.rawSnippet);
  let aiFields = buildSkippedAiFields();

  const aiResult = await generateInsightForItem({
    item,
    source: {
      ...source,
      type: sourceType || source.type || 'rss',
    },
    sourceName,
    fallbackSummary,
    adminDb,
    FieldValue,
  });

  if (aiResult.status === 'summarized') {
    aiFields = buildSummarizedAiFields(FieldValue, aiResult);
  } else if (aiResult.status !== 'skipped') {
    aiFields = buildFailedAiFields(FieldValue, aiResult);
    console.error(`AI insight generation failed for ${item.url}.`, {
      status: aiFields.aiStatus,
      provider: aiFields.aiProvider,
      name: aiFields.aiErrorName,
      code: aiFields.aiErrorCode,
      httpStatus: aiFields.aiErrorStatus,
      message: aiFields.aiErrorMessage,
    });
  }

  await itemRef.set({
    sourceId: sourceDoc.id,
    sourceName,
    sourceType: sourceType || source.type || 'rss',
    title: item.title,
    url: item.url,
    publishedAt: item.publishedAt,
    rawSnippet: item.rawSnippet,
    summary: aiFields.aiSummary || fallbackSummary,
    topic: aiFields.topic || 'Uncategorized',
    keyTakeaway: '',
    actionNote: aiFields.actionProposal || 'Review this update.',
    signalType: aiFields.signalType || 'Other',
    whyItMatters: aiFields.whyItMatters || '',
    actionProposal: aiFields.actionProposal || '',
    relevanceScore: aiFields.relevanceScore || null,
    ...aiFields,
    status: 'parsed',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    saved: true,
    duplicate: false,
    aiStatus: aiFields.aiStatus,
    fromCache: aiResult.fromCache === true,
  };
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  // Basic auth header check before loading Firebase Admin (lazy import)
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing Firebase ID token.' });
  }

  let adminAuth, adminDb, FieldValue;
  try {
    const adminMod = await import('./lib/firebaseAdmin.js');
    adminAuth = adminMod.getAdminAuth();
    adminDb = adminMod.getAdminDb();
    FieldValue = adminMod.FieldValue;
  } catch (err) {
    if (err?.name === 'MissingFirebaseAdminEnvError' && Array.isArray(err.missing)) {
      return res.status(500).json({
        success: false,
        error: 'Server Firebase Admin configuration is missing.',
        missing: err.missing,
      });
    }

    console.error('Firebase Admin import failed.', err);
    return res.status(500).json({
      success: false,
      error: 'Server Firebase Admin configuration is missing or invalid.',
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid } = decodedToken;

    const sourcesSnapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('sources')
      .where('status', '==', 'active')
      .get();

    let newItems = 0;
    let skippedDuplicates = 0;
    let aiSummarized = 0;
    let aiSkipped = 0;
    let aiFailed = 0;
    let aiQuotaLimited = 0;
    let aiCached = 0;
    let fallbackItemsSaved = 0;
    const sourceResults = [];
    const failedSources = [];

    const tallySaveResult = (saveResult) => {
      if (saveResult.duplicate) {
        skippedDuplicates++;
        return;
      }

      if (!saveResult.saved) return;

      newItems++;
      if (saveResult.aiStatus === 'summarized') {
        if (saveResult.fromCache) {
          aiCached++;
        } else {
          aiSummarized++;
        }
      } else if (saveResult.aiStatus === 'quota_limited') {
        aiQuotaLimited++;
      } else if (saveResult.aiStatus === 'failed') {
        aiFailed++;
      } else {
        aiSkipped++;
      }
    };

    for (const sourceDoc of sourcesSnapshot.docs) {
      const source = sourceDoc.data();
      const sourceName = source.name || 'Unnamed source';

      if (!source.url) {
        const message = 'No accessible feed or page metadata found. Try another URL or source.';
        failedSources.push({
          sourceId: sourceDoc.id,
          sourceName,
          error: message,
        });
        sourceResults.push({
          sourceId: sourceDoc.id,
          sourceName,
          status: 'failed',
          itemsSaved: 0,
          reason: message,
        });
        await sourceDoc.ref.update({
          lastRefreshStatus: 'failed',
          lastRefreshMessage: message,
          lastCheckedAt: FieldValue.serverTimestamp(),
          lastFailureAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        continue;
      }

      let sourceStatus = 'failed';
      let sourceMessage = '';
      let sourceItemsSaved = 0;

      try {
        const sourceType = source.type || 'rss';
        const sourceText = await fetchSourceText(source.url, sourceType);
        const maxItemsPerRefresh = getMaxItemsPerRefresh(source);
        const parsedItems = applySourceFilters(
          sourceType === 'webpage'
            ? parseWebpageItem(sourceText, source.url)
            : parseFeedXml(sourceText, maxItemsPerRefresh),
          source,
        ).slice(0, maxItemsPerRefresh);

        if (parsedItems.length === 0) {
          throw new Error('No usable feed items were found.');
        }

        for (const item of parsedItems) {
          const saveResult = await saveParsedItem({
            adminDb,
            FieldValue,
            uid,
            sourceDoc,
            item,
            source,
            sourceName,
            sourceType,
          });

          tallySaveResult(saveResult);
          if (saveResult.saved) {
            sourceItemsSaved++;
          }
        }

        sourceStatus = 'success';
        sourceMessage = getSafeSourceMessage('success');
        sourceResults.push({
          sourceId: sourceDoc.id,
          sourceName,
          status: sourceStatus,
          itemsSaved: sourceItemsSaved,
          reason: sourceMessage,
        });

        await sourceDoc.ref.update({
          lastFetchedAt: FieldValue.serverTimestamp(),
          lastRefreshStatus: sourceStatus,
          lastRefreshMessage: sourceMessage,
          lastCheckedAt: FieldValue.serverTimestamp(),
          lastSuccessAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        try {
          const fallbackUrl = getFallbackUrl(source);
          const fallbackText = await fetchSourceText(fallbackUrl, 'webpage');
          const fallbackItems = parseWebpageItem(fallbackText, fallbackUrl).slice(0, 1);

          if (fallbackItems.length === 0) {
            throw new Error('No page metadata found.');
          }

          const fallbackSaveResult = await saveParsedItem({
            adminDb,
            FieldValue,
            uid,
            sourceDoc,
            item: fallbackItems[0],
            source,
            sourceName,
            sourceType: 'webpage',
          });

          tallySaveResult(fallbackSaveResult);
          if (fallbackSaveResult.saved) {
            fallbackItemsSaved++;
            sourceItemsSaved++;
          }

          sourceStatus = 'fallback';
          sourceMessage = fallbackSaveResult.duplicate
            ? 'Feed items were unavailable, and the webpage fallback was already saved.'
            : getSafeSourceMessage('fallback');
          sourceResults.push({
            sourceId: sourceDoc.id,
            sourceName,
            status: sourceStatus,
            itemsSaved: sourceItemsSaved,
            reason: sourceMessage,
          });

          await sourceDoc.ref.update({
            lastFetchedAt: FieldValue.serverTimestamp(),
            lastRefreshStatus: sourceStatus,
            lastRefreshMessage: sourceMessage,
            lastCheckedAt: FieldValue.serverTimestamp(),
            lastSuccessAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (fallbackError) {
          sourceStatus = 'failed';
          sourceMessage = getSafeSourceMessage('failed', error?.message || fallbackError?.message);
          failedSources.push({
            sourceId: sourceDoc.id,
            sourceName,
            error: sourceMessage,
          });
          sourceResults.push({
            sourceId: sourceDoc.id,
            sourceName,
            status: sourceStatus,
            itemsSaved: 0,
            reason: sourceMessage,
          });

          await sourceDoc.ref.update({
            lastRefreshStatus: sourceStatus,
            lastRefreshMessage: sourceMessage,
            lastCheckedAt: FieldValue.serverTimestamp(),
            lastFailureAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      sourcesChecked: sourcesSnapshot.size,
      newItems,
      skippedDuplicates,
      aiSummarized,
      aiSkipped,
      aiFailed,
      aiQuotaLimited,
      aiCached,
      fallbackItemsSaved,
      sourceResults,
      failedSources,
    });
  } catch (error) {
    console.error('Refresh API failed.', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to refresh sources.',
    });
  }
}
