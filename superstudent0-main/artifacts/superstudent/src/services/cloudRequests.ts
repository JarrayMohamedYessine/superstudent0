/**
 * Bridge between the existing local data layer and the private cloud API.
 *
 *  - requests (elite applications, feedback, complaints) are PRIVATE: they live in Telegram and
 *    are readable only by staff through /api/requests. They are never put in a public site file.
 *  - public texts (FAQs...) go to /api/store/<collection> and come back through the static
 *    snapshot (/store/*.json) via cloudStore.ts.
 *
 * Every function here is best-effort and NEVER throws: if the user has no server session, is
 * offline, or lacks the rights, the app keeps working exactly as before with its local data.
 * The "Authorization" header is added by apiAuthHeader.ts.
 */
import { getCachedRole, getStoredToken } from "./authClient";

export type RequestKind = "elite" | "feedback" | "complaint" | "ticket";

function hasSession(): boolean {
  try {
    return !!getStoredToken();
  } catch {
    return false;
  }
}

async function send(path: string, method: string, body?: unknown): Promise<Response | null> {
  if (!hasSession()) return null;
  try {
    return await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      // base64 data URLs never travel to the cloud copy (proof images are uploaded as links)
      body: body === undefined ? undefined : JSON.stringify(body, (_k, v) => (typeof v === "string" && v.startsWith("data:") ? undefined : v)),
    });
  } catch {
    return null;
  }
}

export async function pushRequest(kind: RequestKind, item: { id: string }): Promise<boolean> {
  const res = await send("/api/requests", "POST", { kind, item });
  return !!res && res.ok;
}

/** Staff only. Returns null when unavailable (not staff / offline / no session). */
export async function pullRequests<T extends { id: string }>(kind: RequestKind): Promise<T[] | null> {
  // Ordinary users never reach the server for this: it would only answer 403 and still cost a request.
  const role = getCachedRole();
  if (role !== "superadmin" && role !== "moderator") return null;
  const res = await send(`/api/requests?kind=${kind}`, "GET");
  if (!res || !res.ok) return null;
  try {
    const data = (await res.json()) as { items?: T[] };
    return Array.isArray(data.items) ? data.items : null;
  } catch {
    return null;
  }
}

export async function updateRequestRemote(kind: RequestKind, id: string, changes: Record<string, unknown>): Promise<boolean> {
  const res = await send("/api/requests/update", "POST", { kind, id, changes });
  return !!res && res.ok;
}

export async function deleteRequestRemote(kind: RequestKind, id: string): Promise<boolean> {
  const res = await send(`/api/requests?kind=${kind}&id=${encodeURIComponent(id)}`, "DELETE");
  return !!res && res.ok;
}

export async function pushStoreItem(collection: string, item: { id: string }): Promise<boolean> {
  const res = await send(`/api/store/${collection}`, "POST", item);
  return !!res && res.ok;
}

export async function deleteStoreItem(collection: string, id: string): Promise<boolean> {
  const res = await send(`/api/store/${collection}?id=${encodeURIComponent(id)}`, "DELETE");
  return !!res && res.ok;
}

export type ContentKind = "super_ann" | "home_ann" | "story";

/** Public content (announcements, success stories): ONE call for any number of items. */
export async function pushContent(kind: ContentKind, items: { id: string }[]): Promise<boolean> {
  if (items.length === 0) return true;
  const res = await send("/api/content/bulk", "POST", { upserts: items.slice(0, 100).map((item) => ({ kind, item })) });
  return !!res && res.ok;
}

export async function deleteContent(kind: ContentKind, id: string): Promise<boolean> {
  const res = await send("/api/content/bulk", "POST", { deletes: [{ kind, id }] });
  return !!res && res.ok;
}

/** Superadmin only: role / upload right / ban of an account that exists on the server. */
export async function syncAdminUser(email: string, changes: Record<string, unknown>): Promise<boolean> {
  const res = await send("/api/admin/user", "POST", { email, ...changes });
  return !!res && res.ok;
}

export async function deleteAccountRemote(email: string): Promise<boolean> {
  const res = await send("/api/admin/delete-user", "POST", { email });
  return !!res && res.ok;
}

/** Union by id; the remote copy wins for the same id (it carries the latest status). */
export function mergeById<T extends { id: string }>(local: T[], remote: T[] | null): T[] {
  if (!remote) return local;
  const remoteIds = new Set(remote.map((r) => r.id));
  return [...remote, ...local.filter((l) => !remoteIds.has(l.id))];
}
