// VIKALAAM CRM Types & Domain Models

export type PipelineStage =
  | '01_NEW_LEAD'
  | '02_QUALIFICATION'
  | '03_DETAILS_COLLECTION'
  | '04_DOCUMENT_COLLECTION'
  | '05_PHOTO_COLLECTION'
  | '06_AI_VALUATION'
  | '07_QUOTE_PENDING'
  | '08_QUOTE_SENT'
  | '09_NEGOTIATION'
  | '10_INSPECTION_PENDING'
  | '11_INSPECTION_SCHEDULED'
  | '12_INSPECTION_COMPLETED'
  | '13_PURCHASE_APPROVAL'
  | '14_PURCHASED'
  | '15_INVENTORY'
  | 'PARKED'
  | 'LOST';

export type ParkQueue =
  | 'NEW_LEAD_PARK'
  | 'DETAILS_PARK'
  | 'QUOTE_PARK'
  | 'NEGOTIATION_PARK'
  | 'INSPECTION_PARK';

export type ParkReason =
  | 'PRICE_OBJECTION'
  | 'NOT_READY_TO_SELL'
  | 'UNRESPONSIVE'
  | 'INSPECTION_DELAY'
  | 'DOCUMENT_PENDING'
  | 'COMPETITOR_EVALUATION'
  | 'OTHER';

export type LostReason =
  | 'SOLD_ELSEWHERE'
  | 'PRICE_GAP_TOO_HIGH'
  | 'VEHICLE_REJECTED'
  | 'FRAUD_OR_LEGAL_ISSUE'
  | 'CUSTOMER_DROPPED_OUT';

export type LeadTemperature = 'HOT' | 'WARM' | 'COOL' | 'LOW';

export type QualificationStatus =
  | 'QUALIFIED'
  | 'PARTIALLY_QUALIFIED'
  | 'NEEDS_HUMAN_REVIEW'
  | 'NOT_QUALIFIED';

export type ChannelSource =
  | 'WHATSAPP'
  | 'WEBSITE'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'PHONE'
  | 'WALK_IN'
  | 'REFERRAL'
  | 'META_ADS'
  | 'GOOGLE_ADS'
  | 'PARTNER';

export type EmployeeRole =
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_EXECUTIVE'
  | 'INSPECTION_MANAGER'
  | 'INSPECTOR'
  | 'MARKETING_MANAGER'
  | 'FINANCE_DIRECTOR';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  branch: string; // e.g. 'Chennai - Anna Nagar', 'Bangalore - Indiranagar', 'Coimbatore'
  location: string;
  languages: string[]; // e.g. ['Tamil', 'English']
  skills: string[]; // e.g. ['Superbikes', 'High-Value', 'Fast-Closer']
  activeLeadsCount: number;
  pendingTasksCount: number;
  maxLeadCapacity: number;
  performanceRating: number; // 1 to 5
  conversionRate: number; // percentage
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  city: string;
  preferredLanguage: string;
  totalLeadsCount: number;
  totalPurchasedCount: number;
  lifetimeValue: number;
  createdAt: string;
}

export interface DocumentChecklistItem {
  name: 'RC' | 'INSURANCE' | 'PUC' | 'OWNER_ID' | 'LOAN_NOC';
  label: string;
  status: 'MISSING' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  fileUrl?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface PhotoChecklistItem {
  angle:
    | 'FRONT'
    | 'REAR'
    | 'LEFT'
    | 'RIGHT'
    | 'ODOMETER'
    | 'ENGINE'
    | 'TYRES'
    | 'RC_PHOTO';
  label: string;
  status: 'MISSING' | 'UPLOADED' | 'BLURRED' | 'DEFECT_DETECTED' | 'VERIFIED';
  fileUrl?: string;
  defectNote?: string;
}

export interface Vehicle {
  id: string;
  leadId: string;
  brand: string; // e.g., 'Honda', 'Royal Enfield', 'Yamaha', 'TVS'
  model: string; // e.g., 'Activa 6G', 'Classic 350', 'MT-15'
  variant?: string; // e.g., 'Disc DLX'
  year: number;
  registrationNumber?: string;
  registrationYear?: number;
  kmRidden: number;
  fuelType: 'PETROL' | 'ELECTRIC';
  ownerCount: number; // 1, 2, 3+
  insuranceValidUntil?: string;
  pucValidUntil?: string;
  loanStatus: 'NONE' | 'ACTIVE_LOAN' | 'NOC_AVAILABLE';
  serviceHistory: 'COMPLETE_SHOWROOM' | 'LOCAL_GARAGE' | 'PARTIAL' | 'UNKNOWN';
  accidentHistory: 'NONE' | 'MINOR_SCRATCHES' | 'ACCIDENTAL' | 'UNKNOWN';
  customerExpectedPrice: number;
  documents: DocumentChecklistItem[];
  photos: PhotoChecklistItem[];
}

export interface Valuation {
  id: string;
  vehicleId: string;
  baselineMarketValue: number;
  recommendedBuyMin: number;
  recommendedBuyMax: number;
  maxApprovedPrice: number;
  expectedResalePrice: number;
  expectedGrossMargin: number;
  confidenceScore: number; // 0 - 100
  reasoning: string[];
  calculatedAt: string;
}

export interface Quote {
  id: string;
  leadId: string;
  initialOfferedPrice: number;
  currentOfferedPrice: number;
  customerCounterPrice?: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  version: number;
  approvedByEmployeeId?: string;
  sentAt?: string;
  respondedAt?: string;
}

export interface InspectionChecklistItem {
  category:
    | 'ENGINE'
    | 'TRANSMISSION'
    | 'BRAKES'
    | 'TYRES'
    | 'BATTERY'
    | 'SUSPENSION'
    | 'ELECTRICAL'
    | 'CHASSIS_FRAME'
    | 'ODOMETER_TAMPERING'
    | 'ROAD_TEST';
  label: string;
  status: 'PASS' | 'MINOR_DEFECT' | 'MAJOR_DEFECT' | 'REPLACE_REQUIRED';
  notes?: string;
  repairEstimatedCost: number;
  photos?: string[];
}

export interface Inspection {
  id: string;
  leadId: string;
  vehicleId: string;
  inspectorId?: string;
  inspectorName?: string;
  scheduledAt: string;
  locationAddress: string;
  status:
    | 'PENDING_SCHEDULE'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'RESCHEDULED'
    | 'CANCELLED';
  checklist: InspectionChecklistItem[];
  totalRepairDeduction: number;
  finalRecommendedBuyPrice?: number;
  outcome?: 'BUY' | 'BUY_WITH_PRICE_REVISION' | 'REJECT' | 'MANAGER_REVIEW';
  completedAt?: string;
  inspectorNotes?: string;
}

export interface Lead {
  id: string;
  customerId: string;
  customer: Customer;
  vehicle: Vehicle;
  valuation?: Valuation;
  quote?: Quote;
  inspection?: Inspection;
  currentStage: PipelineStage;
  previousStage?: PipelineStage;
  parkQueue?: ParkQueue;
  parkReason?: ParkReason;
  parkedAt?: string;
  reactivationDate?: string;
  reactivationCount?: number;
  lostReason?: LostReason;
  source: ChannelSource;
  campaignId?: string;
  adId?: string;
  landingPage?: string;
  assignedEmployeeId?: string;
  assignedEmployee?: Employee;
  qualificationStatus: QualificationStatus;
  leadScore: number; // 0 - 100
  leadTemperature: LeadTemperature;
  slaDueDate?: string;
  isSlaBreached: boolean;
  conversionProbability: number; // 0 - 100%
  lastCustomerMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  leadId: string;
  assignedToEmployeeId: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  createdAt: string;
  type: 'FOLLOW_UP' | 'CALL' | 'INSPECTION' | 'APPROVAL' | 'DOC_COLLECTION';
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'CUSTOMER' | 'AI_AGENT' | 'EMPLOYEE' | 'SYSTEM';
  agentName?: string;
  employeeName?: string;
  content: string;
  mediaUrl?: string;
  quickReplies?: string[];
  suggestedActions?: { label: string; action: string; payload?: any }[];
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

export interface AIAuditLog {
  id: string;
  leadId: string;
  agentName: string;
  action: string;
  inputContext: string;
  decision: string;
  toolUsed?: string;
  result: string;
  confidenceScore: number;
  approvalRequired: boolean;
  approvedBy?: string;
  timestamp: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: ChannelSource;
  targetSegment: string;
  targetCount: number;
  sentCount: number;
  responseCount: number;
  qualifiedCount: number;
  purchasesCount: number;
  totalSpend: number;
  netGrossProfit: number;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED';
  createdAt: string;
}
