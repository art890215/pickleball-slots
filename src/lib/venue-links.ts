// Google Maps search link built from the venue name and address.
// No Google account or API key needed: it just opens a Maps search.
export function googleMapsUrl(name: string, address: string): string {
  const query = [name, address, "Hong Kong"].map((s) => s.trim()).filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Accepts "@name", "name" or an instagram.com link; returns just "name", or null if invalid.
export function normalizeInstagram(input: string): string | null {
  let s = input.trim();
  const fromUrl = s.match(/instagram\.com\/([^/?#]+)/i);
  if (fromUrl) s = fromUrl[1];
  s = s.replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : null;
}

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// "Tsuen Wan Pickle" -> "TW". Used instead of a logo until the venue agrees.
export function initials(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, " ")
    .split(/[^A-Za-z0-9一-鿿]+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// A soft, stable background colour per venue for the initials badge.
export function badgeColor(name: string): string {
  const colors = ["#047857", "#0369a1", "#7c3aed", "#b45309", "#be123c", "#0f766e", "#4d7c0f", "#1d4ed8"];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return colors[h % colors.length];
}

export function whatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Only allow redirects to our own pages.
export function safeNext(next: unknown, fallback = "/owner"): string {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}
