import { use, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";


type Todo = { id: string; text: string; done: boolean };
const uid = () => crypto.randomUUID();

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");

  const remaining = useMemo(
    () => todos.filter((t) => !t.done).length, [todos]);

    // Load
    useEffect(() => {
      (async () => {
        const loaded = await invoke<Todo[]>("load_todos");
        setTodos(loaded);
      })();
    }, []);

    useEffect( () => {
      (async () => {
        await invoke("save_todos", { todos });
      })();
    }, [todos]);

    const addTodo = () => {
      const t = text.trim();
      if (!t) return;
      setTodos((prev) => [{ id: uid(), text: t, done: false}, ...prev]);
      setText("");
    };

    const toggle = (id: string) => {
      setTodos((prev) => prev.map((t) => (t.id === id ? {...t,  done: !t.done } : t)));
    };

    const remove = (id: string) => {
      setTodos((prev) => prev.filter((t) => t.id !== id ));
    }


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
        <button onClick={addTodo} style={{ padding: "10px 14px", borderRadius: 8 }}>
          Add
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {todos.map((t) => (
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
            <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>
              {t.text}
            </span>
            <button onClick={() => remove(t.id)} style={{ padding: "6px 10px", borderRadius: 8 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
