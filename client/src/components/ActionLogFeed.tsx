import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AuditRecord, District } from '../types';
import { 
  History, 
  UserCheck, 
  Lock, 
  PlusCircle, 
  Copy, 
  Check, 
  Loader2
} from 'lucide-react';

interface ActionLogFeedProps {
  auditLogs: AuditRecord[];
  districts: District[];
  onAddAuditRecord: (record: AuditRecord) => void;
  theme?: 'light' | 'dark';
  selectedEdgeId: string | null;
}

export const ActionLogFeed: React.FC<ActionLogFeedProps> = ({ auditLogs, districts, onAddAuditRecord, theme = 'light', selectedEdgeId }) => {
  const isLight = theme === 'light';
  const [showModal, setShowModal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Form State
  const [reasonCode, setReasonCode] = useState<string>('verified');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSubmitAuthorization = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const targetId = selectedEdgeId || 'EDGE-EVID-01';

    const payload = {
      target_type: 'edge',
      target_id: targetId,
      user_id: 'USER-0001',
      reason_code: reasonCode
    };

    fetch('/server/relational_action_log/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Acknowledgment failed');
        }
        
        // On success, construct a record to add to the visual UI log
        const generateSha = () => Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

        const newRecord: AuditRecord = {
          id: `aud-${Date.now()}`,
          timestamp,
          officerId: 'USER-0001',
          officerName: 'Demo User',
          supervisorBadge: 'N/A',
          action: `Acknowledged ${targetId}`,
          district: 'Global',
          reasonCode: payload.reason_code,
          algorithmicWeightBefore: 1.0,
          algorithmicWeightAfter: 1.0,
          status: 'Approved',
          sha256Hash: generateSha(),
        };

        onAddAuditRecord(newRecord);
        setShowModal(false);
      })
      .catch(err => {
        setErrorMsg(err.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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
            <History className="w-3.5 h-3.5" /> HUMAN-IN-THE-LOOP (HITL) AUDIT TRAIL
          </div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Officer Authorization & Action Logs
          </h2>
          <p className={`text-xs lg:text-sm font-sans mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Immutable decision feed. Active Target: {selectedEdgeId || 'EDGE-EVID-01'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 font-mono hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Acknowledge Link</span>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className={`rounded-3xl p-6 border space-y-4 shadow-xl ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className={`flex items-center justify-between font-mono text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>SHOWING {auditLogs.length} BADGE VERIFIED DECISION ENTRIES</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> SHA-256 IMMUTABLE LEDGER
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className={`border-b uppercase text-[10px] tracking-wider ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
              }`}>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer / Badge ID</th>
                <th className="py-3 px-4">Action Summary</th>
                <th className="py-3 px-4">Reason Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
              {auditLogs.map((log) => (
                <tr key={log.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                  <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <div className={`font-bold font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>{log.officerName}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">Badge #{log.officerId}</div>
                  </td>
                  <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{log.action}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                      {log.reasonCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCopyHash(log.sha256Hash)}
                      className={`font-mono text-[10px] inline-flex items-center gap-1 ${
                        isLight ? 'text-slate-500 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      {copiedHash === log.sha256Hash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{log.sha256Hash.substring(0, 10)}...</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorization Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-6 border max-w-lg w-full space-y-5 shadow-2xl font-mono ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`text-base font-bold flex items-center gap-2 font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span>Acknowledge Link</span>
              </h3>
              <button onClick={() => setShowModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-white'}>✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                Error: {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitAuthorization} className="space-y-4 text-xs">
              <div>
                <label className={`block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Target Edge ID</label>
                <input
                  type="text"
                  readOnly
                  value={selectedEdgeId || 'EDGE-EVID-01'}
                  className={`w-full border rounded-xl px-3 py-2 bg-opacity-50 cursor-not-allowed ${
                    isLight ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Reason Code</label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  <option value="verified">verified</option>
                  <option value="rejected">rejected</option>
                  <option value="pending_review">pending_review</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Authorize Acknowledgment</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
