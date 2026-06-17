export type SourceType = 'rss' | 'atom' | 'sitemap' | 'webpage';

export type SourcePurpose =
  | 'competitor'
  | 'content'
  | 'product'
  | 'seo'
  | 'research'
  | 'custom';

export type SourceDiscoveryMethod =
  | 'html-link'
  | 'common-path'
  | 'robots'
  | 'sitemap'
  | 'fallback';

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  purpose?: SourcePurpose;
  discoveredFrom?: string;
  discoveryMethod?: SourceDiscoveryMethod;
  maxItemsPerRefresh?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
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

