import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { AppCustomCodeSettings } from "@/types";
import { CustomCodeSettingsForm } from "@/components/admin/CustomCodeSettingsForm";

const CUSTOM_CODE_SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Must match the ID in CustomCodeInjector

const CustomCodeManagementPage = () => {
  const [settings, setSettings] = useState<AppCustomCodeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('app_custom_code_settings')
        .select('*')
        .eq('id', CUSTOM_CODE_SETTINGS_ID)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        setError(fetchError.message);
        showError("Failed to load custom code settings.");
      } else if (data) {
        setSettings(data as AppCustomCodeSettings);
      } else {
        // If no row exists, we'll create a default one
        const { data: newRow, error: insertError } = await supabase
          .from('app_custom_code_settings')
          .insert({
            id: CUSTOM_CODE_SETTINGS_ID,
            head_enabled: false,
            body_end_enabled: false,
          })
          .select('*')
          .single();
        
        if (insertError) {
          setError(insertError.message);
          showError("Failed to initialize custom code settings.");
        } else {
          setSettings(newRow as AppCustomCodeSettings);
        }
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Global Custom Code Settings</CardTitle>
          <CardDescription>
            Manage HTML, CSS, and JavaScript snippets to be injected globally into your application.
            Use with extreme caution, as incorrect code can break your site or introduce security vulnerabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings && <CustomCodeSettingsForm initialData={settings} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomCodeManagementPage;