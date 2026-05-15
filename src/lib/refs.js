export const genRef = () => {
  const d = new Date();
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase();
  return `SAF-${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}-${rand}`;
};

export const genAppRef = () => {
  const d = new Date();
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase();
  return `DRV-${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}-${rand}`;
};
