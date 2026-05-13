import { useEffect, useState, useCallback } from "react";

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

/** @deprecated kept for backwards compatibility with old localStorage data */
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
  "📦 Packing & Logistics",
  "🏠 New Home Setup",
  "📋 Admin & Documents",
  "🛒 Shopping & Supplies",
  "🔧 Repairs & Maintenance",
  "🎉 First Week Celebrations",
] as const;

export const ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Home Office",
  "Hallway",
  "Outdoor",
  "Storage",
] as const;

export const ROOM_ICONS: Record<string, string> = {
  "Living Room": "🛋️",
  Bedroom: "🛏️",
  Kitchen: "🍳",
  Bathroom: "🛁",
  "Home Office": "💻",
  Hallway: "🚪",
  Outdoor: "🌿",
  Storage: "📦",
};

export const AVATAR_OPTIONS_1 = ["🦊", "🐻", "🌻", "🍑", "🔥", "🌶️", "🦁", "🍂"];
export const AVATAR_OPTIONS_2 = ["🌿", "🐢", "🌱", "🥑", "🦖", "🍀", "🐸", "🌳"];

const DEFAULT_TASKS: Omit<Task, "id" | "createdAt" | "addedBy">[] = [
  { name: "Order moving boxes", category: CATEGORIES[0], status: "todo" },
  { name: "Book moving van", category: CATEGORIES[0], status: "todo" },
  { name: "Pack non-essentials", category: CATEGORIES[0], status: "todo" },
  { name: "Label boxes by room", category: CATEGORIES[0], status: "todo" },
  { name: "Set up wifi & internet", category: CATEGORIES[1], status: "todo" },
  { name: "Hang curtains", category: CATEGORIES[1], status: "todo" },
  { name: "Assemble bed frame", category: CATEGORIES[1], status: "todo" },
  { name: "Update address with bank", category: CATEGORIES[2], status: "todo" },
  { name: "Transfer utilities", category: CATEGORIES[2], status: "todo" },
  { name: "Sign rental agreement", category: CATEGORIES[2], status: "todo" },
  { name: "Buy groceries for first night", category: CATEGORIES[3], status: "todo" },
  { name: "Stock cleaning supplies", category: CATEGORIES[3], status: "todo" },
  { name: "Fix leaky tap", category: CATEGORIES[4], status: "todo" },
  { name: "Plan housewarming dinner", category: CATEGORIES[5], status: "todo" },
  { name: "Take a 'first night' photo 📸", category: CATEGORIES[5], status: "todo" },
];

const KEYS = {
  setup: "ourhome.setup",
  current: "ourhome.current",
  tasks: "ourhome.tasks",
  wish: "ourhome.wish",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("ourhome:update", { detail: { key } }));
}

function useStored<T>(key: string, fallback: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read(key, fallback));
    setHydrated(true);
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ key: string }>;
      if (ev.detail?.key === key) setValue(read(key, fallback));
    };
    window.addEventListener("ourhome:update", handler);
    return () => window.removeEventListener("ourhome:update", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setter = useCallback(
    (v: T | ((p: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        write(key, next);
        return next;
      });
    },
    [key],
  );

  return [hydrated ? value : fallback, setter];
}

export function useSetup() {
  return useStored<Setup | null>(KEYS.setup, null);
}

export function useCurrentUser() {
  return useStored<PartnerKey>(KEYS.current, "p1");
}

export function useTasks() {
  return useStored<Task[]>(KEYS.tasks, []);
}

export function useWishlist() {
  return useStored<WishItem[]>(KEYS.wish, []);
}

export function seedDefaultTasks(): Task[] {
  const now = Date.now();
  return DEFAULT_TASKS.map((t, i) => ({
    ...t,
    id: `seed-${i}`,
    createdAt: now + i,
    addedBy: (i % 2 === 0 ? "p1" : "p2") as PartnerKey,
  }));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
