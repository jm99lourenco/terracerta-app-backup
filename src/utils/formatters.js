export const formatArea = (m2) => {
  if (!m2) return "—";
  if (m2 >= 10000) {
    return `${(m2 / 10000).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} ha`;
  }
  return `${m2.toLocaleString('pt-PT')} m²`;
};

export const generateTCID = () => {
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `TC-2026-${seq}`;
};
