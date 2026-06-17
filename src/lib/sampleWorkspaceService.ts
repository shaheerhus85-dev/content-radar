import {
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

const SAMPLE_LABEL = 'Sample workspace data';

const sampleSources = [
  {
    id: 'sample-source-competitor',
    name: 'Sample Competitor Updates',
    url: 'https://example.com/sample-competitor-feed',
    type: 'rss',
    purpose: 'competitor',
  },
  {
    id: 'sample-source-product',
    name: 'Sample Product Changelog',
    url: 'https://example.com/sample-product-changelog',
    type: 'rss',
    purpose: 'product',
  },
] as const;

const sampleItems = [
  {
    id: 'sample-item-01',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'Competitor launches faster onboarding for small teams',
    url: 'https://example.com/sample/competitor-onboarding',
    publishedAt: '2026-06-14T10:00:00Z',
    topic: 'Product',
    signalType: 'Competitor Update',
    aiSummary: 'A competitor introduced a guided onboarding flow aimed at reducing setup time for small teams.',
    whyItMatters: 'This points to a positioning move around speed-to-value, which can influence buyer expectations during evaluations.',
    actionProposal: 'Review your first-run experience and identify one setup step that could be simplified or made more visible.',
    relevanceScore: 91,
  },
  {
    id: 'sample-item-02',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'New pricing page highlights usage-based tiers',
    url: 'https://example.com/sample/pricing-signal',
    publishedAt: '2026-06-13T12:30:00Z',
    topic: 'Business',
    signalType: 'Competitor Update',
    aiSummary: 'The sample competitor reframed pricing around usage tiers and emphasized lower upfront commitment.',
    whyItMatters: 'Pricing-message changes often reveal where a company sees buyer friction or market pressure.',
    actionProposal: 'Compare your pricing page language against this positioning and note any objections your copy does not answer.',
    relevanceScore: 88,
  },
  {
    id: 'sample-item-03',
    sourceId: 'sample-source-product',
    sourceName: 'Sample Product Changelog',
    title: 'Changelog adds dashboard export controls',
    url: 'https://example.com/sample/export-controls',
    publishedAt: '2026-06-12T09:15:00Z',
    topic: 'Developer Tools',
    signalType: 'Product Update',
    aiSummary: 'A product update added export controls for dashboard reports and team sharing.',
    whyItMatters: 'Export features often support stakeholder workflows and can turn a tool into a recurring reporting habit.',
    actionProposal: 'Assess whether your reports can be shared cleanly with hiring managers or non-technical stakeholders.',
    relevanceScore: 84,
  },
  {
    id: 'sample-item-04',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'Competitor publishes hiring automation benchmark',
    url: 'https://example.com/sample/automation-benchmark',
    publishedAt: '2026-06-11T15:45:00Z',
    topic: 'Automation',
    signalType: 'Marketing Signal',
    aiSummary: 'A sample benchmark report claims reduced review time through automated candidate triage.',
    whyItMatters: 'Benchmark content can shape buyer expectations and provide sales teams with proof-point language.',
    actionProposal: 'Create a short comparison note that explains where your workflow saves time and where human review remains important.',
    relevanceScore: 89,
  },
  {
    id: 'sample-item-05',
    sourceId: 'sample-source-product',
    sourceName: 'Sample Product Changelog',
    title: 'Release notes add role-based source permissions',
    url: 'https://example.com/sample/role-permissions',
    publishedAt: '2026-06-10T08:20:00Z',
    topic: 'Security',
    signalType: 'Technical Update',
    aiSummary: 'A release introduced role-based controls for who can manage monitored sources.',
    whyItMatters: 'Permissions features signal movement toward larger teams with stronger governance needs.',
    actionProposal: 'Document which workspace actions should be owner-only before expanding team collaboration features.',
    relevanceScore: 82,
  },
  {
    id: 'sample-item-06',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'Sample competitor refreshes homepage messaging around AI agents',
    url: 'https://example.com/sample/agent-messaging',
    publishedAt: '2026-06-09T14:10:00Z',
    topic: 'AI',
    signalType: 'Marketing Signal',
    aiSummary: 'Homepage copy now emphasizes AI agents that monitor changes and recommend next steps.',
    whyItMatters: 'Messaging shifts around agents may indicate a market move from passive dashboards to proactive recommendations.',
    actionProposal: 'Audit your headline and supporting copy for clear evidence of proactive value, not just monitoring.',
    relevanceScore: 90,
  },
  {
    id: 'sample-item-07',
    sourceId: 'sample-source-product',
    sourceName: 'Sample Product Changelog',
    title: 'Product update improves duplicate detection',
    url: 'https://example.com/sample/duplicate-detection',
    publishedAt: '2026-06-08T11:00:00Z',
    topic: 'Automation',
    signalType: 'Product Update',
    aiSummary: 'Duplicate detection was improved to reduce repeated items in the insights queue.',
    whyItMatters: 'Lower duplicate noise makes monitoring workflows more credible and less tiring for regular users.',
    actionProposal: 'Track duplicate skip counts separately from saved articles so reviewers can see the cleanup value.',
    relevanceScore: 86,
  },
  {
    id: 'sample-item-08',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'Industry report highlights demand for private workspaces',
    url: 'https://example.com/sample/private-workspaces',
    publishedAt: '2026-06-07T16:40:00Z',
    topic: 'Research',
    signalType: 'Industry Trend',
    aiSummary: 'A sample industry report notes increased demand for private, user-owned monitoring workspaces.',
    whyItMatters: 'Privacy expectations matter for recruiter demos because sample data must be separate from real user data.',
    actionProposal: 'Keep sample data clearly labeled and make user-owned private workspace boundaries visible in the UI.',
    relevanceScore: 87,
  },
  {
    id: 'sample-item-09',
    sourceId: 'sample-source-product',
    sourceName: 'Sample Product Changelog',
    title: 'Changelog adds source purpose metadata',
    url: 'https://example.com/sample/source-purpose',
    publishedAt: '2026-06-06T13:05:00Z',
    topic: 'Product',
    signalType: 'Product Update',
    aiSummary: 'Source setup now stores why a user is monitoring each website, such as competitor, SEO, or product updates.',
    whyItMatters: 'Purpose metadata helps AI analysis produce context-aware recommendations instead of generic summaries.',
    actionProposal: 'Use source purpose as a required setup field when adding monitoring targets.',
    relevanceScore: 85,
  },
  {
    id: 'sample-item-10',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'Competitor blog targets SEO comparison keywords',
    url: 'https://example.com/sample/seo-comparison',
    publishedAt: '2026-06-05T10:25:00Z',
    topic: 'SEO',
    signalType: 'Marketing Signal',
    aiSummary: 'A competitor published comparison-oriented content aimed at high-intent search traffic.',
    whyItMatters: 'Comparison pages can capture buyers late in the evaluation process and influence shortlist decisions.',
    actionProposal: 'Identify one comparison query where your product needs clearer positioning or proof points.',
    relevanceScore: 83,
  },
  {
    id: 'sample-item-11',
    sourceId: 'sample-source-product',
    sourceName: 'Sample Product Changelog',
    title: 'Release adds clearer failed-analysis status',
    url: 'https://example.com/sample/ai-status',
    publishedAt: '2026-06-04T09:00:00Z',
    topic: 'Developer Tools',
    signalType: 'Technical Update',
    aiSummary: 'The interface now separates parsed-only, summarized, and failed AI states.',
    whyItMatters: 'Clear AI status prevents users from confusing ingestion success with analysis success.',
    actionProposal: 'Use user-friendly status language whenever AI quota or provider limits affect analysis.',
    relevanceScore: 92,
  },
  {
    id: 'sample-item-12',
    sourceId: 'sample-source-competitor',
    sourceName: 'Sample Competitor Updates',
    title: 'Market signal shows more teams tracking changelogs',
    url: 'https://example.com/sample/changelog-tracking',
    publishedAt: '2026-06-03T17:20:00Z',
    topic: 'Business',
    signalType: 'Industry Trend',
    aiSummary: 'Teams are increasingly monitoring changelogs and release notes to spot competitive movement earlier.',
    whyItMatters: 'This validates Content Radar’s core workflow: turning source monitoring into decision-ready signals.',
    actionProposal: 'In demos, show how a source update becomes a summary, topic, reason, and recommended action.',
    relevanceScore: 94,
  },
];

const requireFirestore = () => {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values before loading sample data.');
  }

  return db;
};

export const loadSampleWorkspace = async (uid: string) => {
  const firestore = requireFirestore();
  const batch = writeBatch(firestore);
  const createdAt = serverTimestamp();

  sampleSources.forEach((source) => {
    batch.set(doc(firestore, 'users', uid, 'sources', source.id), {
      name: source.name,
      url: source.url,
      type: source.type,
      purpose: source.purpose,
      discoveredFrom: source.url,
      discoveryMethod: 'fallback',
      maxItemsPerRefresh: 10,
      includePatterns: [],
      excludePatterns: [],
      status: 'active',
      isSample: true,
      sampleLabel: SAMPLE_LABEL,
      createdAt,
      updatedAt: createdAt,
      lastFetchedAt: createdAt,
    });
  });

  sampleItems.forEach((item) => {
    batch.set(doc(firestore, 'users', uid, 'items', item.id), {
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      title: item.title,
      url: item.url,
      publishedAt: item.publishedAt,
      rawSnippet: item.aiSummary,
      summary: item.aiSummary,
      aiSummary: item.aiSummary,
      topic: item.topic,
      signalType: item.signalType,
      whyItMatters: item.whyItMatters,
      actionProposal: item.actionProposal,
      actionNote: item.actionProposal,
      keyTakeaway: '',
      relevanceScore: item.relevanceScore,
      aiStatus: 'summarized',
      aiModel: 'sample',
      aiUpdatedAt: createdAt,
      aiErrorName: null,
      aiErrorCode: null,
      aiErrorStatus: null,
      aiErrorMessage: null,
      status: 'parsed',
      isSample: true,
      sampleLabel: SAMPLE_LABEL,
      createdAt,
      updatedAt: createdAt,
    });
  });

  await batch.commit();

  return {
    sourcesCreated: sampleSources.length,
    itemsCreated: sampleItems.length,
  };
};
