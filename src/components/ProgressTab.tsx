import { useMemo } from "react";
import { CATEGORIES, useSetup, useTasks, useWishlist } from "@/lib/store";
import { Avatar } from "./Avatar";

export function ProgressTab({ onJump }: { onJump: (t: "checklist" | "wishlist") => void }) {
  const [setup] = useSetup();
  const [tasks] = useTasks();
  const [wish] = useWishlist();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const byCat = CATEGORIES.map((c) => {
      const items = tasks.filter((t) => t.category === c);
      return {
        cat: c,
        total: items.length,
        done: items.filter((i) => i.status === "done").length,
      };
    });
    const p1 = tasks.filter((t) => t.status === "done" && t.completedBy === "p1").length;
    const p2 = tasks.filter((t) => t.status === "done" && t.completedBy === "p2").length;

    const loved = wish.filter(
      (i) => i.reactions.p1 === "love" && i.reactions.p2 === "love",
    ).length;
    const vetoed = wish.filter((i) => i.reactions.p1 === "veto" || i.reactions.p2 === "veto").length;
    const undecided = wish.filter((i) => !i.reactions.p1 || !i.reactions.p2).length;
    const budget = wish.reduce((s, i) => s + (i.price || 0), 0);

    return { total, done, byCat, p1, p2, loved, vetoed, undecided, budget };
  }, [tasks, wish]);

  if (!setup) return null;

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const days = setup.moveInDate ? daysUntil(setup.moveInDate) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-serif font-semibold">Progress</h2>

      {/* Milestone */}
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-terracotta/15 via-warmth/10 to-sage/15 p-6 shadow-soft">
        <div className="text-xs font-medium uppercase tracking-wider text-foreground/60">
          Moving in together
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            {days != null ? (
              <>
                <div className="font-serif text-4xl font-semibold">
                  {days > 0 ? `${days}` : days === 0 ? "Today" : `${Math.abs(days)}`}
                </div>
                <div className="text-sm text-foreground/70">
                  {days > 0
                    ? `days until ${setup.moveInDate}`
                    : days === 0
                      ? "It's the day! 🎉"
                      : `days since ${setup.moveInDate}`}
                </div>
              </>
            ) : (
              <>
                <div className="font-serif text-2xl font-semibold">No date set yet</div>
                <div className="text-sm text-foreground/70">
                  Add one in setup to see a countdown.
                </div>
              </>
            )}
          </div>
          <div className="flex -space-x-2">
            <Avatar partner={setup.p1} who="p1" size="lg" />
            <Avatar partner={setup.p2} who="p2" size="lg" />
          </div>
        </div>
      </section>

      {/* Checklist ring */}
      <section
        onClick={() => onJump("checklist")}
        className="cursor-pointer rounded-3xl border bg-card p-6 shadow-soft transition hover:shadow-card"
      >
        <div className="flex items-center gap-5">
          <Ring percent={pct} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Checklist
            </div>
            <div className="font-serif text-2xl font-semibold">
              {stats.done} of {stats.total} done
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {pct === 100
                ? "All done — well done you two 🌟"
                : pct >= 50
                  ? "More than halfway there!"
                  : "Every little step counts."}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {stats.byCat.filter((c) => c.total > 0).map((c) => {
            const p = c.total ? (c.done / c.total) * 100 : 0;
            return (
              <div key={c.cat}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{c.cat}</span>
                  <span>
                    {c.done}/{c.total}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pulling weight */}
      <section className="rounded-3xl border bg-card p-6 shadow-soft">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Who's pulling their weight?
        </div>
        <p className="mt-1 text-sm text-muted-foreground">A team effort 🌟</p>

        <div className="mt-4 space-y-4">
          <WeightBar partner={setup.p1} who="p1" count={stats.p1} max={Math.max(stats.p1, stats.p2, 1)} />
          <WeightBar partner={setup.p2} who="p2" count={stats.p2} max={Math.max(stats.p1, stats.p2, 1)} />
        </div>
      </section>

      {/* Wishlist stats */}
      <section
        onClick={() => onJump("wishlist")}
        className="cursor-pointer rounded-3xl border bg-card p-6 shadow-soft transition hover:shadow-card"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Wishlist
            </div>
            <div className="font-serif text-2xl font-semibold">{wish.length} items saved</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Budget</div>
            <div className="font-serif text-2xl font-semibold">€{stats.budget.toFixed(0)}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Both love" value={stats.loved} emoji="❤️" />
          <Stat label="Vetoed" value={stats.vetoed} emoji="⚠️" />
          <Stat label="Undecided" value={stats.undecided} emoji="🤔" />
        </div>
      </section>
    </div>
  );
}

function daysUntil(date: string) {
  const d = new Date(date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function Ring({ percent }: { percent: number }) {
  const size = 84;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--muted)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="var(--font-serif)"
        fontWeight="600"
        fontSize="20"
        fill="var(--foreground)"
      >
        {percent}%
      </text>
    </svg>
  );
}

function WeightBar({
  partner,
  who,
  count,
  max,
}: {
  partner: { name: string; emoji: string };
  who: "p1" | "p2";
  count: number;
  max: number;
}) {
  const pct = (count / max) * 100;
  const barColor = who === "p1" ? "bg-terracotta" : "bg-sage";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Avatar partner={partner} who={who} size="sm" />
          <span className="font-medium">{partner.name}</span>
        </div>
        <span className="text-muted-foreground">{count} tasks 🌟</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-3 py-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-0.5 font-serif text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
