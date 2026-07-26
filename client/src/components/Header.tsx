import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Database, Lock, Clock, UserCheck, AlertTriangle, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pendingReviewCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  pendingReviewCount,
  theme,
  onToggleTheme 
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC+5.5');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur border-b px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4 transition-colors duration-200 ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-xl'
    }`}>
      {/* Brand & System Indicators */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40">
          <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-base lg:text-lg font-black tracking-wider uppercase font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
              CRIME-INTEL MESH
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              v3.8-GOV
            </span>
          </div>
          <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            State Police Intelligence & Algorithmic Governance
          </p>
        </div>
      </div>

      {/* System Status Telemetry Badges */}
      <div className="hidden xl:flex items-center gap-3 font-mono text-xs">
        {/* SHA-256 Grounded Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>SHA-256 Ledger:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% GROUNDED</span>
        </div>

        {/* CAD Sensor Sync */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>CAD Live Sync:</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">1,420 SENSORS</span>
        </div>

        {/* Pending HITL Reviews Badge */}
        {pendingReviewCount > 0 && (
          <div className="flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
            <span>HITL Pending:</span>
            <span className="font-bold">{pendingReviewCount} ACTION REQUIRED</span>
          </div>
        )}
      </div>

      {/* Center Search & Theme Toggle & Officer Profile */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Global Search Input */}
        <div className="relative w-40 sm:w-56 lg:w-64">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SHA-256, LPR..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs font-mono transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500'
                : 'bg-slate-950/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-amber-500/60'
            }`}
          />
        </div>

        {/* Theme Switcher Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${isLight ? 'Dark Executive' : 'Light Executive'} Mode`}
          className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-amber-400'
          }`}
        >
          {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Live Clock */}
        <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{time}</span>
        </div>

        {/* Officer Badge Profile */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
          isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/90 border-slate-700'
        }`}>
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>Capt. V. Vance</div>
            <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">Badge #8841-A • CLEARANCE L4</div>
          </div>
        </div>
      </div>
    </header>
  );
};
