import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import React from 'react'; // Explicit React import

const LoginPage = () => {
  const { session } = useSession();
  const { theme } = useTheme();

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container flex items-center justify-center py-12">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login / Sign Up</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme={theme === 'dark' ? 'dark' : 'light'}
            view="sign_in"
            showLinks={true}
            redirectTo={`${window.location.origin}/`}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;