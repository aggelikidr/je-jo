import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import type { ApartmentReaction } from "@/lib/jejoStore";
import type { Partner, PartnerKey } from "@/lib/store";

// ── Partners context shape ────────────────────────────────────
export interface Partners {
  p1: Partner;
  p2: Partner;
}

// ── Avatar ────────────────────────────────────────────────────

interface AvatarProps {
  who: PartnerKey;
  partner: Partner;
  size?: number;
  ring?: boolean;
}

export function Avatar({ who, partner, size = 28, ring = false }: AvatarProps) {
  const tone = who === "p1" ? "var(--coral)" : "var(--olive)";
  const tint = who === "p1" ? "var(--coral-soft)" : "var(--olive-soft)";
  return (
    <span
      title={partner.name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: tint,
        boxShadow: ring ? `0 0 0 2px ${tone}` : `0 0 0 1px ${tone}`,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {partner.emoji}
    </span>
  );
}

interface AvatarPairProps {
  partners: Partners;
  size?: number;
  gap?: number;
}

export function AvatarPair({ partners, size = 28, gap = -6 }: AvatarPairProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <Avatar who="p1" partner={partners.p1} size={size} />
      <span style={{ marginLeft: gap }}>
        <Avatar who="p2" partner={partners.p2} size={size} />
      </span>
    </span>
  );
}

// ── Sticker / stamp ───────────────────────────────────────────

type StickerTone = "ink" | "coral" | "olive" | "sun" | "sky";

interface StickerProps {
  children: ReactNode;
  tone?: StickerTone;
  rotate?: number;
  style?: CSSProperties;
}

const STICKER_COLORS: Record<StickerTone, { c: string; bg: string }> = {
  ink:   { c: "var(--ink)",        bg: "oklch(1 0 0 / 0.6)" },
  coral: { c: "var(--coral-deep)", bg: "var(--coral-soft)" },
  olive: { c: "var(--olive-deep)", bg: "var(--olive-soft)" },
  sun:   { c: "oklch(0.45 0.13 75)", bg: "oklch(0.95 0.08 85)" },
  sky:   { c: "oklch(0.4 0.1 230)",  bg: "oklch(0.93 0.04 230)" },
};

export function Sticker({ children, tone = "ink", rotate = 0, style }: StickerProps) {
  const m = STICKER_COLORS[tone] ?? STICKER_COLORS.ink;
  return (
    <span
      className="stamp"
      style={{ color: m.c, background: m.bg, transform: `rotate(${rotate}deg)`, ...style }}
    >
      {children}
    </span>
  );
}

// ── Pinned polaroid card frame ────────────────────────────────

type PinPosition = "topLeft" | "topRight" | "topCenter";

interface PinnedProps {
  children: ReactNode;
  rotate?: number;
  pin?: PinPosition;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

const PIN_POSITIONS: Record<PinPosition, CSSProperties> = {
  topLeft:   { top: -6, left: 18 },
  topRight:  { top: -6, right: 18 },
  topCenter: { top: -6, left: "50%", transform: "translateX(-50%)" },
};

export function Pinned({ children, rotate = 0, pin = "topLeft", style, className = "", onClick }: PinnedProps) {
  const pinPos = PIN_POSITIONS[pin] ?? PIN_POSITIONS.topLeft;
  return (
    <div
      className={"polaroid wobble " + className}
      style={{ "--rot": rotate + "deg", transform: `rotate(${rotate}deg)`, ...style } as CSSProperties}
      onClick={onClick}
    >
      <span className="pin" style={pinPos as CSSProperties} />
      {children}
    </div>
  );
}

// ── PhotoSlot ─────────────────────────────────────────────────

interface PhotoSlotProps {
  hue?: number;
  label?: string;
  height?: number;
  tag?: ReactNode;
  /** Proxied or absolute image URL; falls back to gradient placeholder on error. */
  src?: string;
}

export function PhotoSlot({ hue = 30, label = "photo", height = 160, tag, src }: PhotoSlotProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [src]);
  const showImage = Boolean(src) && !imageFailed;

  const bg1 = `oklch(0.88 0.07 ${hue})`;
  const bg2 = `oklch(0.78 0.10 ${hue})`;
  const bg3 = `oklch(0.62 0.13 ${hue})`;
  return (
    <div
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        background: showImage
          ? "var(--paper-deep)"
          : `linear-gradient(135deg, ${bg1} 0%, ${bg2} 55%, ${bg3} 100%)`,
        borderRadius: 4,
      }}
    >
      {showImage && (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {showImage ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.18,
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 14px)",
            }}
          />
          <svg
            viewBox="0 0 200 120"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }}
          >
            <rect x="20" y="40" width="80" height="60" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
            <rect x="110" y="55" width="70" height="45" fill="rgba(0,0,0,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            <rect x="25" y="20" width="30" height="14" fill="rgba(255,255,255,0.35)" />
            <circle cx="145" cy="38" r="8" fill="rgba(255,255,255,0.25)" />
          </svg>
        </>
      )}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.92)",
          textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      >
        {label}
      </div>
      {tag && <div style={{ position: "absolute", top: 8, right: 8 }}>{tag}</div>}
    </div>
  );
}

// ── Vote row ──────────────────────────────────────────────────

export const REACTIONS: { key: ApartmentReaction; emoji: string; label: string }[] = [
  { key: "love", emoji: "❤️", label: "love" },
  { key: "fine", emoji: "🤝", label: "fine" },
  { key: "veto", emoji: "✋", label: "no" },
];

interface VoteRowProps {
  reactions: { p1?: ApartmentReaction; p2?: ApartmentReaction };
  partners: Partners;
  currentUser: PartnerKey;
  onVote: (r: ApartmentReaction) => void;
  compact?: boolean;
}

export function VoteRow({ reactions, partners, currentUser, onVote }: VoteRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 6,
        background: "oklch(0.96 0.012 60 / 0.7)",
        borderRadius: 999,
        border: "1px dashed var(--line)",
      }}
    >
      {(["p1", "p2"] as PartnerKey[]).map((k) => {
        const r = reactions[k];
        const meta = REACTIONS.find((x) => x.key === r);
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 4 }}>
            <Avatar who={k} partner={partners[k]} size={20} />
            <span style={{ fontSize: 14, lineHeight: 1, width: 16 }}>
              {meta ? meta.emoji : <span style={{ color: "var(--ink-mute)" }}>·</span>}
            </span>
          </div>
        );
      })}
      <span
        style={{ width: 1, height: 18, background: "var(--line-strong)", margin: "0 4px" }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-mute)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginRight: 2,
        }}
      >
        you →
      </span>
      {REACTIONS.map((r) => {
        const active = reactions[currentUser] === r.key;
        return (
          <button
            key={r.key}
            onClick={() => onVote(r.key)}
            title={r.label}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: active ? "white" : "transparent",
              boxShadow: active ? "var(--shadow-paper)" : "none",
              fontSize: 14,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.12s ease",
            }}
          >
            {r.emoji}
          </button>
        );
      })}
    </div>
  );
}

// ── Consensus ─────────────────────────────────────────────────

export type ConsensusResult = "both-love" | "agreed" | "veto" | "partial" | "pending";

export function consensusOf(react: { p1?: ApartmentReaction; p2?: ApartmentReaction }): ConsensusResult {
  const { p1, p2 } = react ?? {};
  if (p1 === "veto" || p2 === "veto") return "veto";
  if (!p1 || !p2) return p1 || p2 ? "partial" : "pending";
  if (p1 === "love" && p2 === "love") return "both-love";
  return "agreed";
}

const CONSENSUS_MAP: Record<ConsensusResult, { text: string; tone: StickerTone; emoji: string }> = {
  "both-love": { text: "Both love it!",          tone: "coral", emoji: "💛" },
  "agreed":    { text: "We agree",               tone: "olive", emoji: "🤝" },
  "veto":      { text: "Someone said no",         tone: "ink",   emoji: "✋" },
  "partial":   { text: "Waiting for the other",   tone: "sky",   emoji: "⏳" },
  "pending":   { text: "No votes yet",            tone: "ink",   emoji: "·" },
};

interface ConsensusBadgeProps {
  c: ConsensusResult;
  small?: boolean;
}

export function ConsensusBadge({ c, small = false }: ConsensusBadgeProps) {
  const m = CONSENSUS_MAP[c] ?? CONSENSUS_MAP.pending;
  return (
    <Sticker tone={m.tone} style={small ? { fontSize: 10, padding: "2px 8px" } : undefined}>
      <span>{m.emoji}</span>
      <span> {m.text}</span>
    </Sticker>
  );
}

// ── Modal / bottom sheet ──────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  isMobile?: boolean;
}

export function Modal({ open, onClose, title, children, isMobile }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  if (isMobile) {
    return (
      <div className="sheet-overlay fade-up" onClick={onClose}>
        <div className="sheet-content" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-handle" />
          <div style={{ padding: "8px 20px 20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: 28,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  fontSize: 20,
                  color: "var(--ink-mute)",
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "oklch(0.2 0.04 30 / 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      className="fade-up"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper)",
          maxWidth: 520,
          width: "100%",
          borderRadius: 12,
          padding: 28,
          boxShadow: "var(--shadow-lift)",
          border: "1px solid var(--line)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 32,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              fontSize: 18,
              color: "var(--ink-mute)",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Speech bubble ─────────────────────────────────────────────

interface SpeechProps {
  who: PartnerKey;
  partners: Partners;
  children: ReactNode;
  tail?: "left" | "right";
}

export function Speech({ who, partners, children, tail = "left" }: SpeechProps) {
  const tone = who === "p1" ? "var(--coral-soft)" : "var(--olive-soft)";
  const border = who === "p1" ? "var(--coral)" : "var(--olive)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {tail === "left" && <Avatar who={who} partner={partners[who]} size={22} />}
      <span
        style={{
          position: "relative",
          background: tone,
          border: `1.5px solid ${border}`,
          borderRadius: 14,
          padding: "5px 10px",
          fontSize: 13,
          color: "var(--ink)",
          maxWidth: 280,
          lineHeight: 1.35,
        }}
      >
        {children}
      </span>
      {tail === "right" && <Avatar who={who} partner={partners[who]} size={22} />}
    </span>
  );
}

// ── Euro price ────────────────────────────────────────────────

export function Euro({ value }: { value: number }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
      €{Number(value).toLocaleString("el-GR")}
    </span>
  );
}

// ── Confetti ──────────────────────────────────────────────────

export function celebrate(opts: { origin?: { x?: number; y?: number } } = {}) {
  const c = (window as { confetti?: (opts: unknown) => void }).confetti;
  if (typeof c !== "function") return;
  c({
    particleCount: 80,
    spread: 70,
    origin: opts.origin ?? { y: 0.7 },
    colors: ["#e26d3f", "#7b9a55", "#ecbb47", "#faf0d8", "#c75c46"],
    scalar: 0.9,
    ticks: 180,
  });
}

// ── Time helpers ──────────────────────────────────────────────

export function daysUntil(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function relTime(hours: number): string {
  if (!hours) return "·";
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const d = Math.floor(hours / 24);
  return `${d}d ago`;
}

// ── Progress bar ──────────────────────────────────────────────

interface ProgressBarProps {
  label: string;
  done: number;
  total: number;
  tone?: "coral" | "olive" | "sun";
}

export function ProgressBar({ label, done, total, tone = "coral" }: ProgressBarProps) {
  const pct = total ? (done / total) * 100 : 0;
  const color =
    tone === "coral" ? "var(--coral)" : tone === "olive" ? "var(--olive)" : "var(--sun-deep)";
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-mute)" }}>
          {done}/{total}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--line)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Furniture donut ───────────────────────────────────────────

export function FurnitureMiniDonut({ have, total }: { have: number; total: number }) {
  const pct = total ? have / total : 0;
  const size = 70;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--olive)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - pct * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontSize="22"
        fill="var(--ink)"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
