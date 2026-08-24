// ─────────────────────────────────────────────────────────────────────────────
// Shared domain types — used across store/, components/, app/, and server types
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';
export type AuthFlow = 'login' | 'signup';
export type KycStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatus;
}

export interface FlowConfig {
  biometric: boolean;
  fileUpload: boolean;
  cameraInjection: boolean;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export type TxType = 'debit' | 'credit';

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number; // positive = credit, negative = debit
  type: TxType;
  icon: string;
  note?: string;
  referenceId: string;
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover';

export interface Card {
  id: string;
  label: string;
  number: string;
  holder: string;
  expiry: string;
  color: string;
  cardType: CardType;
  frozen?: boolean;
}

// ── Account / Balance ─────────────────────────────────────────────────────────

export interface AccountBalance {
  balance: number;
  savings: number;
  checking: number;
  currency: string;
}

// ── Orders / Shop ─────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  description?: string;
  createdAt: string;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  userId: string;
  fullName: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: string;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TransferResponse {
  transaction: Transaction;
  newBalance: number;
}

export interface ProfileResponse extends User {
  memberSince: string;
  account: { id: string; balance: number; currency: string } | null;
}
