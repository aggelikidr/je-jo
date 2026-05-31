import { useMemo, useState } from "react";
import type { AppCtx } from "@/components/AppShell";
import type { Apartment, ApartmentReaction, ApartmentStatus } from "@/lib/jejoStore";
import {
  Avatar,
  Sticker,
  PhotoSlot,
  VoteRow,
  ConsensusBadge,
  Modal,
  Euro,
  daysUntil,
  relTime,
  consensusOf,
} from "@/components/JejoUI";

const STATUS_META: Record<ApartmentStatus, { label: string; emoji: string; tone: "coral" | "sun" | "ink" }> = {
  shortlist: { label: "Shortlist",     emoji: "📌", tone: "coral" },
  scheduled: { label: "Visit booked",  emoji: "📅", tone: "sun" },
  passed:    { label: "Passed",        emoji: "🚫", tone: "ink" },
};

// ── Screen ────────────────────────────────────────────────────

export function ApartmentsScreen({ ctx }: { ctx: AppCtx }) {
  const { apartments, setApartments, setup, currentUser, isMobile } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const [filter, setFilter] = useState<"all" | "shortlist" | "scheduled" | "passed" | "both-love">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [sort, setSort] = useState<"recent" | "price" | "size">("recent");

  const list = useMemo(() => {
    let arr = [...apartments];
    if (filter === "shortlist")  arr = arr.filter((a) => a.status === "shortlist");
    if (filter === "scheduled")  arr = arr.filter((a) => a.status === "scheduled");
    if (filter === "passed")     arr = arr.filter((a) => a.status === "passed");
    if (filter === "both-love")  arr = arr.filter((a) => a.reactions.p1 === "love" && a.reactions.p2 === "love");
    if (sort === "price") arr.sort((a, b) => a.price - b.price);
    if (sort === "size")  arr.sort((a, b) => b.sqm - a.sqm);
    return arr;
  }, [apartments, filter, sort]);

  const update = (id: string, fn: (a: Apartment) => Apartment) =>
    setApartments((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));

  const vote = (id: string, r: ApartmentReaction) =>
    update(id, (a) => ({
      ...a,
      reactions: {
        ...a.reactions,
        [currentUser]: a.reactions[currentUser] === r ? undefined : r,
      },
    }));

  const setStatus = (id: string, status: ApartmentStatus) =>
    update(id, (a) => ({ ...a, status }));

  const remove = (id: string) =>
    setApartments((prev) => prev.filter((a) => a.id !== id));

  const stats = useMemo(() => ({
    shortlist: apartments.filter((a) => a.status === "shortlist").length,
    scheduled: apartments.filter((a) => a.status === "scheduled").length,
    passed:    apartments.filter((a) => a.status === "passed").length,
    bothLove:  apartments.filter((a) => a.reactions.p1 === "love" && a.reactions.p2 === "love").length,
  }), [apartments]);

  const selected = apartments.find((a) => a.id === selectedId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = apartments.find((a) => a.id === editingId);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 20 }}>
        <div>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>
            Apartments · saved from Spitogatos, XE, &amp; the wild
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 40 : 56, lineHeight: 1, margin: "8px 0 0", fontWeight: 400 }}>
            Where shall we <span style={{ color: "var(--coral)" }}>land?</span>
          </h1>
        </div>
        <button className="btn btn-coral" onClick={() => setAdding(true)}>+ Paste a listing</button>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 20 }}>
        <StatPill emoji="📌" label="Shortlist" value={stats.shortlist} active={filter === "shortlist"} onClick={() => setFilter(filter === "shortlist" ? "all" : "shortlist")} />
        <StatPill emoji="📅" label="Visits booked" value={stats.scheduled} active={filter === "scheduled"} onClick={() => setFilter(filter === "scheduled" ? "all" : "scheduled")} />
        <StatPill emoji="💛" label="Both love" value={stats.bothLove} active={filter === "both-love"} tone="coral" onClick={() => setFilter(filter === "both-love" ? "all" : "both-love")} />
        <StatPill emoji="🚫" label="Passed" value={stats.passed} active={filter === "passed"} onClick={() => setFilter(filter === "passed" ? "all" : "passed")} />
      </div>

      {/* Sort row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>
          {list.length} listing{list.length === 1 ? "" : "s"}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Sort:</span>
        {([
          { v: "recent", l: "Recent" },
          { v: "price",  l: "Price ↑" },
          { v: "size",   l: "Size ↓" },
        ] as const).map((o) => (
          <button
            key={o.v}
            onClick={() => setSort(o.v)}
            style={{
              fontSize: 12, padding: "4px 10px", borderRadius: 999,
              background: sort === o.v ? "var(--ink)" : "transparent",
              color: sort === o.v ? "var(--paper)" : "var(--ink-soft)",
              border: sort === o.v ? "1px solid var(--ink)" : "1px solid var(--line)",
            }}
          >
            {o.l}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: isMobile ? 14 : 24 }}>
        {list.map((a, i) => (
          <ApartmentCard
            key={a.id}
            a={a}
            partners={partners}
            currentUser={currentUser}
            onOpen={() => setSelectedId(a.id)}
            onVote={(r) => vote(a.id, r)}
            onStatus={(s) => setStatus(a.id, s)}
            onRemove={() => remove(a.id)}
            onEdit={() => setEditingId(a.id)}
            rotate={(i % 5 - 2) * 0.6}
          />
        ))}
      </div>

      {list.length === 0 && <EmptyListings onAdd={() => setAdding(true)} />}

      {selected && (
        <ApartmentDetail
          a={selected}
          partners={partners}
          currentUser={currentUser}
          isMobile={isMobile}
          onClose={() => setSelectedId(null)}
          onVote={(r) => vote(selected.id, r)}
          onStatus={(s) => setStatus(selected.id, s)}
          onUpdate={(fn) => update(selected.id, fn)}
          onRemove={() => { remove(selected.id); setSelectedId(null); }}
          onEdit={() => { setSelectedId(null); setEditingId(selected.id); }}
        />
      )}

      {editing && (
        <EditListingModal
          a={editing}
          isMobile={isMobile}
          onClose={() => setEditingId(null)}
          onSave={(fields) => { update(editing.id, (a) => ({ ...a, ...fields })); setEditingId(null); }}
        />
      )}

      {adding && (
        <AddListingModal
          isMobile={isMobile}
          onClose={() => setAdding(false)}
          onAdd={(a) => {
            setApartments((prev) => [a, ...prev]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────

function StatPill({ emoji, label, value, active, onClick, tone }: { emoji: string; label: string; value: number; active: boolean; onClick: () => void; tone?: string }) {
  const accent = tone === "coral" ? "var(--coral)" : "var(--ink)";
  return (
    <button
      onClick={onClick}
      className="card-paper"
      style={{
        padding: "12px 16px", textAlign: "left",
        border: active ? `2px solid ${accent}` : "1px solid var(--line)",
        background: active ? "white" : "oklch(1 0 0 / 0.65)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-mute)" }}>{emoji} {label}</span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, lineHeight: 1, marginTop: 4 }}>{value}</div>
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────

function ApartmentCard({ a, partners, currentUser, onOpen, onVote, onRemove, onEdit, rotate = 0 }: {
  a: Apartment;
  partners: { p1: { name: string; emoji: string }; p2: { name: string; emoji: string } };
  currentUser: "p1" | "p2";
  onOpen: () => void;
  onVote: (r: ApartmentReaction) => void;
  onStatus: (s: ApartmentStatus) => void;
  onRemove: () => void;
  onEdit: () => void;
  rotate?: number;
}) {
  const c = consensusOf(a.reactions);
  const meta = STATUS_META[a.status];

  return (
    <article
      className="polaroid"
      style={{ transform: `rotate(${rotate}deg)`, cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "rotate(0deg) translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lift)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = `rotate(${rotate}deg)`; e.currentTarget.style.boxShadow = "var(--shadow-paper)"; }}
    >
      <div onClick={onOpen} style={{ position: "relative" }}>
        <PhotoSlot hue={a.photo.hue} label={a.photo.label} height={200}
          tag={a.visitDate ? <Sticker tone="sun" rotate={3}>📅 {new Date(a.visitDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Sticker> : null}
        />
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <Sticker tone={meta.tone} rotate={-2}>{meta.emoji} {meta.label}</Sticker>
        </div>
        {c === "both-love" && (
          <div style={{ position: "absolute", bottom: -10, right: -10, transform: "rotate(8deg)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 999, background: "var(--coral)", color: "white", fontWeight: 500, fontSize: 12, boxShadow: "var(--shadow-paper)" }}>
              💛 both love it
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 6px 4px" }} onClick={onOpen}>
        <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, margin: "0 0 4px", fontWeight: 400, lineHeight: 1.1 }}>{a.title}</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 10px" }}>{a.area}</p>
        <div style={{ display: "flex", gap: 14, fontSize: 14, marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: "var(--coral-deep)" }}><Euro value={a.price} /></span>
          <span style={{ color: "var(--ink-mute)" }}>·</span>
          <span className="mono" style={{ fontSize: 13 }}>{a.sqm}m²</span>
          <span style={{ color: "var(--ink-mute)" }}>·</span>
          <span className="mono" style={{ fontSize: 13 }}>{a.rooms} room{a.rooms === 1 ? "" : "s"}</span>
        </div>
        {a.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {a.tags.slice(0, 4).map((t, i) => (
              <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "var(--paper-deep)", borderRadius: 999, color: "var(--ink-soft)" }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ padding: "0 4px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        <VoteRow reactions={a.reactions} partners={partners} currentUser={currentUser} onVote={onVote} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <button
            onClick={onEdit}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, border: "1px solid var(--line)", color: "var(--ink-soft)", background: "transparent" }}
          >
            ✎ Edit
          </button>
          <button
            onClick={onRemove}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, border: "1px solid var(--line)", color: "var(--coral-deep)", background: "transparent" }}
          >
            ✕ Remove
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Detail panel ──────────────────────────────────────────────

function ApartmentDetail({ a, partners, currentUser, isMobile, onClose, onVote, onStatus, onUpdate, onRemove, onEdit }: {
  a: Apartment;
  partners: { p1: { name: string; emoji: string }; p2: { name: string; emoji: string } };
  currentUser: "p1" | "p2";
  isMobile: boolean;
  onClose: () => void;
  onVote: (r: ApartmentReaction) => void;
  onStatus: (s: ApartmentStatus) => void;
  onUpdate: (fn: (a: Apartment) => Apartment) => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const c = consensusOf(a.reactions);
  const [note, setNote] = useState("");

  const addNote = () => {
    if (!note.trim()) return;
    onUpdate((x) => ({ ...x, notes: [{ who: currentUser, text: note.trim(), at: 0 }, ...x.notes] }));
    setNote("");
  };

  const inner = (
    <div style={{ padding: isMobile ? "0 16px 16px" : 28, paddingBottom: isMobile ? "max(16px, var(--safe-bottom, 16px))" : 28 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Sticker tone={STATUS_META[a.status].tone}>{STATUS_META[a.status].emoji} {STATUS_META[a.status].label}</Sticker>
        <ConsensusBadge c={c} />
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-mute)", padding: "4px 8px", marginLeft: "auto" }}>via {a.source}</span>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 34 : 44, lineHeight: 1.05, margin: "8px 0 6px", fontWeight: 400 }}>{a.title}</h2>
      <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 18px" }}>{a.area}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
        <Fact label="Rent" value={<><Euro value={a.price} /><span style={{ fontSize: 12, color: "var(--ink-mute)" }}>/mo</span></>} />
        <Fact label="Size" value={<>{a.sqm}<span style={{ fontSize: 12, color: "var(--ink-mute)" }}>m²</span></>} />
        <Fact label="Rooms" value={a.rooms} />
        <Fact label="Floor" value={a.floor} />
        <Fact label="Built" value={a.year} small />
        <Fact label="Heating" value={a.heat} small />
        <Fact label="Per m²" value={<><Euro value={Math.round(a.price / a.sqm)} /></>} small />
        <Fact label="Visit" value={a.visitDate ? new Date(a.visitDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"} small />
      </div>

      {a.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {a.tags.map((t, i) => (
            <span key={i} style={{ fontSize: 12, padding: "4px 10px", background: "var(--paper-deep)", borderRadius: 999, border: "1px dashed var(--line-strong)" }}>#{t}</span>
          ))}
        </div>
      )}

      <h4 className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px", color: "var(--ink-mute)" }}>What we think</h4>
      <div style={{ marginBottom: 20 }}>
        <VoteRow reactions={a.reactions} partners={partners} currentUser={currentUser} onVote={onVote} />
      </div>

      <h4 className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px", color: "var(--ink-mute)" }}>Status</h4>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, padding: 4, background: "var(--paper-deep)", borderRadius: 999, width: "fit-content", flexWrap: isMobile ? "wrap" : "nowrap" }}>
        {(Object.entries(STATUS_META) as [ApartmentStatus, typeof STATUS_META[ApartmentStatus]][]).map(([k, m]) => (
          <button key={k} onClick={() => onStatus(k)} style={{
            padding: "8px 14px", borderRadius: 999,
            background: a.status === k ? "white" : "transparent",
            boxShadow: a.status === k ? "var(--shadow-paper)" : "none",
            fontSize: 13, fontWeight: a.status === k ? 500 : 400,
          }}>{m.emoji} {m.label}</button>
        ))}
      </div>

      <h4 className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px", color: "var(--ink-mute)" }}>Notes between you</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {a.notes.length === 0 && <p style={{ fontSize: 13, color: "var(--ink-mute)", fontStyle: "italic" }}>No notes yet — first impression?</p>}
        {a.notes.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Avatar who={n.who} partner={partners[n.who]} size={28} />
            <div style={{
              flex: 1, padding: "8px 12px",
              background: n.who === "p1" ? "var(--coral-soft)" : "var(--olive-soft)",
              borderRadius: 14, borderTopLeftRadius: 4, fontSize: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: n.who === "p1" ? "var(--coral-deep)" : "var(--olive-deep)" }}>{partners[n.who].name}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-mute)" }}>{relTime(n.at)}</span>
              </div>
              {n.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Quick thought, ${partners[currentUser].name}?`}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <button className="btn btn-primary" onClick={addNote} style={{ minHeight: 44 }}>Send</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={a.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Open on {a.source} ↗</a>
        <button className="btn btn-ghost" onClick={() => {
          const d = new Date(); d.setDate(d.getDate() + 5);
          onUpdate((x) => ({ ...x, visitDate: d.toISOString().slice(0, 10) }));
        }}>📅 Book</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onEdit} style={{ flex: 1, justifyContent: "center" }}>✎ Edit listing</button>
        <button
          onClick={onRemove}
          style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid var(--coral)", color: "var(--coral-deep)", background: "transparent", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        >
          Remove
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="sheet-overlay fade-up" onClick={onClose}>
        <div className="sheet-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "94dvh" }}>
          <div className="sheet-handle" />
          <div style={{ position: "relative" }}>
            <PhotoSlot hue={a.photo.hue} label={a.photo.label} height={200} />
            <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 999, background: "white", boxShadow: "var(--shadow-paper)", fontSize: 18 }} aria-label="Close">×</button>
          </div>
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0.2 0.04 30 / 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }} className="fade-up">
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "95vw", background: "var(--paper)", overflow: "auto", boxShadow: "var(--shadow-lift)" }}>
        <div style={{ position: "relative" }}>
          <PhotoSlot hue={a.photo.hue} label={a.photo.label} height={300} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: 999, background: "white", boxShadow: "var(--shadow-paper)", fontSize: 18 }} aria-label="Close">×</button>
        </div>
        {inner}
      </div>
    </div>
  );
}

function Fact({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) {
  return (
    <div style={{ padding: "12px 14px", borderRight: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: small ? 18 : 22, lineHeight: 1.1, fontWeight: 400 }}>{value}</div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyListings({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card-paper" style={{ padding: 48, textAlign: "center", border: "2px dashed var(--line-strong)", background: "oklch(1 0 0 / 0.4)" }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, margin: "10px 0 6px", fontWeight: 400 }}>No listings here yet</h3>
      <p style={{ color: "var(--ink-soft)", margin: "0 0 16px" }}>Paste a Spitogatos or XE link and we'll save it for you both to vote on.</p>
      <button className="btn btn-coral" onClick={onAdd}>+ Paste a listing</button>
    </div>
  );
}

// ── Add listing modal ─────────────────────────────────────────

function AddListingModal({ isMobile, onClose, onAdd }: { isMobile: boolean; onClose: () => void; onAdd: (a: Apartment) => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [sqm, setSqm] = useState("");
  const [rooms, setRooms] = useState("2");

  const submit = () => {
    if (!title.trim() || !price) return;
    const hostname = (() => { try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return null; } })();
    onAdd({
      id: "ap" + Math.random().toString(36).slice(2, 8),
      title: title.trim(),
      area: area.trim() || "—",
      price: Number(price),
      sqm: Number(sqm) || 60,
      floor: 2, rooms: Number(rooms), year: 2000, heat: "—",
      source: hostname ?? "manual",
      url: url || "#",
      photo: { hue: Math.floor(Math.random() * 360), label: "your listing" },
      status: "shortlist",
      visitDate: null,
      reactions: {},
      notes: [],
      tags: [],
    });
  };

  return (
    <Modal open onClose={onClose} title="Save a listing" isMobile={isMobile}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="field" placeholder="Listing URL (Spitogatos / XE / Tospitimou…)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <input className="field" placeholder="Title (e.g. Bright 2-bed in Pangrati)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="field" placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <input className="field" placeholder="€ / month" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
          <input className="field" placeholder="m²" inputMode="numeric" value={sqm} onChange={(e) => setSqm(e.target.value.replace(/\D/g, ""))} />
          <input className="field" placeholder="rooms" inputMode="numeric" value={rooms} onChange={(e) => setRooms(e.target.value.replace(/\D/g, ""))} />
        </div>
        <button className="btn btn-coral" onClick={submit} style={{ justifyContent: "center", marginTop: 4 }}>Save to shortlist →</button>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", margin: 0, textAlign: "center" }}>We'll fetch the rest from the link when we wire it up.</p>
      </div>
    </Modal>
  );
}

// ── Edit listing modal ────────────────────────────────────────

function EditListingModal({ a, isMobile, onClose, onSave }: {
  a: Apartment;
  isMobile: boolean;
  onClose: () => void;
  onSave: (fields: Partial<Apartment>) => void;
}) {
  const [title, setTitle] = React.useState(a.title);
  const [area, setArea] = React.useState(a.area);
  const [price, setPrice] = React.useState(String(a.price));
  const [sqm, setSqm] = React.useState(String(a.sqm));
  const [rooms, setRooms] = React.useState(String(a.rooms));
  const [floor, setFloor] = React.useState(String(a.floor));
  const [visitDate, setVisitDate] = React.useState(a.visitDate ?? "");
  const [url, setUrl] = React.useState(a.url === "#" ? "" : a.url);

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      area: area.trim() || a.area,
      price: Number(price) || a.price,
      sqm: Number(sqm) || a.sqm,
      rooms: Number(rooms) || a.rooms,
      floor: Number(floor) || a.floor,
      visitDate: visitDate || null,
      url: url.trim() || a.url,
    });
  };

  return (
    <Modal open onClose={onClose} title="Edit listing" isMobile={isMobile}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="field" placeholder="Area / neighbourhood" value={area} onChange={(e) => setArea(e.target.value)} />
        <input className="field" placeholder="Listing URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input className="field" placeholder="€ / month" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
          <input className="field" placeholder="m²" inputMode="numeric" value={sqm} onChange={(e) => setSqm(e.target.value.replace(/\D/g, ""))} />
          <input className="field" placeholder="Rooms" inputMode="numeric" value={rooms} onChange={(e) => setRooms(e.target.value.replace(/\D/g, ""))} />
          <input className="field" placeholder="Floor" inputMode="numeric" value={floor} onChange={(e) => setFloor(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-mute)", display: "block", marginBottom: 4 }}>Visit date</label>
          <input className="field" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
          <button className="btn btn-coral" onClick={submit} style={{ flex: 1, justifyContent: "center" }}>Save changes →</button>
        </div>
      </div>
    </Modal>
  );
}

import React from "react";
