import { useState, useRef } from "react";

const routes = [
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "بيروت", en: "Beirut" }, car: 100, van: 110, seat: 25, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "حمص", en: "Homs" }, car: 100, van: 110, seat: 25, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "حلب", en: "Aleppo" }, car: 175, van: 195, seat: 45, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "عمّان", en: "Amman" }, car: 175, van: 195, seat: 45, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "مطار الملكة علياء", en: "Queen Alia Airport" }, car: 200, van: 220, seat: 50, carOnly: false },
  { from: { ar: "دمشق", en: "Damascus" }, to: { ar: "مطار دمشق الدولي", en: "Damascus Int'l Airport" }, car: 25, van: 28, seat: null, carOnly: true },
];

const allRoutes = [...routes, ...routes.map(r => ({ ...r, from: r.to, to: r.from }))];

const T = {
  ar: {
    brand: "سفّرني",
    brandEn: "SAFFERNI",
    tagline: "وجهتك علينا... بس قلنا وين!",
    subtitle: "خدمة نقل بين المدن — من سوريا لعمّان وبيروت. احجز مقعد أو سيارة كاملة بضغطة زر.",
    nav: { home: "الرئيسية", pricing: "الأسعار", team: "الفريق", contact: "تواصل معنا", book: "احجز الآن" },
    about: {
      title: "من نحن",
      p1: "سفّرني هي خدمة نقل بين المدن تربط سوريا بعمّان وبيروت. نوفر رحلات يومية بسيارات حديثة ومكيّفة.",
      p2: "سائقونا محترفون وذوو خبرة، ونلتزم بالمواعيد المحددة. سلامتك وراحتك أولويتنا.",
      p3: "سواء كنت مسافراً لوحدك أو مع عائلتك، عندنا الخيار المناسب لك.",
    },
    features: [
      { icon: "🛣️", t: "٦ مسارات", d: "رحلات بين المدن الرئيسية والمطارات" },
      { icon: "🚗", t: "سيارة أو فان", d: "سيارة لحد ٤ ركاب أو فان لحد ٦ ركاب" },
      { icon: "💺", t: "مقعد واحد", d: "مو لازم تحجز سيارة كاملة — احجز مقعد بس" },
      { icon: "💵", t: "أسعار ثابتة", d: "تعرفة واضحة — نفس السعر بالاتجاهين" },
    ],
    booking: {
      title: "احجز رحلتك",
      route: "المسار", type: "نوع الحجز",
      seat: "مقعد واحد", car: "سيارة كاملة (حتى ٤ ركاب)", van: "فان (حتى ٦ ركاب)",
      date: "التاريخ", time: "الوقت",
      name: "الاسم الكامل", phone: "رقم الهاتف",
      notes: "ملاحظات إضافية",
      submit: "تأكيد الحجز",
      success: "تم الحجز بنجاح! سنتواصل معك قريباً.",
      selectRoute: "اختر المسار",
      price: "السعر",
      fillAll: "يرجى ملء جميع الحقول المطلوبة",
      carOnlyNote: "هذا المسار متاح للسيارة الكاملة فقط",
      formNote: "عبّي المعلومات وبنتواصل معك",
    },
    pricing: {
      title: "الأسعار", desc: "أسعار واضحة وثابتة — بدون مفاجآت",
      route: "المسار", seat: "مقعد", car: "سيارة (٤ ركاب)", van: "فان (٦ ركاب)",
      note: "الأسعار بالدولار الأمريكي — نفس الأسعار بالاتجاهين",
      carOnly: "سيارة كاملة فقط",
    },
    team: {
      title: "الفريق",
      founder: "المؤسس",
      founderName: "م. وليد الأخوان",
      founderRole: "المؤسس والمدير التنفيذي",
      founderBio: "طبيب ورائد أعمال، أسّس سفّرني لتوفير خدمة نقل موثوقة ومريحة بين المدن السورية والعواصم المجاورة.",
    },
    contact: {
      title: "تواصل معنا", desc: "لأي استفسار أو حجز — نحن بخدمتك",
      phone: "الهاتف", email: "البريد الإلكتروني",
      whatsapp: "واتساب", hours: "ساعات العمل",
      hoursVal: "٧ أيام في الأسبوع، ٢٤ ساعة",
    },
    footer: "جميع الحقوق محفوظة",
  },
  en: {
    brand: "سفّرني",
    brandEn: "SAFFERNI",
    tagline: "Your destination is on us — just tell us where!",
    subtitle: "Intercity transport from Syria to Amman and Beirut. Book a seat or a whole car with one tap.",
    nav: { home: "Home", pricing: "Pricing", team: "Team", contact: "Contact", book: "Book Now" },
    about: {
      title: "About Us",
      p1: "Safferni is an intercity transport service connecting Syria with Amman and Beirut. We offer daily trips in modern, air-conditioned vehicles.",
      p2: "Our drivers are experienced professionals, and we stick to our schedules. Your safety and comfort are our top priority.",
      p3: "Whether you're traveling solo or with family, we have the right option for you.",
    },
    features: [
      { icon: "🛣️", t: "6 routes", d: "Trips between major cities and airports" },
      { icon: "🚗", t: "Car or van", d: "Car up to 4 passengers or van up to 6" },
      { icon: "💺", t: "Single seat", d: "No need to book a whole car — just a seat" },
      { icon: "💵", t: "Fixed prices", d: "Clear fares — same price both directions" },
    ],
    booking: {
      title: "Book Your Ride",
      route: "Route", type: "Booking Type",
      seat: "Single Seat", car: "Full Car (up to 4 pax)", van: "Van (up to 6 pax)",
      date: "Date", time: "Time",
      name: "Full Name", phone: "Phone Number",
      notes: "Additional Notes",
      submit: "Confirm Booking",
      success: "Booking confirmed! We'll contact you shortly.",
      selectRoute: "Select route",
      price: "Price",
      fillAll: "Please fill all required fields",
      carOnlyNote: "This route is available for whole car only",
      formNote: "Fill in the details and we'll get back to you",
    },
    pricing: {
      title: "Pricing", desc: "Clear, fixed prices — no surprises",
      route: "Route", seat: "Seat", car: "Car (4 pax)", van: "Van (6 pax)",
      note: "Prices in USD — same prices both directions",
      carOnly: "Whole car only",
    },
    team: {
      title: "Our Team",
      founder: "Founder",
      founderName: "Dr. M. Walid Alokhwan",
      founderRole: "Founder & CEO",
      founderBio: "Physician and entrepreneur who founded Safferni to provide reliable and comfortable intercity transport between Syrian cities and neighboring capitals.",
    },
    contact: {
      title: "Contact Us", desc: "For any inquiries or bookings — we're here for you",
      phone: "Phone", email: "Email",
      whatsapp: "WhatsApp", hours: "Working Hours",
      hoursVal: "7 days a week, 24 hours",
    },
    footer: "All rights reserved",
  },
};

const LogoSVG = ({ light }) => (
  <svg width="48" height="48" viewBox="0 0 48 48">
    <path d="M18 4 L14 44 L34 44 L30 4 Z" fill={light ? "rgba(255,255,255,0.15)" : "#1B3A2A"}/>
    <rect x="22.5" y="10" width="3" height="7" rx="1.5" fill={light ? "rgba(255,255,255,0.6)" : "#F0F7F3"}/>
    <rect x="22.5" y="21" width="3" height="7" rx="1.5" fill={light ? "rgba(255,255,255,0.6)" : "#F0F7F3"}/>
    <rect x="22.5" y="32" width="3" height="7" rx="1.5" fill={light ? "rgba(255,255,255,0.6)" : "#F0F7F3"}/>
  </svg>
);

export default function App() {
  const [lang, setLang] = useState("ar");
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ route: "", type: "car", date: "", time: "", name: "", phone: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const t = T[lang];
  const isRTL = lang === "ar";
  const bookRef = useRef(null);

  const toggleLang = () => setLang(l => l === "ar" ? "en" : "ar");
  const selectedRoute = form.route !== "" ? allRoutes[parseInt(form.route)] : null;

  // If route is carOnly, force type to car or van
  const effectiveType = selectedRoute?.carOnly && form.type === "seat" ? "car" : form.type;
  const currentPrice = selectedRoute
    ? effectiveType === "seat" ? selectedRoute.seat : effectiveType === "car" ? selectedRoute.car : selectedRoute.van
    : null;

  const handleSubmit = () => {
  if (!form.route || !form.date || !form.name || !form.phone) {
    setError(t.booking.fillAll);
    return;
  }

  const r = selectedRoute;

  const message =
    lang === "ar"
      ? `
🚗 *طلب حجز جديد - سفّرني*

📍 المسار: ${r.from.ar} → ${r.to.ar}
🧾 نوع الحجز: ${
          form.type === "seat"
            ? "مقعد"
            : form.type === "car"
            ? "سيارة كاملة"
            : "فان"
        }
💰 السعر: $${currentPrice}

📅 التاريخ: ${form.date}
⏰ الوقت: ${form.time || "-"}

👤 الاسم: ${form.name}
📞 الهاتف: ${form.phone}

📝 ملاحظات: ${form.notes || "-"}
      `
      : `
🚗 *New Booking - Safferni*

📍 Route: ${r.from.en} → ${r.to.en}
🧾 Type: ${form.type}
💰 Price: $${currentPrice}

📅 Date: ${form.date}
⏰ Time: ${form.time || "-"}

👤 Name: ${form.name}
📞 Phone: ${form.phone}

📝 Notes: ${form.notes || "-"}
      `;

  const phone = "963933383307";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");

  setSubmitted(true);
  setTimeout(() => setSubmitted(false), 5000);
  setForm({ route: "", type: "car", date: "", time: "", name: "", phone: "", notes: "" });
};

  const scrollToBook = () => { setPage("home"); setTimeout(() => bookRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };
  const fade = { animation: "fadeUp 0.7s ease both" };
  const navLinks = [["home", t.nav.home], ["pricing", t.nav.pricing], ["team", t.nav.team], ["contact", t.nav.contact]];

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr", fontFamily: "'Montserrat', sans-serif", background: "#FAFAF8", color: "#1A1A1A", minHeight: "100vh", fontSize: 15, lineHeight: 1.7 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; max-height:0 } to { opacity:1; max-height:500px } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-6px) } }
        * { box-sizing:border-box; margin:0; padding:0 }
        input,select,textarea { font-family:'Montserrat',sans-serif; font-size:14px }
        ::selection { background:#1B3A2A; color:white }
        html { scroll-behavior:smooth }
      `}</style>

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(250,250,248,0.95)", backdropFilter:"blur(16px)", borderBottom:"1px solid #E8E6E1", padding:"0 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div onClick={() => setPage("home")} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <LogoSVG />
            <span style={{ fontSize:20, fontWeight:900, color:"#1B3A2A" }}>{t.brand}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:22 }} className="dnav">
            {navLinks.map(([k,l]) => (
              <span key={k} onClick={() => setPage(k)} style={{ cursor:"pointer", fontSize:13, fontWeight:600, color:page===k?"#1B3A2A":"#999", transition:"color 0.2s" }}>{l}</span>
            ))}
            <button onClick={scrollToBook} style={{ background:"#1B3A2A", color:"white", border:"none", padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{t.nav.book}</button>
            <button onClick={toggleLang} style={{ background:"transparent", border:"1.5px solid #DDD", borderRadius:8, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:700, color:"#555", fontFamily:"inherit" }}>{lang==="ar"?"EN":"عربي"}</button>
          </div>
          <div style={{ display:"none" }} className="mnav">
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={toggleLang} style={{ background:"transparent", border:"1.5px solid #DDD", borderRadius:6, padding:"5px 12px", fontSize:11, cursor:"pointer", fontWeight:700, color:"#555", fontFamily:"inherit" }}>{lang==="ar"?"EN":"عربي"}</button>
              <div onClick={() => setMenuOpen(!menuOpen)} style={{ cursor:"pointer", padding:8, fontSize:20, lineHeight:1 }}>{menuOpen?"✕":"☰"}</div>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div style={{ animation:"slideDown 0.3s ease", borderTop:"1px solid #E8E6E1", padding:"12px 0 16px" }}>
            {navLinks.map(([k,l]) => (
              <div key={k} onClick={() => { setPage(k); setMenuOpen(false); }} style={{ padding:"10px 24px", cursor:"pointer", fontSize:15, fontWeight:page===k?700:400, color:page===k?"#1B3A2A":"#444" }}>{l}</div>
            ))}
            <div style={{ padding:"8px 24px" }}>
              <button onClick={() => { scrollToBook(); setMenuOpen(false); }} style={{ background:"#1B3A2A", color:"white", border:"none", padding:"10px 24px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", fontFamily:"inherit" }}>{t.nav.book}</button>
            </div>
          </div>
        )}
        <style>{`@media(max-width:700px){ .dnav{display:none!important} .mnav{display:flex!important} }`}</style>
      </nav>

      {/* ═══ HOME ═══ */}
      {page === "home" && (
        <div>
          {/* HERO */}
          <section style={{
            background:"linear-gradient(180deg, #1B3A2A 0%, #234D36 100%)",
            padding:"70px 24px 80px", textAlign:"center", position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:3, height:"100%", background:"rgba(255,255,255,0.05)" }} />
            <div style={{ position:"relative", zIndex:1, ...fade }}>
              <div style={{ animation:"float 3s ease-in-out infinite", marginBottom:20 }}>
                <LogoSVG light />
              </div>
              <h1 style={{ fontSize:"clamp(48px, 10vw, 80px)", fontWeight:900, color:"white", lineHeight:1.1, marginBottom:4 }}>{t.brand}</h1>
              <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:10, marginBottom:24 }}>{t.brandEn}</div>
              <p style={{ fontSize:"clamp(16px, 3vw, 22px)", fontWeight:600, color:"rgba(255,255,255,0.9)", marginBottom:12, maxWidth:500, marginInline:"auto" }}>{t.tagline}</p>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", maxWidth:460, marginInline:"auto", marginBottom:32 }}>{t.subtitle}</p>
              <button onClick={scrollToBook} style={{
                background:"white", color:"#1B3A2A", border:"none", padding:"14px 44px", borderRadius:12,
                fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 4px 20px rgba(0,0,0,0.2)", transition:"transform 0.2s",
              }}
                onMouseEnter={e => e.target.style.transform="scale(1.04)"}
                onMouseLeave={e => e.target.style.transform="scale(1)"}
              >{t.nav.book}</button>
            </div>
          </section>

          {/* ABOUT SECTION ON HOME */}
          <section style={{ maxWidth:800, margin:"0 auto", padding:"60px 24px 20px", textAlign:"center" }}>
            <h2 style={{ fontSize:26, fontWeight:900, color:"#1B3A2A", marginBottom:16, animation:"fadeUp 0.6s ease 0.1s both" }}>{t.about.title}</h2>
            <p style={{ fontSize:15, color:"#555", lineHeight:1.9, maxWidth:620, margin:"0 auto 10px", animation:"fadeUp 0.6s ease 0.2s both" }}>{t.about.p1}</p>
            <p style={{ fontSize:15, color:"#555", lineHeight:1.9, maxWidth:620, margin:"0 auto 10px", animation:"fadeUp 0.6s ease 0.25s both" }}>{t.about.p2}</p>
            <p style={{ fontSize:15, color:"#555", lineHeight:1.9, maxWidth:620, margin:"0 auto", animation:"fadeUp 0.6s ease 0.3s both" }}>{t.about.p3}</p>
          </section>

          {/* FEATURES */}
          <section style={{ maxWidth:900, margin:"0 auto", padding:"40px 24px 50px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:14 }}>
              {t.features.map((f,i) => (
                <div key={i} style={{
                  background:"white", border:"1px solid #ECEAE6", borderRadius:14, padding:"28px 20px",
                  textAlign:"center", animation:`fadeUp 0.6s ease ${0.15*i+0.3}s both`, transition:"transform 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
                >
                  <div style={{ fontSize:28, marginBottom:10 }}>{f.icon}</div>
                  <div style={{ fontWeight:800, fontSize:14, color:"#1B3A2A", marginBottom:5 }}>{f.t}</div>
                  <div style={{ fontSize:12, color:"#999", lineHeight:1.5 }}>{f.d}</div>
                </div>
              ))}
            </div>
          </section>

          {/* DIVIDER */}
          <div style={{ maxWidth:120, margin:"0 auto 10px", borderTop:"2px solid #E8E6E1" }} />

          {/* BOOKING */}
          <section ref={bookRef} style={{ maxWidth:580, margin:"0 auto", padding:"40px 24px 80px" }}>
            <div style={{
              background:"white", borderRadius:20, padding:"40px 28px",
              border:"1px solid #E8E6E1", boxShadow:"0 8px 40px rgba(0,0,0,0.05)",
              animation:"fadeUp 0.7s ease 0.2s both",
            }}>
              <h2 style={{ fontSize:24, fontWeight:900, marginBottom:6, color:"#1B3A2A", textAlign:"center" }}>{t.booking.title}</h2>
              <p style={{ fontSize:12, color:"#AAA", textAlign:"center", marginBottom:28 }}>{t.booking.formNote}</p>

              {/* Route */}
              <div style={{ marginBottom:18 }}>
                <label style={lbl}>{t.booking.route} *</label>
                <select value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} style={inp}>
                  <option value="">{t.booking.selectRoute}</option>
                  {allRoutes.map((r,i) => <option key={i} value={i}>{r.from[lang]} → {r.to[lang]}</option>)}
                </select>
              </div>

              {/* Car only notice */}
              {selectedRoute?.carOnly && form.type === "seat" && (
                <div style={{ marginBottom:14, padding:"10px 16px", background:"#FFF8E1", border:"1px solid #FFE082", borderRadius:10, color:"#F57F17", fontSize:12, fontWeight:700 }}>
                  {t.booking.carOnlyNote}
                </div>
              )}

              {/* Type */}
              <div style={{ marginBottom:18 }}>
                <label style={lbl}>{t.booking.type} *</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[
                    ["seat", t.booking.seat],
                    ["car", t.booking.car],
                    ["van", t.booking.van],
                  ].map(([key, label]) => {
                    const disabled = key === "seat" && selectedRoute?.carOnly;
                    return (
                      <button key={key} onClick={() => !disabled && setForm({ ...form, type: key })} style={{
                        flex:1, minWidth:130, padding:"11px 10px", borderRadius:10, fontSize:11, fontWeight:700,
                        cursor: disabled ? "not-allowed" : "pointer", fontFamily:"inherit", border:"2px solid", transition:"all 0.2s",
                        opacity: disabled ? 0.4 : 1,
                        borderColor: effectiveType===key ? "#1B3A2A" : "#E8E6E1",
                        background: effectiveType===key ? "#1B3A2A" : "white",
                        color: effectiveType===key ? "white" : "#666",
                      }}>{label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              {currentPrice !== null && (
                <div style={{
                  background:"linear-gradient(135deg, #F0F7F3, #E8F5ED)", borderRadius:12,
                  padding:"14px 20px", marginBottom:18, display:"flex", justifyContent:"space-between",
                  alignItems:"center", animation:"fadeUp 0.3s ease",
                }}>
                  <span style={{ fontSize:13, fontWeight:700, color:"#555" }}>{t.booking.price}</span>
                  <span style={{ fontSize:28, fontWeight:900, color:"#1B3A2A" }}>${currentPrice}</span>
                </div>
              )}

              {/* Date + Time */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                <div><label style={lbl}>{t.booking.date} *</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>{t.booking.time}</label><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={inp} /></div>
              </div>

              {/* Name + Phone */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                <div><label style={lbl}>{t.booking.name} *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>{t.booking.phone} *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="+963..." /></div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom:18 }}>
                <label style={lbl}>{t.booking.notes}</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inp, minHeight:65, resize:"vertical" }} rows={2} />
              </div>

              {error && <div style={{ marginBottom:14, padding:"10px 16px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, color:"#B91C1C", fontSize:13, fontWeight:700 }}>{error}</div>}
              {submitted && <div style={{ marginBottom:14, padding:"10px 16px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, color:"#166534", fontSize:13, fontWeight:700, animation:"fadeUp 0.3s ease" }}>✓ {t.booking.success}</div>}

              <button onClick={handleSubmit} style={{
                width:"100%", background:"#1B3A2A", color:"white", border:"none", padding:"15px",
                borderRadius:12, fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit", transition:"background 0.2s",
              }}
                onMouseEnter={e => e.target.style.background="#142E21"}
                onMouseLeave={e => e.target.style.background="#1B3A2A"}
              >{t.booking.submit}</button>
            </div>
          </section>
        </div>
      )}

      {/* ═══ PRICING ═══ */}
      {page === "pricing" && (
        <section style={{ maxWidth:800, margin:"0 auto", padding:"60px 24px 80px", ...fade }}>
          <h2 style={{ fontSize:32, fontWeight:900, marginBottom:10, textAlign:"center", color:"#1B3A2A" }}>{t.pricing.title}</h2>
          <p style={{ textAlign:"center", color:"#888", marginBottom:36, fontSize:15 }}>{t.pricing.desc}</p>

          <div style={{ background:"white", borderRadius:16, border:"1px solid #E8E6E1", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr", padding:"14px 20px", background:"#1B3A2A", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"uppercase" }}>
              <div>{t.pricing.route}</div>
              <div style={{ textAlign:"center" }}>{t.pricing.seat}</div>
              <div style={{ textAlign:"center" }}>{t.pricing.car}</div>
              <div style={{ textAlign:"center" }}>{t.pricing.van}</div>
            </div>
            {routes.map((r,i) => (
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr", padding:"14px 20px",
                borderBottom:i<routes.length-1?"1px solid #F0EEEA":"none", fontSize:13,
                animation:`fadeUp 0.4s ease ${0.08*i}s both`, transition:"background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background="#FAFAF8"}
                onMouseLeave={e => e.currentTarget.style.background="white"}
              >
                <div style={{ fontWeight:800, color:"#1B3A2A", fontSize:13 }}>{r.from[lang]} ↔ {r.to[lang]}</div>
                <div style={{ textAlign:"center", fontWeight:700, color: r.carOnly ? "#CCC" : "#333" }}>
                  {r.carOnly ? <span style={{ fontSize:10, color:"#BBB" }}>{t.pricing.carOnly}</span> : `$${r.seat}`}
                </div>
                <div style={{ textAlign:"center", fontWeight:700 }}>${r.car}</div>
                <div style={{ textAlign:"center", fontWeight:700 }}>${r.van}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop:20, fontSize:12, color:"#999", textAlign:"center", fontStyle:"italic" }}>{t.pricing.note}</p>
          <div style={{ textAlign:"center", marginTop:36 }}>
            <button onClick={scrollToBook} style={{ background:"#1B3A2A", color:"white", border:"none", padding:"14px 40px", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{t.nav.book}</button>
          </div>
        </section>
      )}

      {/* ═══ TEAM ═══ */}
      {page === "team" && (
        <section style={{ maxWidth:600, margin:"0 auto", padding:"60px 24px 80px", ...fade }}>
          <h2 style={{ fontSize:32, fontWeight:900, marginBottom:36, textAlign:"center", color:"#1B3A2A" }}>{t.team.title}</h2>

          <div style={{
            background:"white", borderRadius:20, padding:"40px 32px", border:"1px solid #E8E6E1",
            boxShadow:"0 4px 24px rgba(0,0,0,0.04)", textAlign:"center",
          }}>
            {/* Avatar placeholder */}
            <div style={{
              width:90, height:90, borderRadius:"50%", background:"linear-gradient(135deg, #1B3A2A, #2D6B45)",
              margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:36, color:"white", fontWeight:900,
            }}>W</div>

            <div style={{ fontSize:11, fontWeight:700, color:"#1B3A2A", textTransform:"uppercase", letterSpacing:2, marginBottom:6 }}>{t.team.founder}</div>
            <h3 style={{ fontSize:22, fontWeight:900, color:"#1B3A2A", marginBottom:4 }}>{t.team.founderName}</h3>
            <p style={{ fontSize:13, fontWeight:600, color:"#888", marginBottom:20 }}>{t.team.founderRole}</p>
            <p style={{ fontSize:14, color:"#555", lineHeight:1.8, maxWidth:420, margin:"0 auto" }}>{t.team.founderBio}</p>
          </div>
        </section>
      )}

      {/* ═══ CONTACT ═══ */}
      {page === "contact" && (
        <section style={{ maxWidth:550, margin:"0 auto", padding:"60px 24px 80px", ...fade }}>
          <h2 style={{ fontSize:32, fontWeight:900, marginBottom:10, textAlign:"center", color:"#1B3A2A" }}>{t.contact.title}</h2>
          <p style={{ textAlign:"center", color:"#888", marginBottom:32, fontSize:15 }}>{t.contact.desc}</p>
          <div style={{ background:"white", borderRadius:16, padding:"28px", border:"1px solid #E8E6E1", boxShadow:"0 2px 12px rgba(0,0,0,0.03)" }}>
            {[
              { l: t.contact.email, v: "info@safferni.com", ic: "✉️", link: "mailto:info@safferni.com" },
              { l: t.contact.whatsapp, v: lang === "ar" ? "قريباً..." : "Coming soon...", ic: "💬", link: null },
              { l: t.contact.hours, v: t.contact.hoursVal, ic: "🕐", link: null },
            ].map((item,i) => (
              <div key={i} onClick={() => item.link && window.open(item.link)} style={{
                display:"flex", alignItems:"center", gap:14, padding:"14px 0",
                borderBottom:i<2?"1px solid #F0EEEA":"none",
                cursor: item.link ? "pointer" : "default",
              }}>
                <div style={{ width:42, height:42, borderRadius:10, background:"#F0F7F3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{item.ic}</div>
                <div>
                  <div style={{ fontSize:11, color:"#AAA", fontWeight:700, textTransform:"uppercase", marginBottom:1 }}>{item.l}</div>
                  <div style={{ fontSize:14, fontWeight:600, color: item.link ? "#1B3A2A" : "#333" }}>{item.v}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ borderTop:"1px solid #E8E6E1", padding:"20px", textAlign:"center", color:"#BBB", fontSize:12, background:"white", fontWeight:500 }}>
        © 2026 {t.brand} — {t.footer}
      </footer>
    </div>
  );
}

const lbl = { display:"block", fontSize:12, fontWeight:700, color:"#666", marginBottom:6 };
const inp = { width:"100%", padding:"11px 14px", border:"1.5px solid #E0DDD8", borderRadius:10, background:"#FAFAF8", outline:"none", transition:"border-color 0.2s" };
