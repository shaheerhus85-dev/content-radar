export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'sitemap';
  createdAt?: string;
  lastFetchedAt?: string;
  status: 'active' | 'failed';
}

export interface ContentItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  publishedAt?: string;
  summary: string;
  topic: string;
  actionNote: string;
  createdAt?: string;
  isNew?: boolean;
}

