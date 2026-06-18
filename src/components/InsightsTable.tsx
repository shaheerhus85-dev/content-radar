import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ContentItem } from '../types';
import { Search, Filter, Eye, X, ExternalLink, Calendar, BookOpen, AlertCircle, Sparkles, ChevronLeft, ArrowLeft, Globe, Shield } from 'lucide-react';

interface InsightsTableProps {
  insights: ContentItem[];
  onRefreshDemo: () => void;
  onAnalyzeExisting?: () => void | Promise<void>;
  onResetAiFailedItems?: () => void | Promise<void>;
  isAnalyzingExisting?: boolean;
  isResettingAiFailures?: boolean;
  analyzeExistingMessage?: string;
  analyzeExistingError?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function InsightsTable({
  insights,
  onRefreshDemo,
  onAnalyzeExisting,
  onResetAiFailedItems,
  isAnalyzingExisting = false,
  isResettingAiFailures = false,
  analyzeExistingMessage = '',
  analyzeExistingError = '',
  emptyTitle = 'No matching insights',
  emptyDescription = 'Try adjusting your search criteria or topic pill settings.',
}: InsightsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [activeArticle, setActiveArticle] = useState<ContentItem | null>(null);

  // Lock body scroll and set up Escape key dismiss
  useEffect(() => {
    if (activeArticle) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setActiveArticle(null);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeArticle]);

  const topics = [
    'All',
    'AI',
    'SEO',
    'Automation',
    'Marketing',
    'Developer Tools',
    'Product',
    'Security',
    'Business',
    'Research',
    'Uncategorized',
  ];

  // Real-time local search and filtering
  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.signalType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.aiSummary || item.summary).toLowerCase().includes(searchTerm.toLowerCase());

      const matchTopic = selectedTopic === 'All' || item.topic === selectedTopic;

      return matchSearch && matchTopic;
    });
  }, [insights, searchTerm, selectedTopic]);

  // Topic badge color mapper
  const getTopicColor = (topic: string) => {
    return 'bg-theme-surface-soft text-theme-text-secondary border-theme-border/40';
  };

  const getEffectiveAiStatus = (item: ContentItem) => {
    if (
      item.aiStatus === 'failed'
      && (
        item.aiErrorStatus === 429
        || String(item.aiErrorCode || '').toUpperCase() === 'RESOURCE_EXHAUSTED'
      )
    ) {
      return 'quota_limited';
    }

    return item.aiStatus || 'skipped';
  };

  const getAiStatusLabel = (item: ContentItem) => {
    const effectiveStatus = getEffectiveAiStatus(item);
    if (effectiveStatus === 'summarized') return 'Summarized';
    if (effectiveStatus === 'quota_limited') return 'AI queued';
    if (effectiveStatus === 'failed') return 'Failed';
    return 'Parsed only';
  };

  const getAiStatusClassName = (item: ContentItem) => {
    const effectiveStatus = getEffectiveAiStatus(item);
    if (effectiveStatus === 'summarized') {
      return 'text-[#12B76A] bg-[#12B76A]/5 dark:bg-[#12B76A]/10 border-[#12B76A]/10';
    }

    if (effectiveStatus === 'failed') {
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }

    if (effectiveStatus === 'quota_limited') {
      return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
    }

    return 'text-theme-text-secondary bg-theme-surface-soft border-theme-border';
  };

  const getFriendlyAiErrorMessage = (item: ContentItem) => {
    const effectiveStatus = getEffectiveAiStatus(item);
    if (effectiveStatus === 'quota_limited') {
      return 'AI analysis is queued. Parsed content is saved and can be analyzed later.';
    }

    if (effectiveStatus === 'failed') {
      return 'AI analysis could not be completed. Parsed content is still available.';
    }

    return 'AI analysis not generated yet.';
  };

  const getAiProviderLabel = (item: ContentItem) => {
    if (item.aiProvider === 'groq') return 'Groq';
    if (item.aiProvider === 'cache') return 'Cached insight';
    return '';
  };

  return (
    <div id="insights-table-parent-wrapper" className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm text-left transition-colors">
      
      {/* 1. Header and Search Filtering controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5 pb-4 border-b border-theme-border select-none">
        <div>
          <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-1.5 leading-none">
            <Sparkles className="w-4 h-4 text-theme-text-secondary" /> Latest Insights
          </h3>
          <p className="text-xs text-theme-text-secondary mt-1 font-medium">
            Browse and filter brief insights collected from monitored source streams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          {onAnalyzeExisting && (
            <button
              type="button"
              onClick={() => void onAnalyzeExisting()}
              disabled={isAnalyzingExisting}
              className="px-3.5 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-theme-border"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAnalyzingExisting ? 'Analyzing...' : 'Analyze 1 Item'}
            </button>
          )}
          {onResetAiFailedItems && (
            <button
              type="button"
              onClick={() => void onResetAiFailedItems()}
              disabled={isResettingAiFailures}
              className="px-3.5 py-2 bg-theme-surface-soft text-theme-text-primary hover:bg-theme-border/40 disabled:opacity-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-theme-border"
            >
              {isResettingAiFailures ? 'Resetting...' : 'Reset AI Failed Items'}
            </button>
          )}

          {/* Local Search input */}
          <div className="relative w-full sm:w-[260px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-secondary" />
            <input
              id="insights-table-search-input"
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 pl-9 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary"
            />
          </div>
        </div>
      </div>

      {(analyzeExistingMessage || analyzeExistingError) && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-xs font-semibold ${
          analyzeExistingError
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            : 'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/15'
        }`}>
          {analyzeExistingError || analyzeExistingMessage}
        </div>
      )}

      {/* 2. Horizontal Topic filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5 overflow-x-auto pb-1 select-none">
        <span className="text-[11px] font-bold text-theme-text-secondary mr-2 flex items-center gap-1 uppercase tracking-tight">
          <Filter className="w-3.5 h-3.5" /> Topic Filter:
        </span>
        {topics.map((topic) => (
          <button
            key={topic}
            id={`filter-topic-${topic}`}
            onClick={() => setSelectedTopic(topic)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer border
              ${selectedTopic === topic
                ? 'bg-theme-accent text-theme-accent-fg border-theme-accent shadow-sm'
                : 'bg-theme-surface-soft border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-border/20'
              }
            `}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* 3. Compact responsive grid table */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-theme-border rounded-xl max-w-md mx-auto select-none">
          <AlertCircle className="w-8 h-8 text-[#F59E0B] mx-auto mb-3" />
          <h4 className="text-xs font-bold text-theme-text-primary uppercase tracking-wider">
            {emptyTitle}
          </h4>
          <p className="text-xs text-theme-text-secondary mt-1.5 leading-relaxed font-medium">
            {emptyDescription}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTopic('All');
              onRefreshDemo();
            }}
            className="mt-4 px-3.5 py-1.5 bg-theme-accent text-theme-accent-fg font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer border border-theme-border"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto xl:overflow-x-hidden w-full rounded-xl border border-theme-border select-none">
          <table id="insights-compact-grid" className="w-full text-xs text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-theme-surface-soft text-theme-text-secondary border-b border-theme-border font-bold text-[11px] uppercase tracking-wide">
                <th className="px-4 py-3 w-[45%] min-w-[200px]">Article</th>
                <th className="px-4 py-3 w-[15%] min-w-[90px]">Source</th>
                <th className="px-4 py-3 w-[13%] min-w-[90px]">Topic</th>
                <th className="px-4 py-3 w-[15%] min-w-[120px]">Status</th>
                <th className="px-4 py-3 w-[12%] min-w-[85px]">Published</th>
                <th className="px-4 py-3 w-[60px] min-w-[60px] text-center">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border text-theme-text-primary">
              {filteredInsights.map((item) => (
                <tr
                  key={item.id}
                  id={`insight-row-${item.id}`}
                  className="hover:bg-theme-surface-soft/40 transition-colors duration-150 group"
                >
                  {/* Article Title and short summary preview */}
                  <td className="px-4 py-2.5 max-w-[400px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 text-[8.5px] font-bold bg-theme-accent text-theme-accent-fg rounded uppercase tracking-wider shrink-0">
                            New
                          </span>
                        )}
                        {item.isSample && (
                          <span className="px-1.5 py-0.5 text-[8.5px] font-bold bg-theme-surface-soft text-theme-text-secondary border border-theme-border rounded uppercase tracking-wider shrink-0">
                            Sample
                          </span>
                        )}
                        <span className="font-bold text-theme-text-primary tracking-tight leading-snug group-hover:opacity-85 transition-opacity truncate block">
                          {item.title}
                        </span>
                      </div>
                      {/* Short summary one-line preview */}
                      <p className="text-[10.5px] text-theme-text-secondary font-medium leading-none truncate max-w-[220px] md:max-w-xs xl:max-w-md">
                        {item.aiSummary || item.summary}
                      </p>
                    </div>
                  </td>

                  {/* Channel tag */}
                  <td className="px-4 py-2.5 font-semibold text-theme-text-primary capitalize truncate">
                    {item.sourceName}
                  </td>

                  {/* Topic badge */}
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${getTopicColor(item.topic)}`}>
                      {item.topic}
                    </span>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getAiStatusClassName(item)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {getAiStatusLabel(item)}
                    </span>
                  </td>

                  {/* Published Relative time */}
                  <td className="px-4 py-2.5 text-theme-text-secondary whitespace-nowrap font-medium">
                    {item.publishedAt || '1 day ago'}
                  </td>

                  {/* Open details page trigger - exact width */}
                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                    <button
                      id={`open-detail-btn-${item.id}`}
                      onClick={() => setActiveArticle(item)}
                      className="p-1.5 border border-theme-border bg-theme-surface hover:bg-theme-surface-soft text-theme-text-primary hover:border-theme-text-primary/40 rounded-lg transition-colors cursor-pointer"
                      title="Open details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Beautiful Centered Premium Insight Review Overlaid Modal through React Portal */}
      {activeArticle && createPortal(
        <div
          id="insight-modal-overlay"
          className="fixed inset-0 z-[9999] grid place-items-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in-quick --insight-review"
          onClick={() => setActiveArticle(null)}
        >
          <div
            id="insight-modal-card"
            className="bg-theme-surface border border-theme-border p-6 md:p-8 shadow-2xl flex flex-col justify-between animate-scale-up text-left"
            style={{
              width: 'min(860px, calc(100vw - 48px))',
              height: 'auto',
              maxHeight: '80vh',
              borderRadius: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header section with topic badge, published time, and close (X) button */}
            <div className="flex flex-col shrink-0 border-b border-theme-border pb-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTopicColor(activeArticle.topic)}`}>
                    {activeArticle.topic}
                  </span>
                  <span className="text-[11px] font-semibold text-theme-text-secondary font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {activeArticle.publishedAt || '1 day ago'}
                  </span>
                </div>
                
                {/* Header Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    id="close-detail-modal-btn"
                    onClick={() => setActiveArticle(null)}
                    className="p-1.5 border border-theme-border rounded-lg bg-theme-surface hover:bg-theme-surface-soft text-theme-text-secondary hover:text-theme-text-primary transition-colors cursor-pointer shrink-0"
                    title="Close Review"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Title (Article Title) */}
              <h2 className="text-base md:text-lg font-extrabold text-theme-text-primary leading-snug mt-3 select-text">
                {activeArticle.title}
              </h2>
            </div>

            {/* Scrollable multi-column balanced bento-feel content template to prevent empty visual areas */}
            <div className="flex-grow overflow-y-auto pr-1 select-text space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Left/main 2-column container */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  {/* Summary */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-theme-text-secondary uppercase tracking-wider flex items-center gap-1 font-bold">
                      <BookOpen className="w-3.5 h-3.5" /> {getEffectiveAiStatus(activeArticle) === 'summarized' ? 'AI Summary' : 'Parsed Summary'}
                    </span>
                    <p className="bg-theme-surface-soft/60 p-4 rounded-xl font-normal text-xs text-theme-text-primary leading-relaxed border border-theme-border/40 whitespace-pre-line">
                      {getEffectiveAiStatus(activeArticle) === 'summarized'
                        ? activeArticle.aiSummary || activeArticle.summary
                        : activeArticle.summary}
                    </p>
                  </div>

                  {getEffectiveAiStatus(activeArticle) === 'summarized' ? (
                    <>
                      {/* Why It Matters */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-theme-text-secondary uppercase tracking-wider flex items-center gap-1 font-bold">
                          <Sparkles className="w-3.5 h-3.5" /> Why It Matters
                        </span>
                        <p className="bg-theme-surface-soft/60 p-4 rounded-xl font-normal text-xs text-theme-text-primary leading-relaxed border border-theme-border/40 whitespace-pre-line">
                          {activeArticle.whyItMatters || 'No AI rationale is available for this item.'}
                        </p>
                      </div>

                      {/* Action Proposal */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-[#F59E0B] uppercase tracking-wider flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" /> Action Proposal
                        </span>
                        <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/15 p-4 rounded-xl font-normal text-xs text-theme-text-primary leading-relaxed">
                          {activeArticle.actionProposal || activeArticle.actionNote}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-theme-text-secondary uppercase tracking-wider flex items-center gap-1 font-bold">
                        <Sparkles className="w-3.5 h-3.5" /> AI Analysis
                      </span>
                      <div className="bg-theme-surface-soft/60 p-4 rounded-xl font-normal text-xs text-theme-text-primary leading-relaxed border border-theme-border/40">
                        {getFriendlyAiErrorMessage(activeArticle)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right sidebar panel container */}
                <div className="col-span-1 space-y-4">
                  {/* Source Information & Stats panel */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-theme-text-secondary uppercase tracking-wider flex items-center gap-1 font-bold">
                      <Globe className="w-3.5 h-3.5" /> Source Information
                    </span>
                    <div className="bg-theme-surface-soft/40 border border-theme-border/40 p-4 rounded-xl space-y-3.5 text-xs text-theme-text-secondary">
                      {getEffectiveAiStatus(activeArticle) === 'summarized' && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">Signal Type</span>
                          <strong className="text-theme-text-primary font-bold text-xs">{activeArticle.signalType || 'Other'}</strong>
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">AI Status</span>
                        <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md border w-fit ${getAiStatusClassName(activeArticle)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {getAiStatusLabel(activeArticle)}
                        </span>
                      </div>

                      {getAiProviderLabel(activeArticle) && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">AI Provider</span>
                          <span className="text-theme-text-secondary font-semibold text-xs">
                            {getAiProviderLabel(activeArticle)}
                          </span>
                        </div>
                      )}

                      {activeArticle.isSample && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">Data Label</span>
                          <span className="inline-flex w-fit rounded-md border border-theme-border bg-theme-surface-soft px-2 py-0.5 text-[10.5px] font-bold text-theme-text-secondary">
                            {activeArticle.sampleLabel || 'Sample workspace data'}
                          </span>
                        </div>
                      )}

                      {(getEffectiveAiStatus(activeArticle) === 'failed' || getEffectiveAiStatus(activeArticle) === 'quota_limited') && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">AI Note</span>
                          <span className="text-theme-text-primary font-semibold text-xs break-words">
                            {getFriendlyAiErrorMessage(activeArticle)}
                          </span>
                        </div>
                      )}

                      {getEffectiveAiStatus(activeArticle) === 'summarized' && activeArticle.relevanceScore !== null && activeArticle.relevanceScore !== undefined && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">Relevance Score</span>
                          <strong className="text-theme-text-primary font-bold text-xs">{activeArticle.relevanceScore}/100</strong>
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">Source Name</span>
                        <strong className="text-theme-text-primary font-bold text-xs capitalize">{activeArticle.sourceName}</strong>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">Reliability Status</span>
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#12B76A] bg-[#12B76A]/10 px-2 py-0.5 rounded-md border border-[#12B76A]/15 w-fit">
                          <Shield className="w-3 h-3 text-[#12B76A]" /> Source Active
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-theme-text-secondary/80">Origin Link</span>
                        <a
                          href={activeArticle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 dark:text-zinc-300 hover:opacity-80 inline-flex items-center gap-1 font-bold break-all"
                        >
                          Visit Site <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer action bar with explicitly defined actions */}
            <div className="shrink-0 mt-4 pt-4 border-t border-theme-border flex flex-col sm:flex-row items-center justify-end gap-3">
              {/* Right side primary buttons */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={activeArticle.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4.5 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Open Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  id="close-insight-btn"
                  onClick={() => setActiveArticle(null)}
                  className="w-full sm:w-auto px-4.5 py-2 bg-theme-surface hover:bg-theme-surface-soft text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border cursor-pointer transition-colors"
                >
                  Close Review
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
