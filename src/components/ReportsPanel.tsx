import { useState } from 'react';
import { FileDown, TrendingUp } from 'lucide-react';

export default function ReportsPanel() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const triggerExport = (format: 'pdf' | 'csv') => {
    setIsExporting(format);
    setTimeout(() => {
      setIsExporting(null);
    }, 1500);
  };

  return (
    <div id="reports-panel" className="space-y-6 text-left">
      <div className="select-none">
        <h2 className="text-lg font-bold text-theme-text-primary capitalize">Performance Reports</h2>
        <p className="text-xs text-theme-text-secondary mt-1">
          Generate, review, and export insights digests for team recruiters and hiring leads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        {/* Weekly Digest summary metric card */}
        <div className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm text-center md:text-left flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-theme-text-secondary tracking-wider">Digest Status</span>
            <h4 className="text-sm font-bold text-theme-text-primary">Weekly Content Brief</h4>
            <p className="text-xs text-theme-text-secondary leading-normal mt-1">
              Summarized brief containing critical OpenAI, Google SEO, and AI product changes.
            </p>
          </div>
          <div className="pt-4 border-t border-theme-border mt-3.5 flex items-center justify-between text-xs font-semibold text-theme-text-primary">
            <span className="text-theme-text-secondary">Next schedule:</span>
            <span className="text-theme-text-primary font-bold">Every Monday morning</span>
          </div>
        </div>

        {/* Categories parsed metrics summary */}
        <div className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm text-center md:text-left flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-theme-text-secondary tracking-wider">Indexed Balance</span>
            <h4 className="text-sm font-bold text-theme-text-primary">Topic Integrity Ratio</h4>
            <p className="text-xs text-theme-text-secondary leading-normal mt-1">
              The ratio of artificial intelligence articles versus standard software tooling posts.
            </p>
          </div>
          <div className="pt-4 border-t border-theme-border mt-3.5 flex items-center justify-between text-xs font-semibold text-theme-text-primary">
            <span className="text-theme-text-secondary">Topic balance:</span>
            <span className="text-[#12B76A] font-bold">Optimal distribution</span>
          </div>
        </div>

        {/* Deduplication efficacy progress indicator */}
        <div className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm text-center md:text-left flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#12B76A] tracking-wider">Efficiency Gain</span>
            <h4 className="text-sm font-bold text-theme-text-primary text-left block">Duplicate Filter Rate</h4>
            <p className="text-xs text-theme-text-secondary leading-normal mt-1">
              Deduplication percentage of redundant news posts skipped on inbound RSS pipelines.
            </p>
          </div>
          <div className="pt-4 border-t border-theme-border mt-3.5 flex items-center justify-between text-xs font-semibold text-theme-text-primary">
            <span className="text-theme-text-secondary">Accuracy matches:</span>
            <span className="text-[#12B76A] font-extrabold">98.5% rate</span>
          </div>
        </div>
      </div>

      {/* Main Export Utility Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Analytical Overview progress blocks */}
        <div className="lg:col-span-8 bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm space-y-5 select-none">
          <div>
            <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-1.5 leading-none">
              <TrendingUp className="w-5 h-5 text-theme-text-secondary" /> Executive Digest Statistics
            </h3>
            <p className="text-xs text-theme-text-secondary mt-1">
              Overview metrics to present at regular quarterly strategic planning boards.
            </p>
          </div>

          <div className="space-y-4 border-t border-theme-border pt-4">
            {/* Progress block 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-theme-text-primary">AI & Automation summaries relevance</span>
                <span className="text-theme-text-primary font-bold font-mono">88%</span>
              </div>
              <div className="w-full bg-theme-surface-soft h-2 rounded-full overflow-hidden">
                <div className="bg-theme-accent h-full rounded" style={{ width: '88%' }} />
              </div>
            </div>

            {/* Progress block 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-theme-text-primary">Recruiter sourcing yield increase</span>
                <span className="text-[#12B76A] font-bold font-mono">92%</span>
              </div>
              <div className="w-full bg-theme-surface-soft h-2 rounded-full overflow-hidden">
                <div className="bg-[#12B76A] h-full rounded" style={{ width: '92%' }} />
              </div>
            </div>

            {/* Progress block 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-theme-text-primary">Deduplication token savings</span>
                <span className="text-[#F59E0B] font-bold font-mono">74%</span>
              </div>
              <div className="w-full bg-theme-surface-soft h-2 rounded-full overflow-hidden">
                <div className="bg-[#F59E0B] h-full rounded" style={{ width: '74%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Download Actions button links (4 cols) */}
        <div className="lg:col-span-4 bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="space-y-1.5 select-none text-center lg:text-left">
            <h3 className="text-sm font-bold text-theme-text-primary">
              Download Actions
            </h3>
            <p className="text-xs text-theme-text-secondary">
              Export verified content research into standard spreadsheets or presentations.
            </p>
          </div>

          <div className="space-y-2.5 mt-5">
            {/* PDF export button link */}
            <button
              id="export-pdf-report-btn"
              onClick={() => triggerExport('pdf')}
              disabled={isExporting !== null}
              className="w-full py-2.5 bg-theme-accent text-theme-accent-fg hover:opacity-95 disabled:opacity-50 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-theme-border shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              {isExporting === 'pdf' ? 'Formatting PDF Brief...' : 'Export PDF Summary'}
            </button>

            {/* CSV Spreadsheet export button link */}
            <button
              id="export-csv-report-btn"
              onClick={() => triggerExport('csv')}
              disabled={isExporting !== null}
              className="w-full py-2.5 bg-theme-surface-soft hover:bg-theme-border/45 text-theme-text-primary font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-theme-border"
            >
              <FileDown className="w-4 h-4 text-theme-text-secondary" />
              {isExporting === 'csv' ? 'Compiling CSV Cells...' : 'Export Excel / CSV Spreadsheet'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
