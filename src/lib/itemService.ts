import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  ContentItem,
  type AiProvider,
  type AiStatus,
  type InsightTopic,
  type SignalType,
} from '../types';
import { db } from './firebase';

interface ItemDocument {
  sourceId?: string;
  sourceName?: string;
  sourceType?: ContentItem['sourceType'];
  title?: string;
  url?: string;
  publishedAt?: string | null;
  rawSnippet?: string;
  summary?: string;
  aiSummary?: string;
  topic?: InsightTopic;
  signalType?: SignalType;
  whyItMatters?: string;
  actionProposal?: string;
  relevanceScore?: number | null;
  aiStatus?: AiStatus;
  aiProvider?: AiProvider;
  aiModel?: string | null;
  aiUpdatedAt?: Timestamp | null;
  aiErrorName?: string | null;
  aiErrorCode?: string | null;
  aiErrorStatus?: number | null;
  aiErrorMessage?: string | null;
  isSample?: boolean;
  sampleLabel?: string;
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
          sourceType: data.sourceType,
          title: data.title || 'Untitled update',
          url: data.url || '#',
          publishedAt: formatPublishedAt(data.publishedAt),
          rawSnippet: data.rawSnippet || '',
          summary: data.summary || data.rawSnippet || 'Parsed source update ready for review.',
          aiSummary: data.aiSummary || '',
          topic: data.topic || 'Uncategorized',
          signalType: data.signalType || 'Other',
          whyItMatters: data.whyItMatters || '',
          actionProposal: data.actionProposal || data.actionNote || 'Review this update.',
          relevanceScore: typeof data.relevanceScore === 'number' ? data.relevanceScore : null,
          aiStatus: data.aiStatus || 'skipped',
          aiProvider: data.aiProvider || 'none',
          aiModel: data.aiModel || null,
          aiUpdatedAt: formatTimestamp(data.aiUpdatedAt),
          aiErrorName: data.aiErrorName || null,
          aiErrorCode: data.aiErrorCode || null,
          aiErrorStatus: typeof data.aiErrorStatus === 'number' ? data.aiErrorStatus : null,
          aiErrorMessage: data.aiErrorMessage || null,
          isSample: data.isSample || false,
          sampleLabel: data.sampleLabel || '',
          keyTakeaway: data.keyTakeaway || '',
          actionNote: data.actionNote || data.actionProposal || 'Review this update.',
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

export const resetQuotaFailedItems = async (uid: string) => {
  const firestore = requireFirestore();
  const itemsSnapshot = await getDocs(collection(firestore, 'users', uid, 'items'));
  const batch = writeBatch(firestore);
  let updated = 0;

  itemsSnapshot.docs.forEach((itemDoc) => {
    const data = itemDoc.data() as ItemDocument;
    const isQuotaFailure = data.aiStatus === 'failed'
      && (
        data.aiErrorStatus === 429
        || String(data.aiErrorCode || '').toUpperCase() === 'RESOURCE_EXHAUSTED'
      );

    if (!isQuotaFailure) return;

    batch.update(itemDoc.ref, {
      aiStatus: 'quota_limited',
      aiProvider: 'none',
      aiErrorMessage: 'AI analysis is queued. Parsed content is saved and can be analyzed later.',
      aiUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    updated++;
  });

  if (updated > 0) {
    await batch.commit();
  }

  return updated;
};
