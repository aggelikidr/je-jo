import { useState, type ReactNode } from "react";
import { useCurrentUser, useSetup } from "@/lib/store";
import { Avatar } from "./Avatar";
import { ChecklistTab } from "./ChecklistTab";
import { FurnitureTab } from "./FurnitureTab";
import { ProgressTab } from "./ProgressTab";

type TabKey = "checklist" | "furniture" | "progress";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "checklist", label: "Checklist", icon: "🏡" },
  { key: "furniture", label: "Furniture", icon: "🛋️" },
  { key: "progress", label: "Progress", icon: "📊" },
];

export function AppShell() {
  const [setup] = useSetup();
  const [current, setCurrent] = useCurrentUser();
  const [tab, setTab] = useState<TabKey>("checklist");

  if (!setup) return null;
  const me = setup[current];
  const other = current === "p1" ? setup.p2 : setup.p1;

  return (
    <div className="min-h-dvh bg-background pb-24 sm:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <h1 className="text-xl font-serif font-semibold leading-none">Our Home</h1>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden gap-1 rounded-full bg-muted/60 p-1 sm:flex">
            {TABS.map((t) => (
              <TabButton
                key={t.key}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
                icon={t.icon}
                label={t.label}
              />
            ))}
          </nav>

          <button
            onClick={() => setCurrent(current === "p1" ? "p2" : "p1")}
            className="flex items-center gap-2 rounded-full border bg-card px-2 py-1 pr-3 text-sm shadow-soft transition hover:shadow-card"
            aria-label="Switch partner"
          >
            <Avatar partner={me} who={current} size="sm" active />
            <span className="font-medium">{me.name}</span>
            <span className="text-muted-foreground">⇄</span>
            <Avatar partner={other} who={current === "p1" ? "p2" : "p1"} size="sm" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6 sm:py-10">
        <div key={tab} className="animate-fade-up">
          {tab === "checklist" && <ChecklistTab />}
          {tab === "furniture" && <FurnitureTab />}
          {tab === "progress" && <ProgressTab onJump={setTab} />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition ${
                tab === t.key ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

export function FAB({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground shadow-card transition active:scale-95 sm:bottom-8"
    >
      +
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-fade-up rounded-t-3xl bg-card p-6 shadow-card sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
