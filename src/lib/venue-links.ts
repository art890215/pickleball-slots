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
