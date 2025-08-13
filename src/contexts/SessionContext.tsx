import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types'; // Import the Profile type

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // Add profile to the context
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  user: null,
  profile: null, // Default profile to null
  isLoading: true,
});

export const useSession = () => useContext(SessionContext);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // State for profile
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setIsLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // Ignore "No rows found" error
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(profileData as Profile | null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile on auth change:", profileError);
        } else {
          setProfile(profileData as Profile | null);
        }
      } else {
        setProfile(null);
      }
      // No need to set loading here as it's for the initial load
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    profile,
    isLoading,
  };

  return <SessionContext.Provider value={value}>{!isLoading && children}</SessionContext.Provider>;
};