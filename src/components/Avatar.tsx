import type { Partner, PartnerKey } from "@/lib/store";

interface Props {
  partner: Partner;
  who: PartnerKey;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  active?: boolean;
}

export function Avatar({ partner, who, size = "md", showName = false, active = false }: Props) {
  const sizes = {
    sm: "h-7 w-7 text-sm",
    md: "h-9 w-9 text-base",
    lg: "h-14 w-14 text-2xl",
  };
  const bg = who === "p1" ? "bg-terracotta/15 ring-terracotta/40" : "bg-sage/15 ring-sage/40";
  const ring = active ? (who === "p1" ? "ring-2 ring-terracotta" : "ring-2 ring-sage") : "ring-1";

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`${sizes[size]} ${bg} ${ring} inline-flex items-center justify-center rounded-full leading-none transition-all`}
        aria-label={partner.name}
      >
        {partner.emoji}
      </span>
      {showName && (
        <span className="text-sm font-medium text-foreground/80">{partner.name}</span>
      )}
    </span>
  );
}
