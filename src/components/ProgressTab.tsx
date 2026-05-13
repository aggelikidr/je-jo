import { useMemo } from "react";
import {
  CATEGORIES,
  ROOMS,
  ROOM_ICONS,
  useFurniture,
  useSetup,
  useTasks,
  type FurnitureItem,
} from "@/lib/store";
import { Avatar } from "./Avatar";

export function ProgressTab({ onJump }: { onJump: (t: "checklist" | "furniture") => void }) {
  const [setup] = useSetup();
  const [tasks] = useTasks();
  const [furniture] = useFurniture();

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
    return { total, done, byCat, p1, p2 };
  }, [tasks]);

  const f = useMemo(() => furnitureStats(furniture), [furniture]);

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

      {/* Furniture */}
      <section
        onClick={() => onJump("furniture")}
        className="cursor-pointer rounded-3xl border bg-card p-6 shadow-soft transition hover:shadow-card"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Furniture
            </div>
            <div className="font-serif text-2xl font-semibold">
              {f.total} {f.total === 1 ? "item" : "items"} tracked
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Budget</div>
            <div className="font-serif text-2xl font-semibold">€{f.budget.toFixed(0)}</div>
          </div>
        </div>

        {f.total === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Start adding pieces room by room to see your progress.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Have" value={f.have} emoji="✅" />
              <Stat label="Need" value={f.need} emoji="🛒" />
              <Stat label="Discuss" value={f.discuss} emoji="🤔" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat
                label="With a winning pick"
                value={f.withWinner}
                hint={`${f.needingDecision} still deciding`}
              />
              <MiniStat
                label="Need ideas"
                value={f.needNoLinks}
                hint={
                  f.needNoLinks > 0
                    ? `Still missing ideas for ${f.needNoLinks} ${f.needNoLinks === 1 ? "item" : "items"}`
                    : "Every need has at least one idea ✨"
                }
              />
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                By room
              </div>
              {ROOMS.map((r) => {
                const rs = f.byRoom[r];
                if (!rs || rs.total === 0) return null;
                return <RoomDonutRow key={r} room={r} stats={rs} />;
              })}
            </div>
          </>
        )}
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

interface RoomStats {
  have: number;
  need: number;
  discuss: number;
  total: number;
}

function furnitureStats(items: FurnitureItem[]) {
  const byRoom: Record<string, RoomStats> = {};
  let have = 0;
  let need = 0;
  let discuss = 0;
  let withWinner = 0;
  let needNoLinks = 0;
  let budget = 0;

  for (const it of items) {
    const r = (byRoom[it.room] ??= { have: 0, need: 0, discuss: 0, total: 0 });
    r.total++;
    r[it.status]++;
    if (it.status === "have") have++;
    if (it.status === "need") need++;
    if (it.status === "discuss") discuss++;

    const winners = it.links.filter(
      (l) => l.reactions.p1 === "love" && l.reactions.p2 === "love",
    );
    if (winners.length > 0) {
      withWinner++;
      // Sum the cheapest winning pick (the chosen one)
      const prices = winners.map((l) => l.price ?? 0);
      budget += Math.min(...prices);
    } else {
      // For items without consensus, count any loved link from either partner as soft-budget
      const lovedAny = it.links.find(
        (l) => l.reactions.p1 === "love" || l.reactions.p2 === "love",
      );
      if (lovedAny?.price) budget += lovedAny.price;
    }

    if ((it.status === "need" || it.status === "discuss") && it.links.length === 0) {
      needNoLinks++;
    }
  }

  const needingDecision = need + discuss - withWinner;
  return {
    total: items.length,
    have,
    need,
    discuss,
    withWinner,
    needingDecision: Math.max(0, needingDecision),
    needNoLinks,
    budget,
    byRoom,
  };
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

function Donut({ stats }: { stats: RoomStats }) {
  const size = 44;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = stats.total || 1;
  const segs = [
    { v: stats.have, color: "var(--success)" },
    { v: stats.discuss, color: "var(--warn)" },
    { v: stats.need, color: "var(--terracotta)" },
  ];
  let acc = 0;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={stroke} fill="none" />
      {segs.map((s, i) => {
        if (s.v === 0) return null;
        const len = (s.v / total) * c;
        const dash = `${len} ${c - len}`;
        const offset = -acc;
        acc += len;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={s.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

function RoomDonutRow({ room, stats }: { room: string; stats: RoomStats }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-2.5">
      <Donut stats={stats} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span>{ROOM_ICONS[room]}</span>
          {room}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>✅ {stats.have}</span>
          <span>🛒 {stats.need}</span>
          <span>🤔 {stats.discuss}</span>
        </div>
      </div>
      <div className="text-xs font-medium text-muted-foreground">{stats.total}</div>
    </div>
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

function MiniStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-3 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-2xl font-semibold">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
