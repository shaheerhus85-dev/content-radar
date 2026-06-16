import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Compass,
  TrendingUp,
  Settings,
  HelpCircle,
  Radio,
  User,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; email: string; plan: string } | null;
  sourcesCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  sourcesCount = 4,
}: SidebarProps) {
  const routes = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sources',
      name: 'Sources',
      icon: Globe,
      badge: sourcesCount.toString(),
    },
    {
      id: 'insights',
      name: 'Insights',
      icon: Compass,
      badge: null,
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      id="left-navigation-sidebar"
      className="w-[240px] border-r border-theme-border bg-theme-sidebar px-3 py-4 flex flex-col justify-between h-screen sticky top-0 z-40 shrink-0 transition-colors duration-200 hidden md:flex font-sans"
    >
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div className="p-3.5 border-b border-theme-border flex items-center gap-3 mb-6 select-none">
          <div className="bg-theme-accent text-theme-accent-fg p-2 rounded-xl shadow-sm shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-theme-text-primary uppercase tracking-wider text-xs select-none block truncate">
              Content Radar
            </span>
            <span className="text-[10px] font-semibold text-theme-text-secondary block leading-none mt-1 truncate">
              Pulse Monitor
            </span>
          </div>
        </div>

        {/* Sidebar Nav Buttons */}
        <div className="px-1 space-y-1.5">
          <span className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-widest px-3 block mb-2 select-none">
            Main Console
          </span>
          <nav className="space-y-1 select-none">
            {routes.map((route) => {
              const Icon = route.icon;
              const isActive = activeTab === route.id;

              return (
                <button
                  key={route.id}
                  id={`sidebar-link-${route.id}`}
                  onClick={() => setActiveTab(route.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer border text-xs font-semibold
                    ${isActive
                      ? 'bg-theme-accent text-theme-accent-fg border-theme-accent shadow-sm'
                      : 'bg-transparent border-transparent text-theme-text-secondary hover:bg-theme-surface-soft hover:text-theme-text-primary'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-theme-accent-fg' : 'text-theme-text-secondary group-hover:text-theme-text-primary'}`} />
                    <span className="truncate">{route.name}</span>
                  </div>

                  {route.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold leading-none shrink-0
                        ${isActive
                          ? 'bg-theme-surface-soft/20 text-theme-accent-fg'
                          : 'bg-theme-surface-soft text-theme-text-secondary'
                        }
                      `}
                    >
                      {route.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-1 px-1 space-y-3 pt-3 border-t border-theme-border select-none shrink-0">
        <button
          id="sidebar-help-cta"
          onClick={() => setActiveTab('settings')}
          className="w-full flex items-center gap-3 px-3.5 py-2 border border-transparent hover:bg-theme-surface-soft hover:border-theme-border rounded-xl text-theme-text-secondary hover:text-theme-text-primary transition-all text-xs font-semibold cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Help Center</span>
        </button>

        {/* User profile session slot - 36px avatar size */}
        <div className="flex items-center gap-2.5 p-2 bg-theme-surface-soft border border-theme-border rounded-xl">
          <div className="w-9 h-9 rounded-xl bg-theme-accent text-theme-accent-fg flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {user ? user.name[0] : 'D'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-theme-text-primary block truncate leading-none">
              Demo Workspace
            </span>
            <span className="text-[9.5px] font-semibold text-theme-text-secondary block truncate leading-none mt-1">
              Guest Recruiter
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
