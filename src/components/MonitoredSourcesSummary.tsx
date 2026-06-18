import { Radio } from 'lucide-react';
import { Source } from '../types';

interface MonitoredSourcesSummaryProps {
  sources: Source[];
  sourceItemCounts?: Record<string, number>;
}

export default function MonitoredSourcesSummary({
  sources,
  sourceItemCounts = {},
}: MonitoredSourcesSummaryProps) {
  const getSourceTypeLabel = (source: Source) => {
    if (source.type === 'sitemap') return 'Sitemap fallback';
    if (source.type === 'webpage' || source.type === 'page-watch') return 'Page watch';
    return 'Feed stream';
  };

  const getSourceStatusMeta = (source: Source) => {
    if (!source.lastRefreshStatus) {
      return {
        label: 'Not checked yet',
        className: 'bg-theme-surface-soft text-theme-text-secondary border-theme-border',
        dotClassName: 'bg-theme-text-secondary',
      };
    }

    if (source.lastRefreshStatus === 'success') {
      return {
        label: 'Active',
        className: 'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/15',
        dotClassName: 'bg-[#12B76A]',
      };
    }

    if (source.lastRefreshStatus === 'fallback') {
      return {
        label: 'Fallback',
        className: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
        dotClassName: 'bg-[#F59E0B]',
      };
    }

    return {
      label: 'Needs attention',
      className: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      dotClassName: 'bg-rose-500',
    };
  };

  const getSavedItemCount = (source: Source) => (
    sourceItemCounts[source.id] ?? sourceItemCounts[source.name] ?? 0
  );

  return (
    <div
      id="dashboard-monitored-sources-summary"
      className="bg-theme-surface border border-theme-border p-5 shadow-sm text-left select-none"
      style={{ borderRadius: '20px' }}
    >
      <div className="flex items-center justify-between mb-4 border-b border-theme-border pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-theme-text-secondary" />
            <span>Monitored Sources</span>
          </h3>
          <p className="text-[12px] text-theme-text-secondary mt-1">
            Source health based on the latest refresh result.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-theme-surface-soft text-theme-text-secondary border-b border-theme-border font-bold text-[11px] uppercase tracking-wider">
              <th className="px-4 py-2.5 rounded-l-lg">Source</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-center">Saved Items</th>
              <th className="px-4 py-2.5 rounded-r-lg">Last Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border/40 text-theme-text-primary">
            {sources.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-theme-text-secondary">
                  No monitored sources configured.
                </td>
              </tr>
            ) : sources.map((src) => {
              const statusMeta = getSourceStatusMeta(src);

              return (
                <tr
                  key={src.id}
                  className="hover:bg-theme-surface-soft/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3 font-semibold text-theme-text-primary">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{src.name}</span>
                      {src.isSample && (
                        <span className="rounded-md border border-theme-border bg-theme-surface-soft px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-theme-text-secondary">
                          Sample
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-theme-text-secondary">
                    {getSourceTypeLabel(src)}
                  </td>
                  
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.className}`}>
                      <span className={`w-1 h-1 rounded-full ${statusMeta.dotClassName}`} />
                      {statusMeta.label}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-center font-mono font-semibold text-theme-text-secondary">
                    {getSavedItemCount(src)}
                  </td>
                  
                  <td className="px-4 py-3 text-theme-text-secondary font-medium">
                    {src.lastCheckedAt || src.lastFetchedAt || 'Not checked yet'}
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
