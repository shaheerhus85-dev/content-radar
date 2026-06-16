import { useState } from 'react';
import { User, Sliders, Sun, Moon, RotateCcw, CheckCircle2 } from 'lucide-react';

interface SettingsPanelProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  user: { name: string; email: string; plan: string } | null;
  onResetDemo: () => void;
}

export default function SettingsPanel({
  theme,
  onToggleTheme,
  user,
  onResetDemo,
}: SettingsPanelProps) {
  const [crawlLimit, setCrawlLimit] = useState(15);
  const [emailDigest, setEmailDigest] = useState(true);
  const [autoDeduplicate, setAutoDeduplicate] = useState(true);
  const [saveStatus, setSaveStatus] = useState(false);

  const handleSave = () => {
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
    }, 2000);
  };

  return (
    <div id="settings-panel" className="space-y-6 text-left select-none max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-theme-text-primary capitalize">System Settings</h2>
        <p className="text-xs text-theme-text-secondary mt-1">
          Configure content ingestion depth, theme tokens, and account notifications.
        </p>
      </div>

      {saveStatus && (
        <div id="save-settings-notification" className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in-quick">
          <CheckCircle2 className="w-4 h-4" /> Preference parameters updated successfully!
        </div>
      )}

      {/* Grid of Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* 1. Ingestion Control & Preferences card */}
        <div className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-2 border-b border-theme-border pb-2">
              <Sliders className="w-4 h-4 text-theme-text-secondary" /> Ingestion Control
            </h3>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-theme-text-secondary uppercase">
                Crawl Depth Limit ({crawlLimit} posts)
              </label>
              <input
                id="crawl-limit-slider"
                type="range"
                min="5"
                max="50"
                step="5"
                value={crawlLimit}
                onChange={(e) => setCrawlLimit(Number(e.target.value))}
                className="w-full h-1.5 bg-theme-surface-soft rounded-lg appearance-none cursor-pointer accent-slate-800 dark:accent-zinc-200"
              />
              <p className="text-[10px] text-theme-text-secondary">
                Increases accuracy by review of deeper archives.
              </p>
            </div>

            {/* Checkbox preferences */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-theme-text-primary">
                <input
                  type="checkbox"
                  checked={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.checked)}
                  className="w-4 h-4 text-theme-text-primary bg-theme-surface-soft border-theme-border rounded focus:ring-0 cursor-pointer accent-slate-800 dark:accent-zinc-200"
                />
                <span>Email summary digest</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-theme-text-primary">
                <input
                  type="checkbox"
                  checked={autoDeduplicate}
                  onChange={(e) => setAutoDeduplicate(e.target.checked)}
                  className="w-4 h-4 text-theme-text-primary bg-theme-surface-soft border-theme-border rounded focus:ring-0 cursor-pointer accent-slate-800 dark:accent-zinc-200"
                />
                <span>Automatic deduplication of duplicate titles</span>
              </label>
            </div>
          </div>

          <button
            id="save-ingestion-settings-btn"
            onClick={handleSave}
            className="w-full py-2 bg-theme-accent text-theme-accent-fg hover:opacity-90 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm mt-3 border border-theme-border"
          >
            Save Parameters
          </button>
        </div>

        {/* 2. Style & Developer Tools settings card */}
        <div className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-2 border-b border-theme-border pb-2">
              <Sun className="w-4 h-4 text-[#F59E0B]" /> Style Preference
            </h3>

            <div className="space-y-2.5">
              <p className="text-xs text-theme-text-secondary leading-normal">
                Choose the design theme to use across all charts, widgets, and lists in Content Radar.
              </p>

              <div className="flex gap-2">
                <button
                  id="settings-theme-toggle"
                  onClick={onToggleTheme}
                  className="flex items-center justify-center gap-2 px-3.5 py-1.8 border border-theme-border rounded-xl text-xs font-semibold hover:bg-theme-surface-soft/82 bg-theme-surface transition-all cursor-pointer text-theme-text-primary shadow-sm"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-4 h-4 text-slate-500" /> Switch to Dark Charcoal
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-[#F59E0B]" /> Switch to Soft Off-White
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Developer Reset Option */}
            <div className="space-y-2 pt-4 border-t border-theme-border">
              <h4 className="text-[11px] font-bold text-theme-text-secondary uppercase">Backup & Reset options</h4>
              <p className="text-[11px] text-theme-text-secondary leading-normal">
                Reset system cache and reload the clean demo feeds and insights list.
              </p>
              <button
                id="reset-demo-database-btn"
                onClick={() => {
                  onResetDemo();
                  handleSave();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-theme-border bg-theme-surface-soft hover:bg-theme-border/45 text-theme-text-primary hover:text-rose-500 text-[11px] font-bold rounded-xl cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Defaults Demo
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Account Info Detail display */}
      <div className="bg-theme-surface border border-theme-border p-5 rounded-xl shadow-sm select-none text-left">
        <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-2 pb-3 border-b border-theme-border mb-3.5">
          <User className="w-4 h-4 text-theme-text-secondary" /> User Account Metadata
        </h3>
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-theme-text-secondary">
            <div className="space-y-0.5">
              <span className="block text-[10px] text-theme-text-secondary font-bold uppercase">Recruiter Profile Name</span>
              <strong className="text-theme-text-primary font-bold text-sm">{user.name}</strong>
            </div>

            <div className="space-y-0.5">
              <span className="block text-[10px] text-theme-text-secondary font-bold uppercase font-mono">Email Address</span>
              <strong className="text-theme-text-primary font-bold text-sm font-mono">{user.email}</strong>
            </div>

            <div className="space-y-0.5" id="user-billing-plan-container">
              <span className="block text-[10px] text-theme-text-secondary font-bold uppercase">License Tier</span>
              <span className="inline-block text-[10px] font-mono font-black uppercase text-theme-text-primary bg-theme-surface-soft px-2 py-0.5 rounded-lg border border-theme-border leading-none mt-1">
                {user.plan}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-theme-text-secondary">No guest session found. Open the dashboard via tour showcase.</p>
        )}
      </div>

    </div>
  );
}
