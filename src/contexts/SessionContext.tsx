import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types'; // Import the Profile type

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // Add profile to the context
  isLoading: boolean;
  impersonatingAsProfile: Profile | null; // New: Profile of the user being impersonated
  startImpersonation: (userId: string) => Promise<void>; // New: Function to start impersonation
  stopImpersonation: () => void; // New: Function to stop impersonation
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  user: null,
  profile: null, // Default profile to null
  isLoading: true,
  impersonatingAsProfile: null, // Default impersonated profile to null
  startImpersonation: async () => {}, // Dummy function
  stopImpersonation: () => {}, // Dummy function
});

export const useSession = () => useContext(SessionContext);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // State for actual user's profile
  const [impersonatingAsProfile, setImpersonatingAsProfile] = useState<Profile | null>(null); // State for impersonated user's profile
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // Ignore "No rows found" error
      console.error("Error fetching profile:", profileError);
      return null;
    }
    return profileData as Profile | null;
  };

  const startImpersonation = async (userId: string) => {
    if (user?.id === userId) {
      // Cannot impersonate self
      setImpersonatingAsProfile(null);
      localStorage.removeItem('impersonatedUserId');
      return;
    }
    localStorage.setItem('impersonatedUserId', userId);
    const impersonated = await fetchProfile(userId);
    setImpersonatingAsProfile(impersonated);
  };

  const stopImpersonation = () => {
    localStorage.removeItem('impersonatedUserId');
    setImpersonatingAsProfile(null);
    window.location.reload(); // Reload to ensure full state reset
  };

  useEffect(() => {
    const setData = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      let actualProfile: Profile | null = null;
      if (currentSession?.user) {
        actualProfile = await fetchProfile(currentSession.user.id);
        setProfile(actualProfile);
      } else {
        setProfile(null);
      }

      // Check for impersonation if the actual user is an admin
      if (actualProfile?.role === 'super_admin') {
        const storedImpersonatedUserId = localStorage.getItem('impersonatedUserId');
        if (storedImpersonatedUserId) {
          const impersonated = await fetchProfile(storedImpersonatedUserId);
          setImpersonatingAsProfile(impersonated);
        }
      } else {
        // If not super_admin, ensure no impersonation is active
        localStorage.removeItem('impersonatedUserId');
        setImpersonatingAsProfile(null);
      }
      setIsLoading(false);
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      let actualProfile: Profile | null = null;
      if (currentSession?.user) {
        actualProfile = await fetchProfile(currentSession.user.id);
        setProfile(actualProfile);
      } else {
        setProfile(null);
      }

      // Re-check impersonation on auth state change
      if (actualProfile?.role === 'super_admin') {
        const storedImpersonatedUserId = localStorage.getItem('impersonatedUserId');
        if (storedImpersonatedUserId) {
          const impersonated = await fetchProfile(storedImpersonatedUserId);
          setImpersonatingAsProfile(impersonated);
        }
      } else {
        localStorage.removeItem('impersonatedUserId');
        setImpersonatingAsProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]); // Re-run effect if actual user ID changes

  const value = {
    session,
    user,
    profile,
    isLoading,
    impersonatingAsProfile,
    startImpersonation,
    stopImpersonation,
  };

  return <SessionContext.Provider value={value}>{!isLoading && children}</SessionContext.Provider>;
};