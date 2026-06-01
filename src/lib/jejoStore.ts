import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "@/lib/store";

// ── Types ────────────────────────────────────────────────────

export type ApartmentStatus = "shortlist" | "scheduled" | "passed";
export type ApartmentReaction = "love" | "fine" | "veto";

export interface ApartmentNote {
  who: "p1" | "p2";
  text: string;
  at: number; // hours ago
}

export interface Apartment {
  id: string;
  title: string;
  area: string;
  price: number;
  sqm: number;
  floor: number;
  rooms: number;
  year: number;
  heat: string;
  source: string;
  url: string;
  photo: { hue: number; label: string; imageUrl?: string };
  status: ApartmentStatus;
  visitDate: string | null;
  reactions: { p1?: ApartmentReaction; p2?: ApartmentReaction };
  notes: ApartmentNote[];
  tags: string[];
}

export interface HubMood {
  text: string;
  who: "p1" | "p2";
  at: number; // hours ago
}

export interface HubActivity {
  who: "p1" | "p2";
  verb: string;
  what: string;
  at: number;
}

export interface Tweaks {
  hubLayout: "pinboard" | "today-fun" | "today" | "magazine";
  palette: "buttercream" | "paperwhite" | "mochi";
  density: "cozy" | "compact";
  showSpeech: boolean;
}

// ── Initial data ─────────────────────────────────────────────

function makeDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const INITIAL_APARTMENTS: Apartment[] = [
  {
    id: "ap1",
    title: "Bright 2-bed in Pangrati",
    area: "Pangrati, Athens",
    price: 850,
    sqm: 72,
    floor: 3,
    rooms: 2,
    year: 1972,
    heat: "Natural gas",
    source: "spitogatos.gr",
    url: "https://www.spitogatos.gr",
    photo: { hue: 28, label: "balcony · noon light" },
    status: "shortlist",
    visitDate: makeDate(4),
    reactions: { p1: "love", p2: "love" },
    notes: [
      { who: "p1", text: "The kitchen!! and the balcony 🥹", at: 3 },
      { who: "p2", text: "Cat-friendly? Need to ask.", at: 1 },
    ],
    tags: ["balcony", "renovated", "near metro"],
  },
  {
    id: "ap2",
    title: "Quiet 1-bed near Acropolis",
    area: "Koukaki",
    price: 720,
    sqm: 54,
    floor: 4,
    rooms: 1,
    year: 1965,
    heat: "Autonomous",
    source: "spitogatos.gr",
    url: "#",
    photo: { hue: 200, label: "living room · morning" },
    status: "scheduled",
    visitDate: makeDate(2),
    reactions: { p1: "love", p2: "fine" },
    notes: [{ who: "p2", text: "A bit small for both of us long-term?", at: 5 }],
    tags: ["quiet street", "rooftop"],
  },
  {
    id: "ap3",
    title: "3-bed loft, Kerameikos",
    area: "Kerameikos",
    price: 1100,
    sqm: 95,
    floor: 5,
    rooms: 3,
    year: 2015,
    heat: "A/C heat pump",
    source: "spitogatos.gr",
    url: "#",
    photo: { hue: 85, label: "loft · golden hour" },
    status: "shortlist",
    visitDate: null,
    reactions: { p1: "fine", p2: "love" },
    notes: [],
    tags: ["loft", "elevator", "south-facing"],
  },
  {
    id: "ap4",
    title: "Charming flat in Exarcheia",
    area: "Exarcheia",
    price: 680,
    sqm: 64,
    floor: 2,
    rooms: 2,
    year: 1958,
    heat: "Oil",
    source: "xe.gr",
    url: "#",
    photo: { hue: 120, label: "kitchen · evening" },
    status: "passed",
    visitDate: null,
    reactions: { p1: "veto", p2: "fine" },
    notes: [{ who: "p1", text: "The neighbours sounded… intense.", at: 6 }],
    tags: ["budget", "wood floors"],
  },
  {
    id: "ap5",
    title: "Sunlit duplex in Petralona",
    area: "Petralona",
    price: 920,
    sqm: 88,
    floor: 1,
    rooms: 2,
    year: 1978,
    heat: "Natural gas",
    source: "spitogatos.gr",
    url: "#",
    photo: { hue: 340, label: "bedroom · pink walls" },
    status: "shortlist",
    visitDate: makeDate(8),
    reactions: { p1: "love", p2: undefined },
    notes: [],
    tags: ["duplex", "garden"],
  },
];

const INITIAL_MOOD: HubMood = {
  text: "Pangrati or Koukaki? Either way, we're doing this.",
  who: "p1",
  at: 48,
};

const INITIAL_ACTIVITY: HubActivity[] = [
  { who: "p2", verb: "loved",       what: "the loft in Kerameikos",  at: 1 },
  { who: "p1", verb: "added",       what: "Sofa to the wishlist",     at: 4 },
  { who: "p2", verb: "scheduled",   what: "Koukaki viewing",          at: 6 },
  { who: "p1", verb: "checked off", what: "Set rent ceiling",         at: 12 },
  { who: "p2", verb: "vetoed",      what: "Exarcheia flat",           at: 26 },
  { who: "p1", verb: "agreed on",   what: "Vintage sofa pick",        at: 34 },
];

const DEFAULT_TWEAKS: Tweaks = {
  hubLayout: "today-fun",
  palette: "buttercream",
  density: "compact",
  showSpeech: true,
};

// ── Storage helpers ──────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Apartments — Supabase-backed ─────────────────────────────

const APTS_KEY = "jejo.apartments";

type ApartmentRow = {
  id: string;
  household_id: string;
  title: string;
  area: string;
  price: number;
  sqm: number;
  floor: number;
  rooms: number;
  year: number;
  heat: string;
  source: string;
  url: string;
  photo: { hue: number; label: string; imageUrl?: string };
  status: string;
  visit_date: string | null;
  reactions: { p1?: string; p2?: string };
  notes: ApartmentNote[];
  tags: string[];
  created_at: string;
};

function rowToApartment(r: ApartmentRow): Apartment {
  return {
    id: r.id,
    title: r.title,
    area: r.area,
    price: Number(r.price),
    sqm: Number(r.sqm),
    floor: r.floor,
    rooms: r.rooms,
    year: r.year,
    heat: r.heat,
    source: r.source,
    url: r.url,
    photo: r.photo as { hue: number; label: string; imageUrl?: string },
    status: r.status as ApartmentStatus,
    visitDate: r.visit_date ?? null,
    reactions: r.reactions as { p1?: ApartmentReaction; p2?: ApartmentReaction },
    notes: (r.notes ?? []) as ApartmentNote[],
    tags: r.tags ?? [],
  };
}

function apartmentToRow(householdId: string, a: Apartment): Record<string, unknown> {
  return {
    id: a.id,
    household_id: householdId,
    title: a.title,
    area: a.area,
    price: a.price,
    sqm: a.sqm,
    floor: a.floor,
    rooms: a.rooms,
    year: a.year,
    heat: a.heat,
    source: a.source,
    url: a.url,
    photo: a.photo,
    status: a.status,
    visit_date: a.visitDate ?? null,
    reactions: a.reactions,
    notes: a.notes,
    tags: a.tags,
  };
}

async function syncApartments(householdId: string, prev: Apartment[], next: Apartment[]) {
  const prevMap = new Map(prev.map((a) => [a.id, a]));
  const nextMap = new Map(next.map((a) => [a.id, a]));
  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; patch: Record<string, unknown> }[] = [];
  const deletes: string[] = [];

  for (const [id, a] of nextMap) {
    const p = prevMap.get(id);
    if (!p) {
      inserts.push(apartmentToRow(householdId, a));
    } else if (
      p.title !== a.title || p.area !== a.area || p.price !== a.price ||
      p.sqm !== a.sqm || p.floor !== a.floor || p.rooms !== a.rooms ||
      p.status !== a.status || p.visitDate !== a.visitDate || p.url !== a.url ||
      JSON.stringify(p.reactions) !== JSON.stringify(a.reactions) ||
      JSON.stringify(p.notes) !== JSON.stringify(a.notes) ||
      JSON.stringify(p.tags) !== JSON.stringify(a.tags) ||
      JSON.stringify(p.photo) !== JSON.stringify(a.photo)
    ) {
      updates.push({
        id,
        patch: {
          title: a.title, area: a.area, price: a.price, sqm: a.sqm,
          floor: a.floor, rooms: a.rooms, year: a.year, heat: a.heat,
          source: a.source, url: a.url, photo: a.photo,
          status: a.status, visit_date: a.visitDate ?? null,
          reactions: a.reactions, notes: a.notes, tags: a.tags,
        },
      });
    }
  }
  for (const id of prevMap.keys()) if (!nextMap.has(id)) deletes.push(id);

  if (inserts.length) await supabase.from("apartments").insert(inserts as never);
  for (const u of updates) await supabase.from("apartments").update(u.patch as never).eq("id", u.id);
  if (deletes.length) await supabase.from("apartments").delete().in("id", deletes);
}

export function useApartments(): [
  Apartment[],
  (v: Apartment[] | ((p: Apartment[]) => Apartment[])) => void,
] {
  const h = useHousehold();
  const [apts, setAptsState] = useState<Apartment[]>([]);
  const ref = useRef<Apartment[]>([]);
  ref.current = apts;

  useEffect(() => {
    if (!h) { setAptsState([]); return; }
    let cancelled = false;

    void supabase
      .from("apartments")
      .select("*")
      .eq("household_id", h.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return; // table unavailable — don't overwrite DB with demo data
        if (data && data.length > 0) {
          setAptsState((data as ApartmentRow[]).map(rowToApartment));
        } else {
          // First load on a fresh household — seed from localStorage or demo data
          const local = read<Apartment[]>(APTS_KEY, INITIAL_APARTMENTS);
          setAptsState(local);
          void supabase.from("apartments").upsert(
            local.map((a) => apartmentToRow(h.id, a)) as never,
            { onConflict: "id", ignoreDuplicates: true },
          );
        }
      });

    const channel = supabase
      .channel(`apartments-${h.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "apartments", filter: `household_id=eq.${h.id}` }, (payload) => {
        if (cancelled) return;
        setAptsState((prev) => {
          if (payload.eventType === "INSERT") {
            const a = rowToApartment(payload.new as ApartmentRow);
            return prev.find((x) => x.id === a.id) ? prev : [a, ...prev];
          }
          if (payload.eventType === "UPDATE") {
            const a = rowToApartment(payload.new as ApartmentRow);
            return prev.map((x) => (x.id === a.id ? a : x));
          }
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id: string }).id;
            return prev.filter((x) => x.id !== oldId);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [h?.id]);

  const setApts = useCallback(
    (v: Apartment[] | ((p: Apartment[]) => Apartment[])) => {
      if (!h) return;
      const prev = ref.current;
      const next = typeof v === "function" ? (v as (p: Apartment[]) => Apartment[])(prev) : v;
      setAptsState(next);
      void syncApartments(h.id, prev, next);
    },
    [h?.id],
  );

  return [apts, setApts];
}

// ── Mood — Supabase-backed ────────────────────────────────────

export function useMood(): [HubMood, (m: HubMood) => void] {
  const h = useHousehold();
  const [mood, setMoodState] = useState<HubMood>(INITIAL_MOOD);

  useEffect(() => {
    if (!h) { setMoodState(INITIAL_MOOD); return; }
    let cancelled = false;

    void supabase
      .from("hub_mood")
      .select("*")
      .eq("household_id", h.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setMoodState({ text: data.text, who: data.who as "p1" | "p2", at: data.at });
      });

    const channel = supabase
      .channel(`hub_mood-${h.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hub_mood", filter: `household_id=eq.${h.id}` }, (payload) => {
        if (cancelled || payload.eventType === "DELETE") return;
        const row = payload.new as { text: string; who: string; at: number };
        setMoodState({ text: row.text, who: row.who as "p1" | "p2", at: row.at });
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [h?.id]);

  const setMood = useCallback(
    (m: HubMood) => {
      setMoodState(m);
      if (!h) return;
      void supabase.from("hub_mood").upsert(
        { household_id: h.id, text: m.text, who: m.who, at: m.at, updated_at: new Date().toISOString() },
        { onConflict: "household_id" },
      );
    },
    [h?.id],
  );

  return [mood, setMood];
}

// ── Activity hook ─────────────────────────────────────────────

const ACTIVITY_KEY = "jejo.activity";

export function useActivity(): [
  HubActivity[],
  (v: HubActivity[] | ((p: HubActivity[]) => HubActivity[])) => void,
] {
  const [activity, setActivityState] = useState<HubActivity[]>(INITIAL_ACTIVITY);
  const ref = useRef<HubActivity[]>([]);
  ref.current = activity;

  useEffect(() => {
    setActivityState(read(ACTIVITY_KEY, INITIAL_ACTIVITY));
  }, []);

  const setActivity = useCallback(
    (v: HubActivity[] | ((p: HubActivity[]) => HubActivity[])) => {
      const next = typeof v === "function" ? (v as (p: HubActivity[]) => HubActivity[])(ref.current) : v;
      setActivityState(next);
      write(ACTIVITY_KEY, next);
    },
    [],
  );

  return [activity, setActivity];
}

// ── Tweaks hook ──────────────────────────────────────────────

const TWEAKS_KEY = "jejo.tweaks";

export function useTweaks(): [Tweaks, (key: keyof Tweaks, value: unknown) => void] {
  const [tweaks, setTweaksState] = useState<Tweaks>(DEFAULT_TWEAKS);

  useEffect(() => {
    setTweaksState(read(TWEAKS_KEY, DEFAULT_TWEAKS));
  }, []);

  const setTweak = useCallback((key: keyof Tweaks, value: unknown) => {
    setTweaksState((prev) => {
      const next = { ...prev, [key]: value };
      write(TWEAKS_KEY, next);
      return next;
    });
  }, []);

  return [tweaks, setTweak];
}

// ── isMobile hook ────────────────────────────────────────────

export function useIsMobile(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return m;
}

// ── Palette effect ───────────────────────────────────────────

export function usePaletteEffect(palette: string) {
  useEffect(() => {
    const root = document.documentElement;
    const palettes: Record<string, { paper: string; coral: string; olive: string }> = {
      buttercream: {
        paper: "oklch(0.965 0.018 85)",
        coral: "oklch(0.66 0.16 28)",
        olive: "oklch(0.62 0.12 120)",
      },
      paperwhite: {
        paper: "oklch(0.98 0.005 90)",
        coral: "oklch(0.62 0.18 18)",
        olive: "oklch(0.58 0.13 145)",
      },
      mochi: {
        paper: "oklch(0.97 0.018 30)",
        coral: "oklch(0.7 0.15 12)",
        olive: "oklch(0.65 0.11 165)",
      },
    };
    const p = palettes[palette] ?? palettes.buttercream;
    root.style.setProperty("--paper", p.paper);
    root.style.setProperty("--coral", p.coral);
    root.style.setProperty("--olive", p.olive);
    root.style.setProperty("--background", p.paper);
    root.style.setProperty("--primary", p.coral);
  }, [palette]);
}
