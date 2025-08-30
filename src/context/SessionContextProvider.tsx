"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@/integrations/supabase/client";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  supabase: ReturnType<typeof createClient>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      console.log("[SessionContextProvider] Attempting to get session...");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("[SessionContextProvider] Error getting session:", error.message);
      }
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
      console.log(`[SessionContextProvider] Initial session loaded. User: ${session?.user?.id || 'null'}, Session: ${session ? 'present' : 'null'}`);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log(`[SessionContextProvider] Auth state changed: ${event}. User: ${session?.user?.id || 'null'}, Session: ${session ? 'present' : 'null'}`);
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading, supabase }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};