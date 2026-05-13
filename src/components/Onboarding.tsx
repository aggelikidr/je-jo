import { useState } from "react";
import {
  AVATAR_OPTIONS_1,
  AVATAR_OPTIONS_2,
  useSetup,
  useTasks,
  seedDefaultTasks,
  type Setup,
} from "@/lib/store";

export function Onboarding() {
  const [, setSetup] = useSetup();
  const [, setTasks] = useTasks();
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [emoji1, setEmoji1] = useState(AVATAR_OPTIONS_1[0]);
  const [emoji2, setEmoji2] = useState(AVATAR_OPTIONS_2[0]);
  const [moveDate, setMoveDate] = useState("");

  const canSubmit = name1.trim() && name2.trim();

  const submit = () => {
    if (!canSubmit) return;
    const setup: Setup = {
      p1: { name: name1.trim(), emoji: emoji1 },
      p2: { name: name2.trim(), emoji: emoji2 },
      moveInDate: moveDate || undefined,
    };
    setSetup(setup);
    setTasks(seedDefaultTasks());
  };

  return (
    <div className="min-h-dvh bg-background px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <div className="text-5xl">🏠</div>
          <h1 className="mt-4 text-4xl font-serif font-semibold">Our Home</h1>
          <p className="mt-2 text-muted-foreground">
            A little space to plan your move-in together.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          <PartnerSetup
            label="Partner 1"
            tone="terracotta"
            name={name1}
            setName={setName1}
            emoji={emoji1}
            setEmoji={setEmoji1}
            options={AVATAR_OPTIONS_1}
          />
          <PartnerSetup
            label="Partner 2"
            tone="sage"
            name={name2}
            setName={setName2}
            emoji={emoji2}
            setEmoji={setEmoji2}
            options={AVATAR_OPTIONS_2}
          />

          <div>
            <label className="text-sm font-medium text-foreground/80">
              Move-in date <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              className="mt-2 w-full rounded-2xl border bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full rounded-2xl bg-primary py-4 text-base font-medium text-primary-foreground shadow-card transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-95 enabled:active:scale-[0.99]"
          >
            Let's begin →
          </button>
        </div>
      </div>
    </div>
  );
}

function PartnerSetup({
  label,
  tone,
  name,
  setName,
  emoji,
  setEmoji,
  options,
}: {
  label: string;
  tone: "terracotta" | "sage";
  name: string;
  setName: (v: string) => void;
  emoji: string;
  setEmoji: (v: string) => void;
  options: string[];
}) {
  const dot = tone === "terracotta" ? "bg-terracotta" : "bg-sage";
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Their name"
        className="mt-3 w-full rounded-2xl border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="mt-4 grid grid-cols-8 gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => setEmoji(o)}
            className={`flex h-10 items-center justify-center rounded-xl border text-xl transition ${
              emoji === o
                ? tone === "terracotta"
                  ? "border-terracotta bg-terracotta/10"
                  : "border-sage bg-sage/10"
                : "border-border hover:bg-muted"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
