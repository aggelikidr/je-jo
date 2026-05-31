import { useMemo, useState } from "react";
import { useTasks, useFurniture, useHousehold, ROOM_CONFIG, type PartnerKey, type Task } from "@/lib/store";
import type { AppCtx, TabKey } from "@/components/AppShell";
import type { Apartment } from "@/lib/jejoStore";
import {
  Avatar,
  Sticker,
  Pinned,
  PhotoSlot,
  Euro,
  ConsensusBadge,
  ProgressBar,
  FurnitureMiniDonut,
  consensusOf,
  daysUntil,
  relTime,
} from "@/components/JejoUI";

// ── Shared stats ──────────────────────────────────────────────

function useHubStats(ctx: AppCtx) {
  const [tasks] = useTasks();
  const [furniture] = useFurniture();
  const { apartments } = ctx;
  const moveInDate = ctx.setup.moveInDate ?? "";

  return useMemo(() => {
    const days = moveInDate ? daysUntil(moveInDate) : null;
    const tasksDone = tasks.filter((t) => t.status === "done").length;
    const tasksTotal = tasks.length;
    const shortlisted = apartments.filter((a) => a.status !== "passed").length;
    const bothLoveAp = apartments.find(
      (a) => a.reactions.p1 === "love" && a.reactions.p2 === "love",
    );
    const nextVisit = [...apartments]
      .filter((a) => a.visitDate && a.status !== "passed")
      .sort((a, b) => (a.visitDate ?? "").localeCompare(b.visitDate ?? ""))[0];
    const furnitureHave = furniture.filter((f) => f.status === "have").length;
    const furnitureTotal = furniture.length;
    const viewings = apartments.filter((a) => a.status === "passed" || a.visitDate).length;
    return {
      days,
      tasksDone,
      tasksTotal,
      shortlisted,
      bothLoveAp,
      nextVisit,
      furnitureHave,
      furnitureTotal,
      viewings,
      bothLoveCount: apartments.filter(
        (a) => a.reactions.p1 === "love" && a.reactions.p2 === "love",
      ).length,
    };
  }, [apartments, tasks, furniture, moveInDate]);
}

// ── Hub screen (layout selector) ─────────────────────────────

function ShareCodeBanner({ isMobile }: { isMobile: boolean }) {
  const household = useHousehold();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!household) return;
    try {
      await navigator.clipboard.writeText(household.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!household) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 12 : 20,
        padding: isMobile ? "8px 12px" : "10px 16px",
        borderRadius: 12,
        background: "var(--paper)",
        border: "1px solid var(--line)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          className="mono"
          style={{
            fontSize: isMobile ? 10 : 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-mute)",
          }}
        >
          Invite code
        </span>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: isMobile ? 16 : 18,
            letterSpacing: "0.15em",
            color: "var(--ink)",
            marginTop: 2,
          }}
        >
          {household.code}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          padding: isMobile ? "5px 10px" : "6px 14px",
          borderRadius: 999,
          background: copied ? "var(--olive)" : "var(--ink)",
          color: "var(--paper)",
          fontSize: 12,
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {copied ? "✓ Copied" : "📋 Copy"}
      </button>
    </div>
  );
}

export function HubScreen({ ctx }: { ctx: AppCtx }) {
  const layout = ctx.isMobile ? "today-fun" : ctx.tweak.hubLayout;
  return (
    <div>
      <ShareCodeBanner isMobile={ctx.isMobile} />
      {layout === "magazine" && <HubMagazine ctx={ctx} />}
      {layout === "today" && <HubToday ctx={ctx} />}
      {layout === "today-fun" && <HubTodayFun ctx={ctx} />}
      {layout !== "magazine" && layout !== "today" && layout !== "today-fun" && <HubPinboard ctx={ctx} />}
    </div>
  );
}

// ── Mood polaroid ─────────────────────────────────────────────

function MoodPolaroid({ ctx, rotate = -0.8 }: { ctx: AppCtx; rotate?: number }) {
  const { mood, setMood, setup, currentUser } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(mood?.text ?? "");
  const bg = "var(--sun-deep)";

  const save = () => {
    const text = val.trim();
    if (text) setMood({ text, who: currentUser, at: 0 });
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="polaroid"
        style={{ background: bg, transform: `rotate(${rotate}deg)`, padding: 18 }}
      >
        <span className="pin" style={{ top: -6, left: "50%", transform: "translateX(-50%)" }} />
        <span className="stamp" style={{ color: "white", borderColor: "white", background: "transparent" }}>
          📌 mood today
        </span>
        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            if (e.key === "Escape") setEditing(false);
          }}
          rows={2}
          autoFocus
          style={{
            width: "100%",
            marginTop: 10,
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 22,
            lineHeight: 1.2,
            color: "white",
            background: "rgba(255,255,255,0.12)",
            border: "1.5px dashed rgba(255,255,255,0.45)",
            borderRadius: 8,
            padding: 10,
            outline: "none",
            resize: "vertical",
          }}
          placeholder="What's the mood today? (paste a song lyric, drop an inside joke, leave a love note…)"
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => setEditing(false)}
            style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", padding: "4px 10px" }}
          >
            cancel
          </button>
          <button
            onClick={save}
            style={{
              fontSize: 12,
              padding: "5px 12px",
              borderRadius: 999,
              background: "white",
              color: "var(--ink)",
              fontWeight: 500,
            }}
          >
            Pin it
          </button>
        </div>
      </div>
    );
  }

  return (
    <Pinned rotate={rotate} pin="topCenter" style={{ background: bg }}>
      <div style={{ padding: 18, color: "white", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <span className="stamp" style={{ color: "white", borderColor: "white", background: "transparent" }}>
            📌 mood today
          </span>
          <button
            onClick={() => { setVal(mood?.text ?? ""); setEditing(true); }}
            style={{
              color: "white",
              fontSize: 12,
              padding: "3px 10px",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: 999,
              opacity: 0.85,
            }}
          >
            ✎ edit
          </button>
        </div>
        {mood?.text ? (
          <>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 26,
                margin: "10px 0 4px",
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              "{mood.text}"
            </p>
            <p style={{ fontSize: 12, opacity: 0.85, margin: 0 }}>
              — pinned by {partners[mood.who]?.name}, {relTime(mood.at ?? 0)}
            </p>
          </>
        ) : (
          <button
            onClick={() => { setVal(""); setEditing(true); }}
            style={{
              display: "block",
              marginTop: 10,
              fontSize: 14,
              color: "rgba(255,255,255,0.85)",
              padding: "10px 14px",
              border: "1.5px dashed rgba(255,255,255,0.5)",
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              textAlign: "left",
              width: "100%",
            }}
          >
            + pin a mood (lyric, joke, love note…)
          </button>
        )}
      </div>
    </Pinned>
  );
}

// ── Variant 1: Pinboard mosaic ────────────────────────────────

function HubPinboard({ ctx }: { ctx: AppCtx }) {
  const { apartments, activity, setTab, setup } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const s = useHubStats(ctx);
  const [tasks] = useTasks();
  const [furniture] = useFurniture();
  const topAp =
    apartments.find((a) => a.reactions.p1 === "love" && a.reactions.p2 === "love") ??
    apartments.find((a) => a.reactions.p1 === "love" || a.reactions.p2 === "love");

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28, gap: 24 }}>
        <div>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>
            Our shared pinboard · updated {new Date().toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase()}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 64, lineHeight: 1, margin: "6px 0 0", fontWeight: 400 }}>
            Hello, <span style={{ color: "var(--coral)" }}>you two.</span>
          </h1>
        </div>
        {s.days !== null && (
          <div style={{ textAlign: "right" }}>
            <p className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Days until home</p>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 80, lineHeight: 0.9, color: "var(--coral-deep)" }}>{s.days}</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "minmax(120px, auto)", gap: 24 }}>
        {topAp && (
          <div style={{ gridColumn: "span 5", gridRow: "span 2" }}>
            <Pinned rotate={-1.5} pin="topRight" onClick={() => setTab("apartments")} style={{ cursor: "pointer" }}>
              <PhotoSlot hue={topAp.photo.hue} label={topAp.photo.label} height={260}
                tag={<Sticker tone="coral" rotate={2}>{topAp.reactions.p1 === "love" && topAp.reactions.p2 === "love" ? "Both love it" : "Top pick"}</Sticker>}
              />
              <div style={{ padding: "12px 6px 4px" }}>
                <p className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Apartments · favourite</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, margin: "4px 0 4px", fontWeight: 400 }}>{topAp.title}</h3>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{topAp.area} · <Euro value={topAp.price} />/mo · {topAp.sqm}m²</p>
              </div>
            </Pinned>
          </div>
        )}

        {s.nextVisit && (
          <div style={{ gridColumn: "span 4", gridRow: "span 1" }}>
            <Pinned rotate={1.2} pin="topLeft">
              <div style={{ padding: 16 }}>
                <Sticker tone="sun" rotate={-2}>📅 next viewing</Sticker>
                <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26, margin: "10px 0 4px", fontWeight: 400 }}>{s.nextVisit.title}</h3>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                  {new Date(s.nextVisit.visitDate!).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · in {daysUntil(s.nextVisit.visitDate!)} days
                </p>
                <button onClick={() => setTab("apartments")} className="btn btn-ghost" style={{ marginTop: 10, fontSize: 12, padding: "6px 12px" }}>Open →</button>
              </div>
            </Pinned>
          </div>
        )}

        <div style={{ gridColumn: "span 3", gridRow: "span 1" }}>
          <Pinned rotate={-2} pin="topCenter">
            <div style={{ padding: 16 }}>
              <Sticker tone="olive" rotate={2}>✏️ checklist</Sticker>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 1, marginTop: 8 }}>
                {s.tasksDone}<span style={{ color: "var(--ink-mute)" }}>/{s.tasksTotal}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 10px" }}>done together</p>
              <button onClick={() => setTab("checklist")} style={{ fontSize: 12, color: "var(--coral-deep)", textDecoration: "underline", textDecorationStyle: "dotted" }}>see the list →</button>
            </div>
          </Pinned>
        </div>

        <div style={{ gridColumn: "span 4", gridRow: "span 2" }}>
          <Pinned rotate={1} pin="topRight">
            <div style={{ padding: 16, minHeight: 200 }}>
              <Sticker tone="ink">recent love</Sticker>
              <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {activity.slice(0, 5).map((a, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <Avatar who={a.who} partner={partners[a.who]} size={26} />
                    <div style={{ flex: 1, lineHeight: 1.35 }}>
                      <span style={{ fontWeight: 500 }}>{partners[a.who].name}</span>{" "}
                      <span style={{ color: "var(--ink-soft)" }}>{a.verb}</span>{" "}
                      <span>{a.what}</span>
                      <div className="mono" style={{ fontSize: 10, color: "var(--ink-mute)", marginTop: 1 }}>{relTime(a.at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Pinned>
        </div>

        <div style={{ gridColumn: "span 3", gridRow: "span 1" }}>
          <Pinned rotate={-1} pin="topLeft" style={{ background: "var(--coral)" }}>
            <div style={{ padding: 16, color: "white" }}>
              <span className="stamp" style={{ color: "white", borderColor: "white", background: "transparent" }}>🔑 apartments</span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 1, marginTop: 8 }}>{s.shortlisted}</div>
              <p style={{ fontSize: 13, opacity: 0.9, margin: "2px 0 10px" }}>still on the table</p>
              <button onClick={() => setTab("apartments")} style={{ fontSize: 12, textDecoration: "underline", textDecorationStyle: "dotted" }}>browse them →</button>
            </div>
          </Pinned>
        </div>

        <div style={{ gridColumn: "span 5", gridRow: "span 1" }}>
          <Pinned rotate={0.8} pin="topRight">
            <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 18 }}>
              <FurnitureMiniDonut have={s.furnitureHave} total={s.furnitureTotal} />
              <div style={{ flex: 1 }}>
                <Sticker tone="sky" rotate={-1}>🛋️ furniture</Sticker>
                <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, margin: "6px 0 2px", fontWeight: 400 }}>{s.furnitureHave} pieces already ours</h3>
                <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0 }}>{s.furnitureTotal - s.furnitureHave} still to figure out</p>
              </div>
              <button onClick={() => setTab("furniture")} className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }}>Open →</button>
            </div>
          </Pinned>
        </div>

        <div style={{ gridColumn: "span 7" }}>
          <MoodPolaroid ctx={ctx} rotate={-2} />
        </div>
      </div>
    </div>
  );
}

// ── Variant 2: Editorial magazine ─────────────────────────────

function HubMagazine({ ctx }: { ctx: AppCtx }) {
  const { apartments, setTab, setup } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const s = useHubStats(ctx);
  const [tasks] = useTasks();
  const featured =
    apartments.find((a) => a.reactions.p1 === "love" && a.reactions.p2 === "love") ??
    apartments[0];
  const upcoming = tasks.filter((t) => t.status !== "done").slice(0, 4);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, borderBottom: "2px solid var(--ink)", paddingBottom: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid var(--ink)", borderBottom: "1px solid var(--ink)", padding: "6px 0", marginBottom: 16 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              the je·jo gazette
            </span>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toLowerCase()}
            </span>
          </div>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral-deep)", margin: 0 }}>Volume one · home edition</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 96, lineHeight: 0.95, margin: "8px 0 16px", fontWeight: 400 }}>
            {s.days !== null ? `${s.days} days` : "loading"} <br />and counting.
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-soft)", maxWidth: 480, lineHeight: 1.5, margin: 0 }}>
            {partners.p1.name} and {partners.p2.name}'s field guide to landing somewhere together.
          </p>
        </div>
        <div style={{ background: "var(--ink)", color: "var(--paper)", padding: 22, borderRadius: 4 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sun)" }}>This week</span>
          <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
            <li>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.1 }}>{s.shortlisted} apartments on the shortlist</div>
              <p className="mono" style={{ fontSize: 11, opacity: 0.6, margin: "2px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>places tab</p>
            </li>
            <li>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.1 }}>{s.tasksTotal - s.tasksDone} tasks left to tick</div>
              <p className="mono" style={{ fontSize: 11, opacity: 0.6, margin: "2px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>checklist tab</p>
            </li>
            <li>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.1 }}>{s.furnitureTotal} pieces, {s.furnitureHave} already yours</div>
              <p className="mono" style={{ fontSize: 11, opacity: 0.6, margin: "2px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>furniture tab</p>
            </li>
          </ul>
        </div>
      </div>

      {featured && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 28 }}>
          <article onClick={() => setTab("apartments")} style={{ cursor: "pointer" }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral-deep)" }}>Lead · The favourite</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 48, lineHeight: 1, margin: "10px 0 14px", fontWeight: 400 }}>{featured.title}.</h2>
            <PhotoSlot hue={featured.photo.hue} label={featured.photo.label} height={300} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "14px 0 10px", fontSize: 13 }}>
              <Avatar who="p1" partner={partners.p1} size={24} />
              <span style={{ color: "var(--ink-soft)" }}><Euro value={featured.price} />/mo · {featured.sqm}m² · {featured.area}</span>
              <ConsensusBadge c={consensusOf(featured.reactions)} small />
            </div>
          </article>

          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral-deep)" }}>Bulletin · Together so far</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, lineHeight: 1.05, margin: "10px 0 18px", fontWeight: 400 }}>We've done a lot already.</h2>
            <ProgressBar label="Checklist" done={s.tasksDone} total={s.tasksTotal} tone="coral" />
            <ProgressBar label="Furniture sorted" done={s.furnitureHave} total={s.furnitureTotal} tone="olive" />
            <ProgressBar label="Apartments seen" done={s.viewings} total={apartments.length} tone="sun" />
            <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "20px 0" }} />
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral-deep)" }}>Up next</span>
            <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.map((t) => (
                <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, paddingBottom: 8, borderBottom: "1px dashed var(--line)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: t.status === "in_progress" ? "var(--sun-deep)" : "var(--line-strong)", flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{t.name}</span>
                  <Avatar who={t.addedBy} partner={partners[t.addedBy]} size={20} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral-deep)" }}>Field notes</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, lineHeight: 1.05, margin: "10px 0 18px", fontWeight: 400 }}>Overheard between us.</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {ctx.activity.slice(0, 5).map((a, i) => (
                <li key={i} style={{ borderTop: "1px solid var(--ink)", paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Avatar who={a.who} partner={partners[a.who]} size={22} />
                    <span style={{ fontWeight: 500 }}>{partners[a.who].name}</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{relTime(a.at)}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.15, margin: "6px 0 0", fontWeight: 400 }}>
                    {a.verb} <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "var(--coral)", textUnderlineOffset: 4 }}>{a.what}</span>.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Variant 3: Today minimal ──────────────────────────────────

function HubToday({ ctx }: { ctx: AppCtx }) {
  const { apartments, currentUser, setTab, setup } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const s = useHubStats(ctx);
  const [tasks] = useTasks();
  const me = partners[currentUser];
  const them = partners[currentUser === "p1" ? "p2" : "p1" as PartnerKey];

  const todayFocus = useMemo(() => {
    if (s.nextVisit && daysUntil(s.nextVisit.visitDate!) <= 7) return { kind: "visit" as const, item: s.nextVisit } as { kind: "visit"; item: ApartmentItem } | { kind: "task"; item: Task | undefined };
    const inProg = tasks.find((t) => t.status === "in_progress");
    if (inProg) return { kind: "task" as const, item: inProg } as { kind: "visit"; item: ApartmentItem } | { kind: "task"; item: Task | undefined };
    return { kind: "task" as const, item: tasks.find((t) => t.status === "todo") } as { kind: "visit"; item: ApartmentItem } | { kind: "task"; item: Task | undefined };
  }, [tasks, s.nextVisit]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "good morning";
    if (h < 18) return "good afternoon";
    return "good evening";
  })();

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>{greeting}, {me.name}</p>
        <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>{them.name} is with you {them.emoji}</p>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 80, lineHeight: 1, margin: "0 0 8px", fontWeight: 400 }}>Today, the one thing.</h1>
      <p style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 0 28px", maxWidth: 600 }}>Everything else can wait. Here's what would move you two forward most.</p>

      <div className="card-paper" style={{ padding: 36, marginBottom: 32, borderLeft: "6px solid var(--coral)" }}>
        {todayFocus.kind === "visit" && todayFocus.item ? (
          <FocusVisit item={todayFocus.item as ApartmentItem} partners={partners} setTab={setTab} />
        ) : todayFocus.item ? (
          <FocusTask item={todayFocus.item as Task} partners={partners} setTab={setTab} />
        ) : (
          <p>Nothing urgent — go enjoy a long walk together 💛</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <SnapshotCard title="Apartments" emoji="🔑" big={s.shortlisted} bigUnit={s.shortlisted === 1 ? "saved" : "shortlisted"} sub={s.nextVisit ? `Next visit: ${s.nextVisit.area} in ${daysUntil(s.nextVisit.visitDate!)}d` : "No visits scheduled"} tone="coral" onClick={() => setTab("apartments")} />
        <SnapshotCard title="Together" emoji="💛" big={s.tasksDone} bigUnit={`of ${s.tasksTotal} done`} sub="" tone="olive" onClick={() => setTab("checklist")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, marginTop: 20 }}>
        <div className="card-paper" style={{ padding: 24, background: "var(--ink)", color: "var(--paper)" }}>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sun)", margin: 0 }}>Countdown</p>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 64, lineHeight: 1, margin: "8px 0 4px", color: "white" }}>{s.days !== null ? `${s.days} days` : "—"}</div>
          <p style={{ fontSize: 14, opacity: 0.75, margin: 0 }}>until we live under the same roof. Officially.</p>
        </div>
        <div className="card-paper" style={{ padding: 24 }}>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>Just happened</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {ctx.activity.slice(0, 3).map((a, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                <Avatar who={a.who} partner={partners[a.who]} size={24} />
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{partners[a.who].name}</span>
                  <span style={{ color: "var(--ink-soft)" }}> {a.verb} </span>
                  <span>{a.what}</span>
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>{relTime(a.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Variant 4: Today + pinboard fun (default / mobile) ────────

function HubTodayFun({ ctx }: { ctx: AppCtx }) {
  const { apartments, currentUser, setTab, activity, isMobile, setup } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const s = useHubStats(ctx);
  const [tasks] = useTasks();
  const me = partners[currentUser];

  const todayFocus = useMemo(() => {
    if (s.nextVisit && daysUntil(s.nextVisit.visitDate!) <= 7) return { kind: "visit" as const, item: s.nextVisit } as { kind: "visit"; item: ApartmentItem } | { kind: "task"; item: Task | undefined };
    const inProg = tasks.find((t) => t.status === "in_progress");
    if (inProg) return { kind: "task" as const, item: inProg } as { kind: "visit"; item: ApartmentItem } | { kind: "task"; item: Task | undefined };
    return { kind: "task" as const, item: tasks.find((t) => t.status === "todo") } as { kind: "visit"; item: ApartmentItem } | { kind: "task"; item: Task | undefined };
  }, [tasks, s.nextVisit]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "good morning";
    if (h < 18) return "good afternoon";
    return "good evening";
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: isMobile ? 0 : 28 }}>
        <div>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>
            {greeting}, {me.name} {me.emoji}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 48 : 84, lineHeight: 0.95, margin: "6px 0 0", fontWeight: 400 }}>
            Today, <span style={{ color: "var(--coral)" }}>the&nbsp;one thing.</span>
          </h1>
        </div>
        {s.days !== null && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p className="mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>days left</p>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 44 : 64, lineHeight: 1, color: "var(--coral-deep)" }}>{s.days}</div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.7fr 1fr", gap: isMobile ? 14 : 28, alignItems: "flex-start", marginBottom: isMobile ? 0 : 32 }}>
        <Pinned rotate={isMobile ? 0 : -1} pin="topLeft">
          <div style={{ padding: 4 }}>
            {todayFocus.kind === "visit" && todayFocus.item ? (
              <FocusVisitFun item={todayFocus.item as ApartmentItem} partners={partners} setTab={setTab} isMobile={isMobile} />
            ) : todayFocus.item ? (
              <FocusTaskFun item={todayFocus.item as Task} partners={partners} setTab={setTab} isMobile={isMobile} />
            ) : (
              <p style={{ padding: 20 }}>Nothing urgent — go enjoy a long walk together 💛</p>
            )}
          </div>
        </Pinned>

        <div style={{ position: "relative" }}>
          {!isMobile && <span className="tape" style={{ left: 24, top: -8, transform: "rotate(-3deg)" }} />}
          <div className="card-paper" style={{ padding: isMobile ? 16 : 22 }}>
            <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--coral-deep)", margin: 0 }}>Together so far</p>
            <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 22 : 26, margin: "6px 0 12px", fontWeight: 400 }}>We've done a lot.</h3>
            <ProgressBar label="Checklist" done={s.tasksDone} total={s.tasksTotal} tone="coral" />
            <ProgressBar label="Furniture" done={s.furnitureHave} total={s.furnitureTotal} tone="olive" />
            <ProgressBar label="Viewings" done={s.viewings} total={apartments.length} tone="sun" />
            {s.bothLoveCount > 0 && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "var(--coral-soft)", color: "var(--coral-deep)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <span>💛</span>
                <span><b>{s.bothLoveCount}</b> place{s.bothLoveCount === 1 ? "" : "s"} you both love</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1.2fr", gap: isMobile ? 12 : 24, alignItems: "flex-start" }}>
        <Pinned rotate={isMobile ? 0 : 1.2} pin="topCenter" style={{ background: "var(--coral)" }}>
          <button onClick={() => setTab("apartments")} style={{ padding: isMobile ? 14 : 18, color: "white", textAlign: "left", width: "100%" }}>
            <span className="stamp" style={{ color: "white", borderColor: "white", background: "transparent", fontSize: isMobile ? 9 : 11 }}>🔑 places</span>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 44 : 64, lineHeight: 1, marginTop: 8 }}>{s.shortlisted}</div>
            <div style={{ fontSize: isMobile ? 12 : 13, opacity: 0.9, marginTop: 2 }}>shortlisted</div>
            {s.nextVisit && <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.8, marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(255,255,255,0.4)" }}>Next: {s.nextVisit.area}</div>}
          </button>
        </Pinned>

        <Pinned rotate={isMobile ? 0 : -1.5} pin="topLeft">
          <button onClick={() => setTab("checklist")} style={{ padding: isMobile ? 14 : 18, textAlign: "left", width: "100%" }}>
            <Sticker tone="olive" style={{ fontSize: isMobile ? 9 : 11 }}>✏️ tasks</Sticker>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 44 : 64, lineHeight: 1, marginTop: 8 }}>
              {s.tasksDone}<span style={{ color: "var(--ink-mute)", fontSize: isMobile ? 28 : 40 }}>/{s.tasksTotal}</span>
            </div>
            <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--ink-soft)", marginTop: 2 }}>done</div>
          </button>
        </Pinned>

        {!isMobile && (
          <Pinned rotate={0.8} pin="topRight">
            <div style={{ padding: 18 }}>
              <Sticker tone="ink">recent love</Sticker>
              <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
                {activity.slice(0, 4).map((a, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                    <Avatar who={a.who} partner={partners[a.who]} size={22} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 500 }}>{partners[a.who].name}</span>
                      <span style={{ color: "var(--ink-soft)" }}> {a.verb} </span>
                      {a.what}
                      <div className="mono" style={{ fontSize: 10, color: "var(--ink-mute)" }}>{relTime(a.at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Pinned>
        )}
      </div>

      {isMobile && (
        <div className="card-paper" style={{ padding: 14 }}>
          <p className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: "0 0 10px" }}>Recent</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {activity.slice(0, 3).map((a, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                <Avatar who={a.who} partner={partners[a.who]} size={22} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{partners[a.who].name}</span>
                  <span style={{ color: "var(--ink-soft)" }}> {a.verb} </span>
                  {a.what}
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-mute)" }}>{relTime(a.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: isMobile ? 0 : 28 }}>
        <MoodPolaroid ctx={ctx} />
      </div>
    </div>
  );
}

// ── Focus cards ───────────────────────────────────────────────

type ApartmentItem = NonNullable<ReturnType<typeof useHubStats>["nextVisit"]>;
type PartnersMini = { p1: { name: string; emoji: string }; p2: { name: string; emoji: string } };

function FocusVisit({ item, partners, setTab }: { item: ApartmentItem; partners: PartnersMini; setTab: (t: TabKey) => void }) {
  const d = daysUntil(item.visitDate!);
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
      <div style={{ width: 260, flexShrink: 0 }}>
        <PhotoSlot hue={item.photo.hue} label={item.photo.label} height={180} />
      </div>
      <div style={{ flex: 1 }}>
        <Sticker tone="sun" rotate={-1}>📅 In {d} day{d === 1 ? "" : "s"}</Sticker>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44, lineHeight: 1, margin: "10px 0 4px", fontWeight: 400 }}>Viewing: {item.title.toLowerCase()}.</h2>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 16px" }}>{item.area} · <Euro value={item.price} />/mo · {item.sqm}m² · floor {item.floor}</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-coral" onClick={() => setTab("apartments")}>Open viewing notes →</button>
          <span style={{ marginLeft: "auto" }}><ConsensusBadge c={consensusOf(item.reactions)} /></span>
        </div>
      </div>
    </div>
  );
}

function FocusTask({ item, partners, setTab }: { item: Task; partners: PartnersMini; setTab: (t: TabKey) => void }) {
  return (
    <div>
      <Sticker tone="coral" rotate={-1}>{item.status === "in_progress" ? "in progress" : "next up"}</Sticker>
      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 52, lineHeight: 1.05, margin: "10px 0 8px", fontWeight: 400 }}>{item.name}.</h2>
      <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 18px" }}>
        Suggested by {partners[item.addedBy].name} · {item.category}
        {item.dueDate ? ` · due ${new Date(item.dueDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : ""}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-coral" onClick={() => setTab("checklist")}>Mark in progress →</button>
        <button className="btn btn-ghost" onClick={() => setTab("checklist")}>See full list</button>
      </div>
    </div>
  );
}

function FocusVisitFun({ item, partners, setTab, isMobile }: { item: ApartmentItem; partners: PartnersMini; setTab: (t: TabKey) => void; isMobile: boolean }) {
  const d = daysUntil(item.visitDate!);
  return (
    <div onClick={() => setTab("apartments")} style={{ cursor: "pointer" }}>
      <PhotoSlot hue={item.photo.hue} label={item.photo.label} height={isMobile ? 160 : 240} tag={<Sticker tone="sun" rotate={3}>📅 in {d}d</Sticker>} />
      <div style={{ padding: "12px 8px 8px" }}>
        <Sticker tone="coral" rotate={-2} style={{ fontSize: 10 }}>today · viewing</Sticker>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 26 : 38, lineHeight: 1.05, margin: "8px 0 4px", fontWeight: 400 }}>{item.title}</h2>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>{item.area} · <Euro value={item.price} />/mo · {item.sqm}m²</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-coral" onClick={(e) => { e.stopPropagation(); setTab("apartments"); }} style={{ fontSize: isMobile ? 12 : 14 }}>Open notes →</button>
          <ConsensusBadge c={consensusOf(item.reactions)} small />
        </div>
      </div>
    </div>
  );
}

function FocusTaskFun({ item, partners, setTab, isMobile }: { item: Task; partners: PartnersMini; setTab: (t: TabKey) => void; isMobile: boolean }) {
  return (
    <div onClick={() => setTab("checklist")} style={{ padding: "14px 10px 10px", cursor: "pointer" }}>
      <Sticker tone="coral" rotate={-2} style={{ fontSize: 10 }}>{item.status === "in_progress" ? "today · in progress" : "today · next up"}</Sticker>
      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 30 : 44, lineHeight: 1.05, margin: "10px 0 6px", fontWeight: 400 }}>{item.name}.</h2>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 12px" }}>
        {partners[item.addedBy].name} · {item.category}
        {item.dueDate ? ` · due ${new Date(item.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}
      </p>
      <button className="btn btn-coral" onClick={(e) => { e.stopPropagation(); setTab("checklist"); }} style={{ fontSize: isMobile ? 12 : 14 }}>See checklist →</button>
    </div>
  );
}

// ── Snapshot card ─────────────────────────────────────────────

function SnapshotCard({ title, emoji, big, bigUnit, sub, tone = "coral", onClick }: { title: string; emoji: string; big: number; bigUnit: string; sub: string; tone?: "coral" | "olive"; onClick: () => void }) {
  const accent = tone === "coral" ? "var(--coral)" : "var(--olive)";
  return (
    <button onClick={onClick} className="card-paper" style={{ padding: 24, textAlign: "left", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)" }}>{emoji} {title}</span>
        <span style={{ color: "var(--ink-mute)" }}>→</span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 56, lineHeight: 1, color: accent }}>{big}</div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{bigUnit}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--line)" }}>{sub}</div>}
    </button>
  );
}
