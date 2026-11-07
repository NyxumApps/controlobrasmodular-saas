import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { signOut as signOutWithBetterAuth, useSession } from "@workspace/auth/client";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, onUserChange }: { children: ReactNode; onUserChange?: () => void }) {
  const { data, isPending } = useSession();
  const previousUserId = useRef<string | null | undefined>(undefined);
  const user = data?.user
    ? { id: data.user.id, email: data.user.email, name: data.user.name }
    : null;

  useEffect(() => {
    const nextUserId = user?.id ?? null;
    if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) onUserChange?.();
    previousUserId.current = nextUserId;
  }, [user?.id, onUserChange]);

  const value: AuthContextType = {
    user,
    loading: isPending,
    signOut: async () => {
      await signOutWithBetterAuth();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function Show({ when, children }: { when: "signed-in" | "signed-out"; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (when === "signed-in") === Boolean(user) ? <>{children}</> : null;
}
