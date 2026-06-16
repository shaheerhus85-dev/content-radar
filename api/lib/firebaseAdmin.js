import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue as FirestoreFieldValue } from 'firebase-admin/firestore';

class MissingFirebaseAdminEnvError extends Error {
  constructor(missing, diagnostic) {
    super('Missing required Firebase Admin environment variables.');
    this.name = 'MissingFirebaseAdminEnvError';
    this.missing = missing || [];
    if (diagnostic) this.diagnostic = diagnostic;
  }
}

const normalizePrivateKey = (rawKey) => {
  let key = String(rawKey).trim();

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  return key.replace(/\\n/g, '\n');
};

const parseBase64ServiceAccount = (base64) => {
  const diag = { hasBase64: !!base64, parseSucceeded: false };
  try {
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    const svc = JSON.parse(jsonStr);
    diag.parseSucceeded = true;

    const missing = [];
    if (!svc.project_id && !svc.projectId) missing.push('project_id');
    if (!svc.client_email) missing.push('client_email');
    if (!svc.private_key) missing.push('private_key');

    if (missing.length) {
      throw new MissingFirebaseAdminEnvError(missing, diag);
    }

    return svc;
  } catch (err) {
    if (err instanceof MissingFirebaseAdminEnvError) throw err;
    diag.parseError = err instanceof Error ? err.message : String(err);
    throw new MissingFirebaseAdminEnvError([], diag);
  }
};

const getServiceAccountFallback = () => {
  const missing = [];
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey ? normalizePrivateKey(rawPrivateKey) : '';

  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  const diag = { hasBase64: false, privateKeyLooksOkay: false };
  if (privateKey) {
    diag.privateKeyStartsWith = privateKey.startsWith('-----BEGIN');
    diag.privateKeyEndsWith = privateKey.endsWith('-----END PRIVATE KEY-----');
    diag.privateKeyLooksOkay = diag.privateKeyStartsWith && diag.privateKeyEndsWith;
  }

  if (missing.length) {
    throw new MissingFirebaseAdminEnvError(missing, diag);
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

const getAdminApp = () => {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64) {
    const serviceAccount = parseBase64ServiceAccount(base64);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  return initializeApp({ credential: cert(getServiceAccountFallback()) });
};

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
export const FieldValue = FirestoreFieldValue;
