import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True after following a password recovery link, until a new password is saved. */
  recovering: boolean;
  finishRecovery: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, onUserChange }: { children: ReactNode; onUserChange?: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let previousUserId: string | null | undefined;
    const apply = (next: Session | null) => {
      const id = next?.user.id ?? null;
      if (previousUserId !== undefined && previousUserId !== id) onUserChange?.();
      previousUserId = id;
      setSession(next);
      setLoading(false);
    };
    void supabase.auth.getSession().then(({ data }) => apply(data.session)).catch(() => apply(null));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      apply(next);
    });
    return () => data.subscription.unsubscribe();
  }, [onUserChange]);

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    loading,
    recovering,
    finishRecovery: () => setRecovering(false),
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

/** Renders children only for the matching session state, and nothing while it is still unknown. */
export function Show({ when, children }: { when: 'signed-in' | 'signed-out'; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (when === 'signed-in') === Boolean(user) ? <>{children}</> : null;
}
