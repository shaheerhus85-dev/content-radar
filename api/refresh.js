import { createHash } from 'node:crypto';
import { parseFeedXml } from './lib/feedParser.js';

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

const fetchXml = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
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

const summarizeRawSnippet = (rawSnippet) => {
  if (!rawSnippet) return 'Parsed source update ready for review.';
  return rawSnippet.length > 260 ? `${rawSnippet.slice(0, 257).trim()}...` : rawSnippet;
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
        const xml = await fetchXml(source.url);
        const parsedItems = parseFeedXml(xml, MAX_ITEMS_PER_SOURCE);

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

          await itemRef.set({
            sourceId: sourceDoc.id,
            sourceName,
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            rawSnippet: item.rawSnippet,
            summary: summarizeRawSnippet(item.rawSnippet),
            topic: 'Uncategorized',
            keyTakeaway: '',
            actionNote: 'Review this update.',
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
