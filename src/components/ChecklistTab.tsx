import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  CATEGORIES,
  uid,
  useCurrentUser,
  useSetup,
  useTasks,
  type Task,
  type TaskStatus,
} from "@/lib/store";
import { Avatar } from "./Avatar";
import { FAB, Modal } from "./AppShell";

export function ChecklistTab() {
  const [setup] = useSetup();
  const [current] = useCurrentUser();
  const [tasks, setTasks] = useTasks();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const m: Record<string, Task[]> = {};
    CATEGORIES.forEach((c) => (m[c] = []));
    tasks.forEach((t) => {
      if (!m[t.category]) m[t.category] = [];
      m[t.category].push(t);
    });
    return m;
  }, [tasks]);

  const cycleStatus = (t: Task) => {
    const next: TaskStatus =
      t.status === "todo" ? "in_progress" : t.status === "in_progress" ? "done" : "todo";
    if (next === "done") {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#c97a5a", "#8aa67a", "#e8c79a", "#faf9f6"],
      });
    }
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, status: next, completedBy: next === "done" ? current : undefined } : x)));
  };

  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  if (!setup) return null;

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl font-serif font-semibold">Moving checklist</h2>
          <span className="text-sm text-muted-foreground">
            {done} / {total} done
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">
          One step at a time. Tap a task to move it forward.
        </p>
      </section>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const items = grouped[cat] || [];
          const isCollapsed = collapsed[cat];
          const catDone = items.filter((i) => i.status === "done").length;
          return (
            <section
              key={cat}
              className="overflow-hidden rounded-3xl border bg-card shadow-soft"
            >
              <button
                onClick={() => setCollapsed({ ...collapsed, [cat]: !isCollapsed })}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted/30"
              >
                <div>
                  <div className="font-medium">{cat}</div>
                  <div className="text-xs text-muted-foreground">
                    {items.length === 0
                      ? "Nothing here yet"
                      : `${catDone} of ${items.length} complete`}
                  </div>
                </div>
                <span
                  className={`text-muted-foreground transition ${isCollapsed ? "" : "rotate-180"}`}
                >
                  ⌃
                </span>
              </button>

              {!isCollapsed && items.length > 0 && (
                <ul className="divide-y divide-border/60 border-t border-border/60">
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      partner={setup[t.addedBy]}
                      onToggle={() => cycleStatus(t)}
                      onDelete={() => remove(t.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <FAB onClick={() => setOpen(true)} label="Add task" />

      <AddTaskModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function TaskRow({
  task,
  partner,
  onToggle,
  onDelete,
}: {
  task: Task;
  partner: { name: string; emoji: string };
  onToggle: () => void;
  onDelete: () => void;
}) {
  const statusStyles: Record<TaskStatus, string> = {
    todo: "border-border bg-background text-muted-foreground",
    in_progress: "border-warmth/50 bg-warmth/10 text-warmth",
    done: "border-success/40 bg-success/15 text-success",
  };

  const statusText: Record<TaskStatus, string> = {
    todo: "To do",
    in_progress: "In progress",
    done: "Done",
  };

  return (
    <li className="flex items-start gap-3 px-5 py-4">
      <button
        onClick={onToggle}
        aria-label={`Mark as next status from ${task.status}`}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.status === "done"
            ? "border-success bg-success text-primary-foreground"
            : task.status === "in_progress"
              ? "border-warmth bg-warmth/20"
              : "border-border bg-background hover:border-primary/60"
        }`}
      >
        {task.status === "done" && <span className="animate-pop-in text-sm">✓</span>}
        {task.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-warmth" />}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={`font-medium leading-snug ${
            task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.name}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full border px-2 py-0.5 ${statusStyles[task.status]}`}
          >
            {statusText[task.status]}
          </span>
          {task.dueDate && (
            <span className="text-muted-foreground">📅 {task.dueDate}</span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Avatar partner={partner} who={task.addedBy} size="sm" />
            <span>{partner.name}</span>
          </span>
        </div>
      </div>

      <button
        onClick={onDelete}
        className="text-muted-foreground/60 hover:text-destructive"
        aria-label="Delete"
      >
        ✕
      </button>
    </li>
  );
}

function AddTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tasks, setTasks] = useTasks();
  const [current] = useCurrentUser();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [due, setDue] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    const t: Task = {
      id: uid(),
      name: name.trim(),
      category,
      dueDate: due || undefined,
      status: "todo",
      addedBy: current,
      createdAt: Date.now(),
    };
    setTasks([t, ...tasks]);
    setName("");
    setDue("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a task">
      <div className="space-y-4">
        <Field label="What needs doing?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pick up keys"
            className="w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date (optional)">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </Field>
        <button
          onClick={submit}
          className="w-full rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground shadow-soft transition hover:opacity-95"
        >
          Add task
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</span>
      {children}
    </label>
  );
}
