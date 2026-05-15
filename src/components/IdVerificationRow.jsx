import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export const IdVerificationRow = ({ driver, lang, onVerify, onReject }) => {
  const [signedUrl, setSignedUrl] = useState(null);
  const loadSignedUrl = async () => {
    if (signedUrl) return;
    if (!driver.id_photo_url) { alert(lang === "ar" ? "لم يتم رفع صورة الهوية" : "No ID photo uploaded"); return; }
    const { data, error } = await supabase.storage.from("id-documents").createSignedUrl(driver.id_photo_url, 300);
    if (error) { alert((lang === "ar" ? "فشل تحميل صورة الهوية: " : "Failed to load ID image: ") + error.message); return; }
    setSignedUrl(data?.signedUrl || null);
  };
  return (
    <div style={{ background: "white", border: "1px solid #E8E6E1", borderRadius: 14, padding: "20px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1B3A2A" }}>{driver.full_name || "—"}</div>
          <div style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>{driver.id}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={loadSignedUrl} style={{ background: "#F0F7F3", color: "#1B3A2A", border: "1.5px solid #1B3A2A", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🪪 {lang === "ar" ? "عرض الهوية" : "View ID"}</button>
          <button onClick={() => onVerify(driver.id)} style={{ background: "#1B3A2A", color: "white", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓ {lang === "ar" ? "تحقق" : "Verify"}</button>
          <button onClick={() => onReject(driver.id)} style={{ background: "#FEF2F2", color: "#B91C1C", border: "1.5px solid #FECACA", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✗ {lang === "ar" ? "رفض" : "Reject"}</button>
        </div>
      </div>
      {signedUrl && <div style={{ marginTop: 12 }}><img src={signedUrl} alt="ID document" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, border: "1px solid #E8E6E1", objectFit: "contain" }} /></div>}
    </div>
  );
};
