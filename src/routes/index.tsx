import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Onboarding } from "@/components/Onboarding";
import { AppShell } from "@/components/AppShell";
import { useHousehold, useSetup } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const household = useHousehold();
  const [setup] = useSetup();

  if (!mounted) return <div className="min-h-dvh bg-background" />;
  if (!household) return <Onboarding />;
  if (!setup) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100dvh", gap: 12, background: "var(--paper)",
        fontFamily: "var(--font-sans)",
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
  return <AppShell />;
}
