// Banking store — syncs with backend, starts empty until API loads
import { api } from './api';

export type TxType = 'debit' | 'credit';

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;       // positive = credit, negative = debit
  type: TxType;
  icon: string;
  note?: string;
  referenceId: string;
}

// Start with null to indicate "not loaded yet"
let _balance: number | null = null;
let _transactions: Transaction[] = [];
let _listeners: (() => void)[] = [];
let _syncing = false;
let _synced = false;

function notify() { _listeners.forEach(fn => fn()); }

export const BankStore = {
  getBalance: () => _balance ?? 0,
  getSavings: () => Math.round((_balance ?? 0) * 0.73 * 100) / 100,
  getChecking: () => Math.round((_balance ?? 0) * 0.27 * 100) / 100,
  getTransactions: () => _transactions,
  isLoading: () => !_synced,

  canAfford: (amount: number) => (_balance ?? 0) >= amount,

  // Load real data from backend
  sync: async () => {
    if (_syncing) return;
    _syncing = true;
    try {
      const [balRes, txRes] = await Promise.all([
        api.getBalance(),
        api.getTransactions(),
      ]);
      _balance = balRes.balance;
      _transactions = txRes.transactions;
      _synced = true;
      notify();
    } catch { /* stay empty until next sync */ }
    _syncing = false;
  },

  isSynced: () => _synced,

  addTransaction: (tx: Omit<Transaction, 'id' | 'referenceId'>): Transaction => {
    const id = `t${Date.now()}`;
    const referenceId = `TXN${Date.now().toString().slice(-8)}`;
    const newTx: Transaction = { ...tx, id, referenceId };
    _transactions = [newTx, ..._transactions];
    _balance = Math.round(((_balance ?? 0) + tx.amount) * 100) / 100;
    notify();
    return newTx;
  },

  // Transfer via API (updates DB + local state)
  transfer: async (recipientName: string, amount: number, note?: string): Promise<Transaction> => {
    try {
      const res = await api.transfer(recipientName, amount, note);
      _balance = res.newBalance;
      const tx = res.transaction;
      _transactions = [tx, ..._transactions];
      notify();
      return tx;
    } catch {
      // Fallback to local
      return BankStore.addTransaction({
        merchant: recipientName,
        category: 'Transfer',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: -amount,
        type: 'debit',
        icon: 'swap-horizontal-outline',
        note,
      });
    }
  },

  // Record payment via API
  recordPayment: async (amount: number, description?: string): Promise<Transaction> => {
    try {
      const res = await api.recordPayment(amount, description);
      _balance = res.newBalance;
      const tx = res.transaction;
      _transactions = [tx, ..._transactions];
      notify();
      return tx;
    } catch {
      return BankStore.addTransaction({
        merchant: description || 'Card Payment',
        category: 'Payment',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: -amount,
        type: 'debit',
        icon: 'card-outline',
        note: description,
      });
    }
  },

  subscribe: (fn: () => void) => {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },
};