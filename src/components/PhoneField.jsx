import { useState, useEffect } from "react";
import { COUNTRY_CODES, detectCC } from "../lib/countries.js";

export const PhoneField = ({ value = "", onChange, lang, inp }) => {
  const { cc: initCC } = detectCC(value);
  const [cc, setCc] = useState(initCC);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  // Sync cc state when value prop changes externally (e.g. profile loads after mount)
  useEffect(() => { const detected = detectCC(value).cc; if (detected !== cc) setCc(detected); }, [value]);
  const num = detectCC(value).num;
  const filtered = COUNTRY_CODES.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.v.includes(search));
  const pickCC = v => { setCc(v); setOpen(false); setSearch(""); onChange(v + num); };
  const flag = COUNTRY_CODES.find(c => c.v === cc)?.f || "🌍";
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ position: "relative", flexShrink: 0 }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <button type="button" onClick={() => setOpen(o => !o)}
          style={{ ...inp, width: 90, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, cursor: "pointer", background: "white", padding: "11px 10px" }}>
          <span style={{ fontSize: 16 }}>{flag}</span><span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{cc}</span><span style={{ fontSize: 9, color: "#AAA" }}>▾</span>
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300, background: "white", border: "1px solid #E8E6E1", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: 250, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "ابحث عن دولة..." : "Search country..."}
              style={{ border: "none", borderBottom: "1px solid #E8E6E1", padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#FAFAF9" }} />
            <div style={{ overflowY: "auto", maxHeight: 200 }}>
              {filtered.length === 0
                ? <div style={{ padding: "12px", color: "#AAA", textAlign: "center", fontSize: 13 }}>{lang === "ar" ? "لا توجد نتائج" : "No results"}</div>
                : filtered.map(c => (
                  <div key={c.v} onMouseDown={() => pickCC(c.v)}
                    style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, background: cc === c.v ? "#F0F7F3" : "white" }}>
                    <span style={{ fontSize: 17 }}>{c.f}</span>
                    <span style={{ flex: 1, fontWeight: cc === c.v ? 700 : 400, color: "#222" }}>{c.name}</span>
                    <span style={{ color: "#888", fontSize: 12, fontWeight: 600 }}>{c.v}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      <input value={num} onChange={e => onChange(cc + e.target.value)} type="tel"
        style={{ ...inp, flex: 1, direction: "ltr", textAlign: "left" }}
        placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"} />
    </div>
  );
};
