import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import { ContentItem } from '../types';
import { db } from './firebase';

interface ItemDocument {
  sourceId?: string;
  sourceName?: string;
  title?: string;
  url?: string;
  publishedAt?: string | null;
  rawSnippet?: string;
  summary?: string;
  topic?: string;
  keyTakeaway?: string;
  actionNote?: string;
  status?: 'parsed';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const requireFirestore = () => {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values before loading private items.');
  }

  return db;
};

const formatTimestamp = (timestamp?: Timestamp | null) => {
  if (!timestamp) return undefined;
  return timestamp.toDate().toISOString();
};

const formatPublishedAt = (publishedAt?: string | null) => {
  if (!publishedAt) return 'Not dated';
  const parsedDate = new Date(publishedAt);
  if (Number.isNaN(parsedDate.getTime())) return publishedAt;
  return parsedDate.toLocaleDateString();
};

export const subscribeToUserItems = (
  uid: string,
  callback: (items: ContentItem[]) => void,
  onError?: (error: Error) => void,
) => {
  const firestore = requireFirestore();
  const itemsQuery = query(
    collection(firestore, 'users', uid, 'items'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    itemsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((itemDoc) => {
        const data = itemDoc.data() as ItemDocument;
        return {
          id: itemDoc.id,
          sourceId: data.sourceId || '',
          sourceName: data.sourceName || 'Content Radar Source',
          title: data.title || 'Untitled update',
          url: data.url || '#',
          publishedAt: formatPublishedAt(data.publishedAt),
          rawSnippet: data.rawSnippet || '',
          summary: data.summary || data.rawSnippet || 'Parsed source update ready for review.',
          topic: data.topic || 'Uncategorized',
          keyTakeaway: data.keyTakeaway || '',
          actionNote: data.actionNote || 'Review this update.',
          status: data.status || 'parsed',
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
          isNew: true,
        };
      });

      callback(items);
    },
    onError,
  );
};
