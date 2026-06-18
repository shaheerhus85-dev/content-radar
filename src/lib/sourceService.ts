import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import {
  Source,
  type SourceDiscoveryMethod,
  type SourcePurpose,
  type SourceRefreshStatus,
  type SourceType,
} from '../types';
import { db } from './firebase';
import { userSourcePath } from './firestorePaths';

interface SourceDocument {
  name?: string;
  url?: string;
  type?: SourceType;
  purpose?: SourcePurpose;
  discoveredFrom?: string;
  discoveryMethod?: SourceDiscoveryMethod;
  maxItemsPerRefresh?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  isSample?: boolean;
  sampleLabel?: string;
  status?: 'active' | 'failed';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastFetchedAt?: Timestamp | null;
  lastRefreshStatus?: SourceRefreshStatus | null;
  lastRefreshMessage?: string | null;
  lastCheckedAt?: Timestamp | null;
  lastSuccessAt?: Timestamp | null;
  lastFailureAt?: Timestamp | null;
}

export interface SourceInput {
  name: string;
  url: string;
  type: SourceType;
  purpose?: SourcePurpose;
  discoveredFrom?: string;
  discoveryMethod?: SourceDiscoveryMethod;
  maxItemsPerRefresh?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}

const requireFirestore = () => {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values before managing private sources.');
  }

  return db;
};

const formatTimestamp = (timestamp?: Timestamp | null) => {
  if (!timestamp) return null;
  return timestamp.toDate().toLocaleDateString();
};

const getUserSourcesCollection = (uid: string) => {
  const firestore = requireFirestore();
  return collection(firestore, 'users', uid, 'sources');
};

export const subscribeToUserSources = (
  uid: string,
  callback: (sources: Source[]) => void,
  onError?: (error: Error) => void,
) => {
  const sourcesQuery = query(
    getUserSourcesCollection(uid),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    sourcesQuery,
    (snapshot) => {
      const sources = snapshot.docs.map((sourceDoc) => {
        const data = sourceDoc.data() as SourceDocument;
        return {
          id: sourceDoc.id,
          name: data.name || '',
          url: data.url || '',
          type: data.type || 'rss',
          purpose: data.purpose,
          discoveredFrom: data.discoveredFrom,
          discoveryMethod: data.discoveryMethod,
          maxItemsPerRefresh: data.maxItemsPerRefresh,
          includePatterns: data.includePatterns || [],
          excludePatterns: data.excludePatterns || [],
          isSample: data.isSample || false,
          sampleLabel: data.sampleLabel || '',
          status: data.status || 'active',
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
          lastFetchedAt: formatTimestamp(data.lastFetchedAt),
          lastRefreshStatus: data.lastRefreshStatus || null,
          lastRefreshMessage: data.lastRefreshMessage || null,
          lastCheckedAt: formatTimestamp(data.lastCheckedAt),
          lastSuccessAt: formatTimestamp(data.lastSuccessAt),
          lastFailureAt: formatTimestamp(data.lastFailureAt),
        };
      });

      callback(sources);
    },
    onError,
  );
};

export const addUserSource = async (uid: string, sourceInput: SourceInput) => {
  const docRef = await addDoc(getUserSourcesCollection(uid), {
    name: sourceInput.name,
    url: sourceInput.url,
    type: sourceInput.type,
    purpose: sourceInput.purpose || 'custom',
    discoveredFrom: sourceInput.discoveredFrom || sourceInput.url,
    discoveryMethod: sourceInput.discoveryMethod || 'fallback',
    maxItemsPerRefresh: sourceInput.maxItemsPerRefresh || 10,
    includePatterns: sourceInput.includePatterns || [],
    excludePatterns: sourceInput.excludePatterns || [],
    status: 'active',
    lastRefreshStatus: null,
    lastRefreshMessage: null,
    lastCheckedAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastFetchedAt: null,
  });

  return docRef.id;
};

export const deleteUserSource = async (uid: string, sourceId: string) => {
  const firestore = requireFirestore();
  await deleteDoc(doc(firestore, userSourcePath(uid, sourceId)));
};
