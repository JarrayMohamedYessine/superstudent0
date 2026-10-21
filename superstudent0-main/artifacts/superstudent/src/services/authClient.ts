import { Account } from "../types";

// In-memory session only: nothing is written to localStorage / storage of any kind.
let storedToken: string | null = null;
let cachedMe: Account | null = null;

/** Role of the server session as of the last login/check (null when not logged in on the server). */
export function getCachedRole(): Account["role"] | null {
  return cachedMe?.role ?? null;
}

export function getStoredToken(): string | null {
  return storedToken;
}

export function setStoredToken(token: string | null): void {
  storedToken = token;
  if (!token) cachedMe = null;
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
      cachedMe = data.user;
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
      cachedMe = data.user;
    }
    return { success: true, user: data.user, token: data.token };
  } catch (err: any) {
    return { success: false, error: "تعذر الاتصال بخادم المصادقة: " + (err.message || "Network error") };
  }
}

export async function getMeApi(): Promise<Account | null> {
  if (!storedToken) return null;
  if (cachedMe) return cachedMe;
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });
    if (res.status === 401) {
      setStoredToken(null);
      return null;
    }
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    cachedMe = data.user || null;
    return cachedMe;
  } catch {
    return null;
  }
}

export async function updateProfileApi(updates: Partial<Account>): Promise<{ success: boolean; user?: Account; error?: string }> {
  if (!storedToken) return { success: false, error: "Not logged in" };
  try {
    const res = await fetch("/api/auth/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Update failed" };
    }
    cachedMe = data.user;
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
