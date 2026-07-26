import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewType, District, AuditRecord } from './types';
import { INITIAL_DISTRICTS, INITIAL_AUDIT_LOGS } from './data/mockData';

// Core Layout Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Module View Components
import { HotspotMap } from './components/HotspotMap';
import { NetworkGraph } from './components/NetworkGraph';
import { BiasAuditPanel } from './components/BiasAuditPanel';
import { ActionLogFeed } from './components/ActionLogFeed';

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('hotspot-map');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Lifted Edge Selection State
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'theme-light' : 'theme-dark';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Domain State (Just enough mock state to keep the layout from breaking before components fetch their own data)
  const [districts] = useState<District[]>(INITIAL_DISTRICTS);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(INITIAL_AUDIT_LOGS);

  const pendingReviewCount = auditLogs.filter(a => a.status === 'Pending Review').length;
  const flaggedDistrictsCount = 0; // We removed static mock fields in BiasAuditPanel

  const handleAddAuditRecord = (newRecord: AuditRecord) => {
    setAuditLogs(prev => [newRecord, ...prev]);
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500/30 transition-colors duration-300 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-slate-100'
    }`}>
      {/* Global Header Bar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pendingReviewCount={pendingReviewCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Shell Body: Responsive Sidebar + Main Scroll View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          pendingReviewCount={pendingReviewCount}
          flaggedDistrictsCount={flaggedDistrictsCount}
          theme={theme}
        />

        {/* Main Content Scroll Canvas */}
        <main className={`flex-1 overflow-y-auto min-h-[calc(100vh-120px)] ${
          isLight ? 'bg-slate-100/70' : 'bg-slate-900/60'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {currentView === 'hotspot-map' && (
                <HotspotMap
                  districts={districts}
                  theme={theme}
                />
              )}

              {currentView === 'network-graph' && (
                <NetworkGraph
                  theme={theme}
                  selectedEdgeId={selectedEdgeId}
                  setSelectedEdgeId={setSelectedEdgeId}
                />
              )}

              {currentView === 'bias-audit' && (
                <BiasAuditPanel
                  theme={theme}
                />
              )}

              {currentView === 'action-logs' && (
                <ActionLogFeed
                  auditLogs={auditLogs}
                  districts={districts}
                  onAddAuditRecord={handleAddAuditRecord}
                  theme={theme}
                  selectedEdgeId={selectedEdgeId}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
