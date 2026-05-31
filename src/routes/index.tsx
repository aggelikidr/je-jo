import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LoginScreen } from "@/components/LoginScreen";
import { autoConnectHousehold, useSetup } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function LoadingScreen() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100dvh", gap: 12, background: "var(--paper)", fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        width: 44, height: 44, background: "var(--ink)", color: "var(--paper)",
        borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18,
        transform: "rotate(-3deg)", boxShadow: "0 2px 8px rgba(60,30,10,0.18)",
      }}>
        je·jo
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-mute)", margin: 0, letterSpacing: "0.04em" }}>
        loading your home…
      </p>
    </div>
  );
}

type AuthState = "loading" | "logged-out" | "ready";

function Index() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [setup] = useSetup();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setAuthState("logged-out"); return; }
      autoConnectHousehold().catch(console.error).finally(() => setAuthState("ready"));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        autoConnectHousehold().catch(console.error).finally(() => setAuthState("ready"));
      }
      if (event === "SIGNED_OUT") setAuthState("logged-out");
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authState === "loading" || (authState === "ready" && !setup)) return <LoadingScreen />;
  if (authState === "logged-out") return <LoginScreen />;
  return <AppShell />;
}
