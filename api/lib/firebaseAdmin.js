import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue as FirestoreFieldValue } from 'firebase-admin/firestore';

class MissingFirebaseAdminEnvError extends Error {
  constructor(missing) {
    super('Missing required Firebase Admin environment variables.');
    this.name = 'MissingFirebaseAdminEnvError';
    this.missing = missing;
  }
}

const normalizePrivateKey = (rawKey) => {
  let key = String(rawKey).trim();

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  return key.replace(/\\n/g, '\n');
};

const getServiceAccount = () => {
  const missing = [];
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey ? normalizePrivateKey(rawPrivateKey) : '';

  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length) {
    throw new MissingFirebaseAdminEnvError(missing);
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

const getAdminApp = () => {
  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
  });
};

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
export const FieldValue = FirestoreFieldValue;
