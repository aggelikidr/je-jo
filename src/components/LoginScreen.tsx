import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Stage = "form" | "busy";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [err, setErr] = useState<string | null>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const signIn = async () => {
    if (!email.trim() || !password || stage === "busy") return;
    setStage("busy");
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setErr("Wrong email or password — try again.");
      setStage("form");
    }
    // On success, onAuthStateChange in index.tsx handles the redirect automatically
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
      <div style={{ width: "100%", maxWidth: 360 }}>

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
            Welcome home.
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", margin: "8px 0 0" }}>
            Sign in to your shared space.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && passRef.current?.focus()}
            autoComplete="email"
            style={{ fontSize: 16, padding: "14px 16px" }}
          />

          <input
            ref={passRef}
            className="field"
            type="password"
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
            disabled={!email.trim() || !password || stage === "busy"}
            className="btn btn-coral"
            style={{
              width: "100%", borderRadius: 14, fontSize: 16,
              padding: "14px 20px", marginTop: 4,
              opacity: !email.trim() || !password || stage === "busy" ? 0.5 : 1,
            }}
          >
            {stage === "busy" ? "Signing in…" : "Sign in →"}
          </button>
        </div>

      </div>
    </div>
  );
}
