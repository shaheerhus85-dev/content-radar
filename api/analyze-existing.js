import {
  buildFailedAiFields,
  buildSkippedAiFields,
  buildSummarizedAiFields,
  generateGeminiInsight,
  hasGeminiApiKey,
} from './lib/geminiInsights.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;
const FETCH_CANDIDATE_LIMIT = 100;

const getBearerToken = (authorizationHeader) => {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
};

const readRequestBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const getLimit = (value) => {
  const parsedLimit = Number(value);
  if (!Number.isFinite(parsedLimit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(parsedLimit)));
};

const shouldAnalyzeItem = (item) => (
  !item.aiStatus || item.aiStatus === 'skipped' || item.aiStatus === 'failed'
);

const summarizeExistingItem = (item) => {
  const fallback = item.summary || item.rawSnippet || 'Parsed source update ready for review.';
  return fallback.length > 260 ? `${fallback.slice(0, 257).trim()}...` : fallback;
};

const getSourceContext = async ({ adminDb, uid, item, sourceCache }) => {
  const sourceId = item.sourceId || '';
  if (!sourceId) {
    return {
      source: {
        purpose: 'custom',
        type: 'rss',
      },
      sourceName: item.sourceName || 'Content Radar Source',
    };
  }

  if (!sourceCache.has(sourceId)) {
    const sourceSnapshot = await adminDb
      .collection('users')
      .doc(uid)
      .collection('sources')
      .doc(sourceId)
      .get();

    sourceCache.set(sourceId, sourceSnapshot.exists ? sourceSnapshot.data() : null);
  }

  const source = sourceCache.get(sourceId) || {
    purpose: 'custom',
    type: 'rss',
  };

  return {
    source,
    sourceName: source.name || item.sourceName || 'Content Radar Source',
  };
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

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
    const body = await readRequestBody(req).catch(() => ({}));
    const limit = getLimit(body.limit);

    const itemsCollection = adminDb
      .collection('users')
      .doc(uid)
      .collection('items');

    const itemsSnapshot = await itemsCollection
      .orderBy('createdAt', 'desc')
      .limit(FETCH_CANDIDATE_LIMIT)
      .get();

    const candidateDocs = itemsSnapshot.docs
      .filter((itemDoc) => shouldAnalyzeItem(itemDoc.data()))
      .slice(0, limit);

    let summarized = 0;
    let failed = 0;
    let skipped = 0;

    if (!hasGeminiApiKey()) {
      await Promise.all(candidateDocs.map((itemDoc) => itemDoc.ref.update({
        ...buildSkippedAiFields(),
        aiUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })));

      return res.status(200).json({
        success: true,
        checked: candidateDocs.length,
        summarized,
        failed,
        skipped: candidateDocs.length,
        message: 'GEMINI_API_KEY is not configured.',
      });
    }

    const sourceCache = new Map();

    for (const itemDoc of candidateDocs) {
      const item = itemDoc.data();
      const fallbackSummary = summarizeExistingItem(item);

      try {
        const { source, sourceName } = await getSourceContext({
          adminDb,
          uid,
          item,
          sourceCache,
        });
        const aiInsight = await generateGeminiInsight({
          item,
          source,
          sourceName,
          fallbackSummary,
        });
        const aiFields = buildSummarizedAiFields(FieldValue, aiInsight);

        await itemDoc.ref.update({
          summary: aiFields.aiSummary || fallbackSummary,
          topic: aiFields.topic || 'Uncategorized',
          actionNote: aiFields.actionProposal || item.actionNote || 'Review this update.',
          ...aiFields,
          updatedAt: FieldValue.serverTimestamp(),
        });

        summarized++;
      } catch (error) {
        const aiFields = buildFailedAiFields(FieldValue, error);
        await itemDoc.ref.update({
          ...aiFields,
          updatedAt: FieldValue.serverTimestamp(),
        });
        failed++;
      }
    }

    return res.status(200).json({
      success: true,
      checked: candidateDocs.length,
      summarized,
      failed,
      skipped,
    });
  } catch (error) {
    console.error('Analyze existing API failed.', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unable to analyze existing items.',
    });
  }
}
