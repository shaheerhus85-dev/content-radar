import {
  getAiDebugBasePayload,
  safeAiError,
  testProviderGenerate,
} from './lib/aiInsightService.js';
import { requireDebugSecret } from './lib/debugAuth.js';

const buildProviderResult = async ({ provider, hasApiKey }) => {
  const baseResult = {
    testGenerateOk: false,
    safeErrorName: '',
    safeErrorCode: '',
    safeErrorStatus: null,
    safeErrorMessage: '',
  };

  if (!hasApiKey) {
    return {
      ...baseResult,
      safeErrorName: 'MissingConfiguration',
      safeErrorMessage: `${provider.toUpperCase()} API key is not configured.`,
    };
  }

  try {
    return {
      ...baseResult,
      testGenerateOk: await testProviderGenerate(provider),
    };
  } catch (error) {
    const safeError = safeAiError(error);
    return {
      ...baseResult,
      safeErrorName: safeError.aiErrorName,
      safeErrorCode: safeError.aiErrorCode,
      safeErrorStatus: safeError.aiErrorStatus,
      safeErrorMessage: safeError.aiErrorMessage,
    };
  }
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  if (!requireDebugSecret(req, res)) return;

  const basePayload = getAiDebugBasePayload();
  const [gemini, groq] = await Promise.all([
    buildProviderResult({
      provider: 'gemini',
      hasApiKey: basePayload.hasGeminiApiKey,
    }),
    buildProviderResult({
      provider: 'groq',
      hasApiKey: basePayload.hasGroqApiKey,
    }),
  ]);

  return res.status(200).json({
    success: true,
    ...basePayload,
    gemini,
    groq,
  });
}
