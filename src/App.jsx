import { useState, useRef } from "react";

const routes = [
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "عمّان", en: "Amman" }, seat: 100, car3: 300, car5: 300 },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "بيروت", en: "Beirut" }, seat: 40, car3: 100, car5: 100 },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "حلب", en: "Aleppo" }, seat: 80, car3: 250, car5: 250 },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "حمص", en: "Homs" }, seat: 20, car3: 70, car5: 70 },
];

const allRoutes = [...routes, ...routes.map(r => ({ ...r, from: r.to, to: r.from }))];

const T = {
  ar: {
    brand: "سفرني",
    tagline: "وجهتك علينا... بس قلنا وين!",
    subtitle: "احجز رحلتك بين المدن بضغطة زر — مقعد أو سيارة كاملة",
    nav: { home: "الرئيسية", about: "من نحن", pricing: "الأسعار", contact: "تواصل معنا", book: "احجز الآن" },
    booking: {
      title: "احجز رحلتك",
      route: "المسار",
      type: "نوع الحجز",
      seat: "مقعد واحد",
      car3: "سيارة كاملة (حتى ٣ ركاب)",
      car5: "سيارة كاملة (حتى ٥ ركاب)",
      date: "التاريخ",
      time: "الوقت",
      name: "الاسم الكامل",
      phone: "رقم الهاتف",
      notes: "ملاحظات إضافية",
      submit: "تأكيد الحجز",
      success: "تم الحجز بنجاح! سنتواصل معك قريباً.",
      selectRoute: "اختر المسار",
      price: "السعر",
      fillAll: "يرجى ملء جميع الحقول المطلوبة",
    },
    pricing: {
      title: "الأسعار",
      desc: "أسعار واضحة وثابتة — بدون مفاجآت",
      route: "المسار",
      seat: "مقعد",
      car3: "سيارة (٣ ركاب)",
      car5: "سيارة (٥ ركاب)",
      note: "الأسعار بالدولار الأمريكي — السيارة الكاملة تشمل حتى العدد المحدد من الركاب",
      bothWays: "نفس الأسعار بالاتجاهين",
    },
    about: {
      title: "من نحن",
      p1: "سفرني هي خدمة نقل بين المدن تربط سوريا بعمّان وبيروت. نوفر رحلات يومية بسيارات حديثة ومكيّفة.",
      p2: "سائقونا محترفون وذوو خبرة، ونلتزم بالمواعيد المحددة. سلامتك وراحتك أولويتنا.",
      p3: "سواء كنت مسافراً لوحدك أو مع عائلتك، عندنا الخيار المناسب لك.",
      features: [
        { icon: "🛡️", t: "أمان تام", d: "سائقون محترفون وسيارات مؤمّنة" },
        { icon: "⏰", t: "التزام بالمواعيد", d: "رحلات يومية بمواعيد ثابتة" },
        { icon: "💵", t: "أسعار واضحة", d: "لا رسوم مخفية أو مفاجآت" },
        { icon: "🚗", t: "مقعد أو سيارة", d: "احجز مقعد أو سيارة كاملة" },
      ],
    },
    contact: {
      title: "تواصل معنا",
      desc: "لأي استفسار أو حجز — نحن بخدمتك",
      phone: "الهاتف", email: "البريد الإلكتروني",
      whatsapp: "واتساب", hours: "ساعات العمل",
      hoursVal: "٧ أيام في الأسبوع، ٢٤ ساعة",
    },
    footer: "جميع الحقوق محفوظة",
  },
  en: {
    brand: "Safferni",
    tagline: "Your destination is on us — just tell us where!",
    subtitle: "Book your intercity ride with one tap — a seat or a whole car",
    nav: { home: "Home", about: "About", pricing: "Pricing", contact: "Contact", book: "Book Now" },
    booking: {
      title: "Book Your Ride",
      route: "Route",
      type: "Booking Type",
      seat: "Single Seat",
      car3: "Whole Car (up to 3 passengers)",
      car5: "Whole Car (up to 5 passengers)",
      date: "Date",
      time: "Time",
      name: "Full Name",
      phone: "Phone Number",
      notes: "Additional Notes",
      submit: "Confirm Booking",
      success: "Booking confirmed! We'll contact you shortly.",
      selectRoute: "Select route",
      price: "Price",
      fillAll: "Please fill all required fields",
    },
    pricing: {
      title: "Pricing",
      desc: "Clear, fixed prices — no surprises",
      route: "Route",
      seat: "Seat",
      car3: "Car (3 pax)",
      car5: "Car (5 pax)",
      note: "Prices in USD — whole car includes up to the specified number of passengers",
      bothWays: "Same prices both ways",
    },
    about: {
      title: "About Us",
      p1: "Safferni is an intercity transport service connecting Syria with Amman and Beirut. We offer daily trips in modern, air-conditioned vehicles.",
      p2: "Our drivers are experienced professionals, and we stick to our schedules. Your safety and comfort are our top priority.",
      p3: "Whether you're traveling solo or with family, we have the right option for you.",
      features: [
        { icon: "🛡️", t: "Full Safety", d: "Professional drivers & insured vehicles" },
        { icon: "⏰", t: "On Time", d: "Daily trips with fixed schedules" },
        { icon: "💵", t: "Clear Pricing", d: "No hidden fees or surprises" },
        { icon: "🚗", t: "Seat or Car", d: "Book a seat or a whole car" },
      ],
    },
    contact: {
      title: "Contact Us",
      desc: "For any inquiries or bookings — we're here for you",
      phone: "Phone", email: "Email",
      whatsapp: "WhatsApp", hours: "Working Hours",
      hoursVal: "7 days a week, 24 hours",
    },
    footer: "All rights reserved",
  },
};

export default function App() {
  const [lang, setLang] = useState("ar");
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ route: "", type: "seat", date: "", time: "", name: "", phone: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const t = T[lang];
  const isRTL = lang === "ar";
  const bookRef = useRef(null);

  const toggleLang = () => setLang(l => l === "ar" ? "en" : "ar");
  const selectedRoute = form.route !== "" ? allRoutes[parseInt(form.route)] : null;
  const currentPrice = selectedRoute ? (form.type === "seat" ? selectedRoute.seat : form.type === "car3" ? selectedRoute.car3 : selectedRoute.car5) : null;

  const handleSubmit = () => {
    if (!form.route || !form.date || !form.name || !form.phone) { setError(t.booking.fillAll); return; }
    setError(""); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setForm({ route: "", type: "seat", date: "", time: "", name: "", phone: "", notes: "" });
  };

  const scrollToBook = () => { setPage("home"); setTimeout(() => bookRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };
  const fade = { animation: "fadeUp 0.6s ease both" };
  const navLinks = [["home", t.nav.home], ["about", t.nav.about], ["pricing", t.nav.pricing], ["contact", t.nav.contact]];

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr", fontFamily: "'Montserrat', sans-serif", background: "#FAFAF8", color: "#1A1A1A", minHeight: "100vh", fontSize: 15, lineHeight: 1.7 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; max-height:0 } to { opacity:1; max-height:400px } }
        * { box-sizing:border-box; margin:0; padding:0 }
        input,select,textarea { font-family:'Montserrat',sans-serif; font-size:14px }
        ::selection { background:#1B3A2A; color:white }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,248,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E8E6E1", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div onClick={() => setPage("home")} style={{ fontSize: 24, fontWeight: 900, cursor: "pointer", color: "#1B3A2A" }}>{t.brand}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="dnav">
            {navLinks.map(([k, l]) => (
              <span key={k} onClick={() => setPage(k)} style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: page === k ? "#1B3A2A" : "#888", borderBottom: page === k ? "2px solid #1B3A2A" : "2px solid transparent", paddingBottom: 2, transition: "all 0.2s" }}>{l}</span>
            ))}
            <button onClick={scrollToBook} style={{ background: "#1B3A2A", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.nav.book}</button>
            <button onClick={toggleLang} style={{ background: "transparent", border: "1.5px solid #CCC", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 700, color: "#444", fontFamily: "inherit" }}>{lang === "ar" ? "EN" : "عربي"}</button>
          </div>
          <div style={{ display: "none" }} className="mnav">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={toggleLang} style={{ background: "transparent", border: "1.5px solid #CCC", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700, color: "#444", fontFamily: "inherit" }}>{lang === "ar" ? "EN" : "عربي"}</button>
              <div onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "pointer", padding: 8, fontSize: 22, lineHeight: 1 }}>{menuOpen ? "✕" : "☰"}</div>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div style={{ animation: "slideDown 0.3s ease", borderTop: "1px solid #E8E6E1", padding: "12px 0 16px" }}>
            {navLinks.map(([k, l]) => (
              <div key={k} onClick={() => { setPage(k); setMenuOpen(false); }} style={{ padding: "10px 24px", cursor: "pointer", fontSize: 15, fontWeight: page === k ? 700 : 400, color: page === k ? "#1B3A2A" : "#444" }}>{l}</div>
            ))}
            <div style={{ padding: "8px 24px" }}>
              <button onClick={() => { scrollToBook(); setMenuOpen(false); }} style={{ background: "#1B3A2A", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit" }}>{t.nav.book}</button>
            </div>
          </div>
        )}
        <style>{`@media(max-width:700px){ .dnav{display:none!important} .mnav{display:flex!important} }`}</style>
      </nav>

      {/* ═══ HOME ═══ */}
      {page === "home" && (
        <div>
          <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 50px", textAlign: "center", ...fade }}>
            <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 14, color: "#1B3A2A" }}>{t.brand}</h1>
            <p style={{ fontSize: "clamp(16px, 3vw, 22px)", fontWeight: 700, color: "#444", marginBottom: 10 }}>{t.tagline}</p>
            <p style={{ fontSize: "clamp(13px, 2vw, 16px)", color: "#888", maxWidth: 480, margin: "0 auto 36px" }}>{t.subtitle}</p>
            <button onClick={scrollToBook} style={{ background: "#1B3A2A", color: "white", border: "none", padding: "14px 44px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "transform 0.2s" }}
              onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}
            >{t.nav.book}</button>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 50, maxWidth: 750, marginInline: "auto" }}>
              {routes.map((r, i) => (
                <div key={i} style={{ background: "white", border: "1px solid #E8E6E1", borderRadius: 12, padding: "18px 20px", textAlign: isRTL ? "right" : "left", animation: `fadeUp 0.5s ease ${0.1 * i}s both` }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1B3A2A", marginBottom: 6 }}>{r.from[lang]} ↔ {r.to[lang]}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {lang === "ar" ? "مقعد" : "Seat"}: <span style={{ fontWeight: 700, color: "#333" }}>${r.seat}</span>
                    {" · "}
                    {lang === "ar" ? "سيارة" : "Car"}: <span style={{ fontWeight: 700, color: "#333" }}>${r.car3}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Booking */}
          <section ref={bookRef} style={{ maxWidth: 580, margin: "0 auto", padding: "20px 24px 80px" }}>
            <div style={{ background: "white", borderRadius: 16, padding: "36px 28px", border: "1px solid #E8E6E1", boxShadow: "0 4px 24px rgba(0,0,0,0.04)", ...fade, animationDelay: "0.2s" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28, color: "#1B3A2A", textAlign: "center" }}>{t.booking.title}</h2>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>{t.booking.route} *</label>
                <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} style={inp}>
                  <option value="">{t.booking.selectRoute}</option>
                  {allRoutes.map((r, i) => <option key={i} value={i}>{r.from[lang]} → {r.to[lang]}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>{t.booking.type} *</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["seat", t.booking.seat], ["car3", t.booking.car3], ["car5", t.booking.car5]].map(([key, label]) => (
                    <button key={key} onClick={() => setForm({ ...form, type: key })} style={{
                      flex: 1, minWidth: 130, padding: "10px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      border: "1.5px solid", transition: "all 0.2s",
                      borderColor: form.type === key ? "#1B3A2A" : "#DDD",
                      background: form.type === key ? "#1B3A2A" : "white",
                      color: form.type === key ? "white" : "#555",
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {currentPrice !== null && (
                <div style={{ background: "#F0F7F3", borderRadius: 10, padding: "12px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeUp 0.3s ease" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{t.booking.price}</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#1B3A2A" }}>${currentPrice}</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><label style={lbl}>{t.booking.date} *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>{t.booking.time}</label><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inp} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><label style={lbl}>{t.booking.name} *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>{t.booking.phone} *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="+963..." /></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>{t.booking.notes}</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, minHeight: 65, resize: "vertical" }} rows={2} />
              </div>

              {error && <div style={{ marginBottom: 14, padding: "10px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#B91C1C", fontSize: 13, fontWeight: 700 }}>{error}</div>}
              {submitted && <div style={{ marginBottom: 14, padding: "10px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, color: "#166534", fontSize: 13, fontWeight: 700, animation: "fadeUp 0.3s ease" }}>✓ {t.booking.success}</div>}

              <button onClick={handleSubmit} style={{ width: "100%", background: "#1B3A2A", color: "white", border: "none", padding: "14px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" }}
                onMouseEnter={e => e.target.style.background = "#142E21"}
                onMouseLeave={e => e.target.style.background = "#1B3A2A"}
              >{t.booking.submit}</button>
            </div>
          </section>
        </div>
      )}

      {/* ═══ PRICING ═══ */}
      {page === "pricing" && (
        <section style={{ maxWidth: 750, margin: "0 auto", padding: "60px 24px 80px", ...fade }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, textAlign: "center", color: "#1B3A2A" }}>{t.pricing.title}</h2>
          <p style={{ textAlign: "center", color: "#888", marginBottom: 8, fontSize: 15 }}>{t.pricing.desc}</p>
          <p style={{ textAlign: "center", color: "#1B3A2A", marginBottom: 36, fontSize: 13, fontWeight: 700 }}>↔ {t.pricing.bothWays}</p>

          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E6E1", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", padding: "14px 24px", background: "#1B3A2A", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}>
              <div>{t.pricing.route}</div>
              <div style={{ textAlign: "center" }}>{t.pricing.seat}</div>
              <div style={{ textAlign: "center" }}>{t.pricing.car3}</div>
              <div style={{ textAlign: "center" }}>{t.pricing.car5}</div>
            </div>
            {routes.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", padding: "16px 24px", borderBottom: i < routes.length - 1 ? "1px solid #F0EEEA" : "none", fontSize: 14, animation: `fadeUp 0.4s ease ${0.08 * i}s both`, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                <div style={{ fontWeight: 800, color: "#1B3A2A" }}>{r.from[lang]} ↔ {r.to[lang]}</div>
                <div style={{ textAlign: "center", fontWeight: 700 }}>${r.seat}</div>
                <div style={{ textAlign: "center", fontWeight: 700 }}>${r.car3}</div>
                <div style={{ textAlign: "center", fontWeight: 700 }}>${r.car5}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: "#999", textAlign: "center", fontStyle: "italic" }}>{t.pricing.note}</p>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={scrollToBook} style={{ background: "#1B3A2A", color: "white", border: "none", padding: "14px 40px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.nav.book}</button>
          </div>
        </section>
      )}

      {/* ═══ ABOUT ═══ */}
      {page === "about" && (
        <section style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 80px", ...fade }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24, textAlign: "center", color: "#1B3A2A" }}>{t.about.title}</h2>
          <div style={{ background: "white", borderRadius: 16, padding: "32px", border: "1px solid #E8E6E1", marginBottom: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            <p style={{ marginBottom: 14, color: "#444", fontSize: 15 }}>{t.about.p1}</p>
            <p style={{ marginBottom: 14, color: "#444", fontSize: 15 }}>{t.about.p2}</p>
            <p style={{ color: "#444", fontSize: 15 }}>{t.about.p3}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {t.about.features.map((f, i) => (
              <div key={i} style={{ background: "white", border: "1px solid #E8E6E1", borderRadius: 14, padding: "24px 18px", textAlign: "center", animation: `fadeUp 0.5s ease ${0.1 * i}s both` }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#1B3A2A" }}>{f.t}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{f.d}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ CONTACT ═══ */}
      {page === "contact" && (
        <section style={{ maxWidth: 550, margin: "0 auto", padding: "60px 24px 80px", ...fade }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, textAlign: "center", color: "#1B3A2A" }}>{t.contact.title}</h2>
          <p style={{ textAlign: "center", color: "#888", marginBottom: 32, fontSize: 15 }}>{t.contact.desc}</p>
          <div style={{ background: "white", borderRadius: 16, padding: "28px", border: "1px solid #E8E6E1", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
            {[
              { l: t.contact.phone, v: "+963 XX XXX XXXX", ic: "📞" },
              { l: t.contact.whatsapp, v: "+963 XX XXX XXXX", ic: "💬" },
              { l: t.contact.email, v: "info@safferni.com", ic: "✉️" },
              { l: t.contact.hours, v: t.contact.hoursVal, ic: "🕐" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < 3 ? "1px solid #F0EEEA" : "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "#F0F7F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.ic}</div>
                <div>
                  <div style={{ fontSize: 11, color: "#AAA", fontWeight: 700, textTransform: "uppercase", marginBottom: 1 }}>{item.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{item.v}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ borderTop: "1px solid #E8E6E1", padding: "20px", textAlign: "center", color: "#BBB", fontSize: 12, background: "white", fontWeight: 500 }}>
        © 2026 {t.brand} — {t.footer}
      </footer>
    </div>
  );
}

const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 };
const inp = { width: "100%", padding: "10px 14px", border: "1.5px solid #E0DDD8", borderRadius: 8, background: "#FAFAF8", outline: "none", transition: "border-color 0.2s" };
