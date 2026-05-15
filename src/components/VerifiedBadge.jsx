export const VerifiedBadge = ({ size = 18, title = "Verified" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-label={title} role="img" style={{ verticalAlign: "middle", flexShrink: 0 }}>
    <path fill="#1D9BF0" d="M12 1.5l2.4 1.8 3 .15 1.05 2.85 2.55 1.5-.6 2.85L21.75 12l-1.35 2.55.6 2.85-2.55 1.5-1.05 2.85-3 .15L12 22.5l-2.4-1.8-3-.15-1.05-2.85-2.55-1.5.6-2.85L2.25 12l1.35-2.55-.6-2.85 2.55-1.5L6.6 3.45l3-.15z" />
    <path fill="#fff" d="M10.6 15.6l-3.3-3.3 1.4-1.4 1.9 1.9 4.4-4.4 1.4 1.4z" />
  </svg>
);
