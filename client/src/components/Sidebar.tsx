import React from 'react';
import { ViewType } from '../types';
import { 
  LayoutDashboard, 
  Map, 
  GitFork, 
  Scale, 
  History, 
  FileText, 
  Compass, 
  ChevronRight,
  Radio,
  Sliders,
  Shield
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  pendingReviewCount: number;
  flaggedDistrictsCount: number;
  theme: 'light' | 'dark';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  pendingReviewCount,
  flaggedDistrictsCount,
  theme,
}) => {
  const isLight = theme === 'light';

  const navItems = [
    {
      id: 'landing' as ViewType,
      label: 'Command Hub',
      icon: Compass,
      badge: 'HUB',
      badgeColor: isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: 'Executive Landing & Module Grid'
    },
    {
      id: 'overview' as ViewType,
      label: 'Operational Overview',
      icon: LayoutDashboard,
      badge: 'LIVE',
      badgeColor: isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Tactical CAD & Dispatch Metrics'
    },
    {
      id: 'hotspot-map' as ViewType,
      label: 'Spatial Hotspot Map',
      icon: Map,
      badge: 'GIS',
      badgeColor: isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      description: 'Density Map & Sufficiency Tags'
    },
    {
      id: 'network-graph' as ViewType,
      label: 'SHA-256 Evidence Graph',
      icon: GitFork,
      badge: 'GROUNDED',
      badgeColor: isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      description: 'Cryptographic Node Linkage'
    },
    {
      id: 'bias-audit' as ViewType,
      label: 'Algorithmic Bias Audit',
      icon: Scale,
      badge: flaggedDistrictsCount > 0 ? `${flaggedDistrictsCount} FLAGGED` : 'PARITY 1.04',
      badgeColor: flaggedDistrictsCount > 0 
        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse' 
        : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'),
      description: 'District FPR & Weight Dampening'
    },
    {
      id: 'action-logs' as ViewType,
      label: 'HITL Audit Trails',
      icon: History,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} PENDING` : 'SECURE',
      badgeColor: pendingReviewCount > 0
        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40'
        : (isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-700/60 text-slate-300 border-slate-600'),
      description: 'Badge Verified Officer Logs'
    },
    {
      id: 'dossiers' as ViewType,
      label: 'High-Target Dossiers',
      icon: FileText,
      badge: 'INTEL',
      badgeColor: isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: 'Target Directory & LPR Track'
    },
  ];

  return (
    <aside className={`w-full lg:w-72 border-b lg:border-b-0 lg:border-r shrink-0 flex flex-col justify-between p-4 transition-colors duration-200 ${
      isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950 border-slate-800'
    }`}>
      <div>
        {/* Navigation Category Label */}
        <div className={`px-3 mb-3 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center gap-2 ${
          isLight ? 'text-slate-500' : 'text-slate-500'
        }`}>
          <Shield className="w-3 h-3 text-amber-500" />
          <span>COMMAND MODULES</span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                id={`nav-${item.id}`}
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full text-left flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? (isLight 
                        ? 'bg-white border border-amber-500/80 shadow-md text-slate-900 ring-1 ring-amber-500/30' 
                        : 'bg-slate-900 border border-amber-500/50 shadow-lg text-white ring-1 ring-amber-500/30')
                    : (isLight
                        ? 'bg-transparent hover:bg-white/80 border border-transparent hover:border-slate-200 text-slate-700'
                        : 'bg-slate-950/60 hover:bg-slate-900/80 border border-transparent hover:border-slate-800 text-slate-300 hover:text-white')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                        : (isLight ? 'bg-slate-200 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800' : 'bg-slate-900 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800')
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold font-sans flex items-center gap-1.5 ${
                      isActive ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-800' : 'text-slate-300')
                    }`}>
                      <span>{item.label}</span>
                    </div>
                    <div className={`text-[10px] font-sans line-clamp-1 ${
                      isLight ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-md border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-amber-500 translate-x-0.5' : (isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-400')
                  }`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer & System State */}
      <div className={`mt-6 pt-4 border-t px-2 space-y-3 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <div className={`rounded-2xl p-3 border text-xs font-mono space-y-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-[11px]">
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Mesh Status</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Sliders className="w-3 h-3 text-amber-500" />
              <span>Disparate Impact</span>
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">1.04 DIR</span>
          </div>
          
          <div className={`w-full rounded-full h-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-950'}`}>
            <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full w-[35%]" />
          </div>
        </div>

        <div className={`text-[10px] font-mono text-center ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          STATE POLICE • ALGORITHMIC GOVERNANCE MESH
        </div>
      </div>
    </aside>
  );
};
