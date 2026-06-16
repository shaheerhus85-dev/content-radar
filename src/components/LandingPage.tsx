import { useState } from 'react';
import { Sparkles, Radio, Shield, Cpu, Database, Command, Sun, Moon, Zap, Target, Layers, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onLaunchDashboard: () => void;
  onNavigateToAuth: (view: 'signin' | 'signup') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function LandingPage({ onLaunchDashboard, onNavigateToAuth, theme, onToggleTheme }: LandingPageProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text-primary flex flex-col font-sans antialiased overflow-x-hidden relative transition-colors duration-300 select-none">
      
      {/* 1. Subtle, Clean Dotted Grid Background */}
      <div 
        id="dotted-grid" 
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{ 
          backgroundImage: 'radial-gradient(var(--dot-color) 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* 2. Soft Ambient Lighting Blooms */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,17,21,0.015)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.012)_0%,transparent_70%)] pointer-events-none blur-[90px] z-0" />

      {/* 3. Modern Navbar */}
      <nav id="landing-navbar" className="sticky top-0 z-50 w-full h-18 md:h-20 border-b border-theme-border bg-theme-bg/85 backdrop-blur-md px-6 md:px-12 flex items-center justify-between select-none transition-colors duration-300 relative">
        
        {/* Brand Space */}
        <div className="flex items-center gap-2.5">
          <div className="bg-theme-accent text-theme-accent-fg p-1.5 rounded-lg flex items-center justify-center transition-colors duration-300">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-theme-text-primary uppercase flex items-center gap-1.5 leading-none font-sans">
              Content Radar
            </span>
          </div>
        </div>

        {/* Minimalist Navigation Links - PERFECTLY ABSOLUTELY CENTERED ON SCREEN */}
        <div className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-theme-text-secondary absolute left-1/2 -translate-x-1/2">
          <a href="#workflow" className="hover:text-theme-text-primary transition-colors duration-200">How it works</a>
          <a href="#features" className="hover:text-theme-text-primary transition-colors duration-200">Features</a>
          <a href="#technology" className="hover:text-theme-text-primary transition-colors duration-200">Technology</a>
        </div>

        {/* Clean Topbar Action Section - Perfectly Vertically Aligned */}
        <div className="flex items-center gap-3">
          
          {/* Working Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center border border-theme-border bg-theme-surface hover:bg-theme-surface-soft text-theme-text-secondary hover:text-theme-text-primary rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="Toggle layout theme color"
            id="theme-toggler-btn"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Sign In - Visual and Vertically Aligned */}
            <button
              onClick={() => onNavigateToAuth('signin')}
              className="h-[48px] px-4 text-[15px] font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors cursor-pointer flex items-center justify-center"
              id="navbar-signin-btn"
            >
              Sign in
            </button>

            {/* Get Started Button - Perfectly Sized */}
            <button
              onClick={() => onNavigateToAuth('signup')}
              className="h-[48px] px-5 bg-theme-accent hover:opacity-90 active:scale-98 text-theme-accent-fg text-[15px] font-bold rounded-full cursor-pointer transition-all flex items-center justify-center leading-none"
              id="navbar-signup-btn"
            >
              Get started
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex md:hidden w-10 h-10 items-center justify-center border border-theme-border bg-theme-surface hover:bg-theme-surface-soft text-theme-text-secondary hover:text-theme-text-primary rounded-full transition-all cursor-pointer shadow-sm active:scale-95 z-50 relative"
            aria-label="Toggle mobile menu"
            id="mobile-menu-trigger"
          >
            {isDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Slide-out Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 top-[72px] bg-theme-bg/60 backdrop-blur-md z-40 md:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-[72px] right-0 bottom-0 w-full max-w-[280px] bg-theme-surface border-l border-theme-border z-40 shadow-2xl p-6 flex flex-col justify-between md:hidden select-none"
            >
              {/* Navigation Links */}
              <div className="flex flex-col gap-6 pt-2">
                <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-widest block font-sans">
                  Navigation
                </span>
                <div className="flex flex-col gap-1">
                  <a
                    href="#workflow"
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-[15px] font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors duration-200 flex items-center py-2.5 border-b border-theme-border/50"
                  >
                    How it works
                  </a>
                  <a
                    href="#features"
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-[15px] font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors duration-200 flex items-center py-2.5 border-b border-theme-border/50"
                  >
                    Features
                  </a>
                  <a
                    href="#technology"
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-[15px] font-semibold text-theme-text-secondary hover:text-theme-text-primary transition-colors duration-200 flex items-center py-2.5 border-b border-theme-border/50"
                  >
                    Technology
                  </a>
                </div>
              </div>

              {/* Mobile Call To Actions */}
              <div className="flex flex-col gap-3 mt-auto pb-8">
                <div className="pt-4 border-t border-theme-border/60" />
                
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigateToAuth('signin');
                  }}
                  className="w-full h-[44px] rounded-full border border-theme-border bg-theme-surface hover:bg-theme-surface-soft text-theme-text-primary font-bold text-[14px] transition-all cursor-pointer flex items-center justify-center shadow-sm"
                  id="mobile-drawer-signin-btn"
                >
                  Sign in
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigateToAuth('signup');
                  }}
                  className="w-full h-[44px] rounded-full bg-theme-accent hover:opacity-90 text-theme-accent-fg font-bold text-[14px] transition-all cursor-pointer flex items-center justify-center shadow-md"
                  id="mobile-drawer-signup-btn"
                >
                  Get started
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLaunchDashboard();
                  }}
                  className="w-full h-[44px] rounded-full bg-theme-surface-soft hover:bg-theme-border/45 text-theme-text-secondary font-bold text-[13px] transition-all cursor-pointer flex items-center justify-center border border-theme-border/70"
                  id="mobile-drawer-dashboard-btn"
                >
                  View Preview Dashboard
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Centered Hero Block */}
      <section id="hero" className="relative w-full min-h-[calc(100svh-72px)] md:min-h-[calc(100svh-80px)] grid place-items-center z-10 px-6 py-16 select-none">
        <div className="max-w-[860px] mx-auto text-center flex flex-col items-center justify-center w-full">
          
          {/* Crisp Badge Indicator */}
          <div className="inline-flex items-center gap-2 bg-theme-surface shadow-sm border border-theme-border px-4 py-1.5 rounded-full text-xs font-semibold tracking-normal text-theme-text-secondary mb-6 transition-colors hover:border-theme-text-secondary/15">
            <Sparkles className="w-3.5 h-3.5 text-theme-text-primary animate-pulse" />
            <span>REAL-TIME PIPELINE MONITOR</span>
          </div>

          {/* Bold High-Impact Headline with High Contrast & Perfect Line Height */}
          <h1 className="text-[40px] sm:text-[56px] md:text-[72px] lg:text-[80px] font-extrabold tracking-tight text-theme-text-primary leading-[1.12]">
            De-clutter feeds.
            <br />
            <span className="text-theme-text-secondary">
              Extract clear insights.
            </span>
          </h1>

          {/* Balanced, Highly Readable Subtext */}
          <p className="text-[15px] sm:text-[17px] md:text-[18px] lg:text-[20px] text-theme-text-secondary font-normal leading-relaxed max-w-3xl mt-6 px-4">
            Content Radar monitors public feeds and sitemap sources, removes duplicate updates, and turns new articles into summaries, topics, and action notes.
          </p>

          {/* Hero CTAs - Professional and Clean */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-[14px] md:gap-[16px] mt-8 w-full sm:w-auto px-4 sm:px-0">
            <button
              onClick={onLaunchDashboard}
              className="w-full sm:w-auto px-7 h-[44px] md:h-[48px] bg-theme-accent text-theme-accent-fg hover:opacity-95 font-bold text-[14px] md:text-[15px] rounded-full transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2"
              id="hero-launch-dashboard-btn"
            >
              View Dashboard Preview
            </button>
            
            <a
              href="#workflow"
              className="w-full sm:w-auto px-6 h-[44px] md:h-[48px] bg-theme-surface hover:bg-theme-surface-soft border border-theme-border text-theme-text-primary font-bold text-[14px] md:text-[15px] rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
              id="hero-see-workflow-btn"
            >
              See Workflow
            </a>
          </div>
        </div>
      </section>

      {/* 5. App Frame Dashboard Preview Card Mockup */}
      <div className="w-full max-w-5xl mx-auto px-6 pb-24 z-10 select-none relative group transition-all duration-500 hover:scale-[1.002] hover:shadow-2xl">
        <div className="w-full rounded-[22px] border border-theme-border bg-theme-surface p-3.5 shadow-xl">
          
          {/* Browser frame mockup header */}
          <div className="w-full h-8 flex items-center justify-between px-4 border-b border-theme-border select-none bg-theme-surface-soft rounded-t-[14px] mb-3.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="text-[10.5px] text-theme-text-secondary font-mono">content-radar.io/dashboard</div>
            <div className="w-10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left p-2.5">
            
            {/* Mock Sidebar Pane */}
            <div className="md:col-span-3 space-y-4 md:border-r border-theme-border md:pr-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-theme-text-secondary uppercase tracking-wider px-2">Monitor</p>
                <div className="px-3 py-2 bg-theme-surface-soft text-theme-text-primary font-bold text-[12px] rounded-lg">
                  Feed Dashboard
                </div>
                <div className="px-3 py-2 text-theme-text-secondary text-[12px] hover:text-theme-text-primary font-medium">
                  Sitemap Sources
                </div>
                <div className="px-3 py-2 text-theme-text-secondary text-[12px] hover:text-theme-text-primary font-medium">
                  Action Insights
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-[11px] font-bold text-theme-text-secondary uppercase tracking-wider px-2 mb-2">Active Channels</p>
                <div className="space-y-2 px-2">
                  <div className="flex items-center gap-2 text-[11.5px] text-theme-text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">Next.js releases</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px] text-theme-text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="font-medium">Tailwind blog</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px] text-theme-text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="font-medium">Google web dev</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Content Workspace Area */}
            <div className="md:col-span-9 space-y-4">
              
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Ingested Sources', val: '12 Connected', color: 'text-theme-text-primary' },
                  { label: 'Deduplicated Updates', val: '184 Suppressed', color: 'text-green-600 dark:text-green-400' },
                  { label: 'Insights Resolved', val: '42 Active Tasks', color: 'text-theme-text-primary' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-theme-surface-soft p-3 rounded-xl border border-theme-border">
                    <span className="text-[9.5px] text-theme-text-secondary uppercase tracking-wider block font-bold">{s.label}</span>
                    <span className={`text-[12.5px] font-bold block mt-0.5 ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Feed simulation list showing deduplication and summaries */}
              <div className="border border-theme-border rounded-xl bg-theme-surface-soft/40 divide-y divide-theme-border overflow-hidden">
                
                {/* Simulated Feed Item 1 */}
                <div className="p-4 text-[12.5px] space-y-1.5 bg-theme-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-theme-text-primary">Google Search Central</span>
                      <span className="text-[9px] bg-theme-surface-soft border border-theme-border text-theme-text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Sitemap</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">Parsed takeaway</span>
                  </div>
                  <p className="text-theme-text-primary font-bold text-[13.5px]">Understanding Core Web Vitals and Search Rankings for Single-Page Layouts</p>
                  <p className="text-theme-text-secondary text-[12px] font-light leading-relaxed">
                    <span className="font-bold text-theme-text-primary">Summary:</span> Google revises layout shift measurement logic to prevent unfair site penalties during progressive load.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-theme-text-primary bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-md font-medium border border-amber-500/20">
                    <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Action: Verify lazy-loaded canvas states have custom min-height bounds.</span>
                  </div>
                </div>

                {/* Simulated Feed Item 2 (Duplicate Skipped) */}
                <div className="p-4 text-[12.5px] space-y-1.5 bg-theme-surface-soft/20 text-theme-text-secondary/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Google Webmasters Blog</span>
                      <span className="text-[9px] bg-theme-surface border border-theme-border px-2 py-0.5 rounded font-bold uppercase tracking-wider">RSS</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 px-2.5 py-0.5 rounded-full border border-amber-500/15">
                      <Shield className="w-3 h-3" />
                      <span>Duplicate suppressed</span>
                    </div>
                  </div>
                  <p className="font-bold text-theme-text-secondary/65 line-through text-[13px]">Core Web Vitals updates for Single Page layout frameworks</p>
                  <p className="text-[11.5px] font-light leading-relaxed italic">
                    Title and content fingerprint matched "Google Search Central" item. Skip processed successfully.
                  </p>
                </div>

                {/* Simulated Feed Item 3 */}
                <div className="p-4 text-[12.5px] space-y-1.5 bg-theme-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-theme-text-primary">Next.js Releases</span>
                      <span className="text-[9px] bg-theme-surface-soft border border-theme-border text-theme-text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider">RSS</span>
                    </div>
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400">Parsed takeaway</span>
                  </div>
                  <p className="text-theme-text-primary font-bold text-[13.5px]">Stable Release: Cache isolation controls and CSS dynamic build pipelines</p>
                  <p className="text-theme-text-secondary text-[12px] font-light leading-relaxed">
                    <span className="font-bold text-theme-text-primary">Summary:</span> Stable update isolates layout cache stores, dramatically reducing rebuild costs and eliminating slow rehydration loops.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-theme-text-primary bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-md font-medium border border-amber-500/20">
                    <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Action: Migrate custom cache stores to the isolated handlers specified in v15.1 profiles.</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 6. Workflow Section */}
      <section id="workflow" className="relative z-10 py-24 border-t border-theme-border bg-theme-surface-soft/20 px-6 md:px-12 scroll-mt-6 select-none transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-bold tracking-widest text-theme-text-secondary uppercase block font-sans">FEED AUTOMATION PIPELINE</span>
            <h2 className="text-[30px] sm:text-[36px] md:text-[44px] lg:text-[50px] xl:text-[56px] font-extrabold tracking-tight text-theme-text-primary leading-tight">
              From sources to insights in minutes.
            </h2>
            <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary max-w-md mx-auto leading-relaxed">
              Accept XML streams, suppress structural re-blogs, and generate concise guidelines instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            
            {/* Step 1 */}
            <div className="bg-theme-surface border border-theme-border p-8 rounded-2xl relative z-10 space-y-4 shadow-sm hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-theme-surface-soft flex items-center justify-center font-bold text-sm text-theme-text-primary">
                01
              </div>
              <h3 className="text-lg font-bold text-theme-text-primary font-sans">Add Sources</h3>
              <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">
                Connect RSS feeds, sitemap URLs, and public content sources.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-theme-surface border border-theme-border p-8 rounded-2xl relative z-10 space-y-4 shadow-sm hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-theme-surface-soft flex items-center justify-center font-bold text-sm text-theme-text-primary">
                02
              </div>
              <h3 className="text-lg font-bold text-theme-text-primary font-sans">Filter Duplicates</h3>
              <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">
                Remove repeated updates before they clutter your review flow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-theme-surface border border-theme-border p-8 rounded-2xl relative z-10 space-y-4 shadow-sm hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-theme-surface-soft flex items-center justify-center font-bold text-sm text-theme-text-primary">
                03
              </div>
              <h3 className="text-lg font-bold text-theme-text-primary font-sans">Review Insights</h3>
              <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">
                Turn new articles into summaries, topics, and action notes.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Features Grid Panel */}
      <section id="features" className="relative z-10 py-24 max-w-5xl mx-auto px-6 md:px-12 select-none">
        
        <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold tracking-widest text-theme-text-secondary uppercase block font-sans">PRODUCT CAPABILITIES</span>
          <h2 className="text-[30px] sm:text-[36px] md:text-[44px] lg:text-[50px] xl:text-[56px] font-extrabold tracking-tight text-theme-text-primary leading-tight">
            Engineered for clarity first
          </h2>
          <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">
            A precise RSS utility built to filter signal from clutter and improve feed reading speeds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          
          {[
            { 
              title: 'Feed Monitoring', 
              icon: Database, 
              desc: 'Monitor RSS feeds, sitemap URLs, and public content sources.' 
            },
            { 
              title: 'Duplicate Filtering', 
              icon: Shield, 
              desc: 'Remove repeated updates and keep your review flow clean.' 
            },
            { 
              title: 'Topic Detection', 
              icon: Target, 
              desc: 'Group content into clear categories like SEO, AI, product, and marketing.' 
            },
            { 
              title: 'Summary Generation', 
              icon: Cpu, 
              desc: 'Condense long articles into clear, readable summaries.' 
            },
            { 
              title: 'Action Notes', 
              icon: Zap, 
              desc: 'Turn content updates into practical next steps.' 
            },
            { 
              title: 'Light & Dark Dashboard', 
              icon: Layers, 
              desc: 'Use a focused dashboard that works comfortably in both themes.' 
            }
          ].map((feat, idx) => (
            <div
              key={idx}
              className="relative z-10 border border-theme-border bg-theme-surface p-8 rounded-2xl hover:border-theme-text-secondary/25 transition-all duration-300 group hover:-translate-y-1 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-theme-surface-soft rounded-xl text-theme-text-primary w-fit mb-5 group-hover:scale-105 transition-transform duration-300">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-theme-text-primary mb-3 font-sans">{feat.title}</h3>
                <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">{feat.desc}</p>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* 8. Problem/Benefit Large Neutral Card */}
      <section id="technology" className="relative z-10 py-24 border-t border-theme-border bg-theme-surface-soft/20 px-6 md:px-12 select-none transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-left bg-theme-surface border border-theme-border rounded-3xl p-10 sm:p-12 shadow-sm relative overflow-hidden transition-colors duration-300">
          
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold tracking-widest text-theme-text-secondary uppercase block font-sans">DEDUPLICATION MECHANISM</span>
            <h2 className="text-[30px] sm:text-[36px] md:text-[44px] lg:text-[50px] xl:text-[56px] font-extrabold tracking-tight text-theme-text-primary leading-tight">
              No more duplicate noise. Just clean insight.
            </h2>
            <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">
              We are tired of reading identical releases and updates re-posted endlessly across every RSS feed, newsletter, and news platform.
            </p>
            <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary leading-relaxed font-normal">
              Content Radar matches content signatures, bypassing identical listings silently. You only see pristine unique updates backed by actionable summaries.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center p-8 rounded-2xl bg-theme-surface-soft border border-theme-border w-24 h-24 sm:w-28 sm:h-28">
            <Command className="w-10 h-10 sm:w-12 sm:h-12 text-theme-text-primary" />
          </div>

        </div>
      </section>

      {/* 9. Final CTA Section (Beautifully integrated, neutral card theme, absolutely zero purple purple references) */}
      <section id="cta" className="relative z-10 py-24 text-center select-none bg-theme-surface-soft border-t border-theme-border px-6 md:px-12 transition-colors duration-300">
        <div className="max-w-[850px] mx-auto bg-theme-surface border border-theme-border rounded-3xl px-8 py-14 sm:py-16 sm:px-12 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-[30px] sm:text-[36px] md:text-[44px] lg:text-[50px] xl:text-[56px] font-extrabold tracking-tight text-theme-text-primary leading-tight">
              Start monitoring smarter today.
            </h2>
            <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-theme-text-secondary font-normal max-w-lg mx-auto leading-relaxed">
              Track updates, reduce duplicate noise, and review clean content insights from one focused workspace.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-[14px] md:gap-[16px]">
              <button
                onClick={onLaunchDashboard}
                className="w-full sm:w-auto px-7 h-[44px] md:h-[48px] bg-theme-accent text-theme-accent-fg hover:opacity-95 text-[14px] md:text-[15px] font-bold rounded-full transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center"
                id="final-cta-launch-dashboard"
              >
                View Dashboard Preview
              </button>
              
              <a
                href="#workflow"
                className="w-full sm:w-auto px-6 h-[44px] md:h-[48px] bg-theme-surface hover:bg-theme-surface-soft text-theme-text-primary font-bold text-[14px] md:text-[15px] rounded-full transition-all border border-theme-border cursor-pointer flex items-center justify-center"
                id="final-cta-workflow-anchor"
              >
                See Workflow
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Minimalist Global Footer - Clean and Subtle */}
      <footer className="relative z-10 border-t border-theme-border bg-theme-bg py-12 px-6 text-center select-none shrink-0 mt-auto transition-colors duration-300">
        <div className="max-w-5xl mx-auto text-[13px] text-theme-text-secondary font-sans font-normal tracking-wide">
          Content Radar · Engineered by Shaheer Hussain Jafri
        </div>
      </footer>

    </div>
  );
}
