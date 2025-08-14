import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { AppCustomCodeSettings } from '@/types';

const CUSTOM_CODE_SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // A fixed UUID for the single settings row

const CustomCodeInjector = () => {
  useEffect(() => {
    const injectCode = async () => {
      try {
        // Fetch the single row of custom code settings
        const { data, error } = await supabase
          .from('app_custom_code_settings')
          .select('*')
          .eq('id', CUSTOM_CODE_SETTINGS_ID)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching custom code settings:', error);
          return;
        }

        const settings: AppCustomCodeSettings | null = data;

        if (!settings) {
          console.warn('No custom code settings found in database. Initializing a default row.');
          // If no settings exist, create a default row. This should ideally be done once.
          // This insert will be restricted by RLS to super_admin, so it might fail for other roles.
          await supabase.from('app_custom_code_settings').insert({
            id: CUSTOM_CODE_SETTINGS_ID,
            head_enabled: false,
            body_end_enabled: false,
          });
          return; // Re-fetch on next load or handle immediately if needed
        }

        // --- Inject into <head> ---
        if (settings.head_enabled) {
          // HTML
          if (settings.head_html_content) {
            const sanitizedHtml = DOMPurify.sanitize(settings.head_html_content);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitizedHtml;
            while (tempDiv.firstChild) {
              document.head.appendChild(tempDiv.firstChild);
            }
          }

          // CSS
          if (settings.head_css_content) {
            const styleElement = document.createElement('style');
            // Sanitize CSS within a style tag context
            styleElement.textContent = DOMPurify.sanitize(settings.head_css_content, { USE_PROFILES: { html: true } });
            document.head.appendChild(styleElement);
          }

          // JavaScript (HIGH RISK - see warnings below)
          if (settings.head_js_content) {
            const scriptElement = document.createElement('script');
            // WARNING: DOMPurify is NOT a JavaScript sanitizer for execution.
            // Directly injecting raw JS from a text area is inherently dangerous.
            // For maximum security, consider using a strict Content Security Policy (CSP)
            // with 'nonce' attributes for inline scripts, or only allowing external JS files.
            scriptElement.textContent = settings.head_js_content;
            document.head.appendChild(scriptElement);
          }
        }

        // --- Inject before </body> ---
        if (settings.body_end_enabled) {
          // HTML
          if (settings.body_end_html_content) {
            const sanitizedHtml = DOMPurify.sanitize(settings.body_end_html_content);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitizedHtml;
            while (tempDiv.firstChild) {
              document.body.appendChild(tempDiv.firstChild);
            }
          }

          // CSS
          if (settings.body_end_css_content) {
            const styleElement = document.createElement('style');
            styleElement.textContent = DOMPurify.sanitize(settings.body_end_css_content, { USE_PROFILES: { html: true } });
            document.body.appendChild(styleElement);
          }

          // JavaScript (HIGH RISK - see warnings below)
          if (settings.body_end_js_content) {
            const scriptElement = document.createElement('script');
            scriptElement.textContent = settings.body_end_js_content;
            document.body.appendChild(scriptElement);
          }
        }

      } catch (err) {
        console.error('Failed to inject custom code:', err);
      }
    };

    injectCode();
  }, []); // Run once on mount

  return null; // This component doesn't render any UI
};

export default CustomCodeInjector;