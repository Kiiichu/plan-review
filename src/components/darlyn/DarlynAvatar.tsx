import { cn } from "@/lib/utils";

/**
 * Single avatar slot used everywhere. To use a custom image, set AVATAR_SRC
 * to an imported image URL. Falls back to the lavender monogram.
 */
const AVATAR_SRC: string | undefined = undefined;

export function DarlynAvatar({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {AVATAR_SRC ? (
        <img src={AVATAR_SRC} alt="Darlyn" className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 40 40" className="h-full w-full" aria-label="Darlyn">
          <circle cx="20" cy="20" r="11" className="fill-primary" />
          <circle cx="25" cy="16" r="9.5" className="fill-accent" />
          <circle cx="29" cy="27" r="1.6" className="fill-primary" />
        </svg>
      )}
    </div>
  );
}
