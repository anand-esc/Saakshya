import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { District } from '../types';
import { MapPin, Sliders, ShieldCheck, AlertTriangle, Layers, Info, Filter, Loader2 } from 'lucide-react';

interface Cell {
  lat: number;
  lng: number;
  density: number;
  badge: 'green' | 'amber' | 'grey';
}

interface HotspotMapProps {
  districts: District[];
  theme?: 'light' | 'dark';
}

export const HotspotMap: React.FC<HotspotMapProps> = ({ districts, theme = 'light' }) => {
  const isLight = theme === 'light';
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(districts[0]?.id || 'KA-BLR-URB');
  const [sufficiencyCutoff, setSufficiencyCutoff] = useState<number>(90);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedDistrict = districts.find(d => d.id === selectedDistrictId) || districts[0];

  useEffect(() => {
    if (!selectedDistrictId) return;
    setLoading(true);
    fetch(`/server/spatial_hotspots/hotspots?district_id=${selectedDistrictId}`)
      .then(res => res.json())
      .then(data => {
        setCells(data.cells || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch hotspots:", err);
        setLoading(false);
      });
  }, [selectedDistrictId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Header Banner */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl border shadow-xl transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-950 border-slate-800 text-white'
      }`}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-bold mb-2">
            <Layers className="w-3.5 h-3.5" /> SPATIAL DENSITY & DATA-SUFFICIENCY MESH
          </div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Interactive Hotspot Map
          </h2>
          <p className={`text-xs lg:text-sm font-sans mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Spatial crime density clusters mapped alongside mandatory data-sufficiency scores to prevent bias in under-sampled sectors.
          </p>
        </div>

        {/* Filters bar */}
        <div className={`flex flex-wrap items-center gap-4 p-3 rounded-2xl border font-mono text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Min Sufficiency:</span>
            <input
              type="range"
              min="85"
              max="99"
              value={sufficiencyCutoff}
              onChange={(e) => setSufficiencyCutoff(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="text-amber-600 dark:text-amber-400 font-bold">{sufficiencyCutoff}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 ${
                isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-slate-950 text-slate-200 border-slate-700'
              }`}
            >
              <option value="all">All CAD Categories</option>
              <option value="lpr">LPR Hit Clusters</option>
              <option value="robbery">Armed Robbery</option>
              <option value="narcotics">Narcotics Interdiction</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Map Viewport (8 Cols) */}
        <div className={`lg:col-span-8 rounded-3xl p-6 border relative min-h-[500px] flex flex-col justify-between overflow-hidden shadow-2xl ${
          isLight ? 'bg-white border-slate-200 bg-grid-pattern-light' : 'bg-slate-950 border-slate-800 bg-grid-pattern-dark'
        }`}>
          {/* Top Map Indicators */}
          <div className="flex items-center justify-between z-10 font-mono text-xs">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}>
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>SPATIAL GRID: {selectedDistrict?.name.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-2">
               {loading && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">{cells.length} CELLS VERIFIED</span>
            </div>
          </div>

          {/* Interactive Map Visualizer Container */}
          <div className={`my-6 relative w-full h-[420px] rounded-2xl border overflow-auto ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
          }`}>
            {loading ? (
               <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
               </div>
            ) : (
               <div className="grid grid-cols-10 gap-1 p-4 h-full auto-rows-fr">
                 {cells.map((cell, idx) => {
                   let bgClass = isLight ? 'bg-slate-200' : 'bg-slate-800';
                   if (cell.badge === 'amber') bgClass = 'bg-amber-500/80 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse';
                   if (cell.badge === 'green') bgClass = 'bg-emerald-500/80 border-emerald-500';
                   if (cell.badge === 'grey') bgClass = isLight ? 'bg-slate-300 border-slate-400' : 'bg-slate-800/50 border-slate-700';
   
                   return (
                     <div
                       key={idx}
                       className={`relative rounded-md border text-center transition-all duration-200 flex flex-col items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 z-10 ${bgClass}`}
                       title={`Lat: ${cell.lat}, Lng: ${cell.lng} | Density: ${cell.density}`}
                     >
                       <span className={`text-[8px] font-mono mix-blend-overlay font-black ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                         {cell.density > 0 ? cell.density.toFixed(2) : ''}
                       </span>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>

          {/* Bottom Map Legend */}
          <div className={`flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] pt-2 border-t ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-slate-900 text-slate-400'
          }`}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-500" />
                <span>Green (Low Density)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-500 animate-pulse" />
                <span>Amber (High Risk Hotspot)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded border ${isLight ? 'bg-slate-300 border-slate-400' : 'bg-slate-800/50 border-slate-700'}`} />
                <span>Grey (No Activity)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Inspection Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`rounded-3xl p-6 border space-y-5 shadow-xl font-mono ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`flex flex-col gap-3 border-b pb-4 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                 <span className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>SELECT DISTRICT</span>
              </div>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-amber-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              >
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Spatial Metrics Details */}
            <div className="space-y-3">
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Data Sufficiency Score:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  {selectedDistrict?.dataSufficiencyScore}%
                </span>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Total Incident Cells:</span>
                <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {cells.length}
                </span>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Amber Hotspots:</span>
                <span className={`font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1`}>
                  <AlertTriangle className="w-4 h-4" />
                  {cells.filter(c => c.badge === 'amber').length}
                </span>
              </div>
            </div>

            {/* Data Sufficiency Assessment Banner */}
            <div className={`p-4 rounded-2xl border text-xs font-sans space-y-2 ${
              isLight ? 'bg-amber-50 border-amber-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold font-mono">
                <Info className="w-4 h-4" />
                <span>Governance Sufficiency Standard</span>
              </div>
              <p className="leading-relaxed text-xs">
                {(selectedDistrict?.dataSufficiencyScore || 0) >= 95
                  ? 'Sample size meets high-density governance standards. Algorithmic dispatch weights are certified grounded.'
                  : 'Sample density is moderate. Automated dispatch weight dampening recommended to mitigate spatial variance.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
