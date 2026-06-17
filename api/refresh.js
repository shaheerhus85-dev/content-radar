import { createHash } from 'node:crypto';
import { parseFeedXml } from './lib/feedParser.js';
import {
  buildFailedAiFields,
  buildSkippedAiFields,
  buildSummarizedAiFields,
  generateGeminiInsight,
  hasGeminiApiKey,
} from './lib/geminiInsights.js';

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

const decodeHtmlEntities = (value) => (
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
);

const parseWebpageItem = (html, url) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
  const title = titleMatch?.[1]
    ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim()
    : new URL(url).hostname;
  const rawSnippet = descriptionMatch?.[1]
    ? decodeHtmlEntities(descriptionMatch[1]).replace(/\s+/g, ' ').trim()
    : `Page watch checked ${url}`;

  return [{
    title,
    url,
    publishedAt: null,
    rawSnippet,
  }];
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
    const failedSources = [];

    for (const sourceDoc of sourcesSnapshot.docs) {
      const source = sourceDoc.data();
      const sourceName = source.name || 'Unnamed source';

      if (!source.url) {
        failedSources.push({
          sourceId: sourceDoc.id,
          sourceName,
          error: 'Source URL is missing.',
        });
        continue;
      }

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

        for (const item of parsedItems) {
          const itemId = hashUrl(item.url);
          const itemRef = adminDb
            .collection('users')
            .doc(uid)
            .collection('items')
            .doc(itemId);
          const existingItem = await itemRef.get();

          if (existingItem.exists) {
            skippedDuplicates++;
            continue;
          }

          const fallbackSummary = summarizeRawSnippet(item.rawSnippet);
          let aiFields = buildSkippedAiFields();

          if (hasGeminiApiKey()) {
            try {
              const aiInsight = await generateGeminiInsight({
                item,
                source,
                sourceName,
                fallbackSummary,
              });

              if (aiInsight) {
                aiFields = buildSummarizedAiFields(FieldValue, aiInsight);
                aiSummarized++;
              }
            } catch (error) {
              aiFields = buildFailedAiFields(FieldValue, error);
              console.error(`Gemini insight generation failed for ${item.url}.`, {
                name: aiFields.aiErrorName,
                code: aiFields.aiErrorCode,
                status: aiFields.aiErrorStatus,
                message: aiFields.aiErrorMessage,
              });
              aiFailed++;
            }
          } else {
            aiSkipped++;
          }

          await itemRef.set({
            sourceId: sourceDoc.id,
            sourceName,
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

          newItems++;
        }

        await sourceDoc.ref.update({
          lastFetchedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        failedSources.push({
          sourceId: sourceDoc.id,
          sourceName,
          error: error instanceof Error ? error.message : 'Unknown feed parsing error.',
        });
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
