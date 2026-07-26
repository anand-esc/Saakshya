import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitFork, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Car, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  Loader2
} from 'lucide-react';

interface NetworkGraphProps {
  theme?: 'light' | 'dark';
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ theme = 'light', selectedEdgeId, setSelectedEdgeId }) => {
  const isLight = theme === 'light';
  
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEdge, setLoadingEdge] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<'node' | 'edge'>('node');
  const [edgeDetails, setEdgeDetails] = useState<any>(null);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    fetch('/server/relational_graph/graph?case_id=CASE-00001')
      .then(res => res.json())
      .then(data => {
        // Compute circular layout for nodes
        const centerX = 350;
        const centerY = 200;
        const radius = 160;
        
        const positionedNodes = (data.nodes || []).map((n: any, idx: number) => {
          const angle = (idx / data.nodes.length) * 2 * Math.PI;
          return {
            id: n.id,
            label: n.label,
            category: n.properties?.category || 'suspect',
            sha256: n.properties?.sha256 || 'N/A',
            riskScore: n.properties?.risk_score || 0,
            status: n.properties?.status || 'unverified',
            details: n.properties?.details || '',
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });
        
        const confirmedEdges = (data.edges || []).map((e: any) => ({
          ...e,
          source: e.node_a_id,
          target: e.node_b_id,
          isSuggested: false
        }));
        
        const suggestedLinks = (data.suggested_links || []).map((s: any) => ({
          ...s,
          isSuggested: true,
          relation: 'suggested'
        }));

        setNodes(positionedNodes);
        setLinks([...confirmedEdges, ...suggestedLinks]);
        if (positionedNodes.length > 0) {
          setSelectedNodeId(positionedNodes[0].id);
          setSelectionType('node');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'suspect': return User;
      case 'vehicle': return Car;
      case 'location': return MapPin;
      case 'case':
      case 'incident': return FileText;
      case 'officer': return ShieldCheck;
      default: return GitFork;
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectionType('node');
  };

  const handleEdgeClick = (link: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectionType('edge');
    if (link.isSuggested) {
      setSelectedEdgeId(null);
      setEdgeDetails({ type: 'suggested', message: 'algorithm-suggested — not yet evidence-backed' });
    } else {
      setSelectedEdgeId(link.id);
      setLoadingEdge(true);
      fetch(`/server/relational_graph/graph/edge/${link.id}`)
        .then(res => res.json())
        .then(data => {
          setEdgeDetails({ type: 'confirmed', data });
          setLoadingEdge(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingEdge(false);
        });
    }
  };

  const filteredNodes = filterCategory === 'all' 
    ? nodes 
    : nodes.filter(n => n.category === filterCategory);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const connectedLinks = selectedNode 
    ? links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold mb-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" /> CRYPTOGRAPHIC SHA-256 GROUNDED EVIDENCE GRAPH
          </div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Evidence Network Graph
          </h2>
          <p className={`text-xs lg:text-sm font-sans mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Visualizing multi-source entity relationships. Confirmed edges are evidence-backed.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Filter Class:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`border rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Entity Types ({nodes.length})</option>
            <option value="suspect">Suspects</option>
            <option value="vehicle">Vehicles</option>
            <option value="location">Locations</option>
            <option value="case">Cases</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main SVG Graph Visualizer (8 cols) */}
        <div className={`lg:col-span-8 rounded-3xl p-6 border relative min-h-[520px] flex flex-col justify-between overflow-hidden shadow-2xl ${
          isLight ? 'bg-white border-slate-200 bg-grid-pattern-light' : 'bg-slate-950 border-slate-800 bg-grid-pattern-dark'
        }`}>
          <div className="flex items-center justify-between z-10 font-mono text-xs">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}>
              <GitFork className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>NODES: {nodes.length} | LINKS: {links.length}</span>
            </div>
            {loading && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
          </div>

          {/* Interactive SVG Canvas */}
          <div className={`my-4 relative w-full h-[400px] rounded-2xl border overflow-hidden flex items-center justify-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
          }`} onClick={() => setSelectionType('node')}>
            <svg className="w-full h-full">
              {/* Draw Edges / Links */}
              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;

                const isSelectedEdge = selectionType === 'edge' && ((!link.isSuggested && link.id === selectedEdgeId) || (link.isSuggested && edgeDetails?.type === 'suggested'));
                const strokeColor = link.isSuggested ? '#f59e0b' : (isLight ? '#94a3b8' : '#64748b');

                return (
                  <g id={link.id || `suggested-${idx}`} key={`link-${idx}`} onClick={(e) => handleEdgeClick(link, e)} className="cursor-pointer">
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isSelectedEdge ? '#10b981' : strokeColor}
                      strokeWidth={isSelectedEdge ? 3 : (link.isSuggested ? 1.5 : 2)}
                      strokeDasharray={link.isSuggested ? '4 4' : 'none'}
                      className="transition-all duration-200 hover:stroke-amber-400 hover:stroke-[3px]"
                    />
                  </g>
                );
              })}

              {/* Draw Node Circles */}
              {filteredNodes.map((node) => {
                const isSelected = selectionType === 'node' && node.id === selectedNodeId;
                let fillBg = isLight ? '#ffffff' : '#0f172a';
                let strokeColor = isLight ? '#94a3b8' : '#475569';
                if (node.category === 'suspect') strokeColor = '#f59e0b';
                if (node.category === 'vehicle') strokeColor = '#22d3ee';
                if (node.category === 'location') strokeColor = '#818cf8';
                if (node.category === 'case') strokeColor = '#f87171';

                return (
                  <g
                    key={node.id}
                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 26 : 20}
                      fill={fillBg}
                      stroke={isSelected ? '#10b981' : strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200"
                    />
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={34}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        className="animate-spin-slow"
                      />
                    )}
                    <text
                      x={node.x}
                      y={node.y + 34}
                      fill={isSelected ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#475569' : '#cbd5e1')}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {node.label.substring(0,10)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] pt-2 border-t ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-slate-900 text-slate-400'
          }`}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Suspect</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Vehicle</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Case</span>
              <span className="flex items-center gap-2 ml-4">
                <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="gray" strokeWidth="2" /></svg> Evidence-Backed
              </span>
              <span className="flex items-center gap-2">
                <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" /></svg> ML Suggested
              </span>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4 font-mono">
          <div className={`rounded-3xl p-6 border space-y-5 shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            
            {selectionType === 'node' && selectedNode && (
              <>
                <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div>
                    <span className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>ENTITY NODE INSPECTOR</span>
                    <h3 className={`text-lg font-bold font-sans mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedNode.label}</h3>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg uppercase bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    {selectedNode.category}
                  </span>
                </div>
                
                <div className={`p-4 rounded-2xl border text-xs font-sans space-y-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                  <div className={`text-xs font-bold font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>Risk Score: {selectedNode.riskScore} / 100</div>
                  <p className={`leading-relaxed text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {selectedNode.details}
                  </p>
                </div>
              </>
            )}

            {selectionType === 'edge' && (
              <>
                <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div>
                    <span className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>LINK INSPECTOR</span>
                    <h3 className={`text-lg font-bold font-sans mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {edgeDetails?.type === 'suggested' ? 'ML Suggestion' : 'Confirmed Edge'}
                    </h3>
                  </div>
                </div>

                {loadingEdge ? (
                   <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : edgeDetails?.type === 'suggested' ? (
                   <div className={`p-4 rounded-2xl border text-xs font-sans space-y-2 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400`}>
                     <div className="flex items-center gap-2 font-bold font-mono">
                       <AlertCircle className="w-4 h-4" />
                       <span>Prediction</span>
                     </div>
                     <p>{edgeDetails.message}</p>
                   </div>
                ) : edgeDetails?.type === 'confirmed' ? (
                   <div className={`p-4 rounded-2xl border text-xs font-sans space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                     <div>
                       <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RELATION:</span>
                       <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{edgeDetails.data.relation}</div>
                     </div>
                     <div>
                       <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SOURCE RECORD TYPE:</span>
                       <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{edgeDetails.data.source_record_type}</div>
                     </div>
                     <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                       <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>SOURCE RECORD EVIDENCE:</span>
                       <pre className={`mt-1 p-2 rounded-lg text-[10px] overflow-auto max-h-40 ${isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-900 text-slate-300'}`}>
                         {JSON.stringify(edgeDetails.data.source_record, null, 2)}
                       </pre>
                     </div>
                   </div>
                ) : null}
              </>
            )}

          </div>
        </div>
      </div>
    </motion.div>
  );
};
