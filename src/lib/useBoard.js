import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, configError } from "./supabase.js";

const TASK_FIELDS =
  "id, title, description, status, priority, due_date, labels, created_at, updated_at";

// Starts (or resumes) a guest session, then loads that guest's tasks.
export function useBoard() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [phase, setPhase] = useState(configError ? "error" : "loading"); // loading | ready | error
  const [error, setError] = useState(configError);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const { data, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
        session = data.session;
      }
      setUser(session.user);

      const { data, error: loadError } = await supabase
        .from("tasks")
        .select(TASK_FIELDS)
        .order("created_at", { ascending: true });
      if (loadError) throw loadError;

      setTasks(data);
      setPhase("ready");
    } catch (e) {
      setError(friendly(e));
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!configError) load();
  }, [load]);

  const createTask = useCallback(async (fields) => {
    const { data, error: e } = await supabase
      .from("tasks")
      .insert(fields)
      .select(TASK_FIELDS)
      .single();
    if (e) throw new Error(friendly(e));
    setTasks((prev) => [...prev, data]);
    return data;
  }, []);

  // Optimistic update: change the UI first, roll back if the database says no.
  const updateTask = useCallback(async (id, changes) => {
    const previous = tasksRef.current.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
    const { data, error: e } = await supabase
      .from("tasks")
      .update(changes)
      .eq("id", id)
      .select(TASK_FIELDS)
      .single();
    if (e) {
      if (previous) setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
      throw new Error(friendly(e));
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }, []);

  const deleteTask = useCallback(async (id) => {
    const removed = tasksRef.current.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: e } = await supabase.from("tasks").delete().eq("id", id);
    if (e) {
      if (removed) setTasks((prev) => [...prev, removed]);
      throw new Error(friendly(e));
    }
  }, []);

  return { user, tasks, phase, error, reload: load, createTask, updateTask, deleteTask };
}

export async function fetchTaskDetail(taskId) {
  const [comments, activity] = await Promise.all([
    supabase
      .from("comments")
      .select("id, body, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
    supabase
      .from("task_activity")
      .select("id, action, from_status, to_status, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false }),
  ]);
  if (comments.error) throw new Error(friendly(comments.error));
  if (activity.error) throw new Error(friendly(activity.error));
  return { comments: comments.data, activity: activity.data };
}

export async function addComment(taskId, body) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, body })
    .select("id, body, created_at")
    .single();
  if (error) throw new Error(friendly(error));
  return data;
}

function friendly(e) {
  const msg = e?.message || String(e);
  if (/anonymous sign-ins are disabled/i.test(msg))
    return "Guest sign-in is turned off for this Supabase project. Enable Anonymous sign-ins under Authentication > Providers.";
  if (/failed to fetch|network/i.test(msg))
    return "Can't reach the server. Check your connection and try again.";
  return msg;
}
