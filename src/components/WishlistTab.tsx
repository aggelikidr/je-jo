import { useMemo, useState } from "react";
import {
  ROOMS,
  uid,
  useCurrentUser,
  useSetup,
  useWishlist,
  type Reaction,
  type WishItem,
} from "@/lib/store";
import { Avatar } from "./Avatar";
import { FAB, Modal } from "./AppShell";

const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: "love", emoji: "❤️", label: "Love it" },
  { key: "fine", emoji: "👍", label: "It's fine" },
  { key: "veto", emoji: "❌", label: "Veto" },
];

type StatusFilter = "all" | "loved" | "vetoed" | "undecided";

export function WishlistTab() {
  const [setup] = useSetup();
  const [current] = useCurrentUser();
  const [items, setItems] = useWishlist();
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState<string>("All");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [who, setWho] = useState<"all" | "p1" | "p2">("all");

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (room !== "All" && it.room !== room) return false;
      if (who !== "all" && it.addedBy !== who) return false;
      const consensus = consensusOf(it);
      if (status === "loved" && consensus !== "both-love") return false;
      if (status === "vetoed" && consensus !== "veto") return false;
      if (status === "undecided" && (consensus === "both-love" || consensus === "veto"))
        return false;
      return true;
    });
  }, [items, room, status, who]);

  const react = (id: string, r: Reaction) => {
    setItems(
      items.map((it) =>
        it.id === id
          ? {
              ...it,
              reactions: { ...it.reactions, [current]: it.reactions[current] === r ? undefined : r },
            }
          : it,
      ),
    );
  };
  const remove = (id: string) => setItems(items.filter((it) => it.id !== id));

  if (!setup) return null;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-serif font-semibold">Furniture wishlist</h2>
        <p className="mt-1 text-muted-foreground">
          Drop in finds. React together. Find your shared style.
        </p>
      </section>

      <div className="flex flex-wrap gap-2 text-sm">
        <Chips
          label="Room"
          value={room}
          onChange={setRoom}
          options={["All", ...ROOMS]}
        />
        <Chips
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={["all", "loved", "vetoed", "undecided"]}
          render={(v) =>
            v === "all"
              ? "All"
              : v === "loved"
                ? "Both love ❤️"
                : v === "vetoed"
                  ? "Vetoed ⚠️"
                  : "Undecided"
          }
        />
        <Chips
          label="Added by"
          value={who}
          onChange={(v) => setWho(v as "all" | "p1" | "p2")}
          options={["all", "p1", "p2"]}
          render={(v) => (v === "all" ? "Anyone" : setup[v as "p1" | "p2"].name)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState items={items.length} onAdd={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((it) => (
            <WishCard
              key={it.id}
              item={it}
              setup={setup}
              currentUser={current}
              onReact={(r) => react(it.id, r)}
              onDelete={() => remove(it.id)}
            />
          ))}
        </div>
      )}

      <FAB onClick={() => setOpen(true)} label="Add item" />
      <AddItemModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

type ConsensusKind = "both-love" | "agreed" | "veto" | "partial" | "none";
function consensusOf(it: WishItem): ConsensusKind {
  const { p1, p2 } = it.reactions;
  if (p1 === "veto" || p2 === "veto") return "veto";
  if (!p1 || !p2) return p1 || p2 ? "partial" : "none";
  if (p1 === "love" && p2 === "love") return "both-love";
  return "agreed";
}

function WishCard({
  item,
  setup,
  currentUser,
  onReact,
  onDelete,
}: {
  item: WishItem;
  setup: { p1: { name: string; emoji: string }; p2: { name: string; emoji: string } };
  currentUser: "p1" | "p2";
  onReact: (r: Reaction) => void;
  onDelete: () => void;
}) {
  const [pulse, setPulse] = useState(false);
  const consensus = consensusOf(item);
  const adder = setup[item.addedBy];
  const domain = item.url ? safeDomain(item.url) : null;

  const consensusBanner =
    consensus === "both-love" ? (
      <div className="rounded-2xl bg-success/15 px-4 py-2 text-sm font-medium text-success shadow-glow-sage">
        ✅ We both love this!
      </div>
    ) : consensus === "agreed" ? (
      <div className="rounded-2xl bg-muted px-4 py-2 text-sm font-medium text-foreground/70">
        🤝 Agreed
      </div>
    ) : consensus === "veto" ? (
      <div className="rounded-2xl bg-warn/20 px-4 py-2 text-sm font-medium text-foreground">
        ⚠️ Discuss this one
      </div>
    ) : null;

  return (
    <article className="flex flex-col gap-3 rounded-3xl border bg-card p-5 shadow-soft transition hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {item.room}
            </span>
            {domain && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground hover:underline"
              >
                🔗 {domain}
              </a>
            )}
          </div>
          <h3 className="mt-2 truncate text-lg font-serif font-semibold">{item.name}</h3>
          {item.note && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.note}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground/60 hover:text-destructive"
          aria-label="Delete"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Avatar partner={adder} who={item.addedBy} size="sm" />
          <span>added by {adder.name}</span>
        </div>
        {item.price != null && (
          <span className="font-medium text-foreground">€{item.price.toFixed(0)}</span>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-2">
        <div className="flex items-center gap-1">
          {(["p1", "p2"] as const).map((k) => {
            const r = item.reactions[k];
            return (
              <div
                key={k}
                className="flex items-center gap-1 rounded-full bg-card/70 px-2 py-1 text-xs"
              >
                <Avatar partner={setup[k]} who={k} size="sm" />
                <span className="text-base leading-none">{r ? emojiOf(r) : "·"}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          {REACTIONS.map((r) => {
            const active = item.reactions[currentUser] === r.key;
            return (
              <button
                key={r.key}
                onClick={() => {
                  if (r.key === "love" && !active) {
                    setPulse(true);
                    setTimeout(() => setPulse(false), 600);
                  }
                  onReact(r.key);
                }}
                aria-label={r.label}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition ${
                  active ? "bg-card shadow-soft" : "hover:bg-card/60"
                } ${pulse && r.key === "love" && active ? "animate-heart" : ""}`}
              >
                {r.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {consensusBanner}
    </article>
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

function Chips<T extends string>({
  label,
  value,
  onChange,
  options,
  render,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: T[];
  render?: (v: T) => string;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 shadow-soft">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{render ? render(value) : value}</span>
        <span className="text-muted-foreground">⌄</span>
      </summary>
      <div className="absolute z-20 mt-1 flex w-max max-w-[80vw] flex-wrap gap-1 rounded-2xl border bg-popover p-2 shadow-card">
        {options.map((o) => (
          <button
            key={o}
            onClick={(e) => {
              onChange(o);
              (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
            }}
            className={`rounded-full px-3 py-1 text-sm transition ${
              o === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {render ? render(o) : o}
          </button>
        ))}
      </div>
    </details>
  );
}

function EmptyState({ items, onAdd }: { items: number; onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed bg-card/50 p-10 text-center">
      <div className="text-5xl">🛋️</div>
      <p className="mt-3 font-medium">
        {items === 0 ? "Your wishlist is empty" : "No items match those filters"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Drop in your first dream piece — sofa, lamp, anything.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
      >
        + Add item
      </button>
    </div>
  );
}

function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useWishlist();
  const [current] = useCurrentUser();
  const [name, setName] = useState("");
  const [room, setRoom] = useState<string>(ROOMS[0]);
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    const it: WishItem = {
      id: uid(),
      name: name.trim(),
      room,
      url: url.trim() || undefined,
      price: price ? Number(price) : undefined,
      note: note.trim() || undefined,
      addedBy: current,
      createdAt: Date.now(),
      reactions: {},
    };
    setItems([it, ...items]);
    setName("");
    setUrl("");
    setPrice("");
    setNote("");
    onClose();
  };

  const inputCls =
    "w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <Modal open={open} onClose={onClose} title="Add a wishlist item">
      <div className="space-y-3.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name (e.g. Velvet sofa)"
          className={inputCls}
          autoFocus
        />
        <select value={room} onChange={(e) => setRoom(e.target.value)} className={inputCls}>
          {ROOMS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link (optional)"
          className={inputCls}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="Price € (optional)"
          inputMode="decimal"
          className={inputCls}
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          rows={2}
          className={inputCls}
        />
        <button
          onClick={submit}
          className="w-full rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground shadow-soft hover:opacity-95"
        >
          Add to wishlist
        </button>
      </div>
    </Modal>
  );
}
