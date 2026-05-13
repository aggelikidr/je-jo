import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Onboarding } from "@/components/Onboarding";
import { AppShell } from "@/components/AppShell";
import { useSetup } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [setup] = useSetup();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-dvh bg-background" />;
  }
  return setup ? <AppShell /> : <Onboarding />;
}
