import axios from 'axios';
import { apiConfig } from '../config/api';
import { invalidate } from '../utils/requestCache';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout, // Increased to 60 seconds for file uploads
  withCredentials: true, // Enable cookies for all requests
});

// Request interceptor - no need to manually add JWT token since it's in cookies
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with requests when withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// When a request fails because the login itself ended (token expired, or the
// server no longer accepts it) the app shows a "session expired" prompt
// (Components/SessionExpiredDialog). Every other error (403 "not allowed",
// 404, 500, network trouble) is left to the page that made the request and
// never logs anyone out.
let signedIn = false;
let sessionExpired = false;
const sessionListeners = new Set();

/** Calls listener() when a logged-in session ends unexpectedly; returns an unsubscribe function */
export function onSessionExpired(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

/** True once after the session expired (lets the login page explain why you're there) */
export function consumeSessionExpired() {
  const was = sessionExpired;
  sessionExpired = false;
  return was;
}

// Sent by the server when the request carried a login it no longer accepts.
// It clears the cookie in the same response, so this arrives once per session
// (and works even right after a page load, when signedIn isn't known yet).
const ENDED_CODES = ['TOKEN_EXPIRED', 'TOKEN_INVALID'];

function endSession(code) {
  if (!signedIn && !ENDED_CODES.includes(code)) return; // a visitor, or already handled
  signedIn = false;
  sessionExpired = true;
  meCache = null;
  invalidate(''); // cached pages belonged to the old session
  sessionListeners.forEach((listener) => listener());
}

api.interceptors.response.use(
  (response) => {
    // Check if user is banned - logout silently if so
    if (response.config?.url?.includes('/user/me') && response.data?.role === 'BANNED') {
      window.location.href = '/login';
      return Promise.reject(new Error('User banned'));
    }
    return response;
  },
  (error) => {
    const url = error.config?.url || '';
    // 401 = the server doesn't see a login. Login/signup forms handle their own 401s.
    if (error.response?.status === 401 && !url.includes('/user/auth/')) {
      endSession(error.response.data?.code);
    }
    return Promise.reject(error);
  }
);

// Helper functions
/**
 * "in", "out", or "error" when the server couldn't be reached or failed
 * (that says nothing about your login, so callers shouldn't log you out)
 */
export const checkLogin = async () => {
  try {
    // Shares the /user/me request with getCurrentUser (see fetchMe)
    await fetchMe();
    return 'in';
  } catch (error) {
    return error.response?.status === 401 ? 'out' : 'error';
  }
};

/** True when a recent /user/me answer says you're logged in (no request needed) */
export const knownLoggedIn = () => Boolean(meCache && Date.now() - meCache.at < ME_MAX_AGE);

/**
 * The current user if a recent answer is cached, null if we know you're
 * logged out, undefined if nobody has asked yet. Lets components show the
 * right thing on their first render instead of guessing.
 */
export const peekCurrentUser = () => {
  // Even a slightly old answer is fine for showing the header; it's refreshed right after
  if (signedIn && meCache) return structuredClone(meCache.data);
  if (!signedIn && meChecked) return null;
  return undefined;
};

export const isAuthenticated = async () => (await checkLogin()) === 'in';

export const logout = async () => {
  try {
    meCache = null;
    signedIn = false;
    invalidate('');
    // Call logout endpoint to clear server-side cookies
    await api.post('/user/auth/logout');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Redirect to login page
    window.location.href = '/login';
  }
};

// /user/me is asked for by the header, the page and several components at
// once. Share one request (and reuse the answer for a few seconds) instead of
// sending the same call 3-6 times per page.
const ME_MAX_AGE = 10 * 1000;
let meCache = null; // { data, at }
let meRequest = null;
let meChecked = false; // a /user/me answer (logged in or out) has come back

function fetchMe() {
  if (meCache && Date.now() - meCache.at < ME_MAX_AGE) return Promise.resolve(meCache.data);
  if (meRequest) return meRequest;
  meRequest = api.get('/user/me')
    .then((response) => {
      meCache = { data: response.data, at: Date.now() };
      signedIn = true;
      meChecked = true;
      return response.data;
    })
    .catch((error) => {
      if (error.response?.status === 401) meChecked = true;
      throw error;
    })
    .finally(() => { meRequest = null; });
  return meRequest;
}

/** Forget the cached current user (after changing your own profile, plan, etc.) */
export const forgetCurrentUser = () => {
  meCache = null;
};

async function currentUserOrNull() {
  try {
    const data = await fetchMe();
    // Check if user is banned - logout silently if so
    if (data?.role === 'BANNED') {
      window.location.href = '/login';
      return null;
    }
    // Each caller gets its own copy, so one can't change another's
    return data ? structuredClone(data) : data;
  } catch {
    // Not logged in (or offline): expected for visitors
    return null;
  }
}

export const getCurrentUser = () => currentUserOrNull();

// Same as getCurrentUser; never redirects to login
export const getCurrentUserSafe = () => currentUserOrNull();

export default api;
