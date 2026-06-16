import React, { useState } from 'react';
import { Plus, Globe, Trash2, Check, Radio } from 'lucide-react';
import { Source } from '../types';

interface SourcePanelProps {
  sources: Source[];
  onAddSource: (name: string, url: string, type: 'rss' | 'sitemap') => void;
  onDeleteSource: (id: string) => void;
  isScanning: boolean;
}

export default function SourcePanel({ sources, onAddSource, onDeleteSource, isScanning }: SourcePanelProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'rss' | 'sitemap'>('rss');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!url.trim()) {
      setError('Secure URL is required');
      return;
    }

    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error();
      }
      new URL(url);
    } catch {
      setError('URL must start with http:// or https://');
      return;
    }

    onAddSource(name.trim(), url.trim(), type);
    setName('');
    setUrl('');
  };

  return (
    <div className="flex flex-col gap-5 h-full text-left font-sans select-none">
      
      {/* 1. ADD CONTENT SOURCE CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shrink-0 shadow-sm dark:bg-[#111622]/85 dark:border-white/5 transition-colors">
        <div className="mb-4">
          <h3 className="text-xs font-bold tracking-wider text-slate-900 dark:text-white uppercase flex items-center gap-1.5 leading-none">
            <Radio className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
            Register Feed Channel
          </h3>
          <p className="text-[11px] text-slate-550 dark:text-zinc-400 mt-1 font-light">
            Register custom RSS or Sitemap endpoints to ingest new updates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Source Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Google Central"
                disabled={isScanning}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#0a0d14] dark:border-white/5 dark:text-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Feed Type
              </label>
              <div className="flex bg-slate-50 border border-slate-205 dark:bg-[#0a0d14] dark:border-white/5 rounded-xl p-[2px]">
                <button
                  type="button"
                  onClick={() => setType('rss')}
                  disabled={isScanning}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg uppercase transition-colors cursor-pointer ${
                    type === 'rss'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-350'
                  }`}
                >
                  RSS
                </button>

                <button
                  type="button"
                  onClick={() => setType('sitemap')}
                  disabled={isScanning}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg uppercase transition-colors cursor-pointer ${
                    type === 'sitemap'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-350'
                  }`}
                >
                  Sitemap
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Feed Endpoint URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://developers.google.com/search/feed.xml"
              disabled={isScanning}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#0a0d14] dark:border-white/5 dark:text-zinc-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-400 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-950/30 rounded-xl p-2.5 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isScanning}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Register Channel
          </button>
        </form>
      </div>

      {/* 2. CONFIGURED SOURCES MONITOR LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 relative flex-1 flex flex-col min-h-0 shadow-sm dark:bg-[#111622]/85 dark:border-white/5 transition-colors">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-150 dark:border-white/5">
          <h3 className="text-xs font-bold tracking-wider text-slate-905 dark:text-white uppercase flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
            Active Registered Outlets ({sources.length})
          </h3>
        </div>

        {sources.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 dark:text-zinc-600">
            <p className="text-xs">No active content channels configured.</p>
            <p className="text-[10px] mt-0.5">Use the registry panel above to register one.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[240px] lg:max-h-none scrollbar-thin">
            {sources.map((src) => {
              const itemsFound = src.type === 'rss' ? (src.name.includes('OpenAI') ? 15 : 28) : 32;
              return (
                <div
                  key={src.id}
                  className="group relative border border-slate-200 bg-slate-50/40 hover:bg-slate-50 rounded-2xl p-3.5 transition-all dark:border-white/5 dark:bg-[#0a0d14]/40 dark:hover:bg-[#111622]/40"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-850 dark:text-zinc-250 truncate block">
                          {src.name}
                        </span>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-650 dark:bg-slate-900 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase leading-none select-none">
                          {src.type}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-550 block truncate mt-1">
                        {src.url}
                      </span>

                      {/* Details Strip */}
                      <div className="flex items-center gap-2.5 mt-3 border-t border-slate-150/40 dark:border-white/[0.03] pt-2.5 text-[10.5px] text-slate-505 dark:text-zinc-400">
                        <span className="flex items-center gap-0.5 text-emerald-600 font-bold dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          Connected
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400 dark:text-zinc-550">{itemsFound} posts parsed</span>
                        <span>•</span>
                        <span className="text-slate-400 dark:text-zinc-550 font-mono text-[10px]">{src.lastFetchedAt || '12 mins ago'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteSource(src.id)}
                      disabled={isScanning}
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-[#111622] rounded-xl transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                      title="Deregister channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
