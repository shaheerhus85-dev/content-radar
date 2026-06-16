import { useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { ContentItem } from '../types';

interface AnalyticsChartsProps {
  articles: ContentItem[];
  isScanning: boolean;
  scanProgress: number;
  onRefresh: () => void;
  recentLogs: string[];
}

export default function AnalyticsCharts({
  articles,
  isScanning,
  scanProgress,
  onRefresh,
  recentLogs,
}: AnalyticsChartsProps) {
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: string; y: number } | null>(null);

  // Content Activity statistics computed dynamically or standard trend
  const activityData = [
    { day: 'Mon', value: 8 },
    { day: 'Tue', value: 14 },
    { day: 'Wed', value: 22 },
    { day: 'Thu', value: 18 },
    { day: 'Fri', value: 29 },
    { day: 'Sat', value: 20 },
    { day: 'Sun', value: 27 },
  ];

  const chartHeight = 110;
  const chartWidth = 500;
  const points = activityData.map((d, i) => {
    const x = (i / (activityData.length - 1)) * chartWidth;
    const y = chartHeight - (d.value / 35) * chartHeight;
    return { x, y, day: d.day, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  // Get 3 newest articles for the "New Items" display card
  const newArticles = articles.slice(0, 3);

  return (
    <div id="dashboard-middle-section" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch select-none">
      
      {/* Left Large Card: Content Activity line chart */}
      <div
        id="card-content-activity"
        className="xl:col-span-8 bg-theme-surface border border-theme-border p-6 shadow-sm flex flex-col justify-between"
        style={{ borderRadius: '20px' }}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-theme-text-secondary">
              <Activity className="w-4 h-4 text-theme-text-secondary animate-pulse" />
              <span className="text-[15px] font-semibold">Content Activity</span>
            </div>
            <span className="text-[12px] font-semibold text-[#12B76A] bg-[#12B76A]/10 px-2 py-0.5 rounded-full">
              +14.5% activity
            </span>
          </div>
          <p className="text-[12px] text-theme-text-secondary">
            Inbound articles crawled and indexed over the last 7 days.
          </p>
        </div>

        {/* Clean Line Chart using precise accent stroke inside the chart */}
        <div className="h-40 w-full relative flex items-end justify-center my-6 overflow-visible">
          <svg className="w-full h-full overflow-visible" viewBox={`0 -5 ${chartWidth} ${chartHeight + 5}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartThemeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="text-[#2563EB] dark:text-[#60A5FA]" stopColor="currentColor" stopOpacity="0.14" />
                <stop offset="100%" className="text-[#2563EB] dark:text-[#60A5FA]" stopColor="currentColor" stopOpacity="0.00" />
              </linearGradient>
            </defs>
 
            {/* Grid references */}
            <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="currentColor" className="text-theme-border/70" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="currentColor" className="text-theme-border/70" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="currentColor" className="text-theme-border/70" strokeDasharray="3 3" />
 
            {/* Area block under line */}
            <path d={areaD} fill="url(#chartThemeGradient)" />
 
            {/* Elegant neutral line using chart primary */}
            <path d={pathD} fill="none" stroke="currentColor" className="text-[#2563EB] dark:text-[#60A5FA]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
 
            {/* Dynamic node circles */}
            {points.map((p, i) => {
              const isHovered = hoveredDataPoint?.x === p.day;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : 3.5}
                  className="fill-[#2563EB] dark:fill-[#60A5FA] stroke-theme-surface cursor-pointer"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredDataPoint({ x: p.day, y: p.value })}
                  onMouseLeave={() => setHoveredDataPoint(null)}
                />
              );
            })}
          </svg>
 
          {hoveredDataPoint && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-theme-accent text-theme-accent-fg rounded-lg shadow-md border border-theme-border text-[11px] font-bold z-10 pointer-events-none select-none">
              {hoveredDataPoint.x}: {hoveredDataPoint.y} items indexed
            </div>
          )}
        </div>

        {/* X Axis indicator tags */}
        <div className="flex justify-between text-[11px] font-semibold text-theme-text-secondary border-t border-theme-border pt-3">
          {activityData.map((d) => (
            <span key={d.day}>{d.day}</span>
          ))}
        </div>
      </div>

      {/* Right Side: Stacked Smaller Cards (Refresh Status, Recent Activity, New Items) */}
      <div className="xl:col-span-4 flex flex-col gap-4">
        
        {/* Card 1: Refresh Status */}
        <div
          id="card-refresh-status"
          className="bg-theme-surface border border-theme-border p-5 shadow-sm flex flex-col justify-between"
          style={{ borderRadius: '20px' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-theme-text-primary">Refresh Status</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-75 ${isScanning ? 'animate-ping' : ''}`} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#12B76A]" />
            </span>
          </div>

          <div className="my-3.5">
            {isScanning ? (
              <div className="space-y-2">
                <div className="flex justify-between text-[12px] font-semibold text-theme-text-primary">
                  <span>Contacting content channels...</span>
                  <span className="font-bold">{Math.round(scanProgress * 100)}%</span>
                </div>
                <div className="w-full bg-theme-surface-soft h-1.5 rounded-full overflow-hidden border border-theme-border">
                  <div
                    className="bg-theme-accent h-full rounded transition-all duration-300"
                    style={{ width: `${scanProgress * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-theme-text-secondary leading-normal">
                Everything is quiet. Monitored sources scan automatically. Feel free to trigger an immediate check.
              </p>
            )}
          </div>

          <button
            id="btn-sync-streams"
            onClick={onRefresh}
            disabled={isScanning}
            className="w-full py-2.5 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            Refresh Sources
          </button>
        </div>

        {/* Card 2: Recent Activity */}
        <div
          id="card-recent-activity"
          className="bg-theme-surface border border-theme-border p-5 shadow-sm"
          style={{ borderRadius: '20px' }}
        >
          <span className="text-[14px] font-semibold text-theme-text-primary block mb-3">Recent Activity</span>
          <div className="space-y-2 text-[12px]">
            {recentLogs.length === 0 ? (
              <span className="text-theme-text-secondary block">No workspace activity yet.</span>
            ) : recentLogs.slice(0, 3).map((log, index) => (
              <div key={`${log}-${index}`} className="flex items-center justify-between border-b border-theme-border/40 last:border-0 pb-2 last:pb-0 gap-3">
                <span className="text-theme-text-secondary flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-zinc-400 shrink-0" />
                  <span className="truncate">{log}</span>
                </span>
                <span className="text-theme-text-primary font-bold shrink-0">Logged</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: New Items list */}
        <div
          id="card-new-items-list"
          className="bg-theme-surface border border-theme-border p-5 shadow-sm flex-1 flex flex-col justify-between"
          style={{ borderRadius: '20px' }}
        >
          <span className="text-[14px] font-semibold text-theme-text-primary block mb-3">New Items</span>
          <div className="space-y-2.5 flex-1">
            {newArticles.length === 0 ? (
              <span className="text-xs text-theme-text-secondary block">No articles loaded yet.</span>
            ) : (
              newArticles.map((art) => (
                <div key={art.id} className="flex flex-col gap-0.5 border-b border-theme-border/40 last:border-0 pb-2 last:pb-0">
                  <span className="text-[12px] font-bold text-theme-text-primary truncate block hover:opacity-80 transition-opacity">
                    {art.title}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-theme-text-secondary">
                    <span>{art.sourceName}</span>
                    <span>{art.publishedAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
