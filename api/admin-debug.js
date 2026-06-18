import { Buffer } from 'node:buffer';
import { requireDebugSecret } from './lib/debugAuth.js';

function bool(v) {
  return !!v;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  if (!requireDebugSecret(req, res)) return;

  const env = {
    hasBase64: bool(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64),
    hasProjectId: bool(process.env.FIREBASE_PROJECT_ID),
    hasClientEmail: bool(process.env.FIREBASE_CLIENT_EMAIL),
    hasPrivateKey: bool(process.env.FIREBASE_PRIVATE_KEY),
  };

  const base64Diag = {
    base64DecodeOk: false,
    jsonParseOk: false,
    hasProjectIdField: false,
    hasClientEmailField: false,
    hasPrivateKeyField: false,
  };

  if (env.hasBase64) {
    try {
      const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      base64Diag.base64DecodeOk = true;
      try {
        const parsed = JSON.parse(raw);
        base64Diag.jsonParseOk = true;
        base64Diag.hasProjectIdField = !!(parsed.project_id || parsed.projectId);
        base64Diag.hasClientEmailField = !!parsed.client_email;
        base64Diag.hasPrivateKeyField = !!parsed.private_key;
      } catch (err) {
        base64Diag.jsonParseOk = false;
      }
    } catch (err) {
      base64Diag.base64DecodeOk = false;
    }
  }

  // Attempt to initialize Firebase Admin using the same helper used by /api/refresh
  let adminInitOk = false;
  const safeError = { name: null, code: null, message: null };

  try {
    const adminMod = await import('./lib/firebaseAdmin.js');
    // call a factory that forces initialization
    try {
      const auth = adminMod.getAdminAuth();
      // if no exception, consider init OK
      adminInitOk = true;
    } catch (err) {
      adminInitOk = false;
      safeError.name = err?.name || null;
      safeError.code = err?.code || null;
      safeError.message = err?.message ? String(err.message).replace(/[\r\n\t]+/g, ' ') : null;
    }
  } catch (err) {
    adminInitOk = false;
    safeError.name = err?.name || null;
    safeError.code = err?.code || null;
    safeError.message = err?.message ? String(err.message).replace(/[\r\n\t]+/g, ' ') : null;
  }

  return res.status(200).json({
    env,
    base64Diag,
    adminInitOk,
    safeError,
  });
}
