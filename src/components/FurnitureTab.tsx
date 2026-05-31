import { useEffect, useMemo, useState } from "react";
import {
  ROOMS,
  ROOM_ICONS,
  uid,
  useCurrentUser,
  useFurniture,
  useSetup,
  type FurnitureItem,
  type FurnitureStatus,
  type PartnerKey,
  type Reaction,
  type Setup,
  type WishLink,
} from "@/lib/store";
import { Avatar } from "./Avatar";
import { FAB, Modal } from "./AppShell";

const STATUS_META: Record<FurnitureStatus, { emoji: string; label: string; chip: string }> = {
  have: { emoji: "✅", label: "Have It", chip: "bg-success/15 text-success" },
  need: { emoji: "🛒", label: "Need It", chip: "bg-terracotta/15 text-terracotta" },
  discuss: { emoji: "🤔", label: "Discuss", chip: "bg-warn/20 text-foreground/80" },
};

type LinkConsensus = "both-love" | "agreed" | "veto" | "partial" | "none";
function linkConsensus(l: WishLink): LinkConsensus {
  const { p1, p2 } = l.reactions;
  if (p1 === "veto" || p2 === "veto") return "veto";
  if (!p1 || !p2) return p1 || p2 ? "partial" : "none";
  if (p1 === "love" && p2 === "love") return "both-love";
  return "agreed";
}

export function FurnitureTab() {
  const [setup] = useSetup();
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  if (!setup) return null;

  return openRoom ? (
    <RoomDetail room={openRoom} onBack={() => setOpenRoom(null)} setup={setup} />
  ) : (
    <RoomGrid setup={setup} onPick={setOpenRoom} />
  );
}

/* ---------------- Room grid ---------------- */

function RoomGrid({ setup, onPick }: { setup: Setup; onPick: (r: string) => void }) {
  const [items] = useFurniture();
  const [addOpen, setAddOpen] = useState(false);

  const stats = useMemo(() => {
    const map: Record<string, { have: number; need: number; discuss: number; total: number }> = {};
    for (const r of ROOMS) map[r] = { have: 0, need: 0, discuss: 0, total: 0 };
    for (const it of items) {
      const s = map[it.room] ?? (map[it.room] = { have: 0, need: 0, discuss: 0, total: 0 });
      s.total++;
      s[it.status]++;
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-serif font-semibold">Furniture</h2>
        <p className="mt-1 text-muted-foreground">
          Room by room — what you have, what you need, what you're still deciding.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROOMS.map((r) => {
          const s = stats[r];
          const covered = s.have + s.discuss; // "covered" = decided either way
          const pct = s.total ? Math.round((covered / s.total) * 100) : 0;
          return (
            <button
              key={r}
              onClick={() => onPick(r)}
              className="group flex w-full flex-col gap-3 rounded-3xl border bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ROOM_ICONS[r]}</span>
                  <span className="font-serif text-xl font-semibold">{r}</span>
                </div>
                <span className="text-muted-foreground transition group-hover:translate-x-0.5">
                  →
                </span>
              </div>

              {s.total === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet — tap to add.</p>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {covered} of {s.total} covered
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Chip>{`✅ ${s.have} have`}</Chip>
                    <Chip>{`🛒 ${s.need} need`}</Chip>
                    <Chip>{`🤔 ${s.discuss} discuss`}</Chip>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      <FAB onClick={() => setAddOpen(true)} label="Add furniture item" />
      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        setup={setup}
        defaultRoom={ROOMS[0]}
      />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{children}</span>
  );
}

/* ---------------- Room detail ---------------- */

type StatusFilter = "all" | FurnitureStatus;

function RoomDetail({
  room,
  onBack,
  setup,
}: {
  room: string;
  onBack: () => void;
  setup: Setup;
}) {
  const [items, setItems] = useFurniture();
  const [current] = useCurrentUser();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const list = useMemo(
    () =>
      items
        .filter((i) => i.room === room)
        .filter((i) => filter === "all" || i.status === filter)
        .sort((a, b) => b.createdAt - a.createdAt),
    [items, room, filter],
  );

  const update = (id: string, fn: (it: FurnitureItem) => FurnitureItem) =>
    setItems(items.map((it) => (it.id === id ? fn(it) : it)));
  const remove = (id: string) => setItems(items.filter((it) => it.id !== id));

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "have", label: "Have ✅" },
    { key: "need", label: "Need 🛒" },
    { key: "discuss", label: "Discuss 🤔" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          ← Rooms
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ROOM_ICONS[room]}</span>
          <h2 className="text-2xl font-serif font-semibold">{room}</h2>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`btn btn-sm ${
              filter === f.key ? "btn-coral" : "btn-ghost"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <div className="space-y-3">
          {list.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              setup={setup}
              currentUser={current}
              onUpdate={(fn) => update(it.id, fn)}
              onDelete={() => remove(it.id)}
            />
          ))}
        </div>
      )}

      <FAB onClick={() => setAddOpen(true)} label="Add furniture item" />
      <AddItemModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        setup={setup}
        defaultRoom={room}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed bg-card/50 p-10 text-center">
      <div className="text-5xl">🪑</div>
      <p className="mt-3 font-medium">Nothing here yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Start listing what's already yours and what you'd love to find.
      </p>
      <button onClick={onAdd} className="btn btn-coral mt-5">
        + Add item
      </button>
    </div>
  );
}

/* ---------------- Item card ---------------- */

function ItemCard({
  item,
  setup,
  currentUser,
  onUpdate,
  onDelete,
}: {
  item: FurnitureItem;
  setup: Setup;
  currentUser: PartnerKey;
  onUpdate: (fn: (it: FurnitureItem) => FurnitureItem) => void;
  onDelete: () => void;
}) {
  const meta = STATUS_META[item.status];
  const adder = setup[item.addedBy];
  const hasWinner = item.links.some((l) => linkConsensus(l) === "both-love");

  const setStatus = (s: FurnitureStatus) => onUpdate((it) => ({ ...it, status: s }));

  const reactLink = (linkId: string, r: Reaction) =>
    onUpdate((it) => ({
      ...it,
      links: it.links.map((l) =>
        l.id === linkId
          ? {
              ...l,
              reactions: {
                ...l.reactions,
                [currentUser]: l.reactions[currentUser] === r ? undefined : r,
              },
            }
          : l,
      ),
    }));

  const removeLink = (linkId: string) =>
    onUpdate((it) => ({ ...it, links: it.links.filter((l) => l.id !== linkId) }));

  const addLink = (l: Omit<WishLink, "id" | "addedBy" | "createdAt" | "reactions">) =>
    onUpdate((it) => ({
      ...it,
      links: [
        ...it.links,
        {
          ...l,
          id: uid(),
          addedBy: currentUser,
          createdAt: Date.now(),
          reactions: {},
        },
      ],
    }));

  return (
    <article className="space-y-3 rounded-3xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-serif text-lg font-semibold">{item.name}</h3>
            {hasWinner && (
              <span
                className="text-base"
                title="A favourite link has been chosen"
                aria-label="Has a favourite pick"
              >
                🏆
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-0.5 font-medium ${meta.chip}`}>
              {meta.emoji} {meta.label}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Avatar partner={adder} who={item.addedBy} size="sm" />
              added by {adder.name}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete"
          style={{ color: "var(--ink-mute)", flexShrink: 0 }}
        >
          ✕
        </button>
      </div>

      {/* Status switcher */}
      <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--paper-deep)", borderRadius: 999 }}>
        {(Object.keys(STATUS_META) as FurnitureStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              flex: 1,
              padding: "9px 8px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: item.status === s ? 600 : 400,
              background: item.status === s ? "white" : "transparent",
              boxShadow: item.status === s ? "var(--shadow-paper)" : "none",
              color: item.status === s ? "var(--ink)" : "var(--ink-mute)",
              transition: "all 0.15s ease",
              minHeight: 40,
            }}
          >
            {STATUS_META[s].emoji} {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {item.status === "have" && item.note && (
        <p className="rounded-2xl bg-muted/50 px-3 py-2 text-sm text-foreground/80">
          📝 {item.note}
        </p>
      )}

      {(item.status === "need" || item.status === "discuss") && (
        <LinksSection
          links={item.links}
          setup={setup}
          currentUser={currentUser}
          onReact={reactLink}
          onRemove={removeLink}
          onAdd={addLink}
        />
      )}
    </article>
  );
}

/* ---------------- Links section ---------------- */

function LinksSection({
  links,
  setup,
  currentUser,
  onReact,
  onRemove,
  onAdd,
}: {
  links: WishLink[];
  setup: Setup;
  currentUser: PartnerKey;
  onReact: (id: string, r: Reaction) => void;
  onRemove: (id: string) => void;
  onAdd: (l: { url: string; label?: string; price?: number }) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  const submit = () => {
    if (!url.trim()) return;
    onAdd({
      url: url.trim(),
      label: label.trim() || undefined,
      price: price ? Number(price) : undefined,
    });
    setUrl("");
    setLabel("");
    setPrice("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Wishlist links
      </div>

      {links.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No ideas yet — add a shop link to start comparing.
        </p>
      )}

      {links.map((l) => (
        <LinkRow
          key={l.id}
          link={l}
          setup={setup}
          currentUser={currentUser}
          onReact={(r) => onReact(l.id, r)}
          onRemove={() => onRemove(l.id)}
        />
      ))}

      {adding ? (
        <div className="space-y-2 rounded-2xl border border-dashed bg-background/50 p-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Shop link (https://...)"
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Dream pick)"
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="€"
              inputMode="decimal"
              className="w-24 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button onClick={submit} className="btn btn-coral btn-sm">
              Add link
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1.5px dashed var(--line-strong)", background: "transparent", fontSize: 14, color: "var(--ink-mute)", cursor: "pointer", transition: "background 0.15s", minHeight: 44 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-deep)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          + Add another link
        </button>
      )}
    </div>
  );
}

const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: "love", emoji: "❤️", label: "Love it" },
  { key: "fine", emoji: "👍", label: "Fine" },
  { key: "veto", emoji: "❌", label: "No" },
];

function LinkRow({
  link,
  setup,
  currentUser,
  onReact,
  onRemove,
}: {
  link: WishLink;
  setup: Setup;
  currentUser: PartnerKey;
  onReact: (r: Reaction) => void;
  onRemove: () => void;
}) {
  const consensus = linkConsensus(link);
  const adder = setup[link.addedBy];
  const domain = safeDomain(link.url) ?? "link";

  const banner =
    consensus === "both-love"
      ? { text: "✅ Both love this", cls: "bg-success/15 text-success" }
      : consensus === "agreed"
        ? { text: "🤝 Agreed", cls: "bg-muted text-foreground/70" }
        : consensus === "veto"
          ? { text: "❌ Vetoed", cls: "bg-warn/20 text-foreground" }
          : { text: "⏳ Pending opinion", cls: "bg-muted/60 text-muted-foreground" };

  const wrapCls = `space-y-2 rounded-2xl border p-3 transition ${
    consensus === "both-love" ? "bg-success/5 shadow-glow-sage" : "bg-background/60"
  }`;

  return (
    <div className={wrapCls}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:underline"
            >
              🔗 {domain}
            </a>
            {link.label && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                {link.label}
              </span>
            )}
            {link.price != null && (
              <span className="text-xs font-medium">€{link.price.toFixed(0)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar partner={adder} who={link.addedBy} size="sm" />
            added by {adder.name}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm transition hover:bg-red-50 hover:text-red-500"
          aria-label="Remove link"
          style={{ color: "var(--ink-mute)", flexShrink: 0 }}
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 p-1.5">
        <div className="flex items-center gap-1">
          {(["p1", "p2"] as const).map((k) => {
            const r = link.reactions[k];
            return (
              <div
                key={k}
                className="flex items-center gap-1 rounded-full bg-card/70 px-1.5 py-0.5 text-xs"
              >
                <Avatar partner={setup[k]} who={k} size="sm" />
                <span className="text-sm leading-none">{r ? emojiOf(r) : "·"}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-0.5">
          {REACTIONS.map((r) => {
            const active = link.reactions[currentUser] === r.key;
            return (
              <button
                key={r.key}
                onClick={() => onReact(r.key)}
                aria-label={r.label}
                style={{
                  width: 40, height: 40, borderRadius: 999, fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "white" : "transparent",
                  boxShadow: active ? "var(--shadow-paper)" : "none",
                  border: active ? "1.5px solid var(--line)" : "1.5px solid transparent",
                  transition: "all 0.15s ease",
                  transform: active ? "scale(1.1)" : "scale(1)",
                  flexShrink: 0,
                }}
              >
                {r.emoji}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl px-3 py-1.5 text-xs font-medium ${banner.cls}`}>
        {banner.text}
      </div>
    </div>
  );
}

function emojiOf(r: Reaction) {
  return r === "love" ? "❤️" : r === "fine" ? "👍" : "❌";
}

function safeDomain(url: string) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/* ---------------- Add item modal ---------------- */

function AddItemModal({
  open,
  onClose,
  setup: _setup,
  defaultRoom,
}: {
  open: boolean;
  onClose: () => void;
  setup: Setup;
  defaultRoom: string;
}) {
  const [items, setItems] = useFurniture();
  const [current] = useCurrentUser();
  const [name, setName] = useState("");
  const [room, setRoom] = useState<string>(defaultRoom);
  const [status, setStatus] = useState<FurnitureStatus>("need");
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkPrice, setLinkPrice] = useState("");

  useEffect(() => {
    if (open) setRoom(defaultRoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultRoom]);

  const submit = () => {
    if (!name.trim()) return;
    const links: WishLink[] = [];
    if ((status === "need" || status === "discuss") && linkUrl.trim()) {
      links.push({
        id: uid(),
        url: linkUrl.trim(),
        label: linkLabel.trim() || undefined,
        price: linkPrice ? Number(linkPrice) : undefined,
        addedBy: current,
        createdAt: Date.now(),
        reactions: {},
      });
    }
    const it: FurnitureItem = {
      id: uid(),
      name: name.trim(),
      room,
      status,
      note: status === "have" && note.trim() ? note.trim() : undefined,
      links,
      addedBy: current,
      createdAt: Date.now(),
    };
    setItems([it, ...items]);
    setName("");
    setNote("");
    setLinkUrl("");
    setLinkLabel("");
    setLinkPrice("");
    setStatus("need");
    onClose();
  };

  const inputCls =
    "w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <Modal open={open} onClose={onClose} title="Add furniture item">
      <div className="space-y-3.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name (e.g. Sofa, Coffee maker)"
          className={inputCls}
          autoFocus
        />
        <select value={room} onChange={(e) => setRoom(e.target.value)} className={inputCls}>
          {ROOMS.map((r) => (
            <option key={r} value={r}>
              {ROOM_ICONS[r]} {r}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--paper-deep)", borderRadius: 999 }}>
          {(Object.keys(STATUS_META) as FurnitureStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: status === s ? 600 : 400,
                background: status === s ? "white" : "transparent",
                boxShadow: status === s ? "var(--shadow-paper)" : "none",
                color: status === s ? "var(--ink)" : "var(--ink-mute)",
                transition: "all 0.15s ease",
                minHeight: 44,
              }}
            >
              {STATUS_META[s].emoji} {STATUS_META[s].label}
            </button>
          ))}
        </div>

        {status === "have" ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. bringing my old one over"
            rows={2}
            className={inputCls}
          />
        ) : (
          <div className="space-y-2 rounded-2xl border border-dashed bg-background/50 p-3">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              First wishlist link (optional)
            </div>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Shop link (https://...)"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Label (e.g. Budget option)"
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                value={linkPrice}
                onChange={(e) => setLinkPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="€"
                inputMode="decimal"
                className="w-24 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}

        <button onClick={submit} className="btn btn-coral" style={{ width: "100%", borderRadius: 14, fontSize: 15, padding: "14px 20px" }}>
          Add item →
        </button>
      </div>
    </Modal>
  );
}
