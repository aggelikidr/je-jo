import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PartnerKey = "p1" | "p2";

export interface Partner {
  name: string;
  emoji: string;
}

export interface Setup {
  p1: Partner;
  p2: Partner;
  moveInDate?: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  name: string;
  category: string;
  dueDate?: string;
  status: TaskStatus;
  addedBy: PartnerKey;
  createdAt: number;
  completedBy?: PartnerKey;
  assignee?: PartnerKey;
}

export type Reaction = "love" | "fine" | "veto";

export type FurnitureStatus = "have" | "need" | "discuss";

export interface WishLink {
  id: string;
  url: string;
  label?: string;
  price?: number;
  addedBy: PartnerKey;
  createdAt: number;
  reactions: { p1?: Reaction; p2?: Reaction };
}

export interface FurnitureItem {
  id: string;
  name: string;
  room: string;
  status: FurnitureStatus;
  note?: string;
  links: WishLink[];
  addedBy: PartnerKey;
  createdAt: number;
}

/** @deprecated kept for compat */
export interface WishItem {
  id: string;
  name: string;
  room: string;
  url?: string;
  price?: number;
  note?: string;
  addedBy: PartnerKey;
  createdAt: number;
  reactions: { p1?: Reaction; p2?: Reaction };
}

export const CATEGORIES = [
  "Search",
  "Money",
  "Moving",
  "Utilities",
  "Admin",
  "Joy",
] as const;

export const CATEGORY_EMOJI: Record<string, string> = {
  Search: "🔑",
  Money: "💰",
  Moving: "📦",
  Utilities: "💡",
  Admin: "📋",
  Joy: "🥂",
};

export interface Room {
  id: string;
  name: string;
  hue: number;
}

export const ROOM_CONFIG: Room[] = [
  { id: "living",  name: "Living room", hue: 30 },
  { id: "kitchen", name: "Kitchen",     hue: 90 },
  { id: "bedroom", name: "Bedroom",     hue: 340 },
  { id: "bath",    name: "Bathroom",    hue: 200 },
  { id: "study",   name: "Study nook",  hue: 230 },
  { id: "balcony", name: "Balcony",     hue: 120 },
  { id: "general", name: "General",     hue: 60 },
];

/** @deprecated use ROOM_CONFIG */
export const ROOMS = ROOM_CONFIG.map((r) => r.name);
export const ROOM_ICONS: Record<string, string> = {
  "Living room": "🛋️",
  Kitchen: "🍳",
  Bedroom: "🛏️",
  Bathroom: "🛁",
  "Study nook": "💻",
  Balcony: "🌿",
  General: "📦",
};

export const AVATAR_OPTIONS_1 = ["🦊", "🐻", "🌻", "🍑", "🔥", "🌶️", "🦁", "🍂"];
export const AVATAR_OPTIONS_2 = ["🌿", "🐢", "🌱", "🥑", "🦖", "🍀", "🐸", "🌳"];

const DEFAULT_TASKS: Omit<Task, "id" | "createdAt" | "addedBy">[] = [
  { name: "Pick neighbourhoods to focus on", category: "Search", status: "done" },
  { name: "Sign up alerts on Spitogatos & XE", category: "Search", status: "done" },
  { name: "Set monthly rent ceiling together", category: "Money", status: "done" },
  { name: "Book viewing for Koukaki flat", category: "Search", status: "in_progress", dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) },
  { name: "Ask landlord about pet policy", category: "Search", status: "todo", dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) },
  { name: "Save 2 months rent deposit", category: "Money", status: "in_progress", dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) },
  { name: "Compare moving companies (3 quotes)", category: "Moving", status: "todo", dueDate: new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10) },
  { name: "Sort what to keep / sell / donate", category: "Moving", status: "todo" },
  { name: "Internet + electricity transfer", category: "Utilities", status: "todo", dueDate: new Date(Date.now() + 55 * 86400000).toISOString().slice(0, 10) },
  { name: "Update address on bank & ID", category: "Admin", status: "todo", dueDate: new Date(Date.now() + 70 * 86400000).toISOString().slice(0, 10) },
  { name: "Throw a tiny housewarming 🥂", category: "Joy", status: "todo" },
];

export function uid() {
  return crypto.randomUUID();
}

/* ----------------------- Household (device-local ref) ----------------------- */

export interface HouseholdRef {
  id: string;
  code: string;
}

const HOUSEHOLD_KEY = "ourhome.household";
const CURRENT_KEY = "ourhome.current";

function readHousehold(): HouseholdRef | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(HOUSEHOLD_KEY);
    return v ? (JSON.parse(v) as HouseholdRef) : null;
  } catch {
    return null;
  }
}
function writeHousehold(h: HouseholdRef | null) {
  if (typeof window === "undefined") return;
  if (h) localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify(h));
  else localStorage.removeItem(HOUSEHOLD_KEY);
  window.dispatchEvent(new CustomEvent("ourhome:household"));
}

export function useHousehold(): HouseholdRef | null {
  const [h, setH] = useState<HouseholdRef | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setH(readHousehold());
    setHydrated(true);
    const handler = () => setH(readHousehold());
    window.addEventListener("ourhome:household", handler);
    return () => window.removeEventListener("ourhome:household", handler);
  }, []);
  return hydrated ? h : null;
}

export function useHouseholdHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

// ── Single shared household (Jela + JoJo) ────────────────────

const JEJO_CODE = "JEJOHOME";

const JEJO_SETUP: Setup = {
  p1: { name: "Jela", emoji: "🦊" },
  p2: { name: "JoJo", emoji: "🦖" },
};

export async function autoConnectHousehold(): Promise<void> {
  if (readHousehold()) return; // already connected

  // Try to find the shared household
  const { data: found } = await supabase
    .from("households")
    .select("id, code")
    .eq("code", JEJO_CODE)
    .maybeSingle();

  if (found) {
    writeHousehold({ id: found.id, code: found.code });
    return;
  }

  // First ever device — create the household
  const { data: created, error } = await supabase
    .from("households")
    .insert({ code: JEJO_CODE, setup: JEJO_SETUP as never })
    .select("id, code")
    .single();

  if (!error && created) {
    writeHousehold({ id: created.id, code: created.code });
    const seeds = DEFAULT_TASKS.map((t, i) => ({
      household_id: created.id,
      name: t.name,
      category: t.category,
      status: t.status,
      added_by: i % 2 === 0 ? "p1" : "p2",
    }));
    await supabase.from("tasks").insert(seeds);
  }
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createHousehold(setup: Setup): Promise<HouseholdRef> {
  // Try a few times in case of code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from("households")
      .insert({ code, setup: setup as never })
      .select("id, code")
      .single();
    if (!error && data) {
      const ref: HouseholdRef = { id: data.id, code: data.code };
      // Seed default tasks
      const seeds = DEFAULT_TASKS.map((t, i) => ({
        household_id: data.id,
        name: t.name,
        category: t.category,
        status: t.status,
        added_by: i % 2 === 0 ? "p1" : "p2",
      }));
      await supabase.from("tasks").insert(seeds);
      writeHousehold(ref);
      return ref;
    }
    if (error && !/duplicate|unique/i.test(error.message)) throw error;
  }
  throw new Error("Could not generate a unique code, please try again");
}

export async function joinHousehold(rawCode: string): Promise<HouseholdRef> {
  const code = rawCode.trim().toUpperCase();
  if (code.length < 4) throw new Error("Please enter a valid code");
  const { data, error } = await supabase
    .from("households")
    .select("id, code")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No home found with that code");
  const ref: HouseholdRef = { id: data.id, code: data.code };
  writeHousehold(ref);
  return ref;
}

export function leaveHousehold() {
  writeHousehold(null);
}

/* ----------------------- Current user (derived from auth session) ----------------------- */

export function useCurrentUser(): [PartnerKey, (p: PartnerKey) => void] {
  const [u, setU] = useState<PartnerKey>("p1");

  useEffect(() => {
    const apply = (meta?: Record<string, unknown> | null) => {
      const partner = meta?.partner;
      if (partner === "p1" || partner === "p2") setU(partner);
    };

    supabase.auth.getSession().then(({ data: { session } }) =>
      apply(session?.user?.user_metadata as Record<string, unknown>)
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      apply(session?.user?.user_metadata as Record<string, unknown>)
    );

    return () => subscription.unsubscribe();
  }, []);

  return [u, () => {}];
}

export function useDisplayName(): string {
  const [name, setName] = useState("");

  useEffect(() => {
    const apply = (meta?: Record<string, unknown> | null) => {
      const dn = meta?.display_name;
      if (typeof dn === "string" && dn) setName(dn);
    };

    supabase.auth.getSession().then(({ data: { session } }) =>
      apply(session?.user?.user_metadata as Record<string, unknown>)
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      apply(session?.user?.user_metadata as Record<string, unknown>)
    );

    return () => subscription.unsubscribe();
  }, []);

  return name;
}

/* ----------------------- Setup (from households.setup) ----------------------- */

export function useSetup(): [Setup | null, (s: Setup) => void] {
  const h = useHousehold();
  const [setup, setSetupState] = useState<Setup | null>(null);

  useEffect(() => {
    if (!h) {
      setSetupState(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("households")
      .select("setup")
      .eq("id", h.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          // Stale household ref (DB reset/deleted). Clear it so onboarding shows again.
          writeHousehold(null);
          return;
        }
        setSetupState(data.setup as unknown as Setup);
      });
    const channel = supabase
      .channel(`household-${h.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "households", filter: `id=eq.${h.id}` },
        (payload) => {
          if (!cancelled)
            setSetupState((payload.new as { setup: Setup }).setup);
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [h?.id]);

  const setSetup = useCallback(
    (s: Setup) => {
      if (!h) return;
      setSetupState(s);
      void supabase.from("households").update({ setup: s as never }).eq("id", h.id);
    },
    [h?.id],
  );

  return [setup, setSetup];
}

/* ----------------------- Tasks ----------------------- */

type TaskRow = {
  id: string;
  name: string;
  category: string;
  due_date: string | null;
  status: TaskStatus;
  added_by: PartnerKey;
  completed_by: PartnerKey | null;
  created_at: string;
};

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    dueDate: r.due_date ?? undefined,
    status: r.status,
    addedBy: r.added_by,
    createdAt: new Date(r.created_at).getTime(),
    completedBy: r.completed_by ?? undefined,
  };
}

export function useTasks(): [Task[], (v: Task[] | ((p: Task[]) => Task[])) => void] {
  const h = useHousehold();
  const [tasks, setTasks] = useState<Task[]>([]);
  const ref = useRef<Task[]>([]);
  ref.current = tasks;

  useEffect(() => {
    if (!h) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    void supabase
      .from("tasks")
      .select("*")
      .eq("household_id", h.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled && data) setTasks((data as TaskRow[]).map(rowToTask));
      });
    const channel = supabase
      .channel(`tasks-${h.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `household_id=eq.${h.id}` },
        (payload) => {
          if (cancelled) return;
          setTasks((prev) => {
            if (payload.eventType === "INSERT") {
              const t = rowToTask(payload.new as TaskRow);
              return prev.find((x) => x.id === t.id) ? prev : [t, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const t = rowToTask(payload.new as TaskRow);
              return prev.map((x) => (x.id === t.id ? t : x));
            }
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return prev.filter((x) => x.id !== oldId);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [h?.id]);

  const setter = useCallback(
    (v: Task[] | ((p: Task[]) => Task[])) => {
      if (!h) return;
      const prev = ref.current;
      const next = typeof v === "function" ? (v as (p: Task[]) => Task[])(prev) : v;
      setTasks(next);
      void syncTasks(h.id, prev, next);
    },
    [h?.id],
  );

  return [tasks, setter];
}

async function syncTasks(householdId: string, prev: Task[], next: Task[]) {
  const prevMap = new Map(prev.map((t) => [t.id, t]));
  const nextMap = new Map(next.map((t) => [t.id, t]));

  const inserts: Array<Record<string, unknown>> = [];
  const updates: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const deletes: string[] = [];

  for (const [id, t] of nextMap) {
    const p = prevMap.get(id);
    if (!p) {
      inserts.push({
        id: t.id,
        household_id: householdId,
        name: t.name,
        category: t.category,
        due_date: t.dueDate ?? null,
        status: t.status,
        added_by: t.addedBy,
        completed_by: t.completedBy ?? null,
      });
    } else if (
      p.name !== t.name ||
      p.category !== t.category ||
      p.dueDate !== t.dueDate ||
      p.status !== t.status ||
      p.completedBy !== t.completedBy
    ) {
      updates.push({
        id,
        patch: {
          name: t.name,
          category: t.category,
          due_date: t.dueDate ?? null,
          status: t.status,
          completed_by: t.completedBy ?? null,
        },
      });
    }
  }
  for (const id of prevMap.keys()) if (!nextMap.has(id)) deletes.push(id);

  if (inserts.length) await supabase.from("tasks").insert(inserts as never);
  for (const u of updates) await supabase.from("tasks").update(u.patch as never).eq("id", u.id);
  if (deletes.length) await supabase.from("tasks").delete().in("id", deletes);
}

/* ----------------------- Furniture + Wish links ----------------------- */

type FurnitureRow = {
  id: string;
  name: string;
  room: string;
  status: FurnitureStatus;
  note: string | null;
  added_by: PartnerKey;
  created_at: string;
};
type LinkRow = {
  id: string;
  item_id: string;
  url: string;
  label: string | null;
  price: number | string | null;
  added_by: PartnerKey;
  reactions: { p1?: Reaction; p2?: Reaction } | null;
  created_at: string;
};

function rowsToFurniture(items: FurnitureRow[], links: LinkRow[]): FurnitureItem[] {
  const byItem = new Map<string, WishLink[]>();
  for (const l of links) {
    const list = byItem.get(l.item_id) ?? [];
    list.push({
      id: l.id,
      url: l.url,
      label: l.label ?? undefined,
      price: l.price != null ? Number(l.price) : undefined,
      addedBy: l.added_by,
      createdAt: new Date(l.created_at).getTime(),
      reactions: l.reactions ?? {},
    });
    byItem.set(l.item_id, list);
  }
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    room: i.room,
    status: i.status,
    note: i.note ?? undefined,
    addedBy: i.added_by,
    createdAt: new Date(i.created_at).getTime(),
    links: (byItem.get(i.id) ?? []).sort((a, b) => a.createdAt - b.createdAt),
  }));
}

export function useFurniture(): [
  FurnitureItem[],
  (v: FurnitureItem[] | ((p: FurnitureItem[]) => FurnitureItem[])) => void,
] {
  const h = useHousehold();
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const ref = useRef<FurnitureItem[]>([]);
  ref.current = items;

  useEffect(() => {
    if (!h) {
      setItems([]);
      return;
    }
    let cancelled = false;
    const reload = async () => {
      const { data: its } = await supabase
        .from("furniture_items")
        .select("*")
        .eq("household_id", h.id)
        .order("created_at", { ascending: false });
      const ids = (its ?? []).map((i) => i.id);
      let lns: LinkRow[] = [];
      if (ids.length) {
        const { data } = await supabase.from("wish_links").select("*").in("item_id", ids);
        lns = (data ?? []) as LinkRow[];
      }
      if (!cancelled) setItems(rowsToFurniture((its ?? []) as FurnitureRow[], lns));
    };
    void reload();
    const channel = supabase
      .channel(`furniture-${h.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "furniture_items",
          filter: `household_id=eq.${h.id}`,
        },
        () => void reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wish_links" },
        () => void reload(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [h?.id]);

  const setter = useCallback(
    (v: FurnitureItem[] | ((p: FurnitureItem[]) => FurnitureItem[])) => {
      if (!h) return;
      const prev = ref.current;
      const next = typeof v === "function" ? (v as (p: FurnitureItem[]) => FurnitureItem[])(prev) : v;
      setItems(next);
      void syncFurniture(h.id, prev, next);
    },
    [h?.id],
  );

  return [items, setter];
}

async function syncFurniture(hid: string, prev: FurnitureItem[], next: FurnitureItem[]) {
  const prevMap = new Map(prev.map((i) => [i.id, i]));
  const nextMap = new Map(next.map((i) => [i.id, i]));

  const insItems: Array<Record<string, unknown>> = [];
  const updItems: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const delItems: string[] = [];

  for (const [id, it] of nextMap) {
    const p = prevMap.get(id);
    if (!p) {
      insItems.push({
        id: it.id,
        household_id: hid,
        name: it.name,
        room: it.room,
        status: it.status,
        note: it.note ?? null,
        added_by: it.addedBy,
      });
    } else if (
      p.name !== it.name ||
      p.room !== it.room ||
      p.status !== it.status ||
      p.note !== it.note
    ) {
      updItems.push({
        id,
        patch: {
          name: it.name,
          room: it.room,
          status: it.status,
          note: it.note ?? null,
        },
      });
    }
  }
  for (const id of prevMap.keys()) if (!nextMap.has(id)) delItems.push(id);

  // Flatten links
  const prevLinks = new Map<string, WishLink & { itemId: string }>();
  for (const it of prev) for (const l of it.links) prevLinks.set(l.id, { ...l, itemId: it.id });
  const nextLinks = new Map<string, WishLink & { itemId: string }>();
  for (const it of next) for (const l of it.links) nextLinks.set(l.id, { ...l, itemId: it.id });

  const insLinks: Array<Record<string, unknown>> = [];
  const updLinks: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const delLinks: string[] = [];

  for (const [id, l] of nextLinks) {
    const p = prevLinks.get(id);
    if (!p) {
      insLinks.push({
        id: l.id,
        item_id: l.itemId,
        url: l.url,
        label: l.label ?? null,
        price: l.price ?? null,
        added_by: l.addedBy,
        reactions: l.reactions ?? {},
      });
    } else if (
      JSON.stringify(p.reactions) !== JSON.stringify(l.reactions) ||
      p.url !== l.url ||
      p.label !== l.label ||
      p.price !== l.price
    ) {
      updLinks.push({
        id,
        patch: {
          url: l.url,
          label: l.label ?? null,
          price: l.price ?? null,
          reactions: l.reactions ?? {},
        },
      });
    }
  }
  for (const id of prevLinks.keys()) if (!nextLinks.has(id)) delLinks.push(id);

  if (insItems.length) await supabase.from("furniture_items").insert(insItems as never);
  for (const u of updItems)
    await supabase.from("furniture_items").update(u.patch as never).eq("id", u.id);
  if (insLinks.length) await supabase.from("wish_links").insert(insLinks as never);
  for (const u of updLinks)
    await supabase.from("wish_links").update(u.patch as never).eq("id", u.id);
  if (delLinks.length) await supabase.from("wish_links").delete().in("id", delLinks);
  if (delItems.length) await supabase.from("furniture_items").delete().in("id", delItems);
}

/* ----------------------- Deprecated stubs (kept for compat) ----------------------- */

export function useWishlist(): [WishItem[], (v: WishItem[]) => void] {
  return [[], () => {}];
}

export function seedDefaultTasks(): Task[] {
  return [];
}
