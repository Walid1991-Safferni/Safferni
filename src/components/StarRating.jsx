export const StarRating = ({ value, onChange, readOnly = false }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span
        key={s}
        onClick={() => !readOnly && onChange && onChange(s)}
        style={{
          fontSize: 22,
          cursor: readOnly ? "default" : "pointer",
          color: s <= value ? "#F59E0B" : "#DDD",
          transition: "color 0.15s",
        }}
      >★</span>
    ))}
  </div>
);
