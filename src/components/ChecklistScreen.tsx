import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  uid,
  useTasks,
  type Task,
  type TaskStatus,
  type PartnerKey,
} from "@/lib/store";
import { Avatar, Modal as JejoModal, daysUntil } from "@/components/JejoUI";
import type { AppCtx } from "@/components/AppShell";

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

export function ChecklistScreen({ ctx }: { ctx: AppCtx }) {
  const { setup, currentUser, isMobile } = ctx;
  const partners = { p1: setup.p1, p2: setup.p2 };
  const [tasks, setTasks] = useTasks();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "theirs" | "due-soon">("all");

  const otherKey: PartnerKey = currentUser === "p1" ? "p2" : "p1";

  const filtered = useMemo(() => {
    if (filter === "mine") return tasks.filter((t) => t.addedBy === currentUser);
    if (filter === "theirs") return tasks.filter((t) => t.addedBy !== currentUser);
    if (filter === "due-soon") return tasks.filter((t) => t.dueDate && daysUntil(t.dueDate) <= 7);
    return tasks;
  }, [tasks, filter, currentUser]);

  const grouped = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const c of CATEGORIES) m[c] = [];
    for (const t of filtered) {
      if (!m[t.category]) m[t.category] = [];
      m[t.category].push(t);
    }
    return m;
  }, [filtered]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;

  const cycle = (t: Task, e: React.MouseEvent) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(t.status) + 1) % 3];
    if (next === "done") {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
        colors: ["#e26d3f", "#7b9a55", "#ecbb47", "#faf0d8", "#c75c46"],
      });
    }
    setTasks((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, status: next, completedBy: next === "done" ? currentUser : undefined } : x,
      ),
    );
  };

  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const edit = (id: string, fields: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
  const assign = (id: string, assignee: PartnerKey) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, assignee } : t)));

  const addTask = (name: string, category: string, dueDate?: string) => {
    const task: Task = {
      id: uid(),
      name,
      category,
      dueDate,
      status: "todo",
      addedBy: currentUser,
      createdAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 20 }}>
        <div>
          <p className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>
            Checklist · {done} of {total} done
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: isMobile ? 38 : 56, lineHeight: 1, margin: "8px 0 0", fontWeight: 400 }}>
            Moving in is a <span style={{ color: "var(--coral)" }}>list,</span> mostly.
          </h1>
        </div>
        <button className="btn btn-coral" onClick={() => setAdding(true)}>+ Add a task</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { v: "all",      l: "Everything" },
          { v: "mine",     l: `Mine (${partners[currentUser].emoji})` },
          { v: "theirs",   l: `Theirs (${partners[otherKey].emoji})` },
          { v: "due-soon", l: "Due this week" },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setFilter(o.v as typeof filter)}
            style={{
              fontSize: 13, padding: "8px 14px", borderRadius: 999,
              background: filter === o.v ? "var(--ink)" : "transparent",
              color: filter === o.v ? "var(--paper)" : "var(--ink-soft)",
              border: filter === o.v ? "1px solid var(--ink)" : "1px solid var(--line)",
            }}
          >
            {o.l}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999, background: "var(--paper-deep)" }}>
          <span style={{ width: 80, height: 6, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${total ? (done / total) * 100 : 0}%`, background: "var(--coral)", transition: "width 0.4s ease" }} />
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>{Math.round(total ? (done / total) * 100 : 0)}%</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CATEGORIES.map((cat) => {
          const list = grouped[cat] ?? [];
          const cdone = list.filter((t) => t.status === "done").length;
          const isCollapsed = collapsed[cat];
          if (list.length === 0 && filter !== "all") return null;

          return (
            <section key={cat} className="card-paper" style={{ overflow: "hidden" }}>
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, [cat]: !isCollapsed }))}
                style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{CATEGORY_EMOJI[cat] ?? "•"}</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 24, margin: 0, fontWeight: 400 }}>{cat}</h3>
                    <p className="mono" style={{ fontSize: 11, color: "var(--ink-mute)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
                      {list.length === 0 ? "empty" : `${cdone} / ${list.length} done`}
                    </p>
                  </div>
                </div>
                <span style={{ color: "var(--ink-mute)", fontSize: 20, transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>⌃</span>
              </button>

              {!isCollapsed && (
                <>
                  {list.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--line)" }}>
                      {list.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          partners={partners}
                          onCycle={(e) => cycle(t, e)}
                          onDelete={() => remove(t.id)}
                          onEdit={(fields) => edit(t.id, fields)}
                          onAssign={(a) => assign(t.id, a)}
                        />
                      ))}
                    </ul>
                  )}
                  <QuickAddRow category={cat} currentUser={currentUser} onAdd={addTask} />
                </>
              )}
            </section>
          );
        })}
      </div>

      {adding && (
        <AddTaskModal
          isMobile={isMobile}
          currentUser={currentUser}
          onClose={() => setAdding(false)}
          onAdd={addTask}
        />
      )}
    </div>
  );
}

// ── Quick add per category ────────────────────────────────────

function QuickAddRow({ category, currentUser, onAdd }: { category: string; currentUser: PartnerKey; onAdd: (name: string, cat: string, due?: string) => void }) {
  const [val, setVal] = useState("");
  const [due, setDue] = useState("");
  const [showDue, setShowDue] = useState(false);

  const submit = () => {
    if (!val.trim()) return;
    onAdd(val.trim(), category, due || undefined);
    setVal(""); setDue(""); setShowDue(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderTop: "1px dashed var(--line)", background: "oklch(1 0 0 / 0.4)" }}>
      <span style={{ width: 26, height: 26, borderRadius: 999, flexShrink: 0, border: "1.5px dashed var(--line-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-mute)", fontSize: 16 }}>+</span>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={`Quick add to ${category.toLowerCase()}…`}
        style={{ flex: 1, padding: "6px 8px", fontSize: 14, background: "transparent", border: "none", outline: "none" }}
      />
      {showDue ? (
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ padding: "4px 8px", fontSize: 12, color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 6, background: "white" }} />
      ) : (
        <button onClick={() => setShowDue(true)} title="Add due date" style={{ fontSize: 12, color: "var(--ink-mute)", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 6 }}>📅</button>
      )}
      <button onClick={submit} disabled={!val.trim()} className="btn btn-coral" style={{ fontSize: 12, padding: "5px 14px", opacity: val.trim() ? 1 : 0.4 }}>Add</button>
    </div>
  );
}

// ── Task row ──────────────────────────────────────────────────

function TaskRow({ task, partners, onCycle, onDelete, onEdit, onAssign }: {
  task: Task;
  partners: { p1: { name: string; emoji: string }; p2: { name: string; emoji: string } };
  onCycle: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onEdit: (fields: Partial<Task>) => void;
  onAssign: (a: PartnerKey) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.name);
  const [dueVal, setDueVal] = useState(task.dueDate ?? "");

  const save = () => {
    onEdit({ name: val.trim() || task.name, dueDate: dueVal || undefined });
    setEditing(false);
  };

  const assignee = (task.assignee ?? task.addedBy) as PartnerKey;

  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 20px", borderBottom: "1px dashed var(--line)" }}>
      <button
        onClick={onCycle}
        aria-label="cycle status"
        style={{
          marginTop: 2,
          width: 26, height: 26, borderRadius: 999, flexShrink: 0,
          border: task.status === "done" ? "2px solid var(--olive)" : task.status === "in_progress" ? "2px solid var(--sun-deep)" : "2px solid var(--line-strong)",
          background: task.status === "done" ? "var(--olive)" : task.status === "in_progress" ? "oklch(0.95 0.08 85)" : "white",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 14,
          transition: "all 0.15s ease",
        }}
      >
        {task.status === "done" && <span className="pop">✓</span>}
        {task.status === "in_progress" && <span style={{ width: 8, height: 8, background: "var(--sun-deep)", borderRadius: 999 }} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(task.name); setEditing(false); } }}
              autoFocus
              style={{ flex: 1, minWidth: 200, padding: "4px 8px", fontSize: 15, fontWeight: 500, border: "1.5px solid var(--coral)", borderRadius: 6, outline: "none" }}
            />
            <input type="date" value={dueVal} onChange={(e) => setDueVal(e.target.value)} style={{ fontSize: 12, padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 6 }} />
            <button onClick={save} className="btn btn-coral" style={{ fontSize: 12, padding: "4px 10px" }}>save</button>
            <button onClick={() => { setVal(task.name); setEditing(false); }} style={{ fontSize: 12, color: "var(--ink-mute)", padding: "4px 8px" }}>cancel</button>
          </div>
        ) : (
          <div
            onClick={() => { setVal(task.name); setDueVal(task.dueDate ?? ""); setEditing(true); }}
            style={{ fontSize: 15, fontWeight: 500, textDecoration: task.status === "done" ? "line-through" : "none", color: task.status === "done" ? "var(--ink-mute)" : "var(--ink)", cursor: "text" }}
            title="Click to edit"
          >
            {task.name}
          </div>
        )}

        {!editing && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)" }}>
              {task.status === "done" ? "done" : task.status === "in_progress" ? "in progress" : "to do"}
            </span>
            {task.dueDate && (
              <span style={{ fontSize: 12, color: daysUntil(task.dueDate) < 0 ? "var(--coral-deep)" : "var(--ink-soft)" }}>
                📅 {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onAssign(assignee === "p2" ? "p1" : "p2"); }}
              title="Tap to reassign"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px 2px 4px", borderRadius: 999, border: "1px solid var(--line)", background: "oklch(1 0 0 / 0.6)", fontSize: 12, cursor: "pointer" }}
            >
              <Avatar who={assignee} partner={partners[assignee]} size={18} />
              <span style={{ color: "var(--ink-soft)" }}>{partners[assignee].name}</span>
            </button>
            {task.completedBy && task.status === "done" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--olive-deep)" }}>
                ✓ <Avatar who={task.completedBy} partner={partners[task.completedBy]} size={16} />
              </span>
            )}
          </div>
        )}
      </div>

      {!editing && (
        <>
          <button onClick={() => { setVal(task.name); setDueVal(task.dueDate ?? ""); setEditing(true); }} style={{ color: "var(--ink-mute)", padding: 4, fontSize: 13 }} aria-label="edit">✎</button>
          <button onClick={onDelete} style={{ color: "var(--ink-mute)", padding: 4, fontSize: 14 }} aria-label="delete">✕</button>
        </>
      )}
    </li>
  );
}

// ── Add task modal ────────────────────────────────────────────

function AddTaskModal({ isMobile, currentUser, onClose, onAdd }: {
  isMobile: boolean;
  currentUser: PartnerKey;
  onClose: () => void;
  onAdd: (name: string, cat: string, due?: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [due, setDue] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), category, due || undefined);
    onClose();
  };

  return (
    <JejoModal open onClose={onClose} title="Add a task" isMobile={isMobile}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="field" placeholder="e.g. Schedule mover quotes" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
        </select>
        <input className="field" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn btn-coral" onClick={submit} style={{ justifyContent: "center" }}>Add task →</button>
      </div>
    </JejoModal>
  );
}

import type React from "react";
