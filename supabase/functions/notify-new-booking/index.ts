import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = "admin@safferni.com";

serve(async (req) => {
  // Supabase database webhooks send a POST with the record
  const payload = await req.json();
  const booking = payload.record;

  if (!booking) {
    return new Response("No record", { status: 400 });
  }

  const {
    ref_code,
    passenger_name,
    passenger_phone,
    seats,
    payment_method,
    total_price,
    status,
    created_at,
  } = booking;

  const bookedAt = new Date(created_at).toLocaleString("en-GB", {
    timeZone: "Asia/Damascus",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9f9f9;">
      <div style="background:#1B3A2A;border-radius:12px 12px 0 0;padding:24px 28px;">
        <h1 style="color:white;margin:0;font-size:20px;">🚗 New Booking — Safferni</h1>
      </div>
      <div style="background:white;border-radius:0 0 12px 12px;padding:28px;border:1px solid #E8E6E1;border-top:none;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#888;width:40%;">Reference</td><td style="padding:8px 0;font-weight:700;color:#1B3A2A;letter-spacing:1px;">${ref_code || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Passenger</td><td style="padding:8px 0;font-weight:600;">${passenger_name || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;font-weight:600;">${passenger_phone || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Seats</td><td style="padding:8px 0;font-weight:600;">${seats ?? "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Total Price</td><td style="padding:8px 0;font-weight:700;color:#1B3A2A;">$${total_price ?? "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Payment</td><td style="padding:8px 0;font-weight:600;">${payment_method || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Status</td><td style="padding:8px 0;font-weight:600;">${status || "pending"}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Booked at</td><td style="padding:8px 0;color:#555;">${bookedAt}</td></tr>
        </table>
        <div style="margin-top:24px;padding:14px 18px;background:#F0F7F3;border-radius:8px;font-size:13px;color:#1B3A2A;">
          Log in to your admin panel to view full trip details and confirm or reject this booking.
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#AAA;margin-top:16px;">Safferni · safferni.com</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Safferni Bookings <bookings@safferni.com>",
      to: [ADMIN_EMAIL],
      subject: `New Booking — ${passenger_name || "Unknown"} (${ref_code || ""})`,
      html,
    }),
  });

  const result = await res.json();
  return new Response(JSON.stringify(result), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
