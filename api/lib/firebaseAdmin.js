import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

class MissingFirebaseAdminEnvError extends Error {
  constructor(missing) {
    super('Missing required Firebase Admin environment variables.');
    this.name = 'MissingFirebaseAdminEnvError';
    this.missing = missing;
  }
}

const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new MissingFirebaseAdminEnvError([key]);
  }

  return value;
};

const normalizePrivateKey = (rawKey) => {
  let key = String(rawKey).trim();

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  return key.replace(/\\n/g, '\n');
};

const getAdminApp = () => {
  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  const serviceAccount = {
    projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
    clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: normalizePrivateKey(getRequiredEnv('FIREBASE_PRIVATE_KEY')),
  };

  if (!serviceAccount.privateKey) {
    throw new MissingFirebaseAdminEnvError(['FIREBASE_PRIVATE_KEY']);
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
};

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
