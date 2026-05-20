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
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        Loading your home…
      </div>
    );
  }
  return <AppShell />;
}
