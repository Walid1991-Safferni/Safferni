import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_CHAT_IDS = (process.env.ALLOWED_TELEGRAM_CHAT_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── Telegram helpers ──────────────────────────────────────

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// ── Supabase actions ──────────────────────────────────────

// Maps any common name (English, Arabic, full, lowercase) to the canonical city ID used by the website.
const CITY_MAP = {
  damascus: "dam", dam: "dam", "دمشق": "dam",
  aleppo: "ale", ale: "ale", "حلب": "ale",
  homs: "hom", hom: "hom", "حمص": "hom",
  hama: "ham", ham: "ham", "حماة": "ham",
  latakia: "lat", lat: "lat", "اللاذقية": "lat",
  tartus: "tar", tar: "tar", "طرطوس": "tar",
  daraa: "dar", dar: "dar", "درعا": "dar",
  "deir ez-zor": "dez", "deir ez zor": "dez", "deir_ez_zor": "dez", deirezzor: "dez", dez: "dez", "دير الزور": "dez",
  "al-hasakah": "has", hasakah: "has", hasaka: "has", has: "has", "الحسكة": "has",
  raqqa: "raq", raq: "raq", "الرقة": "raq",
  idlib: "idl", idl: "idl", "إدلب": "idl",
  quneitra: "qun", qun: "qun", "القنيطرة": "qun",
  "as-suwayda": "suw", suwayda: "suw", sweida: "suw", suw: "suw", "السويداء": "suw",
  "rural damascus": "rif", rif: "rif", "ريف دمشق": "rif",
  beirut: "bei", bei: "bei", "بيروت": "bei",
  amman: "amm", amm: "amm", "عمّان": "amm", "عمان": "amm",
  "queen alia airport": "qaa", "queen alia": "qaa", qaa: "qaa", "مطار الملكة علياء": "qaa",
  "damascus international airport": "daa", "damascus airport": "daa", daa: "daa", "مطار دمشق الدولي": "daa",
};

function normalizeCity(name) {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  return CITY_MAP[key] || (Object.values(CITY_MAP).includes(key) ? key : null);
}

async function createTrip({ from_city, to_city, trip_date, trip_time, price_per_seat, total_seats, gender_type, driver_id }) {
  const fromId = normalizeCity(from_city);
  const toId = normalizeCity(to_city);
  if (!fromId) return { success: false, error: `Unknown origin city: "${from_city}"` };
  if (!toId) return { success: false, error: `Unknown destination city: "${to_city}"` };
  const { data, error } = await supabase.from("trips").insert({
    from_city: fromId, to_city: toId, trip_date, trip_time,
    price_per_seat, total_seats,
    available_seats: total_seats,
    gender_type: gender_type || "mixed",
    driver_id,
    status: "pending",
    approved: false,
  }).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, trip: data };
}

async function resolveTripId(idOrPrefix) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrPrefix)) return idOrPrefix;
  const { data } = await supabase.from("trips").select("id").like("id", `${idOrPrefix.toLowerCase()}%`).limit(2);
  if (!data?.length) return null;
  if (data.length > 1) return "AMBIGUOUS";
  return data[0].id;
}

async function approveTrip(tripId) {
  const id = await resolveTripId(tripId);
  if (!id) return { success: false, error: "Trip not found" };
  if (id === "AMBIGUOUS") return { success: false, error: "Multiple trips match that ID prefix, use the full ID" };
  const { error } = await supabase.from("trips").update({ approved: true, status: "active" }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function cancelTrip(tripId) {
  const id = await resolveTripId(tripId);
  if (!id) return { success: false, error: "Trip not found" };
  if (id === "AMBIGUOUS") return { success: false, error: "Multiple trips match that ID prefix, use the full ID" };
  const { error } = await supabase.from("trips").update({ status: "cancelled" }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function getPendingTrips() {
  const { data, error } = await supabase.from("trips").select("id,from_city,to_city,trip_date,trip_time,price_per_seat,available_seats,approved,status").eq("approved", false).eq("status", "active").order("trip_date");
  if (error) return { success: false, error: error.message };
  return { success: true, trips: data || [] };
}

async function getUpcomingTrips() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("trips").select("id,from_city,to_city,trip_date,trip_time,price_per_seat,available_seats,status,approved").gte("trip_date", today).eq("status", "active").eq("approved", true).order("trip_date").limit(10);
  if (error) return { success: false, error: error.message };
  return { success: true, trips: data || [] };
}

async function getPendingBookings() {
  const { data, error } = await supabase.from("bookings").select("id,ref_code,passenger_name,passenger_phone,seats,payment_method,total_price,status,trips(from_city,to_city,trip_date)").eq("status", "pending").order("created_at", { ascending: false }).limit(15);
  if (error) return { success: false, error: error.message };
  return { success: true, bookings: data || [] };
}

async function getRecentBookings() {
  const { data, error } = await supabase.from("bookings").select("id,ref_code,passenger_name,seats,payment_method,total_price,status,trips(from_city,to_city,trip_date)").order("created_at", { ascending: false }).limit(10);
  if (error) return { success: false, error: error.message };
  return { success: true, bookings: data || [] };
}

async function getPendingApplications() {
  const { data, error } = await supabase.from("driver_applications").select("id,full_name,phone,car_kind_year,status,app_ref,created_at").eq("status", "pending").order("created_at");
  if (error) return { success: false, error: error.message };
  return { success: true, applications: data || [] };
}

async function approveApplication(appId) {
  const { data: app, error: fetchErr } = await supabase.from("driver_applications").select("user_id").eq("id", appId).single();
  if (fetchErr) return { success: false, error: fetchErr.message };
  const { error: updateErr } = await supabase.from("driver_applications").update({ status: "approved" }).eq("id", appId);
  if (updateErr) return { success: false, error: updateErr.message };
  const { error: roleErr } = await supabase.from("profiles").update({ role: "driver" }).eq("id", app.user_id);
  if (roleErr) return { success: false, error: roleErr.message };
  return { success: true };
}

async function denyApplication(appId) {
  const { error } = await supabase.from("driver_applications").update({ status: "denied" }).eq("id", appId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function getStats() {
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: totalBookings }, { count: pendingBookings }, { count: activeTrips }, { count: pendingApps }] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "active").eq("approved", true).gte("trip_date", today),
    supabase.from("driver_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { totalBookings, pendingBookings, activeTrips, pendingApps };
}

async function getDriverId(nameOrEmail) {
  const { data } = await supabase.from("profiles").select("id,full_name,email").eq("role", "driver").ilike("full_name", `%${nameOrEmail}%`).limit(5);
  return data || [];
}

async function findBooking(refOrId) {
  const term = refOrId.trim();
  let { data } = await supabase.from("bookings").select("id,ref_code,passenger_name,passenger_phone,seats,total_price,status,trip_id,trips(from_city,to_city,trip_date,trip_time,available_seats,driver_id)").or(`ref_code.eq.${term.toUpperCase()},id.eq.${term}`).limit(1);
  if (!data?.length) {
    const { data: byPrefix } = await supabase.from("bookings").select("id,ref_code,passenger_name,passenger_phone,seats,total_price,status,trip_id,trips(from_city,to_city,trip_date,trip_time,available_seats,driver_id)").like("id", `${term}%`).limit(1);
    data = byPrefix;
  }
  return data?.[0] || null;
}

async function confirmBooking(refOrId) {
  const bk = await findBooking(refOrId);
  if (!bk) return { success: false, error: "Booking not found" };
  if (bk.status !== "pending") return { success: false, error: `Booking is already ${bk.status}` };
  const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bk.id);
  if (error) return { success: false, error: error.message };
  return { success: true, booking: bk };
}

async function rejectBooking(refOrId) {
  const bk = await findBooking(refOrId);
  if (!bk) return { success: false, error: "Booking not found" };
  if (bk.status === "cancelled") return { success: false, error: "Booking is already cancelled" };
  const { error: bkErr } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bk.id);
  if (bkErr) return { success: false, error: bkErr.message };
  if (bk.trips?.available_seats != null && bk.trip_id) {
    await supabase.from("trips").update({ available_seats: bk.trips.available_seats + bk.seats }).eq("id", bk.trip_id);
  }
  return { success: true, booking: bk };
}

// ── Tool definitions for Claude ───────────────────────────

const tools = [
  {
    name: "create_trip",
    description: "Create a new trip. The trip will be marked as pending admin approval.",
    input_schema: {
      type: "object",
      properties: {
        from_city: { type: "string", description: "Origin city (lowercase, use underscore for spaces e.g. deir_ez_zor)" },
        to_city: { type: "string", description: "Destination city" },
        trip_date: { type: "string", description: "Date in YYYY-MM-DD format" },
        trip_time: { type: "string", description: "Time in HH:MM format (24h)" },
        price_per_seat: { type: "number", description: "Price per seat in USD" },
        total_seats: { type: "integer", description: "Total number of seats" },
        gender_type: { type: "string", enum: ["mixed", "women_only"], description: "Trip gender type" },
        driver_email: { type: "string", description: "Email of the driver to assign the trip to (optional, uses admin account if not provided)" },
      },
      required: ["from_city", "to_city", "trip_date", "trip_time", "price_per_seat", "total_seats"],
    },
  },
  {
    name: "approve_trip",
    description: "Approve a pending trip so it becomes visible to passengers",
    input_schema: {
      type: "object",
      properties: { trip_id: { type: "string", description: "The trip UUID" } },
      required: ["trip_id"],
    },
  },
  {
    name: "cancel_trip",
    description: "Cancel an active trip",
    input_schema: {
      type: "object",
      properties: { trip_id: { type: "string", description: "The trip UUID" } },
      required: ["trip_id"],
    },
  },
  {
    name: "get_pending_trips",
    description: "Get all trips waiting for admin approval",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_upcoming_trips",
    description: "Get upcoming active approved trips",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_pending_bookings",
    description: "Get all bookings with status pending",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_recent_bookings",
    description: "Get the 10 most recent bookings",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_pending_applications",
    description: "Get all pending driver applications",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "approve_application",
    description: "Approve a driver application and grant driver role",
    input_schema: {
      type: "object",
      properties: { application_id: { type: "string", description: "The application UUID" } },
      required: ["application_id"],
    },
  },
  {
    name: "deny_application",
    description: "Deny a driver application",
    input_schema: {
      type: "object",
      properties: { application_id: { type: "string", description: "The application UUID" } },
      required: ["application_id"],
    },
  },
  {
    name: "get_stats",
    description: "Get overall platform statistics: total bookings, pending bookings, active trips, pending applications",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "find_driver",
    description: "Find a driver by name to get their ID for creating a trip",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Driver's name or partial name" } },
      required: ["name"],
    },
  },
  {
    name: "confirm_booking",
    description: "Confirm a passenger booking (changes status to confirmed)",
    input_schema: {
      type: "object",
      properties: { booking_ref: { type: "string", description: "Booking reference code (e.g. ABC12345) or booking ID" } },
      required: ["booking_ref"],
    },
  },
  {
    name: "reject_booking",
    description: "Reject a passenger booking (cancels it and restores the seats to the trip)",
    input_schema: {
      type: "object",
      properties: { booking_ref: { type: "string", description: "Booking reference code or booking ID" } },
      required: ["booking_ref"],
    },
  },
];

// ── Tool executor ─────────────────────────────────────────

async function executeTool(name, input) {
  switch (name) {
    case "create_trip": {
      let driverId = null;
      if (input.driver_email) {
        const { data } = await supabase.from("profiles").select("id").eq("email", input.driver_email).single();
        driverId = data?.id;
      }
      return createTrip({ ...input, driver_id: driverId });
    }
    case "approve_trip": return approveTrip(input.trip_id);
    case "cancel_trip": return cancelTrip(input.trip_id);
    case "get_pending_trips": return getPendingTrips();
    case "get_upcoming_trips": return getUpcomingTrips();
    case "get_pending_bookings": return getPendingBookings();
    case "get_recent_bookings": return getRecentBookings();
    case "get_pending_applications": return getPendingApplications();
    case "approve_application": return approveApplication(input.application_id);
    case "deny_application": return denyApplication(input.application_id);
    case "get_stats": return getStats();
    case "find_driver": return getDriverId(input.name);
    case "confirm_booking": return confirmBooking(input.booking_ref);
    case "reject_booking": return rejectBooking(input.booking_ref);
    default: return { error: "Unknown tool" };
  }
}

// ── Format tool results for Telegram ─────────────────────

function formatResult(toolName, result) {
  if (!result.success && result.error) return `❌ Error: ${result.error}`;

  switch (toolName) {
    case "get_stats":
      return `📊 *Platform Stats*\n• Active trips: ${result.activeTrips}\n• Total bookings: ${result.totalBookings}\n• Pending bookings: ${result.pendingBookings}\n• Pending driver applications: ${result.pendingApps}`;

    case "get_pending_trips":
    case "get_upcoming_trips": {
      if (!result.trips.length) return "No trips found.";
      return result.trips.map(t =>
        `🚗 \`${t.id.slice(0,8)}\` ${t.from_city} → ${t.to_city}\n   📅 ${t.trip_date} ${t.trip_time||""} | 💺 ${t.available_seats} seats | $${t.price_per_seat}`
      ).join("\n\n");
    }

    case "get_pending_bookings":
    case "get_recent_bookings": {
      if (!result.bookings.length) return "No bookings found.";
      return result.bookings.map(b =>
        `📋 \`${b.ref_code}\` — ${b.passenger_name}\n   ${b.trips?.from_city||"?"} → ${b.trips?.to_city||"?"} | ${b.trips?.trip_date||""}\n   ${b.seats} seat(s) | $${b.total_price} | ${b.payment_method} | *${b.status}*`
      ).join("\n\n");
    }

    case "get_pending_applications": {
      if (!result.applications.length) return "No pending applications.";
      return result.applications.map(a =>
        `👤 \`${a.id.slice(0,8)}\` ${a.full_name}\n   📞 ${a.phone} | 🚗 ${a.car_kind_year}\n   Ref: ${a.app_ref}`
      ).join("\n\n");
    }

    case "create_trip":
      return result.success
        ? `✅ Trip created!\nID: \`${result.trip.id.slice(0,8)}\`\nRoute: ${result.trip.from_city} → ${result.trip.to_city}\nDate: ${result.trip.trip_date} ${result.trip.trip_time}\nPrice: $${result.trip.price_per_seat}/seat\n\n⚠️ Trip is pending approval. Say "approve trip ${result.trip.id.slice(0,8)}" to make it live.`
        : `❌ Failed to create trip: ${result.error}`;

    case "approve_trip": return result.success ? "✅ Trip approved and now live!" : `❌ ${result.error}`;
    case "cancel_trip": return result.success ? "✅ Trip cancelled." : `❌ ${result.error}`;
    case "approve_application": return result.success ? "✅ Application approved. Driver role granted." : `❌ ${result.error}`;
    case "deny_application": return result.success ? "✅ Application denied." : `❌ ${result.error}`;

    case "find_driver": {
      if (!result.length) return "No driver found with that name.";
      return result.map(d => `👤 ${d.full_name} — \`${d.id}\``).join("\n");
    }

    case "confirm_booking":
      return result.success
        ? `✅ Booking *${result.booking.ref_code}* confirmed.\n${result.booking.passenger_name} — ${result.booking.seats} seat(s) on ${result.booking.trips?.from_city||"?"} → ${result.booking.trips?.to_city||"?"}`
        : `❌ ${result.error}`;

    case "reject_booking":
      return result.success
        ? `✅ Booking *${result.booking.ref_code}* rejected. Seats restored to trip.`
        : `❌ ${result.error}`;

    default: return JSON.stringify(result, null, 2).slice(0, 1000);
  }
}

// ── Main handler ──────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  const { message } = req.body;
  if (!message?.text) return res.status(200).json({ ok: true });

  const chatId = String(message.chat.id);
  const text = message.text;

  // Security: only allow configured chat IDs
  if (ALLOWED_CHAT_IDS.length && !ALLOWED_CHAT_IDS.includes(chatId)) {
    await sendMessage(chatId, "⛔ Unauthorized.");
    return res.status(200).json({ ok: true });
  }

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are the Safferni admin assistant bot. You help the admin manage the Safferni ride-booking platform in Syria.

Today's date is ${today}.

You have access to tools to:
- Create, approve, and cancel trips
- View pending and upcoming trips
- View bookings
- Confirm or reject bookings on behalf of drivers (use booking ref code like ABC12345)
- Approve or deny driver applications
- Get platform stats
- Find drivers by name

Cities available (use these exact IDs in tool calls):
Syria: dam (Damascus), ale (Aleppo), hom (Homs), ham (Hama), lat (Latakia), tar (Tartus), dar (Daraa), dez (Deir ez-Zor), has (Al-Hasakah), raq (Raqqa), idl (Idlib), qun (Quneitra), suw (As-Suwayda), rif (Rural Damascus)
International: bei (Beirut), amm (Amman), qaa (Queen Alia Airport Amman), daa (Damascus Int'l Airport)

When the user mentions a city by name, convert it to the correct ID before calling tools. For example "Aleppo" → "ale", "Beirut" → "bei", "Amman" → "amm".

When the user asks you to do something, use the appropriate tool. Be concise. For lists, show the most important info only.

When creating trips, if no driver is specified, set driver_id to null (admin-created trip).
When the user references a trip or application by a short ID (first 8 chars), match it to the full ID from context.`;

  const messages = [{ role: "user", content: text }];

  try {
    let response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });

    let reply = "";

    while (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(b => b.type === "tool_use");
      const toolResults = [];

      for (const toolUse of toolUses) {
        const result = await executeTool(toolUse.name, toolUse.input);
        const formatted = formatResult(toolUse.name, result);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) });
        reply += formatted + "\n\n";
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemPrompt,
        tools,
        messages,
      });
    }

    const textBlock = response.content.find(b => b.type === "text");
    if (textBlock?.text) reply += textBlock.text;

    await sendMessage(chatId, reply.trim() || "Done.");
  } catch (err) {
    console.error(err);
    await sendMessage(chatId, `⚠️ Something went wrong: ${err.message}`);
  }

  res.status(200).json({ ok: true });
}
