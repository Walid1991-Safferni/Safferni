// Paste this entire file into the Cloudflare Worker editor (replace all default code)
// Worker URL: safferni.m-walid-alokhwan.workers.dev
//
// After deploying, go to Settings → Variables and add:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_VERIFY_SERVICE_SID
//   SUPABASE_URL          → https://httsiptnvtchtqvabkyp.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  → from Supabase Dashboard → Settings → API
//   ADMIN_EMAILS          → admin@safferni.com,hennawi001@gmail.com

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
    }

    const path = new URL(request.url).pathname;

    if (path === '/send-otp') return handleSendOtp(request, env);
    if (path === '/verify-otp') return handleVerifyOtp(request, env);
    return json({ error: 'Not found' }, 404);
  },
};

async function handleSendOtp(request, env) {
  try {
    const { phone } = await request.json();
    if (!phone) return json({ success: false, error: 'Phone required' }, 400);

    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Channel: 'sms' }).toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) return json({ success: false, error: data.message }, 400);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}

async function handleVerifyOtp(request, env) {
  try {
    const { phone, code, fullName, email, password } = await request.json();
    if (!phone || !code || !fullName || !email || !password)
      return json({ success: false, error: 'Missing fields' }, 400);

    // 1. Verify code with Twilio
    const verifyRes = await fetch(
      `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Code: code }).toString(),
      }
    );
    const verifyData = await verifyRes.json();
    if (verifyData.status !== 'approved')
      return json({ success: false, error: 'invalid_code' }, 400);

    const normalizedEmail = email.trim().toLowerCase();
    const adminEmails = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const role = adminEmails.includes(normalizedEmail) ? 'admin' : 'passenger';

    // 2. Create Supabase auth user
    const createRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      const msg = (createData.msg || createData.message || '').toLowerCase();
      return json({ success: false, error: msg.includes('already') ? 'email_exists' : createData.msg }, 400);
    }

    // 3. Insert profile
    await fetch(`${env.SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ id: createData.id, email: normalizedEmail, full_name: fullName, phone, role }),
    });

    // 4. Sign in and return session
    const signInRes = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const session = await signInRes.json();
    if (!signInRes.ok) return json({ success: false, error: session.error_description }, 400);

    return json({ success: true, session });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
