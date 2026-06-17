import { Source, ContentItem } from './types';

export const INITIAL_SOURCES: Source[] = [
  {
    id: 'src-1',
    name: 'Google Search Central Blog',
    url: 'https://developers.google.com/search/blog/feed.xml',
    type: 'rss',
    createdAt: '2026-05-10',
    lastFetchedAt: '12 mins ago',
    status: 'active',
    isSample: true,
    sampleLabel: 'Sample workspace data',
  },
  {
    id: 'src-2',
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    type: 'rss',
    createdAt: '2026-05-12',
    lastFetchedAt: '24 mins ago',
    status: 'active',
    isSample: true,
    sampleLabel: 'Sample workspace data',
  },
  {
    id: 'src-3',
    name: 'Vercel Blog',
    url: 'https://vercel.com/blog/feed',
    type: 'rss',
    createdAt: '2026-05-15',
    lastFetchedAt: '45 mins ago',
    status: 'active',
    isSample: true,
    sampleLabel: 'Sample workspace data',
  },
  {
    id: 'src-4',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    type: 'rss',
    createdAt: '2026-05-18',
    lastFetchedAt: '1 hour ago',
    status: 'active',
    isSample: true,
    sampleLabel: 'Sample workspace data',
  }
];

const DEMO_ARTICLES: ContentItem[] = [
  {
    id: 'art-1',
    sourceId: 'src-1',
    sourceName: 'Google Search Central Blog',
    title: 'Understanding Core Web Vitals and Search Rankings for SPA Applications',
    url: 'https://developers.google.com/search/blog/core-web-vitals-spa',
    publishedAt: '2 hours ago',
    summary: 'An depth review of interaction to next paint (INP) behavior and optimized server-side hydration pathways. Explains how core vitals directly impact search engine indexing priority and rank scores on complex frontend applications.',
    topic: 'SEO',
    actionNote: 'Audit main navigation bundle chunks to defer non-essential hydration code.',
    createdAt: '2026-06-13T02:15:00Z'
  },
  {
    id: 'art-2',
    sourceId: 'src-2',
    sourceName: 'OpenAI News',
    title: 'Introducing Advanced Reasoning Models with Structured JSON Schema Integrity',
    url: 'https://openai.com/blog/advanced-reasoning-models',
    publishedAt: '4 hours ago',
    summary: 'Announcing deep analytical reasoning agents capable of planning complex sequences. Outlines programmatic API layers enforcing strict 100% adherence to specific developer-provided JSON schemas with zero parser format fallback errors.',
    topic: 'AI',
    actionNote: 'Upgrade content ingestion formats to request highly secure object definitions.',
    createdAt: '2026-06-13T00:44:00Z'
  },
  {
    id: 'art-3',
    sourceId: 'src-3',
    sourceName: 'Vercel Blog',
    title: 'The Edge-First Web Deployment Architecture: Complete Layout Case Studies',
    url: 'https://vercel.com/blog/edge-first-web-deployment',
    publishedAt: '1 day ago',
    summary: 'A performance breakdown of dynamic page caching near visitor physical nodes. Underlines immediate reduction in time-to-first-byte (TTFB) and highlights cache validation protocols that update stale resources in the background.',
    topic: 'Developer Tools',
    actionNote: 'Refactor standard dynamic dashboards using static generation with edge-cached state.',
    createdAt: '2026-06-12T11:15:00Z'
  },
  {
    id: 'art-4',
    sourceId: 'src-4',
    sourceName: 'TechCrunch AI',
    title: 'Automating Repetitive Developer Ingestion Workflows with Multi-Agent Systems',
    url: 'https://techcrunch.com/ai/multi-agent-system-automation',
    publishedAt: '1 day ago',
    summary: 'How leading software companies use small specialized generative agents linked in pipelines. Rather than monolithic models, chained execution structures prove higher success at code-parsing, error-logging, and automatic issue healing.',
    topic: 'Automation',
    actionNote: 'Plan modular scheduler retry protocols inside scraping worker routines.',
    createdAt: '2026-06-12T09:30:00Z'
  },
  {
    id: 'art-5',
    sourceId: 'src-5',
    sourceName: 'HubSpot Marketing Blog',
    title: 'Leveraging Generative Search Optimizations and Natural Intent Keywords',
    url: 'https://blog.hubspot.com/marketing/generative-search-optimization',
    publishedAt: '2 days ago',
    summary: 'An exploration of user search behavior shifts toward conversational search interfaces. Identifies key tactics to optimize technical and long-form content to capture authoritative spots in automatic generative summaries.',
    topic: 'Marketing',
    actionNote: 'Update editorial content schemas to directly answer structured human inquiries.',
    createdAt: '2026-06-11T14:20:00Z'
  },
  {
    id: 'art-6',
    sourceId: 'src-3',
    sourceName: 'Vercel Blog',
    title: 'Next-Generation Asset Optimization Protocols via AVIF and Progressive Layers',
    url: 'https://vercel.com/blog/next-gen-asset-optimization',
    publishedAt: '2 days ago',
    summary: 'Details huge bandwidth savings achieved by adopting highly efficient audio and visual layout compression schemes. Compares rendering times across responsive mobile Viewports and quantifies cumulative layout shifts.',
    topic: 'Product',
    actionNote: 'Standardize media sizes and implement strict aspect ratios on main dashboard grids.',
    createdAt: '2026-06-11T11:05:00Z'
  },
  {
    id: 'art-7',
    sourceId: 'src-1',
    sourceName: 'Google Search Central Blog',
    title: 'Best Practices for Schema Markup and Rich Results Metadata Mapping',
    url: 'https://developers.google.com/search/blog/schema-markup-best-practices',
    publishedAt: '3 days ago',
    summary: 'A direct guide describing structured schema mapping formats. Standardizing descriptions and authorship parameters enables advanced search results visualizations, significantly boosting organic layout click-through yields.',
    topic: 'SEO',
    actionNote: 'Implement rich structured JSON metadata schemas natively inside public-facing code.',
    createdAt: '2026-06-10T16:40:00Z'
  }
];

export const INITIAL_ARTICLES: ContentItem[] = DEMO_ARTICLES.map((article, index) => ({
  ...article,
  aiSummary: article.summary,
  signalType: article.topic === 'Product' ? 'Product Update' : article.topic === 'SEO' ? 'Marketing Signal' : 'Industry Trend',
  whyItMatters: article.summary,
  actionProposal: article.actionNote,
  relevanceScore: 92 - index,
  aiStatus: 'summarized',
  aiModel: 'demo',
  isSample: true,
  sampleLabel: 'Sample workspace data',
}));
