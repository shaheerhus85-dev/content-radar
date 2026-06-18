import { createHash } from 'node:crypto';
import {
  DEFAULT_GEMINI_MODEL,
  PURPOSE_GUIDANCE,
  clampText,
  generateGeminiInsight,
  getGeminiModel,
  hasGeminiApiKey,
  isGeminiQuotaError,
  normalizeAiInsight,
  safeGeminiError,
  testGeminiGenerate,
} from './geminiInsights.js';

export const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
export const DEFAULT_PROVIDER_ORDER = ['gemini', 'groq'];

const JSON_MIME_TYPE = 'application/json';
const GROQ_TIMEOUT_MS = 20_000;
const VALID_PROVIDERS = new Set(DEFAULT_PROVIDER_ORDER);

class GroqHttpError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'GroqHttpError';
    this.status = status;
    this.code = code;
  }
}

export const getGroqModel = () => (
  process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL
);

export const hasGroqApiKey = () => Boolean(process.env.GROQ_API_KEY?.trim());

export const getProviderOrder = () => {
  const configuredOrder = (process.env.AI_PROVIDER_ORDER || '')
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => VALID_PROVIDERS.has(provider));

  const ordered = configuredOrder.length > 0 ? configuredOrder : DEFAULT_PROVIDER_ORDER;
  return Array.from(new Set(ordered));
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

const parseJsonResponse = (value, providerName = 'AI provider') => {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${providerName} returned an empty JSON response.`);
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

    throw new Error(`${providerName} did not return parseable JSON.`);
  }
};

const parseProviderErrorBody = (rawText) => {
  try {
    const parsed = JSON.parse(rawText);
    return {
      message: parsed?.error?.message || rawText,
      code: parsed?.error?.code || parsed?.error?.type || parsed?.error?.status || '',
    };
  } catch {
    return {
      message: rawText,
      code: '',
    };
  }
};

export const isQuotaError = (error) => (
  isGeminiQuotaError(error)
  || error?.status === 429
  || String(error?.code || '').toUpperCase() === 'RESOURCE_EXHAUSTED'
  || /RESOURCE_EXHAUSTED|quota|rate limit|too many requests/i.test(error?.message || '')
);

export const safeAiError = (error) => {
  const geminiSafeError = error?.provider === 'gemini' ? safeGeminiError(error) : null;

  return {
    aiErrorName: safeString(geminiSafeError?.aiErrorName || error?.name || 'AIProviderError', 80),
    aiErrorCode: safeString(geminiSafeError?.aiErrorCode || error?.code || error?.cause?.code || '', 80),
    aiErrorStatus: typeof error?.status === 'number' ? error.status : null,
    aiErrorMessage: isQuotaError(error)
      ? 'AI analysis is queued. Parsed content is saved and can be analyzed later.'
      : safeString(error?.message || 'AI analysis could not be completed.', 360),
  };
};

const getProviderModel = (provider) => {
  if (provider === 'gemini') return getGeminiModel();
  if (provider === 'groq') return getGroqModel();
  if (provider === 'cache') return 'cached';
  return null;
};

const getProviderAvailability = (provider) => {
  if (provider === 'gemini') return hasGeminiApiKey();
  if (provider === 'groq') return hasGroqApiKey();
  return false;
};

const normalizeCacheUrl = (url) => {
  const parsedUrl = new URL(String(url || '').trim());
  parsedUrl.hash = '';
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();
  return parsedUrl.toString();
};

const isPrivateIpAddress = (hostname) => {
  if (/^10\./.test(hostname)) return true;
  if (/^127\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true;
  if (hostname === '::1') return true;
  return false;
};

const isCacheablePublicUrl = (url) => {
  try {
    const parsedUrl = new URL(String(url || '').trim());
    const hostname = parsedUrl.hostname.toLowerCase();

    return ['http:', 'https:'].includes(parsedUrl.protocol)
      && hostname !== 'localhost'
      && !hostname.endsWith('.local')
      && !isPrivateIpAddress(hostname);
  } catch {
    return false;
  }
};

export const getUrlHash = (url) => (
  createHash('sha256').update(normalizeCacheUrl(url).toLowerCase()).digest('hex')
);

const getContentHash = ({ item, fallbackSummary }) => (
  createHash('sha256')
    .update([
      item?.url || '',
      item?.title || '',
      fallbackSummary || item?.rawSnippet || item?.summary || '',
    ].join('\n'))
    .digest('hex')
);

const readCachedInsight = async ({ adminDb, item, fallbackSummary }) => {
  if (!adminDb || !isCacheablePublicUrl(item?.url)) return null;

  const normalizedUrl = normalizeCacheUrl(item.url);
  const urlHash = getUrlHash(normalizedUrl);
  const cacheDoc = await adminDb.collection('aiInsightCache').doc(urlHash).get();
  if (!cacheDoc.exists) return null;

  const cached = cacheDoc.data();
  if (!cached?.aiSummary) return null;

  return {
    status: 'summarized',
    provider: 'cache',
    model: 'cached',
    fromCache: true,
    insight: normalizeAiInsight(cached, fallbackSummary),
  };
};

const writeCachedInsight = async ({ adminDb, FieldValue, item, fallbackSummary, insight, provider, model }) => {
  if (!adminDb || !isCacheablePublicUrl(item?.url)) return;

  const normalizedUrl = normalizeCacheUrl(item.url);
  const urlHash = getUrlHash(normalizedUrl);
  const cacheRef = adminDb.collection('aiInsightCache').doc(urlHash);
  const timestamp = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date();

  await cacheRef.set({
    urlHash,
    url: normalizedUrl,
    contentHash: getContentHash({ item, fallbackSummary }),
    aiSummary: insight.aiSummary,
    topic: insight.topic,
    signalType: insight.signalType,
    whyItMatters: insight.whyItMatters,
    actionProposal: insight.actionProposal,
    relevanceScore: insight.relevanceScore,
    aiProvider: provider,
    aiModel: model,
    createdAt: timestamp,
    updatedAt: timestamp,
  }, { merge: true });
};

const buildInsightPrompt = ({ item, source, sourceName, fallbackSummary }) => {
  const purpose = source?.purpose || 'custom';
  const sourceType = source?.type || 'rss';

  return [
    'You are Content Radar, an analyst that turns parsed source updates into concise business insights.',
    'Return only strict JSON with these fields:',
    '{"aiSummary":"short readable summary","topic":"AI | SEO | Automation | Marketing | Developer Tools | Product | Security | Business | Research | Uncategorized","signalType":"Competitor Update | Product Update | Research | Industry Trend | Marketing Signal | Technical Update | Other","whyItMatters":"why this update matters","actionProposal":"what the user should do next","relevanceScore":1}',
    PURPOSE_GUIDANCE[purpose] || PURPOSE_GUIDANCE.custom,
    '',
    `Source name: ${sourceName || 'Content Radar Source'}`,
    `Source purpose: ${purpose}`,
    `Source type: ${sourceType}`,
    `Published date: ${item?.publishedAt || 'Unknown'}`,
    `Item title: ${item?.title || 'Untitled update'}`,
    `Item url: ${item?.url || ''}`,
    `Excerpt or content: ${clampText(fallbackSummary, 1400)}`,
  ].join('\n');
};

const requestGroqJson = async ({ prompt, maxTokens = 700 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  const model = getGroqModel();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': JSON_MIME_TYPE,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You return only valid JSON. Do not wrap responses in markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    if (!response.ok) {
      const parsedError = parseProviderErrorBody(responseText);
      throw new GroqHttpError(
        `Groq request failed with ${response.status}: ${safeString(parsedError.message, 240)}`,
        response.status,
        parsedError.code,
      );
    }

    const responseBody = parseJsonResponse(responseText, 'Groq');
    const groqText = responseBody?.choices?.[0]?.message?.content?.trim() || '';
    if (!groqText) {
      throw new Error('Groq returned an empty response.');
    }

    return parseJsonResponse(groqText, 'Groq');
  } finally {
    clearTimeout(timeoutId);
  }
};

const generateGroqInsight = async ({ item, source, sourceName, fallbackSummary }) => {
  const rawInsight = await requestGroqJson({
    prompt: buildInsightPrompt({
      item,
      source,
      sourceName,
      fallbackSummary,
    }),
  });

  return normalizeAiInsight(rawInsight, fallbackSummary);
};

const generateProviderInsight = async ({ provider, item, source, sourceName, fallbackSummary }) => {
  if (provider === 'gemini') {
    const insight = await generateGeminiInsight({ item, source, sourceName, fallbackSummary });
    return { insight, provider, model: getGeminiModel() };
  }

  if (provider === 'groq') {
    const insight = await generateGroqInsight({ item, source, sourceName, fallbackSummary });
    return { insight, provider, model: getGroqModel() };
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
};

export const generateInsightForItem = async ({
  item,
  source = {},
  sourceName = 'Content Radar Source',
  fallbackSummary = 'Parsed source update ready for review.',
  adminDb = null,
  FieldValue = null,
}) => {
  const cachedInsight = await readCachedInsight({ adminDb, item, fallbackSummary });
  if (cachedInsight) return cachedInsight;

  const providerOrder = getProviderOrder();
  const providerErrors = [];
  let attempted = 0;

  for (const provider of providerOrder) {
    if (!getProviderAvailability(provider)) continue;

    attempted++;
    try {
      const providerResult = await generateProviderInsight({
        provider,
        item,
        source,
        sourceName,
        fallbackSummary,
      });

      await writeCachedInsight({
        adminDb,
        FieldValue,
        item,
        fallbackSummary,
        insight: providerResult.insight,
        provider: providerResult.provider,
        model: providerResult.model,
      });

      return {
        status: 'summarized',
        provider: providerResult.provider,
        model: providerResult.model,
        fromCache: false,
        insight: providerResult.insight,
      };
    } catch (error) {
      error.provider = provider;
      providerErrors.push(error);
    }
  }

  if (attempted === 0) {
    return {
      status: 'skipped',
      provider: 'none',
      model: null,
      fromCache: false,
      error: new Error('No AI provider API key is configured.'),
    };
  }

  const quotaError = providerErrors.find((error) => isQuotaError(error));
  const selectedError = quotaError || providerErrors.at(-1);

  return {
    status: quotaError ? 'quota_limited' : 'failed',
    provider: 'none',
    model: null,
    fromCache: false,
    error: selectedError,
    providerErrors,
  };
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

export const buildFailedAiFields = (FieldValue, insightResult) => ({
  ...safeAiError(insightResult?.error || insightResult),
  aiStatus: insightResult?.status === 'quota_limited' ? 'quota_limited' : 'failed',
  aiProvider: insightResult?.provider || 'none',
  aiModel: insightResult?.model || null,
  aiUpdatedAt: FieldValue.serverTimestamp(),
});

export const buildSummarizedAiFields = (FieldValue, insightResult) => ({
  aiSummary: insightResult.insight.aiSummary,
  topic: insightResult.insight.topic,
  signalType: insightResult.insight.signalType,
  whyItMatters: insightResult.insight.whyItMatters,
  actionProposal: insightResult.insight.actionProposal,
  relevanceScore: insightResult.insight.relevanceScore,
  aiStatus: 'summarized',
  aiProvider: insightResult.provider,
  aiModel: insightResult.model,
  aiUpdatedAt: FieldValue.serverTimestamp(),
  aiErrorName: null,
  aiErrorCode: null,
  aiErrorStatus: null,
  aiErrorMessage: null,
});

export const testGroqGenerate = async () => {
  const result = await requestGroqJson({
    prompt: 'Return JSON: {"ok": true}',
    maxTokens: 40,
  });

  return result?.ok === true;
};

export const testProviderGenerate = async (provider) => {
  if (provider === 'gemini') return testGeminiGenerate();
  if (provider === 'groq') return testGroqGenerate();
  throw new Error(`Unsupported AI provider: ${provider}`);
};

export const getAiDebugBasePayload = () => ({
  hasGeminiApiKey: hasGeminiApiKey(),
  hasGroqApiKey: hasGroqApiKey(),
  providerOrder: getProviderOrder(),
  configuredModels: {
    gemini: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    groq: getGroqModel(),
  },
});
