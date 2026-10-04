export type ContractType = 'NDA' | 'MSA';
export type DetectedType = ContractType | 'OTHER';
export type ContractStatus = 'uploaded' | 'processing' | 'completed' | 'error';
export type ChatRole = 'user' | 'assistant';
export type FeedbackRating = 'up' | 'down';

export interface ContractSummary {
  id: string;
  name: string;
  contract_type: ContractType;
  status: ContractStatus;
  created_at: string;
  page_count: number;
}

export interface KeyTerm {
  id: string;
  term_name: string;
  /** edited_value when present, otherwise original_value */
  value: string;
  original_value: string;
  is_edited: boolean;
  /** 1-indexed; null when the term was not found */
  page_number: number | null;
  /** 0..1 */
  confidence_score: number;
  source_sentence: string | null;
  is_custom: boolean;
  sort_order: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  cited_pages: number[];
  created_at: string;
}

export interface ContractPage {
  n: number;
  text: string;
}

export interface CustomTerm {
  id: string;
  term_name: string;
}

export interface FeedbackRecord {
  rating: FeedbackRating;
  comment: string | null;
}
