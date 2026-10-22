/**
 * Auth API removed: login / registration endpoints and the server session are gone.
 * The session now lives in memory only (cleared when the page closes) and no request
 * is ever sent anywhere. The UI keeps working; its sign-in buttons simply do nothing.
 */
import { Account, UserRole } from "../types";

let memoryToken: string | null = null;
let memoryMe: { at: number; user: Account } | null = null;

/** Role of the (memory-only) session, null when not logged in. */
export function getCachedRole(): UserRole | null {
  return memoryMe?.user.role ?? null;
}

export function getStoredToken(): string | null {
  return memoryToken;
}

export function setStoredToken(token: string | null): void {
  memoryToken = token;
  if (!token) memoryMe = null;
}

export async function loginApi(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; user?: Account; token?: string; error?: string }> {
  void emailOrUsername;
  void password;
  return { success: false, error: "تم تعطيل تسجيل الدخول في هذا الإصدار." };
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
  void payload;
  return { success: false, error: "تم تعطيل إنشاء الحسابات في هذا الإصدار." };
}

export async function getMeApi(): Promise<Account | null> {
  return memoryMe?.user ?? null;
}

export async function updateProfileApi(updates: Partial<Account>): Promise<{ success: boolean; user?: Account; error?: string }> {
  void updates;
  return { success: false, error: "تم تعطيل تحديث الحساب في هذا الإصدار." };
}
