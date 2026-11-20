import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { verifyAdminRole } from "../services/adminService";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSessionAndRole = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser && !currentUser.is_anonymous && currentUser.email) {
        try {
          const verified = await verifyAdminRole();
          setIsAdmin(Boolean(verified.is_admin));
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSessionAndRole();
    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkSessionAndRole();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [checkSessionAndRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        refreshAuth: checkSessionAndRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
