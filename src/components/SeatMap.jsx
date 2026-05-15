export const SeatMap = ({ total, available }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
    {Array.from({ length: total }, (_, i) => {
      const isBooked = i < (total - available);
      return (
        <div
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: isBooked ? "#EF4444" : "#22C55E",
            border: `2px solid ${isBooked ? "#DC2626" : "#16A34A"}`,
            transition: "background 0.3s",
          }}
        />
      );
    })}
  </div>
);
