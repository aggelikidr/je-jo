import { useRef, useState } from "react";
import { writeAuth } from "@/lib/store";

const USERS = [
  { name: "Jela", emoji: "🦊", partner: "p1" as const },
  { name: "JoJo", emoji: "🦖", partner: "p2" as const },
];

// Password is set via VITE_APP_PASSWORD environment variable in Lovable
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string | undefined;

type Stage = "pick" | "password";

export function LoginScreen() {
  const [stage, setStage] = useState<Stage>("pick");
  const [selected, setSelected] = useState<typeof USERS[0] | null>(null);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (u: typeof USERS[0]) => {
    setSelected(u);
    setStage("password");
    setErr(null);
    setPassword("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const signIn = () => {
    if (!selected || !password) return;
    if (!APP_PASSWORD || password !== APP_PASSWORD) {
      setErr("Wrong password — try again.");
      return;
    }
    writeAuth({ partner: selected.partner, name: selected.name, emoji: selected.emoji });
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

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{
            width: 60, height: 60,
            background: "var(--ink)", color: "var(--paper)",
            borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24,
            transform: "rotate(-3deg)", boxShadow: "var(--shadow-lift)", marginBottom: 22,
          }}>
            je·jo
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 38, fontWeight: 400, margin: 0, lineHeight: 1.1,
          }}>
            {stage === "pick" ? "Good to see you." : `Hey, ${selected?.name}.`}
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", margin: "8px 0 0" }}>
            {stage === "pick" ? "Who's home?" : "Enter your password to continue."}
          </p>
        </div>

        {stage === "pick" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {USERS.map((u) => (
              <button
                key={u.partner}
                onClick={() => pick(u)}
                style={{
                  display: "flex", alignItems: "center", gap: 18,
                  padding: "20px 22px", borderRadius: 18,
                  background: "oklch(0.995 0.005 85)",
                  border: "1.5px solid var(--line)",
                  boxShadow: "var(--shadow-paper)",
                  cursor: "pointer", textAlign: "left",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lift)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-paper)";
                }}
              >
                <span style={{
                  width: 56, height: 56, borderRadius: 999, flexShrink: 0,
                  background: u.partner === "p1" ? "var(--coral-soft)" : "var(--olive-soft)",
                  boxShadow: `0 0 0 2px ${u.partner === "p1" ? "var(--coral)" : "var(--olive)"}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30,
                }}>
                  {u.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "var(--font-display)", fontStyle: "italic",
                    fontSize: 26, fontWeight: 400, lineHeight: 1,
                  }}>
                    {u.name}
                  </div>
                </div>
                <span style={{ color: "var(--ink-mute)", fontSize: 22 }}>→</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px", borderRadius: 14,
              background: selected?.partner === "p1" ? "var(--coral-soft)" : "var(--olive-soft)",
              border: `1.5px solid ${selected?.partner === "p1" ? "var(--coral)" : "var(--olive)"}`,
            }}>
              <span style={{ fontSize: 26 }}>{selected?.emoji}</span>
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, flex: 1 }}>
                {selected?.name}
              </span>
              <button
                onClick={() => { setStage("pick"); setErr(null); }}
                style={{
                  fontSize: 12, color: "var(--ink-mute)",
                  padding: "5px 12px", borderRadius: 999,
                  border: "1px solid var(--line)", background: "transparent",
                }}
              >
                change
              </button>
            </div>

            <input
              ref={inputRef}
              type="password"
              className="field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signIn()}
              autoComplete="current-password"
              style={{ fontSize: 16, padding: "14px 16px" }}
            />

            {err && (
              <p style={{
                fontSize: 13, color: "var(--coral-deep)", margin: 0,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--coral-soft)", border: "1px solid var(--coral)",
              }}>
                {err}
              </p>
            )}

            <button
              onClick={signIn}
              disabled={!password}
              className="btn btn-coral"
              style={{
                width: "100%", borderRadius: 14, fontSize: 16,
                padding: "14px 20px", marginTop: 4,
                opacity: !password ? 0.5 : 1,
              }}
            >
              Enter →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
