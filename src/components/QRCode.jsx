export default function QRCode({ value, size = 180, className }) {
  if (!value) return null;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=0&color=0f172a&bgcolor=ffffff`;
  return <img src={src} alt={`QR code for ${value}`} width={size} height={size} className={className} loading="lazy" />;
}