import { Account, UserRole } from "../types";

const TOKEN_KEY = "superstudent_jwt_token";
const ME_CACHE_KEY = "superstudent_me_cache";
// The session is re-checked against the server only when the 30-day token is about to expire.
// Reads, search and announcements never need the server, so opening the app must not cost a Worker
// request. Roles and bans are enforced by the server on every write anyway; a role change is shown
// in the UI at the next login.
const ME_RECHECK_MS = 30 * 24 * 60 * 60 * 1000;

function cacheMe(user: Account | null | undefined): void {
  try {
    if (user) localStorage.setItem(ME_CACHE_KEY, JSON.stringify({ at: Date.now(), user }));
  } catch {
    // ignore
  }
}

function readMeCache(): { at: number; user: Account } | null {
  try {
    const raw = localStorage.getItem(ME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; user?: Account };
    return parsed && typeof parsed.at === "number" && parsed.user ? { at: parsed.at, user: parsed.user } : null;
  } catch {
    return null;
  }
}

/** Role of the server session as of the last login/check (null when not logged in on the server). */
export function getCachedRole(): UserRole | null {
  return readMeCache()?.user.role ?? null;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ME_CACHE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function loginApi(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; user?: Account; token?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "فشل تسجيل الدخول" };
    }
    if (data.token) {
      setStoredToken(data.token);
      cacheMe(data.user);
    }
    return { success: true, user: data.user, token: data.token };
  } catch (err: any) {
    return { success: false, error: "تعذر الاتصال بخادم المصادقة: " + (err.message || "Network error") };
  }
}

export async function registerApi(payload: {
  email: string;
  password: string;
  username: string;
  displayName: string;
  branch: string;
  gradeLevel: string;
  avatar: string | null;
}): Promise<{ success: boolean; user?: Account; token?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "فشل إنشاء الحساب" };
    }
    if (data.token) {
      setStoredToken(data.token);
      cacheMe(data.user);
    }
    return { success: true, user: data.user, token: data.token };
  } catch (err: any) {
    return { success: false, error: "تعذر الاتصال بخادم المصادقة: " + (err.message || "Network error") };
  }
}

export async function getMeApi(): Promise<Account | null> {
  const token = getStoredToken();
  if (!token) return null;
  const cached = readMeCache();
  // Fresh enough: no network at all (this is what keeps millions of app opens off the Worker quota).
  if (cached && Date.now() - cached.at < ME_RECHECK_MS) return cached.user;
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      // Token expired or account unavailable: this is the only case that ends the session.
      setStoredToken(null);
      return null;
    }
    if (!res.ok) {
      // Busy server (429/5xx): never log the user out because of a temporary error.
      return cached ? cached.user : null;
    }
    const data = await res.json();
    cacheMe(data.user);
    return data.user || null;
  } catch {
    return cached ? cached.user : null;
  }
}

export async function updateProfileApi(updates: Partial<Account>): Promise<{ success: boolean; user?: Account; error?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, error: "Not logged in" };
  try {
    const res = await fetch("/api/auth/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Update failed" };
    }
    cacheMe(data.user);
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
