import { useEffect, useRef } from 'react';
import { RefreshCw, Play, Clock, Sparkles } from 'lucide-react';

interface RefreshPanelProps {
  onRefresh: () => Promise<void>;
  isScanning: boolean;
  scanLog: string[];
  scanProgress: number;
}

export default function RefreshPanel({ onRefresh, isScanning, scanLog, scanProgress }: RefreshPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [scanLog]);

  // Premium mock topic counters for the summary card
  const topicsData = [
    { name: 'AI', count: 4, percent: '40%', color: 'bg-indigo-400' },
    { name: 'Search SEO', count: 2, percent: '20%', color: 'bg-teal-400' },
    { name: 'Systems Automation', count: 1, percent: '15%', color: 'bg-cyan-400' },
    { name: 'Product', count: 1, percent: '15%', color: 'bg-purple-400' },
    { name: 'Marketing', count: 1, percent: '12%', color: 'bg-pink-500' },
    { name: 'Developer Tools', count: 1, percent: '10%', color: 'bg-amber-400' },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* 1. REFRESH SOURCES CARD */}
      <div className="border border-zinc-850 bg-gradient-to-b from-[#0e0e12] to-[#08080a] rounded-xl p-4 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="mb-3">
          <h3 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 ${isScanning ? 'animate-ping' : ''}`} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Refresh Automation
          </h3>
          <p className="text-[11.5px] text-zinc-400 mt-0.5">
            Re-scan tracked sources for new posts and process summaries.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isScanning}
          className={`w-full py-2 px-3 font-semibold text-xs rounded transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border
            ${isScanning
              ? 'bg-zinc-950 text-cyan-400 border-cyan-500/20 animate-pulse'
              : 'bg-zinc-950 border-zinc-850 hover:border-cyan-500/30 text-zinc-300 hover:text-white active:scale-[0.98]'
            }
          `}
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Scanning Feeds... ({Math.round(scanProgress * 100)}%)
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-cyan-400 fill-cyan-400/20 stroke-[2]" />
              Refresh Dashboard
            </>
          )}
        </button>

        {isScanning && (
          <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-3 overflow-hidden p-[1px] border border-zinc-900">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${scanProgress * 100}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] font-sans text-zinc-400 border-t border-zinc-900 mt-3 pt-2.5">
          <div>
            <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Monitor Interval</span>
            <span className="text-zinc-300 font-semibold mt-0.5 block">Every 15 mins</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Synthesizer</span>
            <span className="text-cyan-400 font-semibold mt-0.5 flex items-center gap-0.5 justify-end">
              <Sparkles className="w-3 h-3 text-cyan-400" /> NLP Engine
            </span>
          </div>
        </div>
      </div>

      {/* 2. RECENT ACTIVITY CARD */}
      <div className="border border-zinc-850 bg-gradient-to-b from-[#0e0e12] to-[#08080a] rounded-xl p-4 relative flex-1 flex flex-col min-h-0">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5 pb-2 border-b border-zinc-900">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Execution Log
        </h4>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[140px] lg:max-h-none scrollbar-thin" ref={logRef}>
          {scanLog.map((log, index) => {
            const isCompleted = log.toLowerCase().includes('complete') || log.toLowerCase().includes('successfully') || log === 'Dashboard updated';
            return (
              <div key={index} className="flex gap-2 items-start text-[11px] leading-relaxed group">
                <div className="mt-1.5 shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-400 shadow-glow' : 'bg-cyan-500'} transition-transform group-hover:scale-110`} />
                </div>
                <span className={`${isCompleted ? 'text-zinc-200' : 'text-zinc-400'} font-sans`}>
                  {log}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TOPIC DISTRIBUTION SUMMARY CARD (SUPPORTING ACCENT) */}
      <div className="border border-zinc-850 bg-gradient-to-b from-[#0e0e12] to-[#08080a] rounded-xl p-4 shrink-0">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2 pb-2 border-b border-zinc-900">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Topic Summary
        </h4>
        <div className="space-y-2 pt-1">
          {topicsData.map((topic, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-sans">
                <span className="text-zinc-400 font-medium">{topic.name}</span>
                <span className="text-zinc-500 font-mono text-[10px]">{topic.count} items ({topic.percent})</span>
              </div>
              <div className="w-full bg-[#050507] h-1 rounded overflow-hidden">
                <div className={`${topic.color} h-full rounded`} style={{ width: topic.percent }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
