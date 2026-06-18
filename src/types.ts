export type SourceType = 'rss' | 'atom' | 'sitemap' | 'webpage' | 'page-watch';

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

export type SourceRefreshStatus = 'success' | 'fallback' | 'failed';

export type InsightTopic =
  | 'AI'
  | 'SEO'
  | 'Automation'
  | 'Marketing'
  | 'Developer Tools'
  | 'Product'
  | 'Security'
  | 'Business'
  | 'Research'
  | 'Uncategorized';

export type SignalType =
  | 'Competitor Update'
  | 'Product Update'
  | 'Research'
  | 'Industry Trend'
  | 'Marketing Signal'
  | 'Technical Update'
  | 'Other';

export type AiStatus = 'summarized' | 'failed' | 'skipped' | 'quota_limited';

export type AiProvider = 'gemini' | 'groq' | 'cache' | 'none';

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
  isSample?: boolean;
  sampleLabel?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastFetchedAt?: string | null;
  lastRefreshStatus?: SourceRefreshStatus | null;
  lastRefreshMessage?: string | null;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  status: 'active' | 'failed';
}

export interface ContentItem {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType?: SourceType;
  title: string;
  url: string;
  publishedAt?: string;
  rawSnippet?: string;
  summary: string;
  aiSummary?: string;
  topic: InsightTopic;
  signalType?: SignalType;
  whyItMatters?: string;
  actionProposal?: string;
  relevanceScore?: number | null;
  aiStatus?: AiStatus;
  aiProvider?: AiProvider;
  aiModel?: string | null;
  aiUpdatedAt?: string;
  aiErrorName?: string | null;
  aiErrorCode?: string | null;
  aiErrorStatus?: number | null;
  aiErrorMessage?: string | null;
  isSample?: boolean;
  sampleLabel?: string;
  keyTakeaway?: string;
  actionNote: string;
  status?: 'parsed';
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
}

