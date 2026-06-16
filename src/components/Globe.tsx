import { useState, useEffect } from 'react';
import { Radio, CheckCircle, ShieldAlert, FileText, RefreshCw, Layers } from 'lucide-react';

interface GlobeProps {
  isScanning: boolean;
}

export default function Globe({ isScanning }: GlobeProps) {
  // Let's create some simulated live stream items flowing through the radar
  const [streamActivity, setStreamActivity] = useState<Array<{
    id: string;
    source: string;
    title: string;
    type: 'rss' | 'sitemap';
    status: 'parsed' | 'duplicate_skipped' | 'extracting';
    topic: string;
    time: string;
  }>>([
    {
      id: 'flow-1',
      source: 'TechCrunch AI',
      title: 'Deploying High-Throughput Transformer Pipelines of Agentic Workflows',
      type: 'rss',
      status: 'parsed',
      topic: 'AI',
      time: 'Just now',
    },
    {
      id: 'flow-2',
      source: 'Vercel Blog',
      title: 'The Edge-First Web Deployment Architecture Case Studies',
      type: 'rss',
      status: 'duplicate_skipped',
      topic: 'Developer Tools',
      time: '2 mins ago',
    },
    {
      id: 'flow-3',
      source: 'Google search Central',
      title: 'Understanding Core Web Vitals and SEO rankings for SPA layouts',
      type: 'sitemap',
      status: 'parsed',
      topic: 'SEO',
      time: '5 mins ago',
    },
    {
      id: 'flow-4',
      source: 'OpenAI News',
      title: 'Introducing Advanced Reasoning Models with Structured integrity',
      type: 'rss',
      status: 'parsed',
      topic: 'AI',
      time: '12 mins ago',
    }
  ]);

  useEffect(() => {
    if (!isScanning) return;

    // Simulate adding active nodes while scanning
    const timeout = setTimeout(() => {
      const newItems = [
        {
          id: 'flow-new-1',
          source: 'Google Search Central',
          title: 'How Core Vitals Impact Google Rank Scoring In Hydrated Node Elements',
          type: 'sitemap' as const,
          status: 'parsed' as const,
          topic: 'SEO',
          time: 'Just now',
        },
        {
          id: 'flow-new-2',
          source: 'OpenAI News',
          title: 'Introducing Advanced Reasoning Models with Structured integrity',
          type: 'rss' as const,
          status: 'duplicate_skipped' as const,
          topic: 'AI',
          time: 'Just now',
        }
      ];

      setStreamActivity(prev => [newItems[0], newItems[1], ...prev.filter(x => !x.id.startsWith('flow-new'))].slice(0, 5));
    }, 1200);

    return () => clearTimeout(timeout);
  }, [isScanning]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 font-sans select-none">
      {/* Visual Radar sweep simulation container */}
      <div className="w-full h-52 relative flex items-center justify-center overflow-hidden">
        {/* Concentric grid circular rings */}
        <div className="absolute w-44 h-44 rounded-full border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center" />
        <div className="absolute w-32 h-32 rounded-full border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-center" />
        <div className="absolute w-20 h-20 rounded-full border border-slate-200/30 dark:border-slate-800/30 flex items-center justify-center" />
        
        {/* Crosshair grid lines */}
        <div className="absolute w-full h-[1px] bg-slate-200/40 dark:bg-slate-800/40" />
        <div className="absolute h-full w-[1px] bg-slate-200/40 dark:bg-slate-800/40" />

        {/* Central Pulsing Beacon */}
        <div className="absolute z-10 w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center shadow-md">
          <Radio className={`w-4.5 h-4.5 ${isScanning ? 'text-indigo-600 dark:text-indigo-400 animate-spin' : 'text-indigo-500'}`} />
        </div>

        {/* Rotational radar sweep indicator when scanning */}
        {isScanning && (
          <div className="absolute inset-x-0 h-full bg-gradient-to-tr from-indigo-500/10 to-transparent animate-[spin_4s_linear_infinite] origin-center z-0" />
        )}

        {/* Animated flow nodes on rings */}
        <div className="absolute -top-1 left-1/3 animate-pulse p-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-400/30">
          <CheckCircle className="w-3.5 h-3.5" />
        </div>
        <div className="absolute bottom-6 right-1/4 animate-pulse p-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-400/30">
          <ShieldAlert className="w-3.5 h-3.5" />
        </div>
        <div className="absolute top-1/2 right-[18%] animate-pulse p-1 rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-400/30">
          <FileText className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Stream activity events tracking lists */}
      <div className="w-full mt-4 flex-grow flex flex-col justify-end">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 tracking-wider uppercase flex items-center justify-between">
          <span>Ingest Stream Activity</span>
          {isScanning && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              Active Scan...
            </span>
          )}
        </div>

        <div className="space-y-1.5 w-full">
          {streamActivity.slice(0, 4).map((act) => (
            <div 
              key={act.id} 
              className="text-[11px] flex items-center justify-between gap-3 p-2 rounded-xl transition-all border border-slate-100 bg-white/50 hover:bg-white dark:border-slate-800/30 dark:bg-slate-900/60 dark:hover:bg-slate-900 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {act.source}
                  </span>
                  <span className="text-[8px] px-1 py-0.2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded font-bold uppercase select-none">
                    {act.type}
                  </span>
                  <span className="text-[8px] text-slate-400 hidden sm:inline">• {act.topic}</span>
                </div>
                <div className="text-slate-550 dark:text-slate-400 truncate mt-0.5 font-light">
                  {act.title}
                </div>
              </div>

              <div className="text-right shrink-0">
                {act.status === 'parsed' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950 select-none">
                    Parsed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-500 dark:border-amber-950 select-none" title="Deduplication Hash Matched - Skipped parsing to save processing storage">
                    Deduplicated
                  </span>
                )}
                <div className="text-[8px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{act.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
