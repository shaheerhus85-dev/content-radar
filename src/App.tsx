import { useEffect, useMemo, useState } from 'react';
import { INITIAL_SOURCES, INITIAL_ARTICLES } from './mockData';
import { Source, ContentItem } from './types';
import { useAuth } from './auth/AuthContext';
import {
  addUserSource,
  deleteUserSource,
  subscribeToUserSources,
  type SourceInput,
} from './lib/sourceService';
import { resetQuotaFailedItems, subscribeToUserItems } from './lib/itemService';
import { loadSampleWorkspace } from './lib/sampleWorkspaceService';
import Sidebar from './components/Sidebar';
import StatsGrid from './components/StatsGrid';
import AnalyticsCharts from './components/AnalyticsCharts';
import InsightsTable from './components/InsightsTable';
import SourcesPanel from './components/SourcesPanel';
import ReportsPanel from './components/ReportsPanel';
import SettingsPanel from './components/SettingsPanel';
import LandingPage from './components/LandingPage';
import MonitoredSourcesSummary from './components/MonitoredSourcesSummary';
import AuthModal from './components/AuthModal';
import {
  Search,
  Moon,
  Sun,
  Radio,
  Sparkles,
} from 'lucide-react';

type ViewMode = 'landing' | 'dashboard';
type WorkspaceMode = 'demo' | 'private';
type AuthMode = 'signin' | 'signup';

const getArticleSortTime = (article: ContentItem) => {
  const candidates = [article.createdAt, article.updatedAt, article.publishedAt];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = Date.parse(candidate);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
};

const demoUser = {
  name: 'Demo Visitor',
  email: 'preview@content-radar.local',
  plan: 'Public Demo',
};

export default function App() {
  const {
    user: authUser,
    loading: authLoading,
    firebaseReady,
    signOut,
  } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => (
    localStorage.getItem('content-radar-workspace-mode') === 'private' ? 'dashboard' : 'landing'
  ));
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => (
    localStorage.getItem('content-radar-workspace-mode') === 'private' ? 'private' : 'demo'
  ));
  const [authModalMode, setAuthModalMode] = useState<AuthMode | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [demoSources, setDemoSources] = useState<Source[]>(INITIAL_SOURCES);
  const [demoArticles, setDemoArticles] = useState<ContentItem[]>(INITIAL_ARTICLES);
  const [demoLogs, setDemoLogs] = useState<string[]>([
    'Checked OpenAI News feed...',
    'Index verification complete: Vercel Blog sitemap...',
    'Scan cycle stable. Monitoring 4 active sources.',
  ]);

  const [privateSources, setPrivateSources] = useState<Source[]>([]);
  const [privateArticles, setPrivateArticles] = useState<ContentItem[]>([]);
  const [privateLogs, setPrivateLogs] = useState<string[]>([]);
  const [privateSourcesLoading, setPrivateSourcesLoading] = useState(false);
  const [privateSourcesError, setPrivateSourcesError] = useState('');
  const [privateItemsLoading, setPrivateItemsLoading] = useState(false);
  const [privateItemsError, setPrivateItemsError] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [aiAnalysisMessage, setAiAnalysisMessage] = useState('');
  const [aiAnalysisError, setAiAnalysisError] = useState('');
  const [isAnalyzingExisting, setIsAnalyzingExisting] = useState(false);
  const [sampleWorkspaceMessage, setSampleWorkspaceMessage] = useState('');
  const [sampleWorkspaceError, setSampleWorkspaceError] = useState('');
  const [isLoadingSampleWorkspace, setIsLoadingSampleWorkspace] = useState(false);
  const [openAddSourceSignal, setOpenAddSourceSignal] = useState(0);
  const [isResettingAiFailures, setIsResettingAiFailures] = useState(false);

  const [globalSearch, setGlobalSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const isPrivateWorkspace = workspaceMode === 'private';
  const sources = isPrivateWorkspace ? privateSources : demoSources;
  const articles = isPrivateWorkspace ? privateArticles : demoArticles;
  const executionLogs = isPrivateWorkspace ? privateLogs : demoLogs;
  const displayArticles = useMemo(() => {
    const hasRealItems = articles.some((article) => !article.isSample);

    return [...articles].sort((a, b) => {
      if (hasRealItems && a.isSample !== b.isSample) {
        return a.isSample ? 1 : -1;
      }

      return getArticleSortTime(b) - getArticleSortTime(a);
    });
  }, [articles]);

  const user = useMemo(() => {
    if (isPrivateWorkspace && authUser) {
      const fallbackName = authUser.email?.split('@')[0] || 'Private User';
      return {
        name: authUser.displayName || fallbackName,
        email: authUser.email || '',
        plan: 'Private Workspace',
      };
    }

    return demoUser;
  }, [authUser, isPrivateWorkspace]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!authLoading && !authUser && isPrivateWorkspace) {
      localStorage.setItem('content-radar-workspace-mode', 'demo');
      setWorkspaceMode('demo');
      setViewMode('landing');
      setShowProfileDropdown(false);
      setPrivateSources([]);
      setPrivateArticles([]);
      setPrivateLogs([]);
      setPrivateSourcesError('');
      setPrivateItemsError('');
      setRefreshError('');
      setAiAnalysisMessage('');
      setAiAnalysisError('');
      setSampleWorkspaceMessage('');
      setSampleWorkspaceError('');
      setPrivateSourcesLoading(false);
      setPrivateItemsLoading(false);
    }
  }, [authLoading, authUser, isPrivateWorkspace]);

  useEffect(() => {
    if (!authLoading && authUser && workspaceMode === 'private') {
      setViewMode('dashboard');
    }
  }, [authLoading, authUser, workspaceMode]);

  useEffect(() => {
    if (!authUser || !isPrivateWorkspace) {
      setPrivateSourcesLoading(false);
      return undefined;
    }

    setPrivateSourcesLoading(true);
    setPrivateSourcesError('');

    try {
      return subscribeToUserSources(
        authUser.uid,
        (nextSources) => {
          setPrivateSources(nextSources);
          setPrivateSourcesLoading(false);
        },
        (error) => {
          console.error('Unable to load private sources.', error);
          setPrivateSources([]);
          setPrivateSourcesError('Unable to load saved sources. Check Firebase rules and try again.');
          setPrivateSourcesLoading(false);
        },
      );
    } catch (error) {
      console.error('Unable to subscribe to private sources.', error);
      setPrivateSourcesError('Unable to connect to saved sources. Check Firebase configuration.');
      setPrivateSourcesLoading(false);
      return undefined;
    }
  }, [authUser, isPrivateWorkspace]);

  useEffect(() => {
    if (!authUser || !isPrivateWorkspace) {
      setPrivateItemsLoading(false);
      return undefined;
    }

    setPrivateItemsLoading(true);
    setPrivateItemsError('');

    try {
      return subscribeToUserItems(
        authUser.uid,
        (nextItems) => {
          setPrivateArticles(nextItems);
          setPrivateItemsLoading(false);
        },
        (error) => {
          console.error('Unable to load private items.', error);
          setPrivateArticles([]);
          setPrivateItemsError('Unable to load saved insights. Check Firebase rules and try again.');
          setPrivateItemsLoading(false);
        },
      );
    } catch (error) {
      console.error('Unable to subscribe to private items.', error);
      setPrivateItemsError('Unable to connect to saved insights. Check Firebase configuration.');
      setPrivateItemsLoading(false);
      return undefined;
    }
  }, [authUser, isPrivateWorkspace]);

  const updateSources = (updater: (current: Source[]) => Source[]) => {
    if (isPrivateWorkspace) {
      setPrivateSources(updater);
      return;
    }
    setDemoSources(updater);
  };

  const updateArticles = (updater: (current: ContentItem[]) => ContentItem[]) => {
    if (isPrivateWorkspace) {
      setPrivateArticles(updater);
      return;
    }
    setDemoArticles(updater);
  };

  const updateLogs = (updater: (current: string[]) => string[]) => {
    if (isPrivateWorkspace) {
      setPrivateLogs(updater);
      return;
    }
    setDemoLogs(updater);
  };

  const handleOpenDemo = () => {
    localStorage.setItem('content-radar-workspace-mode', 'demo');
    setWorkspaceMode('demo');
    setActiveTab('dashboard');
    setViewMode('dashboard');
  };

  const handleOpenAuth = (mode: AuthMode) => {
    setAuthModalMode(mode);
  };

  const handleAuthSuccess = () => {
    setAuthModalMode(null);
    localStorage.setItem('content-radar-workspace-mode', 'private');
    setWorkspaceMode('private');
    setActiveTab('dashboard');
    setViewMode('dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.setItem('content-radar-workspace-mode', 'demo');
    setPrivateSources([]);
    setPrivateArticles([]);
    setPrivateLogs([]);
    setPrivateSourcesError('');
    setPrivateItemsError('');
    setRefreshError('');
    setAiAnalysisMessage('');
    setAiAnalysisError('');
    setSampleWorkspaceMessage('');
    setSampleWorkspaceError('');
    setPrivateSourcesLoading(false);
    setPrivateItemsLoading(false);
    setWorkspaceMode('demo');
    setActiveTab('dashboard');
    setShowProfileDropdown(false);
    setViewMode('landing');
  };

  const handleAddSource = async (sourceInput: SourceInput) => {
    const { name, url, type } = sourceInput;

    if (isPrivateWorkspace) {
      if (!authUser) {
        throw new Error('Sign in before adding private sources.');
      }

      await addUserSource(authUser.uid, sourceInput);
      setPrivateLogs((prev) => [
        `Added new source: "${name}" stream...`,
        ...prev,
      ]);
      return;
    }

    const newSource: Source = {
      id: `src-${Date.now()}`,
      name,
      url,
      type,
      status: 'active',
      createdAt: new Date().toLocaleDateString(),
      lastFetchedAt: isPrivateWorkspace ? 'Not checked yet' : 'Just now',
      purpose: sourceInput.purpose || 'custom',
      discoveredFrom: sourceInput.discoveredFrom,
      discoveryMethod: sourceInput.discoveryMethod,
      includePatterns: sourceInput.includePatterns || [],
      excludePatterns: sourceInput.excludePatterns || [],
      maxItemsPerRefresh: sourceInput.maxItemsPerRefresh || 10,
    };

    updateSources((prev) => [newSource, ...prev]);
    updateLogs((prev) => [
      `Added new source: "${name}" stream...`,
      ...prev,
    ]);
  };

  const handleDeleteSource = async (id: string) => {
    const sourceToDelete = sources.find((source) => source.id === id);
    const sourceName = sourceToDelete ? sourceToDelete.name : 'Unknown Feed';

    if (isPrivateWorkspace) {
      if (!authUser) {
        throw new Error('Sign in before deleting private sources.');
      }

      await deleteUserSource(authUser.uid, id);
      setPrivateLogs((prev) => [
        `Disconnected source stream: "${sourceName}"`,
        ...prev,
      ]);
      return;
    }

    updateSources((prev) => prev.filter((source) => source.id !== id));
    updateLogs((prev) => [
      `Disconnected source stream: "${sourceName}"`,
      ...prev,
    ]);
  };

  const handleSyncStreams = async () => {
    if (isScanning) return;

    if (sources.length === 0) {
      updateLogs((prev) => [
        'Add at least one source before refreshing this workspace.',
        ...prev,
      ]);
      return;
    }

    if (isPrivateWorkspace) {
      if (!authUser) {
        setRefreshError('Sign in before refreshing private sources.');
        return;
      }

      setIsScanning(true);
      setScanProgress(0.15);
      setRefreshError('');
      setPrivateLogs((prev) => [
        'Requesting authenticated source refresh...',
        ...prev,
      ]);

      try {
        const token = await authUser.getIdToken();
        setScanProgress(0.45);

        const response = await fetch('/api/refresh', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json().catch(() => ({
          success: false,
          error: 'Refresh API did not return JSON. Run the app with Vercel dev or deploy to Vercel to execute /api/refresh.',
        })) as {
          success?: boolean;
          error?: string;
          sourcesChecked?: number;
          newItems?: number;
          skippedDuplicates?: number;
          aiSummarized?: number;
          aiSkipped?: number;
          aiFailed?: number;
          aiQuotaLimited?: number;
          failedSources?: { sourceName: string; error: string }[];
        };

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Source refresh failed.');
        }

        setScanProgress(1);
        setPrivateLogs((prev) => [
          `Refresh complete. Checked ${result.sourcesChecked ?? 0} sources, added ${result.newItems ?? 0} new items, skipped ${result.skippedDuplicates ?? 0} duplicates.`,
          `AI insights: ${result.aiSummarized ?? 0} summarized, ${result.aiSkipped ?? 0} parsed only, ${result.aiFailed ?? 0} failed, ${result.aiQuotaLimited ?? 0} queued.`,
          ...(result.failedSources?.length
            ? [`${result.failedSources.length} sources failed and were skipped.`]
            : []),
          ...prev,
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to refresh sources.';
        setRefreshError(message);
        setPrivateLogs((prev) => [
          `Refresh failed: ${message}`,
          ...prev,
        ]);
      } finally {
        setIsScanning(false);
      }
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    const checkSteps = [
      { progress: 0.25, log: 'Contacting content servers...' },
      { progress: 0.55, log: 'Discovered new articles across sources...' },
      { progress: 0.85, log: 'Filtering duplicates and skipping redundant items...' },
      { progress: 1.0, log: 'Sync complete. Placed 1 new insight on dashboard.' },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < checkSteps.length) {
        const step = checkSteps[stepIndex];
        setScanProgress(step.progress);
        updateLogs((prev) => [step.log, ...prev]);
        stepIndex++;
      } else {
        clearInterval(interval);

        const simArticle: ContentItem = {
          id: `art-sim-${Date.now()}`,
          sourceId: sources[0]?.id || 'src-1',
          sourceName: sources[0]?.name || 'Content Radar Source',
          title: isPrivateWorkspace
            ? 'Private workspace source refresh placeholder'
            : 'Optimizing Recruiter Screening loops through AI Context Mapping',
          url: sources[0]?.url || 'https://example.com',
          publishedAt: 'Just now',
          summary: isPrivateWorkspace
            ? 'This placeholder confirms the private workspace state is isolated from the public demo data. Real RSS ingestion will be implemented in a later phase.'
            : 'A streamlined guide on how automation tools can parse candidate CV nodes and map relevant skills into clear summaries. Reduces initial screening cycles by 40%.',
          topic: isPrivateWorkspace ? 'Product' : 'Automation',
          aiSummary: isPrivateWorkspace
            ? 'This placeholder confirms the private workspace state is isolated from the public demo data.'
            : 'A streamlined guide on using automation tools to parse candidate CV signals and map relevant skills into clear summaries.',
          signalType: isPrivateWorkspace ? 'Product Update' : 'Technical Update',
          whyItMatters: isPrivateWorkspace
            ? 'It confirms private workspace data stays isolated from public demo content.'
            : 'It shows how structured automation can reduce repetitive review work and improve decision speed.',
          actionNote: isPrivateWorkspace
            ? 'Connect the upcoming ingestion worker before using this as production content.'
            : 'Implement talent context rules to serve pre-screened summary dossiers.',
          actionProposal: isPrivateWorkspace
            ? 'Connect the ingestion worker before using this item as production content.'
            : 'Review whether the same context rules can improve your own screening workflow.',
          relevanceScore: isPrivateWorkspace ? 50 : 84,
          aiStatus: 'summarized',
          aiModel: 'demo',
          createdAt: new Date().toISOString(),
          isNew: true,
        };

        updateArticles((prev) => [simArticle, ...prev]);
        setIsScanning(false);
      }
    }, 650);
  };

  const handleLoadSampleWorkspace = async () => {
    if (!authUser) {
      setSampleWorkspaceError('Sign in before loading the sample workspace.');
      return;
    }

    if (isLoadingSampleWorkspace) return;

    setIsLoadingSampleWorkspace(true);
    setSampleWorkspaceError('');
    setSampleWorkspaceMessage('');

    try {
      const result = await loadSampleWorkspace(authUser.uid);
      setSampleWorkspaceMessage(`Loaded sample workspace with ${result.sourcesCreated} sources and ${result.itemsCreated} sample insights.`);
      setPrivateLogs((prev) => [
        `Loaded sample workspace: ${result.sourcesCreated} sources, ${result.itemsCreated} sample items.`,
        ...prev,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load sample workspace.';
      setSampleWorkspaceError(message);
      setPrivateLogs((prev) => [
        `Sample workspace failed: ${message}`,
        ...prev,
      ]);
    } finally {
      setIsLoadingSampleWorkspace(false);
    }
  };

  const handleAddOwnSourceFromOnboarding = () => {
    setActiveTab('sources');
    setOpenAddSourceSignal((current) => current + 1);
  };

  const getFriendlyAiUiMessage = (message: string) => {
    const normalized = message.toUpperCase();
    if (
      normalized.includes('RESOURCE_EXHAUSTED')
      || normalized.includes('429')
      || normalized.includes('QUOTA')
    ) {
      return 'AI analysis is queued. Parsed content is saved and can be analyzed later.';
    }

    return message;
  };

  const handleAnalyzeExistingItems = async () => {
    if (!isPrivateWorkspace) {
      setAiAnalysisMessage('Demo items are already using sample AI insights.');
      setAiAnalysisError('');
      return;
    }

    if (!authUser) {
      setAiAnalysisError('Sign in before analyzing existing items.');
      setAiAnalysisMessage('');
      return;
    }

    if (isAnalyzingExisting) return;

    setIsAnalyzingExisting(true);
    setAiAnalysisError('');
    setAiAnalysisMessage('');
    setPrivateLogs((prev) => [
      'Requesting AI analysis for existing parsed items...',
      ...prev,
    ]);

    try {
      const token = await authUser.getIdToken();
      const response = await fetch('/api/analyze-existing', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 1 }),
      });
      const result = await response.json().catch(() => ({
        success: false,
        error: 'Analyze API did not return JSON. Run the app with Vercel dev or deploy to Vercel to execute /api/analyze-existing.',
      })) as {
        success?: boolean;
        error?: string;
        message?: string;
        checked?: number;
        summarized?: number;
        cached?: number;
        failed?: number;
        skipped?: number;
        quotaLimited?: number;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to analyze existing items.');
      }

      const summary = result.message
        ? `${result.message} ${result.skipped ?? 0} skipped.`
        : `AI analysis completed. ${result.summarized ?? 0} summarized, ${result.cached ?? 0} cached, ${result.failed ?? 0} failed, ${result.quotaLimited ?? 0} quota limited, ${result.skipped ?? 0} skipped.`;

      setAiAnalysisMessage(summary);
      setPrivateLogs((prev) => [
        `Analyze existing complete. Checked ${result.checked ?? 0}; ${result.summarized ?? 0} summarized, ${result.cached ?? 0} cached, ${result.failed ?? 0} failed, ${result.quotaLimited ?? 0} quota limited, ${result.skipped ?? 0} skipped.`,
        ...prev,
      ]);
    } catch (error) {
      const message = getFriendlyAiUiMessage(error instanceof Error ? error.message : 'Unable to analyze existing items.');
      setAiAnalysisError(message);
      setPrivateLogs((prev) => [
        `Analyze existing failed: ${message}`,
        ...prev,
      ]);
    } finally {
      setIsAnalyzingExisting(false);
    }
  };

  const handleResetAiFailedItems = async () => {
    if (!isPrivateWorkspace) {
      setAiAnalysisMessage('Demo items are already using sample AI insights.');
      setAiAnalysisError('');
      return;
    }

    if (!authUser) {
      setAiAnalysisError('Sign in before resetting AI failed items.');
      setAiAnalysisMessage('');
      return;
    }

    if (isResettingAiFailures) return;

    setIsResettingAiFailures(true);
    setAiAnalysisError('');
    setAiAnalysisMessage('');

    try {
      const updated = await resetQuotaFailedItems(authUser.uid);
      setAiAnalysisMessage(`Reset AI failed items. ${updated} quota-limited items are now queued.`);
      setPrivateLogs((prev) => [
        `Reset AI failed items: ${updated} quota-limited items queued.`,
        ...prev,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset AI failed items.';
      setAiAnalysisError(message);
      setPrivateLogs((prev) => [
        `Reset AI failed items failed: ${message}`,
        ...prev,
      ]);
    } finally {
      setIsResettingAiFailures(false);
    }
  };

  const handleResetWorkspace = () => {
    if (isPrivateWorkspace) {
      setPrivateSources([]);
      setPrivateArticles([]);
      setPrivateLogs([]);
      setPrivateItemsError('');
      setRefreshError('');
      setAiAnalysisMessage('');
      setAiAnalysisError('');
      setSampleWorkspaceMessage('');
      setSampleWorkspaceError('');
      return;
    }

    setDemoSources(INITIAL_SOURCES);
    setDemoArticles(INITIAL_ARTICLES);
    setDemoLogs([
      'Reloaded default demo sources...',
      'Index verified for all initial feeds.',
    ]);
  };

  const searchedArticles = displayArticles.filter((article) => {
    if (!globalSearch.trim()) return true;
    return (
      article.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      article.sourceName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      article.topic.toLowerCase().includes(globalSearch.toLowerCase())
    );
  });

  const sourceItemCounts = useMemo(() => {
    return displayArticles.reduce((counts, article) => {
      if (article.sourceId) {
        counts[article.sourceId] = (counts[article.sourceId] || 0) + 1;
      }

      if (article.sourceName) {
        counts[article.sourceName] = (counts[article.sourceName] || 0) + 1;
      }

      return counts;
    }, {} as Record<string, number>);
  }, [displayArticles]);

  const dashboardCounts = {
    articles: articles.length,
    duplicates: isPrivateWorkspace ? 0 : 32,
    insights: articles.filter((article) => article.aiStatus === 'summarized').length,
  };
  const shouldShowZeroInsightsNotice = isPrivateWorkspace
    && (dashboardCounts.articles > 0 || sources.length > 0)
    && dashboardCounts.insights === 0;
  const zeroInsightsNoticeTitle = dashboardCounts.articles > 0
    ? 'Parsed items are ready.'
    : 'Sample insights are available.';
  const zeroInsightsNoticeBody = dashboardCounts.articles > 0
    ? 'Load sample insights or analyze items when AI quota is available.'
    : 'Load sample insights or add parsed items, then analyze when AI quota is available.';

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text-primary flex flex-col font-sans antialiased overflow-x-hidden relative transition-colors duration-200">
      {viewMode === 'landing' && (
        <LandingPage
          onLaunchDashboard={handleOpenDemo}
          onNavigateToAuth={handleOpenAuth}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
      )}

      {viewMode === 'dashboard' && (
        <div id="dashboard-app-container" className="flex h-screen relative overflow-hidden bg-theme-bg">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            sourcesCount={sources.length}
            workspaceMode={workspaceMode}
          />

          <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden max-w-full">
            <header
              id="dashboard-topbar"
              className="h-16 border-b border-theme-border bg-theme-surface px-6 flex items-center justify-between shrink-0 z-30 select-none"
            >
              <div className="flex items-center gap-3">
                <div className="md:hidden bg-theme-accent text-theme-accent-fg p-1.5 rounded-lg mr-1 shadow">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold tracking-tight text-theme-text-primary uppercase font-sans">
                      {activeTab === 'dashboard' && 'Dashboard'}
                      {activeTab === 'sources' && 'Sources'}
                      {activeTab === 'insights' && 'Insights'}
                      {activeTab === 'reports' && 'Reports'}
                      {activeTab === 'settings' && 'Settings'}
                    </h1>
                    <span className="hidden sm:inline-flex rounded-full border border-theme-border bg-theme-surface-soft px-2 py-0.5 text-[10px] font-bold uppercase text-theme-text-secondary">
                      {isPrivateWorkspace ? 'Private Workspace' : 'Demo Preview'}
                    </span>
                  </div>
                  {authLoading && (
                    <p className="text-[10px] text-theme-text-secondary mt-0.5">Checking auth session...</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary animate-pulse" />
                  <input
                    id="topbar-global-search"
                    type="text"
                    placeholder="Search radar..."
                    value={globalSearch}
                    onChange={(event) => setGlobalSearch(event.target.value)}
                    className="h-9 w-[170px] bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 pl-9 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary"
                  />
                </div>

                <div className="relative hidden md:block">
                  <select
                    id="topbar-date-range"
                    className="h-9 bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 text-xs focus:outline-none cursor-pointer font-semibold"
                  >
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>All Time</option>
                  </select>
                </div>

                <button
                  id="navbar-showcase-tour-btn"
                  onClick={() => setViewMode('landing')}
                  className="h-9 px-3.5 border border-theme-border hover:bg-theme-surface-soft text-theme-text-secondary hover:text-theme-text-primary rounded-xl transition-all text-xs font-bold flex items-center justify-center cursor-pointer"
                >
                  Showcase Tour
                </button>

                {!isPrivateWorkspace && (
                  <button
                    id="dashboard-signin-btn"
                    onClick={() => handleOpenAuth('signin')}
                    className="hidden md:flex h-9 px-3.5 border border-theme-border hover:bg-theme-surface-soft text-theme-text-secondary hover:text-theme-text-primary rounded-xl transition-all text-xs font-bold items-center justify-center cursor-pointer"
                  >
                    Sign in
                  </button>
                )}

                <button
                  id="topbar-theme-toggler"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-9 h-9 flex items-center justify-center border border-theme-border bg-theme-surface hover:bg-theme-surface-soft text-theme-text-secondary rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Toggle layout theme color"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                <div className="relative">
                  <button
                    id="user-profile-dropdown-btn"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-theme-accent text-theme-accent-fg flex items-center justify-center hover:opacity-90 transition-opacity shadow select-none cursor-pointer"
                  >
                    <span className="text-xs font-bold leading-none">
                      {user.name[0]}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div
                      id="topbar-profile-popup"
                      className="absolute right-0 mt-3 w-56 bg-theme-surface border border-theme-border rounded-xl shadow-lg p-3 z-50 text-left text-theme-text-primary animate-fade-in-quick"
                    >
                      <div className="pb-2 border-b border-theme-border">
                        <span className="font-bold text-xs block truncate">{user.name}</span>
                        <span className="text-[10px] text-theme-text-secondary block truncate mt-0.5">{user.email}</span>
                      </div>
                      <div className="py-2 space-y-1 text-xs">
                        <div className="flex justify-between p-1.5 bg-theme-surface-soft rounded-lg text-[10px] font-bold">
                          <span className="text-theme-text-secondary">Mode:</span>
                          <span className="text-theme-text-primary font-bold uppercase">{user.plan}</span>
                        </div>
                        {!firebaseReady && (
                          <div className="p-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-semibold">
                            Firebase env values are not configured.
                          </div>
                        )}
                        <button
                          id="btn-settings-redirect"
                          onClick={() => {
                            setActiveTab('settings');
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left p-1.5 hover:bg-theme-surface-soft rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-semibold text-theme-text-secondary hover:text-theme-text-primary"
                        >
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-theme-border pt-1.5 flex justify-end">
                        <button
                          id="btn-profile-signout"
                          onClick={() => {
                            if (isPrivateWorkspace) {
                              void handleSignOut();
                              return;
                            }
                            setViewMode('landing');
                            setShowProfileDropdown(false);
                          }}
                          className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                        >
                          {isPrivateWorkspace ? 'Sign Out' : 'Exit Preview'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div
              id="mobile-navigation-bar"
              className="md:hidden border-b border-theme-border bg-theme-surface flex items-center justify-around h-11 shrink-0 px-3 text-[11px] select-none"
            >
              <button onClick={() => setActiveTab('dashboard')} className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'dashboard' ? 'bg-theme-accent text-theme-accent-fg shadow-sm' : 'text-theme-text-secondary'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('sources')} className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'sources' ? 'bg-theme-accent text-theme-accent-fg shadow-sm' : 'text-theme-text-secondary'}`}>Sources</button>
              <button onClick={() => setActiveTab('insights')} className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'insights' ? 'bg-theme-accent text-theme-accent-fg shadow-sm' : 'text-theme-text-secondary'}`}>Insights</button>
              <button onClick={() => setActiveTab('reports')} className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'reports' ? 'bg-theme-accent text-theme-accent-fg shadow-sm' : 'text-theme-text-secondary'}`}>Reports</button>
              <button onClick={() => setActiveTab('settings')} className={`px-2.5 py-1 rounded-lg font-bold ${activeTab === 'settings' ? 'bg-theme-accent text-theme-accent-fg shadow-sm' : 'text-theme-text-secondary'}`}>Settings</button>
            </div>

            <div id="main-content-scroll" className="flex-grow overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-6">
              {isPrivateWorkspace && !privateSourcesLoading && !privateItemsLoading && sources.length === 0 && articles.length === 0 && (
                <div id="private-empty-workspace" className="bg-theme-surface border border-theme-border rounded-xl p-5 md:p-6 shadow-sm text-left">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    <div className="max-w-2xl">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary">
                        <Sparkles className="w-3.5 h-3.5" /> Private Workspace
                      </span>
                      <h2 className="text-lg font-bold text-theme-text-primary mt-1">Your private workspace is ready.</h2>
                      <p className="text-xs text-theme-text-secondary mt-1.5 leading-relaxed">
                        Start with a sample monitoring workspace or add your own source.
                      </p>
                      <p className="text-[11px] text-theme-text-secondary mt-2 leading-relaxed">
                        Sample records are clearly labeled and stored only in your authenticated workspace after you choose to load them.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleLoadSampleWorkspace()}
                        disabled={isLoadingSampleWorkspace}
                        className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs rounded-xl border border-theme-border"
                      >
                        {isLoadingSampleWorkspace ? 'Loading Sample...' : 'Load Sample Workspace'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddOwnSourceFromOnboarding}
                        className="px-4 py-2 bg-theme-surface-soft hover:bg-theme-border/40 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border"
                      >
                        Add My Own Source
                      </button>
                    </div>
                  </div>

                  {(sampleWorkspaceMessage || sampleWorkspaceError) && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-xs font-semibold ${
                      sampleWorkspaceError
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/15'
                    }`}>
                      {sampleWorkspaceError || sampleWorkspaceMessage}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <StatsGrid
                    sourcesCount={sources.length}
                    articlesCount={dashboardCounts.articles}
                    duplicatesCount={dashboardCounts.duplicates}
                    insightsCount={dashboardCounts.insights}
                    articles={searchedArticles}
                  />

                  {shouldShowZeroInsightsNotice && (
                    <div className="bg-theme-surface border border-theme-border rounded-xl p-5 shadow-sm text-left">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary">AI analysis status</span>
                          <h2 className="text-sm font-bold text-theme-text-primary mt-1">{zeroInsightsNoticeTitle}</h2>
                          <p className="text-xs text-theme-text-secondary mt-1">
                            {zeroInsightsNoticeBody}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => void handleLoadSampleWorkspace()}
                            disabled={isLoadingSampleWorkspace}
                            className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs rounded-xl border border-theme-border"
                          >
                            {isLoadingSampleWorkspace ? 'Loading Sample...' : 'Load Sample Workspace'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAnalyzeExistingItems()}
                            disabled={isAnalyzingExisting}
                            className="px-4 py-2 bg-theme-surface-soft hover:bg-theme-border/40 disabled:opacity-50 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border"
                          >
                            {isAnalyzingExisting ? 'Analyzing...' : 'Analyze 1 Item'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleResetAiFailedItems()}
                            disabled={isResettingAiFailures}
                            className="px-4 py-2 bg-theme-surface-soft hover:bg-theme-border/40 disabled:opacity-50 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border"
                          >
                            {isResettingAiFailures ? 'Resetting...' : 'Reset AI Failed Items'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <AnalyticsCharts
                    articles={searchedArticles}
                    isScanning={isScanning}
                    scanProgress={scanProgress}
                    onRefresh={handleSyncStreams}
                    recentLogs={executionLogs}
                  />

                  {isPrivateWorkspace && (refreshError || privateItemsError || privateItemsLoading) && (
                    <div className="bg-theme-surface border border-theme-border rounded-xl p-4 shadow-sm text-left">
                      {privateItemsLoading && (
                        <p className="text-xs font-semibold text-theme-text-secondary">Loading saved insights...</p>
                      )}
                      {refreshError && (
                        <p className="text-xs font-semibold text-rose-500">{refreshError}</p>
                      )}
                      {privateItemsError && (
                        <p className="text-xs font-semibold text-rose-500">{privateItemsError}</p>
                      )}
                    </div>
                  )}

                  <MonitoredSourcesSummary
                    sources={sources}
                    sourceItemCounts={sourceItemCounts}
                  />
                  <div className="pt-2">
                    <InsightsTable
                      insights={searchedArticles}
                      onRefreshDemo={handleResetWorkspace}
                      onAnalyzeExisting={handleAnalyzeExistingItems}
                      onResetAiFailedItems={handleResetAiFailedItems}
                      isAnalyzingExisting={isAnalyzingExisting}
                      isResettingAiFailures={isResettingAiFailures}
                      analyzeExistingMessage={aiAnalysisMessage}
                      analyzeExistingError={aiAnalysisError}
                      emptyTitle={isPrivateWorkspace && articles.length === 0 ? 'No insights yet' : undefined}
                      emptyDescription={isPrivateWorkspace && articles.length === 0 ? 'Refresh your sources to fetch the latest updates.' : undefined}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'sources' && (
                <div className="animate-fade-in">
                  <SourcesPanel
                    sources={sources}
                    onAddSource={handleAddSource}
                    onDeleteSource={handleDeleteSource}
                    isLoading={isPrivateWorkspace && privateSourcesLoading}
                    errorMessage={isPrivateWorkspace ? privateSourcesError : ''}
                    workspaceMode={workspaceMode}
                    sourceItemCounts={sourceItemCounts}
                    openAddFormSignal={openAddSourceSignal}
                  />
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="animate-fade-in text-left">
                  <InsightsTable
                    insights={searchedArticles}
                    onRefreshDemo={handleResetWorkspace}
                    onAnalyzeExisting={handleAnalyzeExistingItems}
                    onResetAiFailedItems={handleResetAiFailedItems}
                    isAnalyzingExisting={isAnalyzingExisting}
                    isResettingAiFailures={isResettingAiFailures}
                    analyzeExistingMessage={aiAnalysisMessage}
                    analyzeExistingError={aiAnalysisError}
                    emptyTitle={isPrivateWorkspace && articles.length === 0 ? 'No insights yet' : undefined}
                    emptyDescription={isPrivateWorkspace && articles.length === 0 ? 'Refresh your sources to fetch the latest updates.' : undefined}
                  />
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="animate-fade-in">
                  <ReportsPanel />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="animate-fade-in text-left">
                  <SettingsPanel
                    theme={theme}
                    onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    user={user}
                    onResetDemo={handleResetWorkspace}
                    workspaceMode={workspaceMode}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {authModalMode && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onModeChange={setAuthModalMode}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
