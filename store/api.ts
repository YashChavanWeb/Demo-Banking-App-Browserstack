// Central API client — all backend calls go through here
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = __DEV__
  ? 'http://192.168.0.109:3000'
  : 'http://192.168.0.109:3000';

// In-memory token cache — avoids async AsyncStorage reads on every request
let _memToken: string | null = null;

async function getToken(): Promise<string | null> {
  // Use in-memory token first (set synchronously on login/signup)
  if (_memToken) return _memToken;
  try {
    const stored = await AsyncStorage.getItem('auth_token');
    if (stored) _memToken = stored;
    return stored;
  } catch { return null; }
}

async function request<T>(
  method: string,
  path: string,
  body?: object,
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // Auth
  signup: (fullName: string, email: string, password: string) =>
    request<{ token: string; user: any }>('POST', '/auth/signup', { fullName, email, password }, false),

  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('POST', '/auth/login', { email, password }, false),

  sendOtp: (email: string) =>
    request<{ otp: string; message: string }>('POST', '/auth/send-otp', { email }, false),

  verifyOtp: (email: string, code: string) =>
    request<{ verified: boolean }>('POST', '/auth/verify-otp', { email, code }, false),

  // Account
  getProfile: () => request<any>('GET', '/account/profile'),
  getBalance: () => request<{ balance: number; savings: number; checking: number; currency: string }>('GET', '/account/balance'),
  markKyc: () => request<any>('PATCH', '/account/kyc'),

  // Transactions
  getTransactions: () => request<{ transactions: any[] }>('GET', '/transactions'),
  transfer: (recipientName: string, amount: number, note?: string, recipientId?: string) =>
    request<{ transaction: any; newBalance: number }>('POST', '/transactions/transfer', { recipientName, amount, note, recipientId }),
  recordPayment: (amount: number, description?: string) =>
    request<{ transaction: any; newBalance: number }>('POST', '/transactions/payment', { amount, description }),

  // Users (for transfer recipient list)
  getUsers: () => request<{ users: any[] }>('GET', '/users'),

  // Cards
  getCards: () => request<{ cards: any[] }>('GET', '/cards'),
  createCard: (card: { label: string; number: string; holder: string; expiry: string; color: string; cardType: string }) =>
    request<{ card: any }>('POST', '/cards', card),
  updateCard: (id: string, updates: { frozen?: boolean; label?: string; color?: string }) =>
    request<{ card: any }>('PATCH', `/cards/${id}`, updates),
  deleteCard: (id: string) => request<{ deleted: boolean }>('DELETE', `/cards/${id}`),

  // Token management
  saveToken: async (token: string) => {
    _memToken = token; // set in-memory immediately
    return AsyncStorage.setItem('auth_token', token);
  },
  clearToken: async () => {
    _memToken = null;
    return AsyncStorage.removeItem('auth_token');
  },
  setMemToken: (token: string) => { _memToken = token; },
  getToken,
};