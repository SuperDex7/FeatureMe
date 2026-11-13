// A small in-memory cache for GET results, shared by every page in the tab.
// It's cleared on a full page load, so it only speeds up switching back and
// forth (tabs, pages, conversations) within a visit.
//
//   peek(key)            -> the cached value if it's fresh, else undefined
//   cached(key, fetcher) -> a promise; reuses a fresh value or an in-flight
//                           request for the same key instead of fetching again
//   invalidate(prefix)   -> forget every key starting with prefix

const DEFAULT_MAX_AGE = 2 * 60 * 1000;
const store = new Map();
const inflight = new Map();

export function peek(key, maxAge = DEFAULT_MAX_AGE) {
  const entry = store.get(key);
  return entry && Date.now() - entry.at < maxAge ? entry.data : undefined;
}

export function remember(key, data) {
  store.set(key, { data, at: Date.now() });
  return data;
}

export function cached(key, fetcher, { maxAge = DEFAULT_MAX_AGE, force = false } = {}) {
  if (!force) {
    const hit = peek(key, maxAge);
    if (hit !== undefined) return Promise.resolve(hit);
    if (inflight.has(key)) return inflight.get(key);
  }
  const request = Promise.resolve()
    .then(fetcher)
    .then((data) => remember(key, data))
    .finally(() => {
      if (inflight.get(key) === request) inflight.delete(key);
    });
  inflight.set(key, request);
  return request;
}

export function invalidate(prefix) {
  [...store.keys()].filter((key) => key.startsWith(prefix)).forEach((key) => store.delete(key));
}
