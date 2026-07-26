export type ViewType = 
  | 'landing' 
  | 'overview' 
  | 'hotspot-map' 
  | 'network-graph' 
  | 'bias-audit' 
  | 'action-logs' 
  | 'dossiers';

export interface District {
  id: string;
  name: string;
  code: string;
  fpr: number; // False Positive Rate e.g. 0.042 (4.2%)
  disparateImpact: number; // Ratio e.g. 1.04 or 1.28
  algorithmicWeight: number; // 0.0 to 1.0
  autoDampeningActive: boolean;
  dataSufficiencyScore: number; // e.g. 98.4%
  totalIncidents: number;
  highRiskHotspots: number;
  status: 'optimal' | 'warning' | 'critical_dampened';
}

export type EntityCategory = 'suspect' | 'vehicle' | 'location' | 'incident' | 'officer';

export interface EntityNode {
  id: string;
  label: string;
  category: EntityCategory;
  sha256: string;
  riskScore: number; // 0-100
  status: 'grounded' | 'unverified' | 'flagged';
  details: string;
  connectedCount: number;
  x?: number;
  y?: number;
}

export interface RelationshipLink {
  id: string;
  source: string;
  target: string;
  relationship: string;
  sha256Grounded: boolean;
  timestamp: string;
  confidence: number; // 0-100
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  officerId: string;
  officerName: string;
  supervisorBadge: string;
  action: string;
  district: string;
  reasonCode: string;
  algorithmicWeightBefore: number;
  algorithmicWeightAfter: number;
  status: 'Approved' | 'Rejected' | 'Pending Review';
  sha256Hash: string;
}

export interface IntelAlert {
  id: string;
  timestamp: string;
  type: 'lpr' | 'cad' | 'bias' | 'dispatch';
  title: string;
  district: string;
  details: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  verifiedSha256: string;
}

export interface DossierItem {
  id: string;
  targetName: string;
  targetAlias: string;
  riskIndex: number;
  activeWarrants: number;
  primaryDistrict: string;
  sha256Chain: string;
  lastKnownLocation: string;
  vehicleLpr: string;
  connectedEntitiesCount: number;
  dossierStatus: 'Active Intelligence' | 'High Priority Track' | 'Cleared / Archived';
  summary: string;
}
