// Simple in-memory auth store (no external deps needed)
let _role: 'user' | 'admin' = 'user';
let _flow: 'login' | 'signup' = 'login';

export const AuthStore = {
  setRole: (role: 'user' | 'admin') => { _role = role; },
  getRole: () => _role,
  setFlow: (flow: 'login' | 'signup') => { _flow = flow; },
  getFlow: () => _flow,
};