import type {
  ContractPage,
  ContractSummary,
  ContractStatus,
  ContractType,
  CustomTerm,
  DetectedType,
  FeedbackRecord,
  KeyTerm,
} from './domain';

/** Payload of GET /api/contracts/[id]: everything the results page needs. */
export interface ContractDetail {
  contract: {
    id: string;
    name: string;
    contract_type: ContractType;
    detected_type: DetectedType | null;
    status: ContractStatus;
    error_code: string | null;
    page_count: number;
    has_pdf: boolean;
    created_at: string;
  };
  pages: ContractPage[];
  terms: KeyTerm[];
  custom_terms: CustomTerm[];
  feedback: FeedbackRecord | null;
  chat_session_id: string | null;
}

/** Payload of GET /api/dashboard/summary. */
export interface DashboardSummary {
  /** Completed reviews. */
  total: number;
  by_type: { NDA: number; MSA: number };
  /** The 5 newest contracts in any state. */
  recent: ContractSummary[];
}

/** One page of GET /api/contracts. */
export interface ContractPageResult {
  items: ContractSummary[];
  next_cursor: string | null;
}
