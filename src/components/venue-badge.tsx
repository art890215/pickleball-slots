import { badgeColor, initials } from "@/lib/venue-links";

// Coloured initials in place of a logo (until the venue agrees to show theirs).
export function VenueBadge({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-xl font-semibold text-white"
      style={{ background: badgeColor(name), width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
