/**
 * Cloud services removed: the site no longer connects to Firebase (or any external service).
 * This stub keeps the exports the UI imports so the interface compiles and renders unchanged.
 * Sign-in buttons are inert: they return a failure and never touch the network.
 */
import { Account } from "../types";

export const auth = { currentUser: null };

/** No-op: builds the account in memory only, nothing is written anywhere. */
export async function syncUserProfileToFirestore(
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null },
  extraInfo?: Partial<Account>
): Promise<Account> {
  const account: Account = {
    email: user.email || "",
    username: user.email ? user.email.split("@")[0] : `student_${user.uid.slice(0, 6)}`,
    displayName: user.displayName || user.email?.split("@")[0] || "طالب مميز",
    role: "member",
    branch: extraInfo?.branch || "",
    gradeLevel: extraInfo?.gradeLevel || "4eme_bac",
    avatar: user.photoURL || extraInfo?.avatar || null,
    moderatorRooms: [],
    banned: false,
    bannedUntil: null,
    oauth: true,
    createdAt: Date.now(),
  };
  return account;
}

export async function loginWithGoogle(): Promise<{ success: boolean; user?: Account; error?: string }> {
  return {
    success: false,
    error: "تسجيل الدخول بـ Google معطّل في هذا الإصدار.",
  };
}
