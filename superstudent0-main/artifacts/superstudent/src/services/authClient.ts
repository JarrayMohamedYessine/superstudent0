import { Account, UserRole } from "../types";

const TOKEN_KEY = "superstudent_jwt_token";

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
    }
    return { success: true, user: data.user, token: data.token };
  } catch (err: any) {
    return { success: false, error: "تعذر الاتصال بخادم المصادقة: " + (err.message || "Network error") };
  }
}

export async function getMeApi(): Promise<Account | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      setStoredToken(null);
      return null;
    }
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
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
    return { success: true, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
