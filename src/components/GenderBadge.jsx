export const GenderBadge = ({ type, lang }) => {
  const isWomen = type === "women_only";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: isWomen ? "#F3E8FF" : "#F0FDF4",
      color: isWomen ? "#7C3AED" : "#065F46",
      border: `1px solid ${isWomen ? "#DDD6FE" : "#BBF7D0"}`,
    }}>
      {isWomen ? "💜 " + (lang === "ar" ? "نساء فقط" : "Women Only") : "🚗 " + (lang === "ar" ? "مختلط" : "Mixed")}
    </span>
  );
};
