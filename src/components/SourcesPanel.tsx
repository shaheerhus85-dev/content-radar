import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, Globe, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import type {
  Source,
  SourceDiscoveryMethod,
  SourcePurpose,
  SourceType,
} from '../types';
import type { SourceInput } from '../lib/sourceService';

interface SourcesPanelProps {
  sources: Source[];
  onAddSource: (sourceInput: SourceInput) => Promise<void> | void;
  onDeleteSource: (id: string) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string;
  workspaceMode: 'demo' | 'private';
  sourceItemCounts?: Record<string, number>;
  openAddFormSignal?: number;
}

interface DiscoveryCandidate {
  url: string;
  type: SourceType;
  label: string;
  reason: string;
  score: number;
  discoveryMethod: SourceDiscoveryMethod;
}

interface DiscoveryResponse {
  success?: boolean;
  normalizedUrl?: string;
  recommended?: DiscoveryCandidate;
  candidates?: DiscoveryCandidate[];
  error?: string;
}

const purposeOptions: { value: SourcePurpose; label: string }[] = [
  { value: 'competitor', label: 'Competitor monitoring' },
  { value: 'content', label: 'Blog / content tracking' },
  { value: 'product', label: 'Product updates / changelog' },
  { value: 'seo', label: 'SEO content ideas' },
  { value: 'research', label: 'Industry research' },
  { value: 'custom', label: 'Custom' },
];

const purposeLabels = Object.fromEntries(
  purposeOptions.map((option) => [option.value, option.label]),
) as Record<SourcePurpose, string>;

const getCandidateTypeLabel = (type: SourceType) => {
  if (type === 'sitemap') return 'Website sitemap fallback';
  if (type === 'webpage' || type === 'page-watch') return 'Basic page watch';
  return 'Best feed found';
};

const getSourceTypeLabel = (type: SourceType) => {
  if (type === 'sitemap') return 'Sitemap fallback';
  if (type === 'webpage' || type === 'page-watch') return 'Page watch';
  return 'Feed stream';
};

const getRefreshStatusMeta = (source: Source) => {
  if (!source.lastRefreshStatus) {
    return {
      label: 'Not checked yet',
      message: source.lastRefreshMessage || '',
      className: 'text-theme-text-secondary',
      dotClassName: 'bg-theme-text-secondary',
    };
  }

  if (source.lastRefreshStatus === 'success') {
    return {
      label: 'Active',
      message: source.lastRefreshMessage || '',
      className: 'text-[#12B76A]',
      dotClassName: 'bg-[#12B76A]',
    };
  }

  if (source.lastRefreshStatus === 'fallback') {
    return {
      label: 'Fallback',
      message: source.lastRefreshMessage || 'Feed items were unavailable, so a webpage fallback was saved.',
      className: 'text-[#F59E0B]',
      dotClassName: 'bg-[#F59E0B]',
    };
  }

  return {
    label: 'Needs attention',
    message: source.lastRefreshMessage || 'No accessible feed or page metadata found. Try another URL or source.',
    className: 'text-rose-500',
    dotClassName: 'bg-rose-500',
  };
};

const getDefaultSourceName = (url: string, purpose: SourcePurpose) => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const siteName = hostname
      .split('.')
      .filter(Boolean)
      .slice(0, -1)
      .join(' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || hostname;

    return `${siteName} - ${purposeLabels[purpose]}`;
  } catch {
    return `New source - ${purposeLabels[purpose]}`;
  }
};

const parsePatternInput = (value: string) => (
  value
    .split(/[,\n]/)
    .map((pattern) => pattern.trim())
    .filter(Boolean)
);

export default function SourcesPanel({
  sources,
  onAddSource,
  onDeleteSource,
  isLoading = false,
  errorMessage = '',
  workspaceMode,
  sourceItemCounts = {},
  openAddFormSignal = 0,
}: SourcesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [purpose, setPurpose] = useState<SourcePurpose>('competitor');
  const [sourceName, setSourceName] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResponse | null>(null);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [includePatterns, setIncludePatterns] = useState('');
  const [excludePatterns, setExcludePatterns] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errMessage, setErrMessage] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recommended = discoveryResult?.recommended;
  const selectedCandidate = discoveryResult?.candidates?.find((candidate) => candidate.url === selectedUrl)
    || recommended;
  const alternatives = (discoveryResult?.candidates || []).filter((candidate) => candidate.url !== recommended?.url);

  useEffect(() => {
    if (openAddFormSignal > 0) {
      setShowAddForm(true);
    }
  }, [openAddFormSignal]);

  const resetAddFlow = () => {
    setWebsiteUrl('');
    setPurpose('competitor');
    setSourceName('');
    setDiscoveryResult(null);
    setSelectedUrl('');
    setIncludePatterns('');
    setExcludePatterns('');
    setShowAdvanced(false);
    setErrMessage('');
    setIsDiscovering(false);
    setIsSubmitting(false);
  };

  const closeAddFlow = () => {
    setShowAddForm(false);
    resetAddFlow();
  };

  const handleFindSource = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrMessage('');

    if (!websiteUrl.trim()) {
      setErrMessage('Website URL is required.');
      return;
    }

    try {
      setIsDiscovering(true);
      const response = await fetch('/api/discover-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: websiteUrl.trim(),
          purpose,
        }),
      });
      const result = await response.json().catch(() => ({
        success: false,
        error: 'Discovery API did not return JSON. Run the app with Vercel dev to use source discovery locally.',
      })) as DiscoveryResponse;

      if (!response.ok || !result.success || !result.recommended) {
        throw new Error(result.error || 'Unable to discover a source for this website.');
      }

      setDiscoveryResult(result);
      setSelectedUrl(result.recommended.url);
      setSourceName(getDefaultSourceName(result.normalizedUrl || websiteUrl.trim(), purpose));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to discover a source for this website.';
      setErrMessage(message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSaveSource = async (candidate = selectedCandidate) => {
    setErrMessage('');

    if (!candidate) {
      setErrMessage('Choose a source before saving.');
      return;
    }

    if (!sourceName.trim()) {
      setErrMessage('Source name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSource({
        name: sourceName.trim(),
        url: candidate.url,
        type: candidate.type,
        purpose,
        discoveredFrom: discoveryResult?.normalizedUrl || websiteUrl.trim(),
        discoveryMethod: candidate.discoveryMethod,
        includePatterns: parsePatternInput(includePatterns),
        excludePatterns: parsePatternInput(excludePatterns),
        maxItemsPerRefresh: 10,
      });
      closeAddFlow();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add source right now.';
      setErrMessage(message);
      setIsSubmitting(false);
    }
  };

  const renderCandidateCard = (candidate: DiscoveryCandidate, isRecommended = false) => (
    <div
      key={candidate.url}
      className={`border rounded-xl p-4 bg-theme-surface-soft ${
        isRecommended ? 'border-theme-text-primary/20' : 'border-theme-border'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-theme-text-primary">
              {getCandidateTypeLabel(candidate.type)}
            </span>
            {isRecommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#12B76A]/10 px-2 py-0.5 text-[10px] font-bold text-[#12B76A] border border-[#12B76A]/15">
                <CheckCircle2 className="w-3 h-3" /> Recommended
              </span>
            )}
            <span className="rounded-full border border-theme-border bg-theme-surface px-2 py-0.5 text-[10px] font-bold text-theme-text-secondary">
              Score {candidate.score}
            </span>
          </div>
          <p className="text-[11px] text-theme-text-secondary mt-1.5 leading-relaxed">
            {candidate.reason}
          </p>
          <p className="text-[10px] text-theme-text-secondary font-mono truncate mt-2">
            {candidate.url}
          </p>
        </div>
        {!isRecommended && (
          <button
            type="button"
            onClick={() => setSelectedUrl(candidate.url)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
              selectedUrl === candidate.url
                ? 'bg-theme-accent text-theme-accent-fg border-theme-accent'
                : 'bg-theme-surface hover:bg-theme-border/30 text-theme-text-primary border-theme-border'
            }`}
          >
            {selectedUrl === candidate.url ? 'Selected' : 'Choose'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div id="sources-panel-workspace" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left">
          <h2 className="text-lg font-bold text-theme-text-primary capitalize">Monitored Sources</h2>
          <p className="text-xs text-theme-text-secondary mt-1">
            Add a website and Content Radar will find the best feed, sitemap, or page watch automatically.
          </p>
        </div>

        <button
          id="toggle-add-source-form-btn"
          onClick={() => (showAddForm ? closeAddFlow() : setShowAddForm(true))}
          className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 border border-theme-border font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm sm:self-center self-start"
        >
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      {showAddForm && (
        <div id="add-source-form" className="p-5 bg-theme-surface border border-theme-border rounded-xl shadow-sm text-left select-none animate-fade-in-quick">
          {!discoveryResult ? (
            <>
              <h3 className="text-sm font-bold text-theme-text-primary mb-3">Add Website Source</h3>
              <form onSubmit={handleFindSource} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://openai.com"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Monitoring Purpose</label>
                  <select
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value as SourcePurpose)}
                    className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all cursor-pointer"
                  >
                    {purposeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isDiscovering && (
                  <p className="text-[11px] bg-theme-surface-soft text-theme-text-secondary border border-theme-border rounded-lg p-2 font-semibold">
                    Scanning website for feeds and sitemaps...
                  </p>
                )}

                {errMessage && (
                  <p className="text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg p-2 font-medium">
                    {errMessage}
                  </p>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    id="find-best-source-btn"
                    disabled={isDiscovering}
                    className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    {isDiscovering ? 'Finding Source...' : 'Find Best Source'}
                  </button>
                  <button
                    type="button"
                    id="cancel-add-source-btn"
                    onClick={closeAddFlow}
                    className="px-4 py-2 bg-theme-surface-soft hover:bg-theme-border/40 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-theme-text-primary">Recommended Source</h3>
                  <p className="text-xs text-theme-text-secondary mt-1">
                    Review the best match and confirm when you are ready to start monitoring. Content Radar may use a feed, sitemap fallback, or page watch fallback.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDiscoveryResult(null);
                    setSelectedUrl('');
                    setSourceName('');
                    setShowAdvanced(false);
                    setErrMessage('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-theme-surface-soft hover:bg-theme-border/40 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border self-start"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>

              {recommended && renderCandidateCard(recommended, true)}

              <div>
                <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Source Name</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <button
                  type="button"
                  id="use-recommended-source-btn"
                  disabled={isSubmitting || !recommended}
                  onClick={() => void handleSaveSource(recommended)}
                  className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs rounded-xl"
                >
                  {isSubmitting ? 'Saving Source...' : 'Use Recommended Source'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="px-4 py-2 bg-theme-surface-soft hover:bg-theme-border/40 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border flex items-center gap-1.5 self-start"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Advanced
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 border border-theme-border rounded-xl p-4 bg-theme-surface-soft">
                  <div>
                    <h4 className="text-xs font-bold text-theme-text-primary">Choose another source</h4>
                    <div className="space-y-2 mt-2">
                      {alternatives.length > 0 ? (
                        alternatives.map((candidate) => renderCandidateCard(candidate))
                      ) : (
                        <p className="text-[11px] text-theme-text-secondary">No additional sources were found.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Include Keywords</label>
                      <input
                        type="text"
                        placeholder="pricing, launch, roadmap"
                        value={includePatterns}
                        onChange={(event) => setIncludePatterns(event.target.value)}
                        className="w-full bg-theme-surface border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary/60"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Exclude Keywords</label>
                      <input
                        type="text"
                        placeholder="careers, legal, archive"
                        value={excludePatterns}
                        onChange={(event) => setExcludePatterns(event.target.value)}
                        className="w-full bg-theme-surface border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary/60"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !selectedCandidate}
                    onClick={() => void handleSaveSource(selectedCandidate)}
                    className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 disabled:opacity-50 font-bold text-xs rounded-xl"
                  >
                    {isSubmitting ? 'Saving Source...' : 'Use Selected Source'}
                  </button>
                </div>
              )}

              {errMessage && (
                <p className="text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg p-2 font-medium">
                  {errMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div id="sources-list-table-container" className="bg-theme-surface border border-theme-border rounded-xl shadow-sm overflow-hidden text-left">
        {errorMessage && (
          <div className="border-b border-theme-border bg-rose-500/10 px-5 py-3 text-xs font-semibold text-rose-500">
            {errorMessage}
          </div>
        )}
        <table id="sources-management-dashboard-grid" className="w-full text-xs text-left border-collapse select-none">
          <thead>
            <tr className="bg-theme-surface-soft text-theme-text-secondary border-b border-theme-border font-bold text-[11px] uppercase tracking-wide">
              <th className="px-5 py-3 ml-2.5">Source Feed</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Saved Items</th>
              <th className="px-5 py-3">Last Checked</th>
              <th className="px-5 py-3 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border text-theme-text-primary">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-theme-text-secondary">
                  Loading saved sources...
                </td>
              </tr>
            ) : sources.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-theme-text-secondary">
                  <span className="block font-bold text-theme-text-primary">No sources added yet</span>
                  <span className="block mt-1">Add a website and Content Radar will find the best source to monitor.</span>
                </td>
              </tr>
            ) : sources.map((src) => {
              const savedItemCount = sourceItemCounts[src.id] ?? sourceItemCounts[src.name] ?? 0;
              const refreshStatus = getRefreshStatusMeta(src);

              return (
                <tr
                  key={src.id}
                  id={`source-item-${src.id}`}
                  className="hover:bg-theme-surface-soft/40 transition-colors duration-150"
                >
                  <td className="px-5 py-4 max-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="bg-theme-surface-soft border border-theme-border text-theme-text-secondary p-2 rounded-xl">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-theme-text-primary text-xs truncate block">
                          {src.name}
                        </span>
                        {src.isSample && (
                          <span className="inline-flex mt-1 rounded-md border border-theme-border bg-theme-surface px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-theme-text-secondary">
                            Sample
                          </span>
                        )}
                        <span className="text-[10px] text-theme-text-secondary font-semibold font-mono truncate block mt-0.5">
                          {src.url}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-theme-surface-soft border border-theme-border text-theme-text-secondary">
                      {getSourceTypeLabel(src.type)}
                    </span>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="max-w-[210px]">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${refreshStatus.className}`}>
                        <span className={`w-2 h-2 rounded-full ${refreshStatus.dotClassName}`} /> {refreshStatus.label}
                      </span>
                      {refreshStatus.message && (
                        <span className="block text-[10px] text-theme-text-secondary mt-1 leading-snug whitespace-normal">
                          {refreshStatus.message}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-theme-text-primary font-mono font-bold">
                    {savedItemCount}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-theme-text-secondary font-medium">
                    {src.lastCheckedAt || src.lastFetchedAt || (workspaceMode === 'private' ? 'Not fetched yet' : '12 mins ago')}
                  </td>

                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      id={`delete-source-btn-${src.id}`}
                      onClick={() => onDeleteSource(src.id)}
                      className="p-1.5 border border-theme-border rounded-lg bg-theme-surface hover:bg-rose-500/10 hover:border-rose-500/20 text-theme-text-secondary hover:text-rose-500 transition-colors cursor-pointer"
                      title="Deactivate feed stream"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
