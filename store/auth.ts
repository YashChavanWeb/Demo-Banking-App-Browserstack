// Auth store — persists token + user info across sessions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

let _role: 'user' | 'admin' = 'user';
let _flow: 'login' | 'signup' = 'login';
let _token: string | null = null;
let _user: { id: string; fullName: string; email: string; role: string; kycStatus: string } | null = null;
let _email: string = ''; // temp storage during OTP flow

export const AuthStore = {
  // Role / flow (kept for backward compat)
  setRole: (role: 'user' | 'admin') => { _role = role; },
  getRole: () => _role,
  setFlow: (flow: 'login' | 'signup') => { _flow = flow; },
  getFlow: () => _flow,

  // Email (used during OTP verification)
  setEmail: (email: string) => { _email = email; },
  getEmail: () => _email,

  // Token
  setToken: async (token: string) => {
    _token = token;
    api.setMemToken(token); // sync to API client immediately
    await AsyncStorage.setItem('auth_token', token);
  },
  getToken: () => _token,
  loadToken: async () => {
    _token = await AsyncStorage.getItem('auth_token');
    return _token;
  },
  clearToken: async () => {
    _token = null;
    await AsyncStorage.removeItem('auth_token');
  },

  // User
  setUser: (user: typeof _user) => { _user = user; if (user) _role = user.role as any; },
  getUser: () => _user,
  clearUser: () => { _user = null; },

  // Full logout
  logout: async () => {
    _token = null;
    _user = null;
    _role = 'user';
    await api.clearToken();
    await AsyncStorage.removeItem('auth_token');
  },
};