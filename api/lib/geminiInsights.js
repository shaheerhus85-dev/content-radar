export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

const GEMINI_TIMEOUT_MS = 20_000;

export const TOPICS = new Set([
  'AI',
  'SEO',
  'Automation',
  'Marketing',
  'Developer Tools',
  'Product',
  'Security',
  'Business',
  'Research',
  'Uncategorized',
]);

export const SIGNAL_TYPES = new Set([
  'Competitor Update',
  'Product Update',
  'Research',
  'Industry Trend',
  'Marketing Signal',
  'Technical Update',
  'Other',
]);

export const PURPOSE_GUIDANCE = {
  competitor: 'Focus on positioning, product strategy, pricing or feature changes, launches, and messaging signals.',
  content: 'Focus on useful content themes, audience needs, recurring subjects, and editorial opportunities.',
  product: 'Focus on product changes, releases, roadmap direction, feature direction, and user impact.',
  seo: 'Focus on topics, content angles, search intent, keyword-adjacent opportunities, and article ideas.',
  research: 'Focus on trends, insights, market signals, evidence, and implications.',
  custom: 'Focus on practical business relevance and what changed.',
};

class GeminiHttpError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'GeminiHttpError';
    this.status = status;
    this.code = code;
  }
}

const JSON_MIME_TYPE = 'application/json';

export const getGeminiModel = () => (
  process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
);

export const hasGeminiApiKey = () => Boolean(process.env.GEMINI_API_KEY?.trim());

export const clampText = (value, maxLength = 1400) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
};

const clampScore = (score) => {
  const parsedScore = Number(score);
  if (!Number.isFinite(parsedScore)) return 50;
  return Math.max(1, Math.min(100, Math.round(parsedScore)));
};

const safeString = (value, maxLength = 280) => {
  const apiKeys = [
    process.env.GEMINI_API_KEY || '',
    process.env.GROQ_API_KEY || '',
  ].filter(Boolean);
  let text = clampText(value, maxLength);

  for (const apiKey of apiKeys) {
    text = text.split(apiKey).join('[redacted]');
  }

  return text.replace(/key=([^&\s]+)/gi, 'key=[redacted]');
};

export const safeGeminiError = (error) => ({
  aiErrorName: safeString(error?.name || 'GeminiError', 80),
  aiErrorCode: safeString(error?.code || error?.cause?.code || '', 80),
  aiErrorStatus: typeof error?.status === 'number' ? error.status : null,
  aiErrorMessage: isGeminiQuotaError(error)
    ? 'AI quota reached. Parsed items are saved and can be analyzed later.'
    : safeString(error?.message || 'Gemini analysis failed.', 360),
});

export const isGeminiQuotaError = (error) => (
  error?.status === 429
  || String(error?.code || '').toUpperCase() === 'RESOURCE_EXHAUSTED'
  || /RESOURCE_EXHAUSTED|quota/i.test(error?.message || '')
);

export const normalizeAiInsight = (rawInsight, fallbackSummary) => {
  const topic = TOPICS.has(rawInsight?.topic) ? rawInsight.topic : 'Uncategorized';
  const signalType = SIGNAL_TYPES.has(rawInsight?.signalType) ? rawInsight.signalType : 'Other';

  return {
    aiSummary: clampText(rawInsight?.aiSummary, 420) || fallbackSummary,
    topic,
    signalType,
    whyItMatters: clampText(rawInsight?.whyItMatters, 520) || 'This update may affect positioning, planning, or follow-up research.',
    actionProposal: clampText(rawInsight?.actionProposal, 520) || 'Review the source update and decide whether it needs follow-up.',
    relevanceScore: clampScore(rawInsight?.relevanceScore),
  };
};

const extractGeminiText = (responseBody) => (
  responseBody?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || ''
);

const parseGeminiErrorBody = (rawText) => {
  try {
    const parsed = JSON.parse(rawText);
    return {
      message: parsed?.error?.message || rawText,
      code: parsed?.error?.status || parsed?.error?.code || '',
    };
  } catch {
    return {
      message: rawText,
      code: '',
    };
  }
};

const isStructuredJsonConfigError = (error) => (
  error?.status === 400
  && String(error?.code || '').toUpperCase() === 'INVALID_ARGUMENT'
  && /response_?mime_?type|response_?schema|response_?format|mime_?type|schema/i.test(error?.message || '')
);

const parseJsonResponse = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error('Gemini returned an empty JSON response.');
  }

  try {
    return JSON.parse(text);
  } catch {
    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim());
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }

    throw new Error('Gemini did not return parseable JSON.');
  }
};

const performGeminiRequest = async ({
  apiKey,
  model,
  prompt,
  responseSchema,
  maxOutputTokens,
  includeSchema,
  signal,
}) => {
  const generationConfig = {
    temperature: 0.2,
    maxOutputTokens,
    responseMimeType: JSON_MIME_TYPE,
  };

  if (includeSchema && responseSchema) {
    generationConfig.responseSchema = responseSchema;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': JSON_MIME_TYPE,
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: includeSchema
              ? prompt
              : `${prompt}\n\nReturn only valid JSON. Do not wrap it in markdown.`,
          }],
        }],
        generationConfig,
      }),
      signal,
    },
  );

  const responseText = await response.text();
  if (!response.ok) {
    const parsedError = parseGeminiErrorBody(responseText);
    throw new GeminiHttpError(
      `Gemini request failed with ${response.status}: ${safeString(parsedError.message, 240)}`,
      response.status,
      parsedError.code,
    );
  }

  const responseBody = parseJsonResponse(responseText);
  const geminiText = extractGeminiText(responseBody);
  if (!geminiText) {
    throw new Error('Gemini returned an empty response.');
  }

  return parseJsonResponse(geminiText);
};

const requestGeminiJson = async ({ prompt, responseSchema, maxOutputTokens = 700 }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const model = getGeminiModel();

  try {
    try {
      return await performGeminiRequest({
        apiKey,
        model,
        prompt,
        responseSchema,
        maxOutputTokens,
        includeSchema: true,
        signal: controller.signal,
      });
    } catch (error) {
      if (!isStructuredJsonConfigError(error)) {
        throw error;
      }

      return await performGeminiRequest({
        apiKey,
        model,
        prompt,
        responseSchema: null,
        maxOutputTokens,
        includeSchema: false,
        signal: controller.signal,
      });
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildGeminiPrompt = ({ item, source, sourceName, fallbackSummary }) => {
  const purpose = source.purpose || 'custom';
  const sourceType = source.type || 'rss';

  return [
    'You are Content Radar, an analyst that turns parsed source updates into concise business insights.',
    'Return only strict JSON with these fields:',
    '{"aiSummary":"short readable summary","topic":"AI | SEO | Automation | Marketing | Developer Tools | Product | Security | Business | Research | Uncategorized","signalType":"Competitor Update | Product Update | Research | Industry Trend | Marketing Signal | Technical Update | Other","whyItMatters":"why this update matters","actionProposal":"what the user should do next","relevanceScore":1}',
    PURPOSE_GUIDANCE[purpose] || PURPOSE_GUIDANCE.custom,
    '',
    `Source name: ${sourceName}`,
    `Source purpose: ${purpose}`,
    `Source type: ${sourceType}`,
    `Published date: ${item.publishedAt || 'Unknown'}`,
    `Item title: ${item.title || 'Untitled update'}`,
    `Item url: ${item.url || ''}`,
    `Excerpt or content: ${fallbackSummary}`,
  ].join('\n');
};

const insightResponseSchema = {
  type: 'OBJECT',
  properties: {
    aiSummary: { type: 'STRING' },
    topic: {
      type: 'STRING',
      enum: Array.from(TOPICS),
    },
    signalType: {
      type: 'STRING',
      enum: Array.from(SIGNAL_TYPES),
    },
    whyItMatters: { type: 'STRING' },
    actionProposal: { type: 'STRING' },
    relevanceScore: {
      type: 'INTEGER',
      minimum: 1,
      maximum: 100,
    },
  },
  required: [
    'aiSummary',
    'topic',
    'signalType',
    'whyItMatters',
    'actionProposal',
    'relevanceScore',
  ],
};

export const generateGeminiInsight = async ({ item, source, sourceName, fallbackSummary }) => {
  const rawInsight = await requestGeminiJson({
    prompt: buildGeminiPrompt({
      item,
      source,
      sourceName,
      fallbackSummary: clampText(fallbackSummary, 1400),
    }),
    responseSchema: insightResponseSchema,
  });

  return normalizeAiInsight(rawInsight, fallbackSummary);
};

export const testGeminiGenerate = async () => {
  const result = await requestGeminiJson({
    prompt: 'Return JSON: {"ok": true}',
    responseSchema: {
      type: 'OBJECT',
      properties: {
        ok: { type: 'BOOLEAN' },
      },
      required: ['ok'],
    },
    maxOutputTokens: 40,
  });

  return result?.ok === true;
};

export const buildSkippedAiFields = () => ({
  aiStatus: 'skipped',
  aiProvider: 'none',
  aiModel: null,
  aiUpdatedAt: null,
  aiErrorName: null,
  aiErrorCode: null,
  aiErrorStatus: null,
  aiErrorMessage: null,
});

export const buildFailedAiFields = (FieldValue, error) => ({
  ...safeGeminiError(error),
  aiStatus: isGeminiQuotaError(error) ? 'quota_limited' : 'failed',
  aiProvider: 'gemini',
  aiModel: getGeminiModel(),
  aiUpdatedAt: FieldValue.serverTimestamp(),
});

export const buildSummarizedAiFields = (FieldValue, aiInsight) => ({
  aiSummary: aiInsight.aiSummary,
  topic: aiInsight.topic,
  signalType: aiInsight.signalType,
  whyItMatters: aiInsight.whyItMatters,
  actionProposal: aiInsight.actionProposal,
  relevanceScore: aiInsight.relevanceScore,
  aiStatus: 'summarized',
  aiProvider: 'gemini',
  aiModel: getGeminiModel(),
  aiUpdatedAt: FieldValue.serverTimestamp(),
  aiErrorName: null,
  aiErrorCode: null,
  aiErrorStatus: null,
  aiErrorMessage: null,
});
