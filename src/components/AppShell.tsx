import { useState, type ReactNode } from "react";
import {
  useCurrentUser,
  useDisplayName,
  useSetup,
  useTasks,
  type PartnerKey,
  type Setup,
  type Task,
} from "@/lib/store";
import {
  useApartments,
  useMood,
  useActivity,
  useTweaks,
  useIsMobile,
  usePaletteEffect,
  type Apartment,
  type HubMood,
  type HubActivity,
  type Tweaks,
} from "@/lib/jejoStore";
import { Avatar, daysUntil } from "@/components/JejoUI";
import { HubScreen } from "@/components/HubScreen";
import { ApartmentsScreen } from "@/components/ApartmentsScreen";
import { FurnitureTab } from "@/components/FurnitureTab";
import { ChecklistScreen } from "@/components/ChecklistScreen";
import { ProgressScreen } from "@/components/ProgressScreen";

// ── Context shape passed to every screen ─────────────────────

export interface AppCtx {
  setup: Setup;
  currentUser: PartnerKey;
  setCurrentUser: (k: PartnerKey) => void;
  apartments: Apartment[];
  setApartments: (v: Apartment[] | ((p: Apartment[]) => Apartment[])) => void;
  tasks: Task[];
  setTasks: (v: Task[] | ((p: Task[]) => Task[])) => void;
  mood: HubMood;
  setMood: (m: HubMood) => void;
  activity: HubActivity[];
  setActivity: (v: HubActivity[] | ((p: HubActivity[]) => HubActivity[])) => void;
  tweak: Tweaks;
  setTweak: (key: keyof Tweaks, value: unknown) => void;
  isMobile: boolean;
  setTab: (t: TabKey) => void;
}

export type TabKey = "hub" | "apartments" | "furniture" | "checklist" | "progress";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "hub",        label: "Home",      emoji: "🏠" },
  { key: "apartments", label: "Places",    emoji: "🔑" },
  { key: "furniture",  label: "Furniture", emoji: "🛋️" },
  { key: "checklist",  label: "Checklist", emoji: "✏️" },
  { key: "progress",   label: "Progress",  emoji: "🌱" },
];

// ── Logo ──────────────────────────────────────────────────────

function Logo() {
  return (
    <div
      style={{
        width: 38, height: 38, flexShrink: 0,
        background: "var(--ink)", color: "var(--paper)",
        borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16,
        transform: "rotate(-3deg)", boxShadow: "var(--shadow-paper)",
      }}
    >
      je·jo
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────

interface MobileHeaderProps {
  tab: TabKey;
  setup: Setup;
  currentUser: PartnerKey;
  displayName: string;
}

function MobileHeader({ tab, setup, currentUser, displayName }: MobileHeaderProps) {
  const me = setup[currentUser];
  const shownName = displayName || me.name;
  const tabMeta = TABS.find((t) => t.key === tab);
  const days = setup.moveInDate ? daysUntil(setup.moveInDate) : null;

  const handleLogout = () => {
    import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.signOut());
  };

  return (
    <header className="app-header">
      <Logo />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 18, lineHeight: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {tabMeta?.label}
        </div>
        {days !== null && (
          <div
            style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--coral-deep)",
              letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1,
            }}
          >
            {days > 0 ? `${days} days to go` : days === 0 ? "today 🎉" : `${Math.abs(days)}d in`}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px 6px 6px",
            borderRadius: 999, background: "white",
            border: "1px solid var(--line)", boxShadow: "var(--shadow-paper)",
            fontSize: 13, minHeight: 44,
          }}
        >
          <Avatar who={currentUser} partner={me} size={26} ring />
          <span style={{ fontWeight: 500 }}>{shownName}</span>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: "white", border: "1px solid var(--line)",
            boxShadow: "var(--shadow-paper)", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ink-mute)", cursor: "pointer",
          }}
          aria-label="Sign out"
        >
          ↩
        </button>
      </div>
    </header>
  );
}

// ── Bottom nav ────────────────────────────────────────────────

interface BottomNavProps {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  urgentTaskCount: number;
  activePlacesCount: number;
}

function NavBadge({ count, color }: { count: number; color: string }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        position: "absolute",
        top: -4,
        right: -8,
        minWidth: 14,
        height: 14,
        padding: "0 3px",
        borderRadius: 999,
        background: color,
        color: "white",
        fontSize: 9,
        fontFamily: "var(--font-mono)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {count}
    </span>
  );
}

function BottomNav({ tab, setTab, urgentTaskCount, activePlacesCount }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className="bottom-nav-item"
          data-active={tab === t.key}
          onClick={() => setTab(t.key)}
        >
          <span className="nav-icon" style={{ position: "relative" }}>
            {t.emoji}
            {t.key === "checklist" && <NavBadge count={urgentTaskCount} color="var(--coral)" />}
            {t.key === "apartments" && <NavBadge count={activePlacesCount} color="var(--sun-deep)" />}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── App shell ─────────────────────────────────────────────────

export function AppShell() {
  const [setup] = useSetup();
  const [currentUser, setCurrentUser] = useCurrentUser();
  const displayName = useDisplayName();
  const [tab, setTab] = useState<TabKey>("hub");
  const isMobile = useIsMobile();
  const [apartments, setApartments] = useApartments();
  const [tasks, setTasks] = useTasks();
  const [mood, setMood] = useMood();
  const [activity, setActivity] = useActivity();
  const [tweak, setTweak] = useTweaks();

  usePaletteEffect(tweak.palette);

  if (!setup) return null;

  const activePlacesCount = apartments.filter((a) => a.status !== "passed").length;

  const urgentTaskCount = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && daysUntil(t.dueDate) <= 0,
  ).length;

  const ctx: AppCtx = {
    setup,
    currentUser,
    setCurrentUser,
    apartments,
    setApartments,
    tasks,
    setTasks,
    mood,
    setMood,
    activity,
    setActivity,
    tweak,
    setTweak,
    isMobile,
    setTab,
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      <MobileHeader
        tab={tab}
        setup={setup}
        currentUser={currentUser}
        displayName={displayName}
      />

      <main
        className="app-main"
        style={{
          paddingLeft: isMobile ? 0 : 36,
          paddingRight: isMobile ? 0 : 36,
          maxWidth: isMobile ? "none" : 1320,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div key={tab} className="fade-up" style={{ padding: isMobile ? "16px 16px 0" : 0 }}>
          {tab === "hub"        && <HubScreen ctx={ctx} />}
          {tab === "apartments" && <ApartmentsScreen ctx={ctx} />}
          {tab === "furniture"  && <FurnitureTab />}
          {tab === "checklist"  && <ChecklistScreen ctx={ctx} />}
          {tab === "progress"   && <ProgressScreen ctx={ctx} />}
        </div>
      </main>

      <BottomNav
        tab={tab}
        setTab={setTab}
        urgentTaskCount={urgentTaskCount}
        activePlacesCount={activePlacesCount}
      />
    </div>
  );
}

// ── Legacy exports kept for backward compat ───────────────────

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
