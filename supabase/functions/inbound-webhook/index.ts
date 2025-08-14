// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verifyWebhookSignature } from 'https://esm.sh/@mailgun/webhook-validation@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAILGUN_WEBHOOK_SIGNING_KEY = Deno.env.get('MAILGUN_WEBHOOK_SIGNING_KEY');

    if (!MAILGUN_WEBHOOK_SIGNING_KEY) {
      console.error('Mailgun Webhook Signing Key not set in environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Mailgun webhook key missing.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const signature = JSON.parse(formData.get('signature') as string);
    const token = signature.token;
    const timestamp = signature.timestamp;
    const hmac = signature.signature;

    // Verify Mailgun webhook signature
    const isSignatureValid = verifyWebhookSignature(MAILGUN_WEBHOOK_SIGNING_KEY, token, timestamp, hmac);

    if (!isSignatureValid) {
      console.warn('Mailgun webhook signature verification failed.');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sender = formData.get('sender') as string;
    const recipient = formData.get('recipient') as string;
    const subject = formData.get('subject') as string;
    const bodyHtml = formData.get('body-html') as string;
    const messageId = formData.get('Message-Id') as string;

    // Create a Supabase client for the Edge Function with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Attempt to find a user associated with the recipient email for logging
    // This is a basic mapping. More complex logic (e.g., parsing reply-to addresses)
    // would be needed for specific campaign tracking.
    let userId: string | null = null;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', recipient)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching profile for inbound email recipient:', profileError);
    } else if (profileData) {
      userId = profileData.id;
    }

    // Log the inbound email
    const { error: logError } = await supabaseAdmin.from('email_logs').insert({
      recipient: recipient,
      sender: sender,
      subject: subject,
      body_html: bodyHtml,
      status: 'received',
      direction: 'inbound',
      mailgun_message_id: messageId,
      user_id: userId, // Associate with user if found
      campaign_id: null, // No campaign ID from inbound webhook by default
    });

    if (logError) {
      console.error('Failed to log inbound email:', logError);
      return new Response(JSON.stringify({ error: 'Failed to log email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Inbound email processed successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Inbound Webhook Edge Function error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});