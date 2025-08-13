import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, htmlBody } = await req.json();

    if (!to || !subject || !htmlBody) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, htmlBody' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retrieve Mailgun API key and domain from Supabase secrets
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
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', htmlBody);

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
      return new Response(JSON.stringify({ error: `Failed to send email: ${errorText}` }), {
        status: mailgunResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await mailgunResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify({ message: 'Email sent successfully', data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});