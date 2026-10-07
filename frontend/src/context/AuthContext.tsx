import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
interface AuthValue { user: User | null; loading: boolean; activeView: 'coordinator' | 'panelist' | 'student'; setActiveView: (view: 'coordinator' | 'panelist' | 'student') => void; setUser: (user: User | null) => void; refresh: () => Promise<void>; }
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'coordinator' | 'panelist' | 'student'>('student');
  const [loading, setLoading] = useState(true);
  const saveUser = (nextUser: User | null) => { setUser(nextUser); setActiveView(nextUser?.roles?.includes('coordinator') ? 'coordinator' : nextUser?.type === 'faculty' ? 'panelist' : 'student'); };
  const refresh = async () => { try { const response = await api.get('/auth/me'); saveUser(response.data.user); } catch { saveUser(null); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { const expired = () => saveUser(null); window.addEventListener('auth-expired', expired); return () => window.removeEventListener('auth-expired', expired); }, []);
  return <AuthContext.Provider value={{ user, loading, activeView, setActiveView, setUser: saveUser, refresh }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing'); return value; };
