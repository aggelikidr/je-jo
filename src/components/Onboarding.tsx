import { useState } from "react";
import {
  AVATAR_OPTIONS_1,
  AVATAR_OPTIONS_2,
  createHousehold,
  joinHousehold,
  type Setup,
} from "@/lib/store";

type Mode = "pick" | "create" | "join" | "created";

export function Onboarding() {
  const [mode, setMode] = useState<Mode>("pick");
  const [createdCode, setCreatedCode] = useState<string>("");

  if (mode === "create")
    return (
      <CreateFlow
        onBack={() => setMode("pick")}
        onDone={(code) => {
          setCreatedCode(code);
          setMode("created");
        }}
      />
    );

  if (mode === "join") return <JoinFlow onBack={() => setMode("pick")} />;

  if (mode === "created") return <CreatedScreen code={createdCode} />;

  return <PickMode onCreate={() => setMode("create")} onJoin={() => setMode("join")} />;
}

/* ---------------- mode picker ---------------- */

function PickMode({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <div className="min-h-dvh bg-background px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="text-5xl">🏠</div>
        <h1 className="mt-4 text-4xl font-serif font-semibold">Our Home</h1>
        <p className="mt-2 text-muted-foreground">
          A little space to plan your move-in together.
        </p>

        <div className="mt-10 space-y-3 text-left">
          <button
            onClick={onCreate}
            className="w-full rounded-3xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="font-serif text-xl font-semibold">✨ Start a new home</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Set things up and share a code with your partner.
            </div>
          </button>
          <button
            onClick={onJoin}
            className="w-full rounded-3xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="font-serif text-xl font-semibold">🔑 Join with a code</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Got a code from your partner? Hop in here.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- create flow ---------------- */

function CreateFlow({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (code: string) => void;
}) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [emoji1, setEmoji1] = useState(AVATAR_OPTIONS_1[0]);
  const [emoji2, setEmoji2] = useState(AVATAR_OPTIONS_2[0]);
  const [moveDate, setMoveDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = name1.trim() && name2.trim() && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErr(null);
    try {
      const setup: Setup = {
        p1: { name: name1.trim(), emoji: emoji1 },
        p2: { name: name2.trim(), emoji: emoji2 },
        moveInDate: moveDate || undefined,
      };
      const h = await createHousehold(setup);
      onDone(h.code);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <div className="mt-6 text-center">
          <div className="text-5xl">🏠</div>
          <h1 className="mt-4 text-3xl font-serif font-semibold">Start a new home</h1>
        </div>

        <div className="mt-8 space-y-8">
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

          {err && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {err}
            </p>
          )}

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="btn btn-coral"
            style={{ width: "100%", borderRadius: 14, fontSize: 16, padding: "15px 24px", opacity: canSubmit ? 1 : 0.4 }}
          >
            {busy ? "Creating…" : "Create our home →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- join flow ---------------- */

function JoinFlow({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await joinHousehold(code);
      // route gate flips automatically via household event
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <div className="mt-6 text-center">
          <div className="text-5xl">🔑</div>
          <h1 className="mt-4 text-3xl font-serif font-semibold">Join your home</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the 6-character code your partner shared with you.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={8}
            className="w-full rounded-2xl border bg-card px-4 py-5 text-center font-mono text-2xl tracking-[0.4em] uppercase outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
          {err && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {err}
            </p>
          )}
          <button
            onClick={submit}
            disabled={!code.trim() || busy}
            className="btn btn-coral"
            style={{ width: "100%", borderRadius: 14, fontSize: 16, padding: "15px 24px", opacity: !code.trim() || busy ? 0.4 : 1 }}
          >
            {busy ? "Joining…" : "Join →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- created (share code) ---------------- */

function CreatedScreen({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="min-h-dvh bg-background px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-serif font-semibold">Your home is ready</h1>
        <p className="mt-2 text-muted-foreground">
          Share this code with your partner so they can join from their device.
        </p>

        <div className="mt-8 rounded-3xl border bg-card p-6 shadow-card">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your home code
          </div>
          <div className="mt-3 font-mono text-4xl font-semibold tracking-[0.4em] text-foreground">
            {code}
          </div>
          <button
            onClick={copy}
            className={`btn mt-5 ${copied ? "btn-olive" : "btn-coral"}`}
          >
            {copied ? "✓ Copied!" : "📋 Copy code"}
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="btn btn-coral mt-8"
          style={{ width: "100%", borderRadius: 14, fontSize: 16, padding: "15px 24px" }}
        >
          Enter our home →
        </button>
      </div>
    </div>
  );
}

/* ---------------- shared partner editor ---------------- */

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
            style={{
              height: 44, width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 10, fontSize: 22,
              border: emoji === o
                ? `2px solid var(--${tone === "terracotta" ? "coral" : "olive"})`
                : "1.5px solid var(--line)",
              background: emoji === o
                ? `var(--${tone === "terracotta" ? "coral-soft" : "olive-soft"})`
                : "transparent",
              transition: "all 0.12s ease",
              transform: emoji === o ? "scale(1.1)" : "scale(1)",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
