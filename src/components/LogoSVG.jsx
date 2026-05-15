export const LogoSVG = ({ light }) => (
  <svg width="48" height="48" viewBox="0 0 48 48">
    <path d="M18 4 L14 44 L34 44 L30 4 Z" fill={light ? "rgba(255,255,255,0.15)" : "#1B3A2A"} />
    <rect x="22.5" y="10" width="3" height="7" rx="1.5" fill={light ? "rgba(255,255,255,0.6)" : "#F0F7F3"} />
    <rect x="22.5" y="21" width="3" height="7" rx="1.5" fill={light ? "rgba(255,255,255,0.6)" : "#F0F7F3"} />
    <rect x="22.5" y="32" width="3" height="7" rx="1.5" fill={light ? "rgba(255,255,255,0.6)" : "#F0F7F3"} />
  </svg>
);
