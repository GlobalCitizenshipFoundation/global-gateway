// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, htmlBody, cc, bcc, campaignId } = await req.json();

    if (!to || !subject || !htmlBody) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, htmlBody' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Supabase client for the Edge Function with the service role key
    // This allows the function to insert into email_logs table without RLS issues
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user's ID from the JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.split(' ')[1]);

    if (authError || !user) {
      console.error('Authentication error in send-email:', authError?.message);
      return new Response(JSON.stringify({ error: 'Authentication failed.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'mailgun'; // Default to mailgun

    if (emailProvider === 'mailgun') {
      const MAILGUN_API_KEY = Deno.env.get('MAILGUN_API_KEY');
      const MAILGUN_DOMAIN = Deno.env.get('MAILGUN_DOMAIN');
      const MAIL_FROM_ADDRESS = Deno.env.get('MAIL_FROM_ADDRESS') || `noreply@${MAILGUN_DOMAIN}`;

      if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
        console.error('Mailgun API key or domain not set in environment variables.');
        return new Response(JSON.stringify({ error: 'Server configuration error: Mailgun credentials missing.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
      const authHeader = `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`;

      const formData = new URLSearchParams();
      formData.append('from', MAIL_FROM_ADDRESS);
      formData.append('to', Array.isArray(to) ? to.join(',') : to);
      formData.append('subject', subject);
      formData.append('html', htmlBody);
      if (cc && cc.length > 0) formData.append('cc', cc.join(','));
      if (bcc && bcc.length > 0) formData.append('bcc', bcc.join(','));

      const mailgunResponse = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Mailgun API error:', mailgunResponse.status, errorText);
        // Log failed attempt
        await supabaseAdmin.from('email_logs').insert({
          recipient: Array.isArray(to) ? to.join(',') : to,
          sender: MAIL_FROM_ADDRESS,
          subject: subject,
          body_html: htmlBody,
          status: 'failed',
          direction: 'outbound',
          mailgun_message_id: null,
          user_id: user.id,
          campaign_id: campaignId || null,
        });
        return new Response(JSON.stringify({ error: `Failed to send email: ${errorText}` }), {
          status: mailgunResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await mailgunResponse.json();
      console.log('Email sent successfully via Mailgun:', result);

      // Log successful outbound email
      await supabaseAdmin.from('email_logs').insert({
        recipient: Array.isArray(to) ? to.join(',') : to,
        sender: MAIL_FROM_ADDRESS,
        subject: subject,
        body_html: htmlBody,
        status: 'sent',
        direction: 'outbound',
        mailgun_message_id: result.id || null,
        user_id: user.id,
        campaign_id: campaignId || null,
      });

      return new Response(JSON.stringify({ message: 'Email sent successfully', data: result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: `Unsupported email provider: ${emailProvider}` }), {
        status: 501, // Not Implemented
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) { // Explicitly type error as unknown
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { // Cast to Error
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});