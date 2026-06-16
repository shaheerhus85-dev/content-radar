import { useEffect, useMemo, useState } from 'react';
import { INITIAL_SOURCES, INITIAL_ARTICLES } from './mockData';
import { Source, ContentItem } from './types';
import { useAuth } from './auth/AuthContext';
import {
  addUserSource,
  deleteUserSource,
  subscribeToUserSources,
} from './lib/sourceService';
import { subscribeToUserItems } from './lib/itemService';
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
} from 'lucide-react';

type ViewMode = 'landing' | 'dashboard';
type WorkspaceMode = 'demo' | 'private';
type AuthMode = 'signin' | 'signup';

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

  const [globalSearch, setGlobalSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const isPrivateWorkspace = workspaceMode === 'private';
  const sources = isPrivateWorkspace ? privateSources : demoSources;
  const articles = isPrivateWorkspace ? privateArticles : demoArticles;
  const executionLogs = isPrivateWorkspace ? privateLogs : demoLogs;

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
    setPrivateSourcesLoading(false);
    setPrivateItemsLoading(false);
    setWorkspaceMode('demo');
    setActiveTab('dashboard');
    setShowProfileDropdown(false);
    setViewMode('landing');
  };

  const handleAddSource = async (name: string, url: string, type: 'rss' | 'sitemap') => {
    if (isPrivateWorkspace) {
      if (!authUser) {
        throw new Error('Sign in before adding private sources.');
      }

      await addUserSource(authUser.uid, { name, url, type });
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
          failedSources?: { sourceName: string; error: string }[];
        };

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Source refresh failed.');
        }

        setScanProgress(1);
        setPrivateLogs((prev) => [
          `Refresh complete. Checked ${result.sourcesChecked ?? 0} sources, added ${result.newItems ?? 0} new items, skipped ${result.skippedDuplicates ?? 0} duplicates.`,
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
          actionNote: isPrivateWorkspace
            ? 'Connect the upcoming ingestion worker before using this as production content.'
            : 'Implement talent context rules to serve pre-screened summary dossiers.',
          createdAt: new Date().toISOString(),
          isNew: true,
        };

        updateArticles((prev) => [simArticle, ...prev]);
        setIsScanning(false);
      }
    }, 650);
  };

  const handleResetWorkspace = () => {
    if (isPrivateWorkspace) {
      setPrivateSources([]);
      setPrivateArticles([]);
      setPrivateLogs([]);
      setPrivateItemsError('');
      setRefreshError('');
      return;
    }

    setDemoSources(INITIAL_SOURCES);
    setDemoArticles(INITIAL_ARTICLES);
    setDemoLogs([
      'Reloaded default demo sources...',
      'Index verified for all initial feeds.',
    ]);
  };

  const searchedArticles = articles.filter((article) => {
    if (!globalSearch.trim()) return true;
    return (
      article.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      article.sourceName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      article.topic.toLowerCase().includes(globalSearch.toLowerCase())
    );
  });

  const dashboardCounts = {
    articles: isPrivateWorkspace ? articles.length : articles.length + 131,
    duplicates: isPrivateWorkspace ? 0 : 32,
    insights: isPrivateWorkspace ? articles.length : 121,
  };

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
              {isPrivateWorkspace && sources.length === 0 && articles.length === 0 && (
                <div id="private-empty-workspace" className="bg-theme-surface border border-theme-border rounded-xl p-5 shadow-sm text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-secondary">Private Workspace</span>
                  <h2 className="text-lg font-bold text-theme-text-primary mt-1">Your workspace is ready.</h2>
                  <p className="text-xs text-theme-text-secondary mt-1 max-w-2xl">
                    New authenticated users start with empty sources and items. Add an RSS feed or sitemap, then refresh sources to fetch parsed updates. AI summaries arrive in a later phase.
                  </p>
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

                  <MonitoredSourcesSummary sources={sources} />

                  <div className="pt-2">
                    <InsightsTable
                      insights={searchedArticles}
                      onRefreshDemo={handleResetWorkspace}
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
                  />
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="animate-fade-in text-left">
                  <InsightsTable
                    insights={searchedArticles}
                    onRefreshDemo={handleResetWorkspace}
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
