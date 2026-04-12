import { useState, useRef } from "react";

/* ---------------- ROUTES ---------------- */
const routes = [
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "بيروت", en: "Beirut" }, car: 100, van: 110, seat: 25, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "حمص", en: "Homs" }, car: 100, van: 110, seat: 25, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "حلب", en: "Aleppo" }, car: 175, van: 195, seat: 45, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "عمّان", en: "Amman" }, car: 175, van: 195, seat: 45, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "مطار الملكة علياء", en: "Queen Alia Airport" }, car: 200, van: 220, seat: 50, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "مطار دمشق الدولي", en: "Damascus Airport" }, car: 25, van: 28, seat: null, carOnly: true },
];

const allRoutes = [...routes, ...routes.map(r => ({ ...r, from: r.to, to: r.from }))];

export default function App() {
  const [lang, setLang] = useState("ar");
  const [form, setForm] = useState({
    route: "",
    type: "car",
    date: "",
    time: "",
    name: "",
    phone: "",
    notes: ""
  });

  const [payment, setPayment] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedRoute =
    form.route !== "" ? allRoutes[parseInt(form.route)] : null;

  const effectiveType =
    selectedRoute?.carOnly && form.type === "seat" ? "car" : form.type;

  const currentPrice = selectedRoute
    ? effectiveType === "seat"
      ? selectedRoute.seat
      : effectiveType === "car"
      ? selectedRoute.car
      : selectedRoute.van
    : null;

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = () => {
    if (!form.route || !form.date || !form.name || !form.phone || !payment) {
      setError(lang === "ar" ? "يرجى تعبئة جميع الحقول" : "Please fill all fields");
      return;
    }

    const r = selectedRoute;

    const typeText =
      form.type === "seat"
        ? lang === "ar" ? "مقعد" : "Seat"
        : form.type === "car"
        ? lang === "ar" ? "سيارة كاملة" : "Full Car"
        : lang === "ar" ? "فان" : "Van";

    const message =
      lang === "ar"
        ? `
🚗 *طلب حجز جديد - سفّرني*

📍 المسار: ${r.from.ar} → ${r.to.ar}
🧾 نوع الحجز: ${typeText}
💰 السعر: $${currentPrice}

📅 التاريخ: ${form.date}
⏰ الوقت: ${form.time || "-"}

👤 الاسم: ${form.name}
📞 الهاتف: ${form.phone}

💳 الدفع: ${payment === "cash" ? "كاش" : "شام كاش"}

📝 ملاحظات: ${form.notes || "-"}
        `
        : `
🚗 *New Booking - Safferni*

📍 Route: ${r.from.en} → ${r.to.en}
🧾 Type: ${typeText}
💰 Price: $${currentPrice}

📅 Date: ${form.date}
⏰ Time: ${form.time || "-"}

👤 Name: ${form.name}
📞 Phone: ${form.phone}

💳 Payment: ${payment}

📝 Notes: ${form.notes || "-"}
        `;

    const phone = "963949191411";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);

    setForm({
      route: "",
      type: "car",
      date: "",
      time: "",
      name: "",
      phone: "",
      notes: ""
    });

    setPayment("");
    setError("");
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ fontFamily: "sans-serif", padding: 20, maxWidth: 500, margin: "auto" }}>

      <h1>SAFFERNI</h1>

      {/* ROUTE */}
      <select
        value={form.route}
        onChange={e => setForm({ ...form, route: e.target.value })}
      >
        <option value="">Select route</option>
        {allRoutes.map((r, i) => (
          <option key={i} value={i}>
            {r.from.en} → {r.to.en}
          </option>
        ))}
      </select>

      {/* TYPE */}
      <div style={{ marginTop: 10 }}>
        {["seat", "car", "van"].map(type => (
          <button
            key={type}
            disabled={type === "seat" && selectedRoute?.carOnly}
            onClick={() => setForm({ ...form, type })}
            style={{
              margin: 5,
              padding: 10,
              background: form.type === type ? "#1B3A2A" : "#eee",
              color: form.type === type ? "#fff" : "#000",
              border: "none",
              borderRadius: 8
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* PRICE */}
      {currentPrice && (
        <h3>Price: ${currentPrice}</h3>
      )}

      {/* PAYMENT */}
      <h3>Payment</h3>

      <button
        onClick={() => setPayment("cash")}
        style={{
          margin: 5,
          padding: 10,
          background: payment === "cash" ? "#1B3A2A" : "#eee",
          color: payment === "cash" ? "#fff" : "#000",
          border: "none",
          borderRadius: 8
        }}
      >
        Cash
      </button>

      <button
        onClick={() => setPayment("shamcash")}
        style={{
          margin: 5,
          padding: 10,
          background: payment === "shamcash" ? "#1B3A2A" : "#eee",
          color: payment === "shamcash" ? "#fff" : "#000",
          border: "none",
          borderRadius: 8
        }}
      >
        ShamCash
      </button>

      {/* FORM */}
      <input
        placeholder="Name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />

      <input
        type="date"
        value={form.date}
        onChange={e => setForm({ ...form, date: e.target.value })}
      />

      <input
        type="time"
        value={form.time}
        onChange={e => setForm({ ...form, time: e.target.value })}
      />

      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={e => setForm({ ...form, notes: e.target.value })}
      />

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        style={{
          marginTop: 15,
          padding: 15,
          width: "100%",
          background: "#1B3A2A",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 16,
          fontWeight: "bold"
        }}
      >
        Confirm Booking
      </button>

      {/* SUCCESS */}
      {submitted && (
        <p style={{ color: "green", marginTop: 10 }}>
          Booking sent successfully!
        </p>
      )}

    </div>
  );
}
