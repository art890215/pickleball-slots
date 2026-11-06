// Tidy up a Hong Kong phone number: "9123 4567" -> "+852 91234567".
// Returns null if it doesn't look like a phone number.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (/^[2-9]\d{7}$/.test(digits)) return `+852 ${digits}`; // local 8-digit HK number
  if (/^852[2-9]\d{7}$/.test(digits)) return `+852 ${digits.slice(3)}`;
  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}
