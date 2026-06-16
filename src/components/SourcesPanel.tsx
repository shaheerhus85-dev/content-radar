import React, { useState } from 'react';
import { Source } from '../types';
import { Plus, Trash2, Globe, CheckCircle2, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';

interface SourcesPanelProps {
  sources: Source[];
  onAddSource: (name: string, url: string, type: 'rss' | 'sitemap') => void;
  onDeleteSource: (id: string) => void;
}

export default function SourcesPanel({
  sources,
  onAddSource,
  onDeleteSource,
}: SourcesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'rss' | 'sitemap'>('rss');
  const [errMessage, setErrMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');

    if (!newName.trim() || !newUrl.trim()) {
      setErrMessage('Please provide both a source name and stream XML feed URL.');
      return;
    }

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      setErrMessage('The URL must be a valid protocol link containing http:// or https://');
      return;
    }

    onAddSource(newName.trim(), newUrl.trim(), newType);
    setNewName('');
    setNewUrl('');
    setShowAddForm(false);
  };

  return (
    <div id="sources-panel-workspace" className="space-y-6">
      
      {/* Overview header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="text-left">
          <h2 className="text-lg font-bold text-theme-text-primary capitalize">Monitored Sources</h2>
          <p className="text-xs text-theme-text-secondary mt-1">
            Manage the list of verified news feeds, blogs, and XML sitemaps parsed by Content Radar.
          </p>
        </div>

        <button
          id="toggle-add-source-form-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 border border-theme-border font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm sm:self-center self-start"
        >
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      {/* Adding active pipeline form */}
      {showAddForm && (
        <div id="add-source-form" className="p-5 bg-theme-surface border border-theme-border rounded-xl shadow-sm text-left select-none animate-fade-in-quick">
          <h3 className="text-sm font-bold text-theme-text-primary mb-3">Add Feed Source</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Source Name</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI News"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Feed Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'rss' | 'sitemap')}
                  className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-2.5 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all cursor-pointer"
                >
                  <option value="rss">RSS Feed Stream</option>
                  <option value="sitemap">Sitemap XML Stream</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-theme-text-secondary uppercase mb-1">Feed URL Address</label>
              <input
                type="text"
                placeholder="https://openai.com/news/rss.xml"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full bg-theme-surface-soft border border-theme-border text-theme-text-primary rounded-xl px-3 py-2 text-xs focus:border-theme-text-primary/30 outline-none transition-all placeholder-theme-text-secondary/60"
              />
            </div>

            {errMessage && (
              <p className="text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg p-2 font-medium">
                {errMessage}
              </p>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                id="submit-add-source-btn"
                className="px-4 py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 font-bold text-xs rounded-xl"
              >
                Launch Monitoring
              </button>
              <button
                type="button"
                id="cancel-add-source-btn"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-theme-surface-soft hover:bg-theme-border/40 text-theme-text-primary text-xs font-bold rounded-xl border border-theme-border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sources compact list table */}
      <div id="sources-list-table-container" className="bg-theme-surface border border-theme-border rounded-xl shadow-sm overflow-hidden text-left">
        <table id="sources-management-dashboard-grid" className="w-full text-xs text-left border-collapse select-none">
          <thead>
            <tr className="bg-theme-surface-soft text-theme-text-secondary border-b border-theme-border font-bold text-[11px] uppercase tracking-wide">
              <th className="px-5 py-3 ml-2.5">Source Feed</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Parsed Count</th>
              <th className="px-5 py-3">Last Checked</th>
              <th className="px-5 py-3 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border text-theme-text-primary">
            {sources.map((src) => {
              // Simulated parsed items weight
              const simulatedCount = src.name.includes('Google')
                ? 42
                : src.name.includes('OpenAI')
                ? 38
                : src.name.includes('Vercel')
                ? 33
                : 25;

              return (
                <tr
                  key={src.id}
                  id={`source-item-${src.id}`}
                  className="hover:bg-theme-surface-soft/40 transition-colors duration-150"
                >
                  {/* Title and feed URL address */}
                  <td className="px-5 py-4 max-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="bg-theme-surface-soft border border-theme-border text-theme-text-secondary p-2 rounded-xl">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-theme-text-primary text-xs truncate block">
                          {src.name}
                        </span>
                        <span className="text-[10px] text-theme-text-secondary font-semibold font-mono truncate block mt-0.5">
                          {src.url}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Feed type sitemap vs RSS */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-theme-surface-soft border border-theme-border text-theme-text-secondary">
                      {src.type}
                    </span>
                  </td>

                  {/* Status dot representation */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#12B76A]">
                      <span className="w-2 h-2 rounded-full bg-[#12B76A]" /> Active
                    </span>
                  </td>

                  {/* Items indexed count */}
                  <td className="px-5 py-4 whitespace-nowrap text-theme-text-primary font-mono font-bold">
                    {simulatedCount}
                  </td>

                  {/* Last checked time */}
                  <td className="px-5 py-4 whitespace-nowrap text-theme-text-secondary font-medium">
                    {src.lastFetchedAt || '12 mins ago'}
                  </td>

                  {/* Delete button option */}
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
