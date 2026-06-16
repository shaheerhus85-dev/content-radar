import { Radio, RefreshCw, Cpu, User } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onClear: () => void;
  sourceCount: number;
}

export default function Header({ onReset, onClear, sourceCount }: HeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand Left Column */}
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-cyan-500 to-teal-500 p-1.5 rounded-lg text-black">
              <Radio className="w-5 h-5 animate-[pulse_2s_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-sans tracking-tight text-white">
                  Content Radar
                </h1>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                  v1.0-PROTOTYPE
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            AI-powered RSS/Sitemap content monitoring and automation command center
          </p>
        </div>

        {/* Developer Metadata Profile */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-2 rounded-lg">
            <div className="relative">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>
            <span className="text-zinc-400 font-mono">AUTOMATION_CORE:</span>
            <span className="text-white font-medium">LIVE / SCANNING</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800/80 px-3 py-1.5 rounded-lg text-zinc-400">
            <User className="w-3.5 h-3.5 text-teal-400" />
            <span>Builder:</span>
            <span className="text-zinc-300 font-medium font-mono">Shaheer Hussain Jafri</span>
          </div>

          {/* Quick Actions for Sandbox testing */}
          <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
            <button
              onClick={onReset}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded transition-colors duration-150 flex items-center gap-1 text-[11px] font-mono cursor-pointer"
              title="Reset all sources & insights to defaults"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              RESET
            </button>
            <button
              onClick={onClear}
              className="px-2.5 py-1.5 bg-zinc-950 hover:bg-red-950/25 border border-zinc-800 hover:border-red-900/50 text-zinc-500 hover:text-red-400 rounded transition-colors duration-150 text-[11px] font-mono cursor-pointer"
              title="Clear all local items to check empty states"
            >
              CLEAR ALL
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
