import { Target, Eye, Shield, Sparkles, Compass, Heart } from 'lucide-react';
import { ContentItem } from '../types';

interface StatsGridProps {
  sourcesCount: number;
  articlesCount: number;
  duplicatesCount: number;
  insightsCount: number;
  articles: ContentItem[];
}

export default function StatsGrid({
  sourcesCount = 4,
  articlesCount = 138,
  duplicatesCount = 32,
  insightsCount = 121,
  articles = []
}: StatsGridProps) {

  const summarizedArticles = articles.filter((article) => article.aiStatus === 'summarized');

  // Dynamic topic mix calculations based on AI-summarized articles
  const topicCounts = summarizedArticles.reduce((acc, curr) => {
    acc[curr.topic] = (acc[curr.topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTopicsCount = summarizedArticles.length;
  const sortedTopics = Object.keys(topicCounts).map((topic, index) => {
    const count = topicCounts[topic];
    const percentage = Math.round((count / totalTopicsCount) * 100);
    return { name: topic, count, percentage, index };
  });

  // Theme palettes (clean monochrome/slate neutral colors with one subtle chart primary segment)
  const colors = [
    'stroke-[#2563EB] text-[#2563EB] dark:stroke-[#60A5FA] dark:text-[#60A5FA]',
    'stroke-slate-400 text-slate-400 dark:stroke-zinc-500 dark:text-zinc-500',
    'stroke-slate-300 text-slate-300 dark:stroke-zinc-600 dark:text-zinc-600',
    'stroke-slate-500 text-slate-500 dark:stroke-zinc-400 dark:text-zinc-400',
    'stroke-slate-200 text-slate-200 dark:stroke-zinc-700 dark:text-zinc-700',
  ];

  const fillColors = [
    'bg-[#2563EB] dark:bg-[#60A5FA]',
    'bg-slate-400 dark:bg-zinc-500',
    'bg-slate-300 dark:bg-zinc-600',
    'bg-slate-500 dark:bg-zinc-400',
    'bg-slate-200 dark:bg-zinc-700',
  ];

  let cumulativePercent = 0;

  const smallMetrics = [
    {
      id: 'stat-sources',
      label: 'Sources',
      value: sourcesCount,
      helper: 'Active feed channels',
      icon: Target,
      color: 'text-theme-text-primary'
    },
    {
      id: 'stat-articles',
      label: 'Articles',
      value: articlesCount,
      helper: 'Total posts indexed',
      icon: Eye,
      color: 'text-theme-text-primary'
    },
    {
      id: 'stat-duplicates',
      label: 'Duplicates',
      value: duplicatesCount,
      helper: 'Redundant items skipped',
      icon: Shield,
      color: 'text-theme-text-primary'
    },
    {
      id: 'stat-insights',
      label: insightsCount === 0 ? 'AI summaries ready' : 'Insights',
      value: insightsCount,
      helper: insightsCount === 0 ? 'Parsed items can be analyzed later' : 'AI summaries created',
      icon: Sparkles,
      color: 'text-theme-text-primary'
    }
  ];

  return (
    <div id="top-dashboard-grid" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch select-none">
      
      {/* Top Left: 2x2 Grid of small metric cards */}
      <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {smallMetrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              id={item.id}
              className="bg-theme-surface border border-theme-border p-6 shadow-sm flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              style={{ borderRadius: '20px' }}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[14px] font-semibold text-theme-text-secondary">
                  {item.label}
                </span>
                <div className="p-2 rounded-xl bg-theme-surface-soft border border-theme-border">
                  <Icon className="w-4 h-4 text-theme-text-secondary" />
                </div>
              </div>
              <div>
                <span className="text-[34px] font-bold tracking-tight text-theme-text-primary block leading-none">
                  {item.value}
                </span>
                <span className="text-[12px] text-theme-text-secondary font-medium block leading-none mt-2.5">
                  {item.helper}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Right: Two larger analytics cards (Topic Mix Donut & Source Health Radial) */}
      <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Topic Mix Donut Card */}
        <div
          id="card-topic-mix"
          className="bg-theme-surface border border-theme-border p-5 shadow-sm flex flex-col justify-between"
          style={{ borderRadius: '20px' }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-theme-text-secondary">
              <Compass className="w-4 h-4" />
              <span className="text-[14px] font-semibold">Topic Mix</span>
            </div>
            <p className="text-[12px] text-theme-text-secondary mt-1">
              Category ratio in AI insights
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-3 relative">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" className="text-theme-border opacity-20" strokeWidth="4.5" />
                
                {sortedTopics.length === 0 ? (
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" className="text-[#2563EB] dark:text-[#60A5FA]" strokeWidth="4.5" strokeDasharray="100 0" />
                ) : (
                  sortedTopics.slice(0, 5).map((topic, i) => {
                    const percent = topic.percentage;
                    const dashArray = `${percent} ${100 - percent}`;
                    const dashOffset = 100 - cumulativePercent;
                    cumulativePercent += percent;
                    return (
                      <circle
                        key={topic.name}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        className={`${colors[i % colors.length]} transition-all duration-300`}
                        strokeWidth="4.5"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  })
                )}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[17px] font-bold text-theme-text-primary leading-none">{totalTopicsCount}</span>
                <span className="text-[9px] text-theme-text-secondary font-bold uppercase tracking-wider mt-0.5">AI Topics</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[11px] font-semibold text-theme-text-secondary border-t border-theme-border pt-2">
            {sortedTopics.slice(0, 3).map((topic, i) => (
              <div key={topic.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${fillColors[i % fillColors.length]} shrink-0`} />
                  <span className="truncate">{topic.name}</span>
                </div>
                <span className="font-mono text-theme-text-primary font-bold">{topic.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Health Radial Card */}
        <div
          id="card-source-health"
          className="bg-theme-surface border border-theme-border p-5 shadow-sm flex flex-col justify-between"
          style={{ borderRadius: '20px' }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-theme-text-secondary">
              <Heart className="w-4 h-4" />
              <span className="text-[14px] font-semibold">Source Health</span>
            </div>
            <p className="text-[12px] text-theme-text-secondary mt-1">
              RSS feeds synchronization
            </p>
          </div>

          <div className="flex flex-col items-center justify-center my-3">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" className="text-theme-border opacity-20" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#12B76A" strokeWidth="4.5" strokeDasharray="99 1" strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[19px] font-bold text-[#12B76A] leading-none">{sourcesCount > 0 ? '99%' : '0%'}</span>
                <span className="text-[8px] text-theme-text-secondary font-bold uppercase tracking-wider mt-0.5">{sourcesCount > 0 ? 'Stable' : 'Empty'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[11px] font-semibold text-theme-text-secondary border-t border-theme-border pt-2">
            <div className="flex items-center justify-between">
              <span>Primary feeds:</span>
              <span className="text-[#12B76A] font-bold">{sourcesCount} Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Failure rate:</span>
              <span className="text-theme-text-primary font-bold">0%</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
