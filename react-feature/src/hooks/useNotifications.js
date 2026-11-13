import { useEffect, useSyncExternalStore } from "react";
import api from "../services/AuthService";

const PAGE_SIZE = 20;

// One shared copy of your notifications for the whole page, so the header
// bell and the home dashboard show the same list and only load it once.
// hasMore is tracked from batch sizes; "Load more" asks for notifications
// older than the last one shown, so deleting one never shifts what comes next.
let state = { items: [], total: 0, hasMore: false, status: "idle" };
const listeners = new Set();
let loading = null;

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function fetchBatch(before) {
  const params = before ? { before, size: PAGE_SIZE } : { page: 0, size: PAGE_SIZE };
  return api.get("/user/notifications", { params }).then(({ data }) => ({
    items: data?.content || [],
    remaining: data?.page?.totalElements ?? 0,
  }));
}

function loadFirst() {
  if (loading || state.status === "ready") return loading;
  setState({ status: "loading" });
  loading = fetchBatch(null)
    .then(({ items, remaining }) => setState({ items, total: remaining, hasMore: items.length < remaining, status: "ready" }))
    .catch((err) => {
      console.error("Error loading notifications:", err);
      setState({ status: "error" });
    })
    .finally(() => { loading = null; });
  return loading;
}

function loadMore() {
  if (loading || !state.hasMore || state.items.length === 0) return loading;
  setState({ status: "loadingMore" });
  const last = state.items[state.items.length - 1];
  loading = fetchBatch(last.time)
    .then(({ items, remaining }) => {
      const seen = new Set(state.items.map((n) => n.notificationId));
      const merged = [...state.items, ...items.filter((n) => !seen.has(n.notificationId))];
      setState({
        items: merged,
        total: merged.length + Math.max(0, remaining - items.length),
        hasMore: remaining > items.length,
        status: "ready",
      });
    })
    .catch((err) => {
      console.error("Error loading more notifications:", err);
      setState({ status: "ready" });
    })
    .finally(() => { loading = null; });
  return loading;
}

async function remove(notificationId) {
  if (!notificationId) return;
  const before = state;
  // Optimistic: gone immediately, restored if the server says no
  setState({ items: state.items.filter((n) => n.notificationId !== notificationId), total: Math.max(0, state.total - 1) });
  try {
    await api.delete(`/user/notifications/${encodeURIComponent(notificationId)}`);
  } catch (err) {
    console.error("Error deleting notification:", err);
    if (err.response?.status !== 404) setState({ items: before.items, total: before.total });
  }
}

async function clearAll() {
  const before = state;
  setState({ items: [], total: 0, hasMore: false });
  try {
    await api.post("/user/notifications/clear");
  } catch (err) {
    console.error("Error clearing notifications:", err);
    setState({ items: before.items, total: before.total, hasMore: before.hasMore });
  }
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

/**
 * Your notifications: { items, total, hasMore, status, loadMore, remove, clearAll }.
 * Pass enabled=false (e.g. while logged out) to skip loading.
 */
export default function useNotifications(enabled = true) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    if (enabled) loadFirst();
  }, [enabled]);
  return {
    ...snapshot,
    loadMore,
    remove,
    clearAll,
  };
}
