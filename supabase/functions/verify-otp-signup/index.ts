import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, code, fullName, email, password } = await req.json();
    if (!phone || !code || !fullName || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const serviceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')!;

    // Verify OTP with Twilio
    const verifyRes = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Code: code }).toString(),
      }
    );

    const verifyData = await verifyRes.json();
    if (verifyData.status !== 'approved') {
      return new Response(
        JSON.stringify({ success: false, error: 'invalid_code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const normalizedEmail = email.trim().toLowerCase();

    // Create auth user (email confirmed, no email OTP needed)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      const msg = createError.message?.toLowerCase() || '';
      const errorKey = msg.includes('already') || msg.includes('exist') ? 'email_exists' : createError.message;
      return new Response(
        JSON.stringify({ success: false, error: errorKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const uid = userData.user.id;
    const adminEmails = (Deno.env.get('ADMIN_EMAILS') || '').split(',').map(e => e.trim());
    const role = adminEmails.includes(normalizedEmail) ? 'admin' : 'passenger';

    await supabaseAdmin.from('profiles').upsert({
      id: uid,
      email: normalizedEmail,
      full_name: fullName,
      phone,
      role,
    });

    // Sign in and return session so the frontend can call setSession()
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ success: false, error: signInError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, session: signInData.session }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
