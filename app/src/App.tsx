import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";


type Todo = {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;   // 任意
  workedAt?: string;  // 任意
  doneAt?: string;    // 任意
};

const nowIso = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
type Filter = "all" | "active" | "done";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dueDate, setDueDate] = useState<string>("");

  const remaining = useMemo(() => todos.filter((t) => !t.done).length, [todos]);

    // Load
    useEffect(() => {
      (async () => {
        const loaded = await invoke<Todo[]>("load_todos");
        setTodos(loaded);
      })();
    }, []);

    // Save
    useEffect( () => {
      const id = window.setTimeout(() => {
        invoke("save_todos", {todos});
      }, 400);

      return () => window.clearTimeout(id);
    }, [todos]);

    const addTodo = () => {
      const t = text.trim();
      if (!t) return;

      setTodos((prev) => [
        { id: uid(), text: t, done: false, dueDate: dueDate || undefined},
        ...prev,
      ]);

      setText("");
      setDueDate("");
    };

    const toggle = (id: string) => {
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;

          const nextDone = !t.done;
          const now = nowIso();

          return {
            ...t,
            done: nextDone,
            doneAt: nextDone ? now : undefined, // 未完に戻したら消す
            workedAt: t.workedAt ?? (nextDone ? now : t.workedAt), // 完了時に未記録なら埋める（任意）
          };
        })
      );
    };


    const remove = (id: string) => {
      setTodos((prev) => prev.filter((t) => t.id !== id ));
    };

    const visible = useMemo( () => {
      if (filter === "active") return todos.filter(t => !t.done);
      if (filter === "done") return todos.filter(t => t.done);
      return todos;
    }, [todos, filter]);


    const ordered = useMemo( () => {
      return [...visible].sort((a,b) => Number(a.done) - Number(b.done));
    }, [visible]);

    const markWorked = (id: string) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, workedAt: t.workedAt ?? nowIso() } : t))
      );
    };


  return (
    <main style={{ maxWidth: 520, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>ToDo</h1>
      <p style={{ marginTop: 0, opacity: 0.7 }}>Remaining: {remaining}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button onClick={addTodo} style={{ padding: "10px 14px", borderRadius: 8 }}>
          Add
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {ordered.map((t) => (
          <li
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 10,
            }}
          >
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>
                {t.text}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {t.dueDate && <span>Due: {t.dueDate}</span>}
                {t.workedAt && <span>Started: {new Date(t.workedAt).toLocaleString()}</span>}
                {t.doneAt && <span>Done: {new Date(t.doneAt).toLocaleString()}</span>}
              </div>
            </div>

            <button onClick={() => markWorked(t.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
              Start
            </button>
            <button onClick={() => remove(t.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
              Delete
            </button>

          </li>
        ))}
      </ul>
    </main>
  );
}
