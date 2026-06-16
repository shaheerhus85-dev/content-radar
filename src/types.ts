export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'sitemap';
  createdAt?: string | null;
  updatedAt?: string | null;
  lastFetchedAt?: string | null;
  status: 'active' | 'failed';
}

export interface ContentItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  publishedAt?: string;
  rawSnippet?: string;
  summary: string;
  topic: string;
  keyTakeaway?: string;
  actionNote: string;
  status?: 'parsed';
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
}

