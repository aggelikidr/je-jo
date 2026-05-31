import { useState, useEffect, useCallback, useRef } from "react";

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

// ── Apartments hook ──────────────────────────────────────────

const APTS_KEY = "jejo.apartments";

export function useApartments(): [
  Apartment[],
  (v: Apartment[] | ((p: Apartment[]) => Apartment[])) => void,
] {
  const [apts, setAptsState] = useState<Apartment[]>([]);
  const ref = useRef<Apartment[]>([]);
  ref.current = apts;

  useEffect(() => {
    setAptsState(read(APTS_KEY, INITIAL_APARTMENTS));
  }, []);

  const setApts = useCallback(
    (v: Apartment[] | ((p: Apartment[]) => Apartment[])) => {
      const next = typeof v === "function" ? (v as (p: Apartment[]) => Apartment[])(ref.current) : v;
      setAptsState(next);
      write(APTS_KEY, next);
    },
    [],
  );

  return [apts, setApts];
}

// ── Mood hook ────────────────────────────────────────────────

const MOOD_KEY = "jejo.mood";

export function useMood(): [HubMood, (m: HubMood) => void] {
  const [mood, setMoodState] = useState<HubMood>(INITIAL_MOOD);

  useEffect(() => {
    setMoodState(read(MOOD_KEY, INITIAL_MOOD));
  }, []);

  const setMood = useCallback((m: HubMood) => {
    setMoodState(m);
    write(MOOD_KEY, m);
  }, []);

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
