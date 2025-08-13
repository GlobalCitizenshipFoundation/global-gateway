import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types'; // Import the Profile type

interface SessionContextValue {
  session: Session | null;
  user: User | null; // Actual logged-in user
  profile: Profile | null; // Actual logged-in user's profile
  isLoading: boolean;
  impersonatingAsProfile: Profile | null; // Profile of the user being impersonated
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  impersonatingAsProfile: null,
  startImpersonation: async () => {},
  stopImpersonation: () => {},
});

export const useSession = () => useContext(SessionContext);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [impersonatingAsProfile, setImpersonatingAsProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*') // Select all columns, including the new 'email'
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
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
    window.location.reload(); // Reload to apply impersonation context
  };

  const stopImpersonation = () => {
    localStorage.removeItem('impersonatedUserId');
    window.location.reload(); // Reload to clear impersonation context
  };

  useEffect(() => {
    const setData = async () => {
      setIsLoading(true);
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setImpersonatingAsProfile(null);
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

      // Handle impersonation logic
      if (actualProfile?.role === 'super_admin') {
        const storedImpersonatedUserId = localStorage.getItem('impersonatedUserId');
        if (storedImpersonatedUserId && storedImpersonatedUserId !== currentSession?.user?.id) {
          const impersonated = await fetchProfile(storedImpersonatedUserId);
          setImpersonatingAsProfile(impersonated);
        } else {
          setImpersonatingAsProfile(null);
          localStorage.removeItem('impersonatedUserId'); // Clear if impersonating self or invalid
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
      // This callback fires on auth state changes, so re-run setData to ensure consistency
      setData();
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

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