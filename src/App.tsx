import { useState, useEffect } from 'react';
import { INITIAL_SOURCES, INITIAL_ARTICLES } from './mockData';
import { Source, ContentItem } from './types';
import Sidebar from './components/Sidebar';
import StatsGrid from './components/StatsGrid';
import AnalyticsCharts from './components/AnalyticsCharts';
import InsightsTable from './components/InsightsTable';
import SourcesPanel from './components/SourcesPanel';
import ReportsPanel from './components/ReportsPanel';
import SettingsPanel from './components/SettingsPanel';
import LandingPage from './components/LandingPage';
import MonitoredSourcesSummary from './components/MonitoredSourcesSummary';
import {
  Search,
  Moon,
  Sun,
  Radio,
} from 'lucide-react';

export default function App() {
  // Theme state: defaults to dark mode
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark';
  });

  // Public visitors land on the showcase first; the dashboard remains one click away.
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Authenticated user state placeholder
  const [user] = useState<{ name: string; email: string; plan: string } | null>({
    name: 'Shaheer Hussain',
    email: 'shaheerhus85@gmail.com',
    plan: 'Enterprise Partner',
  });

  // Client states
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES);
  const [articles, setArticles] = useState<ContentItem[]>(INITIAL_ARTICLES);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Scanner Simulator states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    'Checked OpenAI News feed...',
    'Index verification complete: Vercel Blog sitemap...',
    'Scan cycle stable. Monitoring 4 active sources.',
  ]);

  // Synchronize layout theme with HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle addition of a new source
  const handleAddSource = (name: string, url: string, type: 'rss' | 'sitemap') => {
    const newSource: Source = {
      id: `src-${Date.now()}`,
      name,
      url,
      type,
      status: 'active',
      createdAt: new Date().toLocaleDateString(),
      lastFetchedAt: 'Just now',
    };
    setSources((prev) => [newSource, ...prev]);
    setExecutionLogs((prev) => [
      `Added new source: "${name}" stream...`,
      ...prev,
    ]);
  };

  // Handle deletion of a source
  const handleDeleteSource = (id: string) => {
    const sourceToDelete = sources.find((s) => s.id === id);
    const sourceName = sourceToDelete ? sourceToDelete.name : 'Unknown Feed';
    setSources((prev) => prev.filter((s) => s.id !== id));
    setExecutionLogs((prev) => [
      `Disconnected source stream: "${sourceName}"`,
      ...prev,
    ]);
  };

  // Simulated content refresh flow (clears AI and developer-heavy labels, provides human steps)
  const handleSyncStreams = () => {
    if (isScanning || sources.length === 0) return;

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
        setExecutionLogs((prev) => [step.log, ...prev]);
        stepIndex++;
      } else {
        clearInterval(interval);

        // Inject simulated article for recruiters to see
        const simArticle: ContentItem = {
          id: `art-sim-${Date.now()}`,
          sourceId: sources[0]?.id || 'src-1',
          sourceName: sources[0]?.name || 'Google Search Central Blog',
          title: 'Optimizing Recruiter Screening loops through AI Context Mapping',
          url: 'https://developers.google.com/search/blog/recruiter-optimization',
          publishedAt: 'Just now',
          summary: 'A streamlined guide on how automation tools can parse candidate CV nodes and map relevant skills into clear summaries. Reduces initial screening cycles by 40%.',
          topic: 'Automation',
          actionNote: 'Implement talent context rules to serve pre-screened summary dossiers.',
          createdAt: new Date().toISOString(),
          isNew: true,
        };

        setArticles((prev) => [simArticle, ...prev]);
        setIsScanning(false);
      }
    }, 650);
  };

  const handleResetToDemo = () => {
    setSources(INITIAL_SOURCES);
    setArticles(INITIAL_ARTICLES);
    setExecutionLogs([
      'Reloaded default demo sources...',
      'Index verified for all initial feeds.',
    ]);
  };

  // Local filter search computed on articles representation
  const searchedArticles = articles.filter((art) => {
    if (!globalSearch.trim()) return true;
    return (
      art.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      art.sourceName.toLowerCase().includes(globalSearch.toLowerCase()) ||
      art.topic.toLowerCase().includes(globalSearch.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text-primary flex flex-col font-sans antialiased overflow-x-hidden relative transition-colors duration-200">
      
      {/* 1. VIEW CONDITIONAL CONTAINER */}
      
      {/* LANDING PAGE TOUR VIEW */}
      {viewMode === 'landing' && (
        <LandingPage
          onLaunchDashboard={() => setViewMode('dashboard')}
          onNavigateToAuth={(mode) => setViewMode('dashboard')} // Send straight to dashboard for fast access
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />
      )}

      {/* DASHBOARD APPLICATION VIEW */}
      {viewMode === 'dashboard' && (
        <div id="dashboard-app-container" className="flex h-screen relative overflow-hidden bg-theme-bg">
          
          {/* Left Sidebar Fixed (240px) */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            sourcesCount={sources.length}
          />

          {/* Right Main Panel Container */}
          <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden max-w-full">
            
            {/* Topbar navigation menu */}
            <header
              id="dashboard-topbar"
              className="h-16 border-b border-theme-border bg-theme-surface px-6 flex items-center justify-between shrink-0 z-30 select-none"
            >
              <div className="flex items-center gap-3">
                {/* Mobile visible branding icon */}
                <div className="md:hidden bg-theme-accent text-theme-accent-fg p-1.5 rounded-lg mr-1 shadow">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-theme-text-primary uppercase font-sans">
                    {activeTab === 'dashboard' && 'Dashboard'}
                    {activeTab === 'sources' && 'Sources'}
                    {activeTab === 'insights' && 'Insights'}
                    {activeTab === 'reports' && 'Reports'}
                    {activeTab === 'settings' && 'Settings'}
                  </h1>
                </div>
              </div>

              {/* Actions & Utilities */}
              <div className="flex items-center gap-4">
                
                {/* Global Search Bar (Filters insights in real time) */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary animate-pulse" />
                  <input
                    id="topbar-global-search"
                    type="text"
                    placeholder="Search radar..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="h-9 w-[170px] bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 pl-9 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary"
                  />
                </div>

                {/* Compact Date range dropdown: Default Last 7 Days */}
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

                {/* Back to landing page toggle styled as a solid 36px action button */}
                <button
                  id="navbar-showcase-tour-btn"
                  onClick={() => setViewMode('landing')}
                  className="h-9 px-3.5 border border-theme-border hover:bg-theme-surface-soft text-theme-text-secondary hover:text-theme-text-primary rounded-xl transition-all text-xs font-bold flex items-center justify-center cursor-pointer"
                >
                  Showcase Tour
                </button>

                {/* Theme toggle switcher - exact 36px */}
                <button
                  id="topbar-theme-toggler"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="w-9 h-9 flex items-center justify-center border border-theme-border bg-theme-surface hover:bg-theme-surface-soft text-theme-text-secondary rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Toggle layout theme color"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                {/* User avatar profile bubble - exact 36px */}
                <div className="relative">
                  <button
                    id="user-profile-dropdown-btn"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-theme-accent text-theme-accent-fg flex items-center justify-center hover:opacity-90 transition-opacity shadow select-none cursor-pointer"
                  >
                    <span className="text-xs font-bold leading-none">
                      {user ? user.name[0] : 'D'}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div
                      id="topbar-profile-popup"
                      className="absolute right-0 mt-3 w-56 bg-theme-surface border border-theme-border rounded-xl shadow-lg p-3 z-50 text-left text-theme-text-primary animate-fade-in-quick"
                    >
                      <div className="pb-2 border-b border-theme-border">
                        <span className="font-bold text-xs block truncate">{user?.name}</span>
                        <span className="text-[10px] text-theme-text-secondary block truncate mt-0.5">{user?.email}</span>
                      </div>
                      <div className="py-2 space-y-1 text-xs">
                        <div className="flex justify-between p-1.5 bg-theme-surface-soft rounded-lg text-[10px] font-bold">
                          <span className="text-theme-text-secondary">Tier:</span>
                          <span className="text-theme-text-primary font-bold uppercase">{user?.plan}</span>
                        </div>
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
                            setViewMode('landing');
                            setShowProfileDropdown(false);
                          }}
                          className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                        >
                          Sign Out Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </header>

            {/* Mobile dynamic navigation indicators in page view */}
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

            {/* Main Interactive Ingest scroll container */}
            <div id="main-content-scroll" className="flex-grow overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-6">
              
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in text-left">
                  {/* Top dashboard grid (2x2 metric cards (Sources: 4, Articles: 138, Duplicates: 32, Insights: 121) + Topic Mix + Source Health) */}
                  <StatsGrid
                    sourcesCount={sources.length}
                    articlesCount={articles.length + 131} // default + mock = 138 articles
                    duplicatesCount={32}
                    insightsCount={121}
                    articles={searchedArticles}
                  />

                  {/* Content Activity line chart & right stacked stats */}
                  <AnalyticsCharts
                    articles={searchedArticles}
                    isScanning={isScanning}
                    scanProgress={scanProgress}
                    onRefresh={handleSyncStreams}
                    recentLogs={executionLogs}
                  />

                  {/* Compact Monitored Sources Table Summary */}
                  <MonitoredSourcesSummary sources={sources} />

                  {/* Compact Latest Insights Table */}
                  <div className="pt-2">
                    <InsightsTable
                      insights={searchedArticles}
                      onRefreshDemo={handleResetToDemo}
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
                  />
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="animate-fade-in text-left">
                  <InsightsTable
                    insights={searchedArticles}
                    onRefreshDemo={handleResetToDemo}
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
                    onResetDemo={handleResetToDemo}
                  />
                </div>
              )}

            </div>

            {/* Footer has been REMOVED entirely from the application view shell! */}

          </div>
          
        </div>
      )}

    </div>
  );
}
