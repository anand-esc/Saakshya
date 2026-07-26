import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Scale, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw, 
  SlidersHorizontal,
  Loader2
} from 'lucide-react';

interface BackendDistrictFPR {
  district_id: string;
  fpr: number;
  n: number;
}

interface BiasAuditPanelProps {
  theme?: 'light' | 'dark';
}

export const BiasAuditPanel: React.FC<BiasAuditPanelProps> = ({ theme = 'light' }) => {
  const isLight = theme === 'light';
  const [districts, setDistricts] = useState<BackendDistrictFPR[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditData = () => {
    setLoading(true);
    fetch('/server/spatial_bias_audit/bias-audit')
      .then(res => res.json())
      .then(data => {
        setDistricts(data.districts || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch bias audit:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
      className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Banner Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl border shadow-xl transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-slate-950 border-slate-800 text-white'
      }`}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold mb-2">
            <Scale className="w-3.5 h-3.5" /> ALGORITHMIC GOVERNANCE & EQUAL PROTECTION ENGINE
          </div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Algorithmic Bias & Parity Audit
          </h2>
          <p className={`text-xs lg:text-sm font-sans mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Real-time False Positive Rate (FPR) parity evaluation.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-2 font-mono ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 text-amber-500 animate-spin" /> : <RotateCcw className="w-4 h-4 text-amber-500" />}
          <span>Refresh Data</span>
        </button>
      </div>

      {/* District Bias List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <SlidersHorizontal className="w-5 h-5 text-amber-500" />
            <span>District False Positive Rate (FPR)</span>
          </h3>
        </div>

        {loading && districts.length === 0 ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {districts.map((district) => {
              return (
                <div
                  key={district.district_id}
                  className={`rounded-3xl p-5 border transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`text-base font-bold font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>{district.district_id}</h4>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl border font-mono text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                  }`}>
                    <div>
                      <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>FPR Rate</div>
                      <div className={`font-bold mt-0.5 text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {(district.fpr * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Sample Size (N)</div>
                      <div className={`font-bold mt-0.5 text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {district.n}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
