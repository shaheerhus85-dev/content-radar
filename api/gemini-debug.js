import {
  getGeminiModel,
  hasGeminiApiKey,
  safeGeminiError,
  testGeminiGenerate,
} from './lib/geminiInsights.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const basePayload = {
    hasGeminiApiKey: hasGeminiApiKey(),
    configuredModel: getGeminiModel(),
    testGenerateOk: false,
    safeErrorName: '',
    safeErrorCode: '',
    safeErrorStatus: null,
    safeErrorMessage: '',
  };

  if (!basePayload.hasGeminiApiKey) {
    return res.status(200).json({
      ...basePayload,
      safeErrorName: 'MissingConfiguration',
      safeErrorMessage: 'GEMINI_API_KEY is not configured.',
    });
  }

  try {
    const testGenerateOk = await testGeminiGenerate();
    return res.status(200).json({
      ...basePayload,
      testGenerateOk,
    });
  } catch (error) {
    const safeError = safeGeminiError(error);
    return res.status(200).json({
      ...basePayload,
      safeErrorName: safeError.aiErrorName,
      safeErrorCode: safeError.aiErrorCode,
      safeErrorStatus: safeError.aiErrorStatus,
      safeErrorMessage: safeError.aiErrorMessage,
    });
  }
}
