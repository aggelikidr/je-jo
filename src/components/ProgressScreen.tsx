import { useMemo } from "react";
import { CATEGORIES, CATEGORY_EMOJI, ROOM_CONFIG, useFurniture } from "@/lib/store";
import type { AppCtx } from "@/components/AppShell";
import { Avatar, Euro, daysUntil } from "@/components/JejoUI";

export function ProgressScreen({ ctx }: { ctx: AppCtx }) {
  const { apartments, setup, isMobile, setTab, tasks } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const [furniture] = useFurniture();
  const moveInDate = setup.moveInDate ?? "";

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const p1 = tasks.filter((t) => t.status === "done" && t.completedBy === "p1").length;
    const p2 = tasks.filter((t) => t.status === "done" && t.completedBy === "p2").length;
    const p1Added = tasks.filter((t) => t.addedBy === "p1").length;
    const p2Added = tasks.filter((t) => t.addedBy === "p2").length;
    const byCat = CATEGORIES.map((c) => {
      const items = tasks.filter((t) => t.category === c);
      return { cat: c, total: items.length, done: items.filter((i) => i.status === "done").length };
    }).filter((c) => c.total > 0);
    return { total, done, p1, p2, p1Added, p2Added, byCat };
  }, [tasks]);

  const f = useMemo(() => {
    type RoomStats = { have: number; need: number; discuss: number; total: number };
    const byRoom: Record<string, RoomStats> = {};
    for (const r of ROOM_CONFIG) byRoom[r.id] = { have: 0, need: 0, discuss: 0, total: 0 };
    let budget = 0;
    for (const it of furniture) {
      const r = (byRoom[it.room] ??= { have: 0, need: 0, discuss: 0, total: 0 });
      r.total++;
      r[it.status]++;
      const winner = it.links.find((l) => l.reactions.p1 === "love" && l.reactions.p2 === "love");
      if (winner?.price) budget += winner.price;
      else {
        const loved = it.links.find((l) => l.reactions.p1 === "love" || l.reactions.p2 === "love");
        if (loved?.price) budget += loved.price;
      }
    }
    return {
      total: furniture.length,
      have: furniture.filter((x) => x.status === "have").length,
      need: furniture.filter((x) => x.status === "need").length,
      discuss: furniture.filter((x) => x.status === "discuss").length,
      byRoom,
      budget,
    };
  }, [furniture]);

  const a = useMemo(() => ({
    total: apartments.length,
    shortlist: apartments.filter((x) => x.status === "shortlist").length,
    scheduled: apartments.filter((x) => x.status === "scheduled").length,
    passed: apartments.filter((x) => x.status === "passed").length,
    bothLove: apartments.filter((x) => x.reactions.p1 === "love" && x.reactions.p2 === "love").length,
  }), [apartments]);

  const days = moveInDate ? daysUntil(moveInDate) : null;
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div>
      <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Progress · the receipts</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 40 : 56, lineHeight: 1, margin: "8px 0 28px", fontWeight: 400 }}>
        Look at <span style={{ color: "var(--coral)" }}>us go.</span>
      </h1>

      {/* Countdown banner */}
      {moveInDate && (
        <section className="card-paper" style={{ background: "linear-gradient(135deg, var(--coral) 0%, var(--coral-deep) 50%, oklch(0.5 0.18 350) 100%)", color: "white", padding: 32, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
            <div>
              <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, opacity: 0.85 }}>
                Move-in day · {new Date(moveInDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 64 : 96, lineHeight: 0.95, margin: "8px 0 4px" }}>
                {days !== null ? (days > 0 ? days : days === 0 ? "Today!" : Math.abs(days)) : "—"}
              </div>
              <p style={{ fontSize: 16, opacity: 0.9, margin: 0 }}>
                {days !== null ? (days > 0 ? "days until we live together" : days === 0 ? "It's the day 🥂" : "days under the same roof") : ""}
              </p>
            </div>
            <div style={{ display: "flex", flexShrink: 0 }}>
              <Avatar who="p1" partner={partners.p1} size={isMobile ? 40 : 56} />
              <span style={{ marginLeft: -16 }}>
                <Avatar who="p2" partner={partners.p2} size={isMobile ? 40 : 56} />
              </span>
            </div>
          </div>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 20 }}>
        {/* Checklist ring */}
        <section className="card-paper" style={{ padding: 28, cursor: "pointer" }} onClick={() => setTab("checklist")}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            <Ring percent={pct} size={110} />
            <div>
              <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Checklist</p>
              <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, lineHeight: 1, margin: "4px 0 4px", fontWeight: 400 }}>{stats.done} of {stats.total} done</h3>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
                {pct === 100 ? "All done — go celebrate 🥂" : pct >= 50 ? "More than halfway 🌟" : "Every small step counts."}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.byCat.map((c) => {
              const p = (c.done / c.total) * 100;
              return (
                <div key={c.cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>
                    <span>{CATEGORY_EMOJI[c.cat] ?? "•"} {c.cat}</span>
                    <span className="mono">{c.done}/{c.total}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--line)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${p}%`, height: "100%", background: "var(--coral)", borderRadius: 999, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Who's pulling weight */}
        <section className="card-paper" style={{ padding: 28 }}>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Who's pulling weight?</p>
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, margin: "6px 0 18px", fontWeight: 400 }}>A team effort 🤝</h3>
          <WeightBar partner={partners.p1} who="p1" count={stats.p1} added={stats.p1Added} max={Math.max(stats.p1, stats.p2, 1)} />
          <div style={{ height: 14 }} />
          <WeightBar partner={partners.p2} who="p2" count={stats.p2} added={stats.p2Added} max={Math.max(stats.p1, stats.p2, 1)} />
        </section>
      </div>

      {/* Apartments + Furniture */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr", gap: 20, marginTop: 20 }}>
        <section className="card-paper" style={{ padding: 28, cursor: "pointer" }} onClick={() => setTab("apartments")}>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Apartments</p>
          <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, margin: "6px 0 18px", fontWeight: 400 }}>The hunt so far.</h3>
          <ApartmentBar items={a} />
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, padding: 12, borderRadius: 10, background: "var(--coral-soft)", color: "var(--coral-deep)" }}>
              <span style={{ fontSize: 22 }}>💛</span>
              <span><b>{a.bothLove}</b> {a.bothLove === 1 ? "place you both" : "places you both"} love</span>
            </div>
          </div>
        </section>

        <section className="card-paper" style={{ padding: 28, cursor: "pointer" }} onClick={() => setTab("furniture")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Furniture</p>
              <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, margin: "6px 0 0", fontWeight: 400 }}>{f.total} pieces tracked</h3>
            </div>
            {f.budget > 0 && (
              <div style={{ textAlign: "right" }}>
                <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Budget so far</p>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, lineHeight: 1, color: "var(--coral-deep)" }}><Euro value={Math.round(f.budget)} /></div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isMobile ? 8 : 10, margin: "18px 0" }}>
            <BigStat emoji="✅" label="Have" value={f.have} />
            <BigStat emoji="🛒" label="Need" value={f.need} />
            <BigStat emoji="🤔" label="Discuss" value={f.discuss} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {ROOM_CONFIG.map((r) => {
              const rs = f.byRoom[r.id];
              if (!rs || rs.total === 0) return null;
              return <RoomMiniRow key={r.id} room={r} stats={rs} />;
            })}
          </div>
        </section>
      </div>

    </div>
  );
}

// ── Ring ──────────────────────────────────────────────────────

function Ring({ percent, size = 100 }: { percent: number; size?: number }) {
  const stroke = 10, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--coral)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (percent / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-display)" fontStyle="italic" fontSize="30" fill="var(--ink)">
        {percent}%
      </text>
    </svg>
  );
}

// ── Weight bar ────────────────────────────────────────────────

function WeightBar({ partner, who, count, added, max }: { partner: { name: string; emoji: string }; who: "p1" | "p2"; count: number; added: number; max: number }) {
  const pct = (count / max) * 100;
  const color = who === "p1" ? "var(--coral)" : "var(--olive)";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar who={who} partner={partner} size={28} ring />
          <span style={{ fontWeight: 500 }}>{partner.name}</span>
        </div>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{count} done · {added} added</span>
      </div>
      <div style={{ height: 10, background: "var(--line)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── Apartment bar ─────────────────────────────────────────────

function ApartmentBar({ items }: { items: { total: number; shortlist: number; scheduled: number; passed: number } }) {
  const total = Math.max(1, items.total);
  const segs = [
    { v: items.shortlist, label: "Shortlist", color: "var(--coral)" },
    { v: items.scheduled, label: "Booked",    color: "var(--sun-deep)" },
    { v: items.passed,    label: "Passed",    color: "var(--ink-mute)" },
  ];
  return (
    <div>
      <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", background: "var(--line)" }}>
        {segs.map((s, i) => s.v > 0 ? (
          <div key={i} title={`${s.label}: ${s.v}`} style={{ flex: s.v / total, background: s.color, transition: "flex 0.4s ease" }} />
        ) : null)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 8, fontSize: 12 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
            <span>{s.label}</span>
            <span className="mono" style={{ color: "var(--ink-mute)" }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Big stat ──────────────────────────────────────────────────

function BigStat({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div style={{ padding: 12, background: "var(--paper-deep)", borderRadius: 10, textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, lineHeight: 1, margin: "2px 0" }}>{value}</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

// ── Room mini row ─────────────────────────────────────────────

function RoomMiniRow({ room, stats }: { room: { name: string }; stats: { have: number; need: number; discuss: number; total: number } }) {
  const size = 40, stroke = 6, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const total = stats.total || 1;
  const segs = [
    { v: stats.have,    color: "var(--olive)" },
    { v: stats.discuss, color: "var(--sun-deep)" },
    { v: stats.need,    color: "var(--coral)" },
  ];
  let acc = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "var(--paper-deep)", borderRadius: 8 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {segs.map((s, i) => {
          if (s.v === 0) return null;
          const len = (s.v / total) * c;
          const dash = `${len} ${c - len}`;
          const offset = -acc;
          acc += len;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={dash} strokeDashoffset={offset} />;
        })}
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{room.name}</div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--ink-mute)" }}>
          <span>✅ {stats.have}</span><span>🛒 {stats.need}</span><span>🤔 {stats.discuss}</span>
        </div>
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>{stats.total}</span>
    </div>
  );
}
