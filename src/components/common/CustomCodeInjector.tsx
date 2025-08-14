import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { AppCustomCodeSettings } from '@/types';

const CUSTOM_CODE_SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const CustomCodeInjector = () => {
  useEffect(() => {
    const injectCode = async () => {
      try {
        const { data, error } = await supabase
          .from('app_custom_code_settings')
          .select('*')
          .eq('id', CUSTOM_CODE_SETTINGS_ID)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching custom code settings:', error);
          return;
        }

        const settings: AppCustomCodeSettings | null = data;

        if (!settings) {
          console.warn('No custom code settings found in database. Initializing a default row.');
          await supabase.from('app_custom_code_settings').insert({
            id: CUSTOM_CODE_SETTINGS_ID,
            head_enabled: false,
            body_end_enabled: false,
          });
          return;
        }

        // --- IMPORTANT DOMPurify Configuration for Mixed Content Injection ---
        // By default, DOMPurify strips <script> and <style> tags to prevent XSS.
        // To allow free-form HTML/CSS/JS injection, we must explicitly allow these tags.
        // This means the responsibility for the safety of the injected code shifts entirely
        // to the Super Admin.
        const DOMPurifyConfig = {
          USE_PROFILES: { html: true }, // Basic HTML profile
          ADD_TAGS: ['script', 'style'], // CRITICAL: Allow <script> and <style> tags
          ADD_ATTR: ['type', 'src', 'charset', 'async', 'defer'], // Allow common attributes for scripts
          // You might need to add more attributes depending on what your users inject (e.g., for iframes, custom data attributes)
        };

        // --- Inject into <head> ---
        if (settings.head_enabled && settings.head_html_content) {
          const sanitizedContent = DOMPurify.sanitize(settings.head_html_content, DOMPurifyConfig);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedContent;
          while (tempDiv.firstChild) {
            document.head.appendChild(tempDiv.firstChild);
          }
        }

        // --- Inject before </body> ---
        if (settings.body_end_enabled && settings.body_end_html_content) {
          const sanitizedContent = DOMPurify.sanitize(settings.body_end_html_content, DOMPurifyConfig);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedContent;
          while (tempDiv.firstChild) {
            document.body.appendChild(tempDiv.firstChild);
          }
        }

      } catch (err) {
        console.error('Failed to inject custom code:', err);
      }
    };

    injectCode();
  }, []);

  return null;
};

export default CustomCodeInjector;