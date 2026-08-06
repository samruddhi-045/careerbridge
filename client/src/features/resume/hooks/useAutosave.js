import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Debounced autosave.
 *
 * Two things this has to get right:
 *
 * 1. Never save on the way IN. When the resume first loads, `value` changes
 *    from null to the loaded document -- that's not an edit, and saving it
 *    would write the document back to itself on every page visit.
 * 2. Always save the LATEST value. The debounce timer fires later, by which
 *    point `value` may have changed again, so the timer reads from a ref
 *    rather than closing over a stale value.
 */
export default function useAutosave(value, save, { delay = 900 } = {}) {
  const [status, setStatus] = useState("idle"); // idle | pending | saving | saved | error
  const [error, setError] = useState("");

  const latest = useRef(value);
  const previous = useRef(value);
  const timer = useRef(null);
  latest.current = value;

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    setStatus("saving");
    try {
      await save(latest.current);
      setStatus("saved");
      setError("");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Couldn't save");
    }
  }, [save]);

  useEffect(() => {
    const wasEmpty = previous.current == null;
    previous.current = value;

    // null -> loaded is the initial load, not an edit
    if (value == null || wasEmpty) return;

    clearTimeout(timer.current);
    setStatus("pending");

    timer.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await save(latest.current);
        setStatus("saved");
        setError("");
      } catch (err) {
        setStatus("error");
        setError(err?.message || "Couldn't save");
      }
    }, delay);

    return () => clearTimeout(timer.current);
  }, [value, save, delay]);

  // Warn on tab close only while there are genuinely unsaved edits.
  useEffect(() => {
    const handler = (e) => {
      if (status === "pending" || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  return { status, error, flush };
}