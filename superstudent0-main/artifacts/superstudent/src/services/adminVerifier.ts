import { Account } from "../types";

// ━━━━━━━━━━━━━━━━━━ SUPER-ADMIN VERIFICATION (Cloudflare Worker) ━━━━━━━━━━━━━━━━━━
//
// The super admin ("الإدارة") is identified through a Cloudflare Worker
// (workers/ggggyyr4364.js) that holds the owner email in a variable named `x`.
// The app calls the Worker ONCE per email per session (at login / signup) and
// caches the verdict in memory only — never in any storage. Navigation,
// re-renders and repeated admin actions never trigger extra Worker requests,
// which keeps the Workers request count at the absolute minimum.

const CHECK_URL: string = ((import.meta as any).env?.VITE_ADMIN_CHECK_URL as string | undefined)?.trim() || "";

// The owner ("الإدارة") email is embedded in the site itself, so recognition is
// instant at login — no external request needed and no storage involved.
const OWNER_EMAIL: string = "learningmyj20@gmail.com";

const verdictCache = new Map<string, boolean>();
const pendingChecks = new Map<string, Promise<boolean>>();

export function isAdminCheckConfigured(): boolean {
  return Boolean(CHECK_URL);
}

/**
 * Asks the ggggyyr4364 Worker whether the given email is the super admin.
 * One HTTP request per email per session; the result is cached in memory.
 */
export async function verifySuperAdmin(email?: string | null): Promise<boolean> {
  const norm = (email || "").trim().toLowerCase();
  if (!norm) return false;

  // Embedded owner email: recognized immediately, zero requests.
  if (norm === OWNER_EMAIL.toLowerCase()) {
    verdictCache.set(norm, true);
    return true;
  }
  if (!CHECK_URL) return false;

  if (verdictCache.has(norm)) return verdictCache.get(norm)!;
  const inflight = pendingChecks.get(norm);
  if (inflight) return inflight;

  const check = (async () => {
    try {
      const res = await fetch(CHECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: norm }),
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      const isAdmin = Boolean(data && data.admin === true);
      verdictCache.set(norm, isAdmin);
      return isAdmin;
    } catch {
      return false;
    } finally {
      pendingChecks.delete(norm);
    }
  })();

  pendingChecks.set(norm, check);
  return check;
}

/**
 * Returns the account upgraded to superadmin when the Worker confirms the
 * email, otherwise the account unchanged.
 */
export async function applySuperAdminVerdict(acc: Account): Promise<Account> {
  if (!acc) return acc;
  const isSuperAdmin = await verifySuperAdmin(acc.email);
  if (!isSuperAdmin) return acc;
  return { ...acc, role: "superadmin", canUpload: true, banned: false };
}
