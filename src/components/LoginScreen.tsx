import { writeAuth } from "@/lib/store";

const USERS = [
  { name: "Jela", emoji: "🦊", partner: "p1" as const },
  { name: "JoJo", emoji: "🦖", partner: "p2" as const },
];

export function LoginScreen() {
  const enter = (u: typeof USERS[0]) => {
    writeAuth({ partner: u.partner, name: u.name, emoji: u.emoji });
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--paper)",
      padding: "24px 20px",
      backgroundImage: [
        "radial-gradient(circle at 20% 30%, oklch(0.94 0.04 60 / 0.5), transparent 50%)",
        "radial-gradient(circle at 80% 70%, oklch(0.94 0.04 120 / 0.4), transparent 55%)",
      ].join(", "),
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{
            width: 60, height: 60, background: "var(--ink)", color: "var(--paper)",
            borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24,
            transform: "rotate(-3deg)", boxShadow: "var(--shadow-lift)", marginBottom: 22,
          }}>
            je·jo
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 38, fontWeight: 400, margin: 0, lineHeight: 1.1 }}>
            Good to see you.
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", margin: "8px 0 0" }}>
            Who's home?
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {USERS.map((u) => (
            <button
              key={u.partner}
              onClick={() => enter(u)}
              style={{
                display: "flex", alignItems: "center", gap: 18,
                padding: "22px 24px", borderRadius: 18,
                background: "oklch(0.995 0.005 85)",
                border: "1.5px solid var(--line)", boxShadow: "var(--shadow-paper)",
                cursor: "pointer", textAlign: "left",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lift)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-paper)"; }}
            >
              <span style={{
                width: 56, height: 56, borderRadius: 999, flexShrink: 0,
                background: u.partner === "p1" ? "var(--coral-soft)" : "var(--olive-soft)",
                boxShadow: `0 0 0 2px ${u.partner === "p1" ? "var(--coral)" : "var(--olive)"}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 30,
              }}>
                {u.emoji}
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 400, flex: 1 }}>
                {u.name}
              </span>
              <span style={{ color: "var(--ink-mute)", fontSize: 22 }}>→</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
