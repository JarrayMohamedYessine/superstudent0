import {
  MESSAGE_RETENTION_MS,
  MEDIA_VAULT_RETENTION_MS,
  isRootOwnerEmail,
} from "../constants";
import {
  Account,
  MessageItem,
  ChatMediaItem,
  StudentFeedbackItem,
  EliteApplicationItem,
  FaqItem,
  ComplaintReport,
  UserRole,
} from "../types";
import {
  getLocalUserProfile,
  saveUserProfileToLocalCache,
} from "../data/userProfilesCache";
import {
  deleteAccountRemote,
  deleteRequestRemote,
  deleteStoreItem,
  mergeById,
  pullRequests,
  pushRequest,
  pushStoreItem,
  syncAdminUser,
  updateRequestRemote,
} from "./cloudRequests";
import { loadStoreCollection } from "./cloudStore";

// ━━━━━━━━━━━━━━━━━━━━ RELATIONAL ACCOUNTS & PROFILES ━━━━━━━━━━━━━━━━━━━━

export function normEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@'"/\\]+@[^\s@'"/\\]+\.[^\s@'"/\\]+$/.test(email);
}

export function isValidUsername(u: string): boolean {
  return /^[a-zA-Z0-9_\u0600-\u06FF-]{3,20}$/.test(u);
}

export function safeUsername(email: string): string {
  const base = normEmail(email).split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "user";
  return base;
}

/**
 * Loads an account from local storage / cache.
 */
export async function getAccountByEmail(email: string): Promise<Account | null> {
  const emailNorm = normEmail(email);
  if (!emailNorm) return null;

  const isOwner = await isRootOwnerEmail(emailNorm);
  let cached = await getJSON<Account>("account:" + emailNorm, true);

  // Fast local file cache fallback
  if (!cached) {
    const localProfile = getLocalUserProfile(emailNorm);
    if (localProfile) {
      cached = {
        email: localProfile.email,
        username: localProfile.username,
        displayName: localProfile.displayName,
        branch: localProfile.branch,
        gradeLevel: (localProfile.gradeLevel as any) || "4eme_bac",
        role: localProfile.role,
        avatar: localProfile.avatar || null,
        createdAt: localProfile.createdAt || Date.now(),
        canUpload: localProfile.canUpload,
        banned: localProfile.banned || false,
        moderatorRooms: localProfile.moderatorRooms || [],
        bannedUntil: null,
      };
    }
  }

  if (cached && isOwner) {
    cached.role = "superadmin";
    cached.canUpload = true;
    cached.banned = false;
  }
  return cached;
}

/**
 * Loads account by username from storage / cache index.
 */
export async function getAccountByUsername(username: string): Promise<Account | null> {
  const uname = (username || "").trim().toLowerCase();
  if (!uname) return null;

  const idx = await getJSON<{ email: string }>("usernameIndex:" + uname, true);
  if (idx && idx.email) {
    return await getAccountByEmail(idx.email);
  }
  return null;
}

/**
 * Loads account by access code
 */
export async function getAccountByAccessCode(code: string): Promise<Account | null> {
  const c = (code || "").trim().toUpperCase();
  if (!c) return null;

  const idx = await getJSON<{ email: string }>("accessCodeIndex:" + c, true);
  if (idx && idx.email) {
    return await getAccountByEmail(idx.email);
  }
  return null;
}

/**
 * Saves or registers an account in the local cache and index.
 * First Account Rule: The very first account registered in the system automatically becomes Site Owner (superadmin).
 */
export async function saveAccount(account: Account): Promise<boolean> {
  const emailNorm = normEmail(account.email);

  const kvOk = await setJSON("account:" + emailNorm, account, true);
  await setJSON("usernameIndex:" + account.username.toLowerCase(), { email: emailNorm }, true);
  if (account.accessCode) {
    await setJSON("accessCodeIndex:" + account.accessCode.trim().toUpperCase(), { email: emailNorm }, true);
  }

  // Always mirror and sync account profile info into local userProfilesCache
  saveUserProfileToLocalCache(account);

  return kvOk;
}

// ━━━━━━━━━━━━━━━━━━━━ ADMINISTRATIVE RPC MUTATIONS ━━━━━━━━━━━━━━━━━━━━

export async function promoteToModeratorRPC(targetEmail: string, roomIds: string[]): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, role: "moderator", moderatorRooms: roomIds };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { role: "moderator", moderatorRooms: roomIds });
    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function demoteModeratorRPC(targetEmail: string): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, role: "member", moderatorRooms: [] };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { role: "member", moderatorRooms: [] });
    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function promoteToSuperAdminRPC(targetEmail: string): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, role: "superadmin" };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { role: "superadmin" });
    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function demoteSuperAdminRPC(targetEmail: string): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, role: "member" };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { role: "member" });
    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function banUserRPC(targetEmail: string, durationMs: number | null): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = {
      ...acc,
      banned: durationMs === null,
      bannedUntil: durationMs === null ? null : Date.now() + durationMs,
    };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { banned: durationMs === null, bannedUntil: durationMs === null ? null : updated.bannedUntil });

    // Automatic purge of user's attached documents upon ban
    try {
      const { purgeDocumentsByUsername } = await import("./documentsService");
      await purgeDocumentsByUsername(acc.username);
    } catch {
      // ignore
    }

    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function unbanUserRPC(targetEmail: string): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, banned: false, bannedUntil: null };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { banned: false, bannedUntil: null });

    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function setEliteStudentRPC(targetEmail: string, isElite: boolean): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, role: isElite ? "elite_student" : "member" };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { role: updated.role });
    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function setUserCanUploadRPC(targetEmail: string, allowed: boolean): Promise<{ success: boolean; error?: string }> {
  const acc = await getAccountByEmail(targetEmail);
  if (acc) {
    const updated: Account = { ...acc, canUpload: allowed };
    await setJSON("account:" + normEmail(targetEmail), updated, true);
    void syncAdminUser(targetEmail, { canUpload: allowed });
    return { success: true };
  }
  return { success: false, error: "Account not found" };
}

export async function resolveEliteApplicationRPC(appId: string, newStatus: "approved" | "rejected"): Promise<{ success: boolean; error?: string }> {
  const ok = await updateEliteApplicationStatus(appId, newStatus, "superadmin");
  return { success: ok };
}

export async function deleteUserAccountRPC(targetEmail: string): Promise<{ success: boolean; error?: string }> {
  const norm = normEmail(targetEmail);
  const acc = await getAccountByEmail(norm);
  void deleteAccountRemote(norm);

  const keysToDelete: string[] = ["account:" + norm];

  if (acc) {
    if (acc.username) {
      const uNorm = acc.username.toLowerCase();
      keysToDelete.push("usernameIndex:" + uNorm);
      keysToDelete.push(`dev:applicant:${uNorm}`);
    }
    if (acc.accessCode) {
      keysToDelete.push("accessCodeIndex:" + acc.accessCode.trim().toUpperCase());
    }
  }

  // 1. Delete all indexed and direct keys from both shared and private stores
  for (const k of keysToDelete) {
    await delKey(k, true);
    await delKey(k, false);
  }

  // 2. Clean up dev:applicants_registry and elite_applications
  if (acc?.username) {
    const uNorm = acc.username.toLowerCase();
    try {
      const registry = (await getJSON<string[]>(DEV_APPLICANTS_INDEX_KEY, true)) || [];
      const updatedRegistry = registry.filter((u) => u.toLowerCase() !== uNorm);
      await setJSON(DEV_APPLICANTS_INDEX_KEY, updatedRegistry, true);

      const apps = (await getJSON<EliteApplicationItem[]>(ELITE_APPLICATIONS_KEY, true)) || [];
      const updatedApps = apps.filter((a) => a.username.toLowerCase() !== uNorm);
      await setJSON(ELITE_APPLICATIONS_KEY, updatedApps, true);
    } catch {
      // safe ignore
    }

    // 3. Purge user's authored documents to prevent orphaned content
    try {
      const { purgeDocumentsByUsername } = await import("./documentsService");
      await purgeDocumentsByUsername(acc.username);
    } catch {
      // safe ignore
    }
  }

  // 4. Evict profile from memory cache and localStorage
  try {
    const { evictUserProfileCache } = await import("../data/userProfilesCache");
    evictUserProfileCache(norm);
    if (acc?.username) {
      evictUserProfileCache(acc.username);
    }
  } catch {
    // safe ignore
  }

  return { success: true };
}

// ━━━━━━━━━━━━━━━━━━━━ STORAGE UPLOADS & FILE SAFETY ━━━━━━━━━━━━━━━━━━━━

export async function uploadFileToCloudStorage(
  dataUrl: string,
  fileName: string,
  folder: "pdfs" | "images" | "avatars" = "images"
): Promise<string | null> {
  // External storage removed: the file stays exactly where it is (in memory), nothing is uploaded.
  void fileName;
  void folder;
  if (!dataUrl) return null;
  return dataUrl;
}

export async function uploadPDFToStorage(dataUrl: string, fileName: string, msgId: string): Promise<string | null> {
  return await uploadFileToCloudStorage(dataUrl, fileName, "pdfs");
}

export async function uploadChatImageToStorage(dataUrl: string, fileName: string): Promise<string> {
  const result = await uploadFileToCloudStorage(dataUrl, fileName, "images");
  return result || dataUrl;
}

export async function uploadAvatarToStorage(dataUrl: string, userUidOrUsername: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  try {
    const cloudUrl = await uploadFileToCloudStorage(dataUrl, `avatar_${userUidOrUsername}.jpg`, "avatars");
    return cloudUrl || dataUrl;
  } catch {
    return dataUrl;
  }
}

// ━━━━━━━━━━━━━━━━━━━━ STORAGE & CACHE HELPERS (MEMORY ONLY) ━━━━━━━━━━━━━━━━━━━━
// Data is kept in memory for the current page session only: nothing is written to
// localStorage, IndexedDB, or any server. Everything clears when the page closes.

const memoryStore = new Map<string, unknown>();

export async function getJSON<T = unknown>(key: string, shared = false): Promise<T | null> {
  const fullKey = (shared ? "bac_shared:" : "bac:") + key;
  if (memoryStore.has(fullKey)) {
    return memoryStore.get(fullKey) as T;
  }
  return null;
}

export async function setJSON(key: string, value: unknown, shared = false): Promise<boolean> {
  const fullKey = (shared ? "bac_shared:" : "bac:") + key;
  memoryStore.set(fullKey, value);
  return true;
}

export async function delKey(key: string, shared = false): Promise<void> {
  const fullKey = (shared ? "bac_shared:" : "bac:") + key;
  memoryStore.delete(fullKey);
}

export async function listKeys(prefix: string, shared = false): Promise<string[]> {
  const storagePrefix = shared ? "bac_shared:" : "bac:";
  const targetPrefix = storagePrefix + prefix;
  const out = new Set<string>();

  for (const k of memoryStore.keys()) {
    if (k.startsWith(targetPrefix)) {
      out.add(k.slice(storagePrefix.length));
    }
  }

  return Array.from(out);
}

// Compatibility no-op / local KV methods
export async function sbGet<T = unknown>(key: string): Promise<T | null> {
  return await getJSON<T>(key, true);
}

export async function sbSet(key: string, value: unknown): Promise<boolean> {
  return await setJSON(key, value, true);
}

export async function sbDel(key: string): Promise<void> {
  return await delKey(key, true);
}

export async function sbList(prefix: string): Promise<string[]> {
  return await listKeys(prefix, true);
}

// ━━━━━━━━━━━━━━━━━━━━ MEDIA & IMAGE HELPERS ━━━━━━━━━━━━━━━━━━━━

export function resizeToDataURL(file: File, maxDim: number, quality: number, square: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (square) {
          const side = Math.min(sw, sh);
          sx = (sw - side) / 2; sy = (sh - side) / 2; sw = side; sh = side;
        }
        let outW = square ? maxDim : sw, outH = square ? maxDim : sh;
        if (!square) {
          if (sw > sh && sw > maxDim) { outH = Math.round(sh * (maxDim / sw)); outW = maxDim; }
          else if (sh > maxDim) { outW = Math.round(sw * (maxDim / sh)); outH = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = outW; canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

export function formatTime(ts: number, lang: string): string {
  try {
    const locale = lang === "ar" ? "ar-TN" : lang === "fr" ? "fr-TN" : "en-US";
    return new Date(ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  } catch {
    const d = new Date(ts);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}

export function formatDateTime(ts: number, lang: string): string {
  try {
    const locale = lang === "ar" ? "ar-TN" : lang === "fr" ? "fr-TN" : "en-US";
    return new Date(ts).toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}

// ━━━━━━━━━━━━━━━━━━━━ REALTIME MESSAGES & SUBSCRIPTION ━━━━━━━━━━━━━━━━━━━━

export async function pruneExpiredRoomMessages(
  messagesKey: string,
  rawMessages: MessageItem[]
): Promise<MessageItem[]> {
  if (!rawMessages || rawMessages.length === 0) return [];
  const cutoff = Date.now() - MESSAGE_RETENTION_MS;
  const valid = rawMessages.filter((m) => m.createdAt && m.createdAt >= cutoff);
  const expired = rawMessages.filter((m) => !m.createdAt || m.createdAt < cutoff);

  if (expired.length > 0) {
    for (const exp of expired) {
      if (exp.pdf) {
        delKey(`pdf:${exp.id}`, true).catch(() => {});
      }
    }
    setJSON(messagesKey, valid, true).catch(() => {});
  }

  return valid;
}

export async function fetchRoomMessages(roomId: string): Promise<MessageItem[]> {
  const messagesKey = `room:${roomId}:messages`;
  const raw = await getJSON<MessageItem[]>(messagesKey, true);
  return await pruneExpiredRoomMessages(messagesKey, raw || []);
}

export async function saveRoomMessage(roomId: string, message: MessageItem): Promise<boolean> {
  const messagesKey = `room:${roomId}:messages`;
  try {
    const rawExisting = (await getJSON<MessageItem[]>(messagesKey, true)) || [];
    const existing = await pruneExpiredRoomMessages(messagesKey, rawExisting);
    const updated = [...existing.filter((m) => m.id !== message.id), message].slice(-100);
    await setJSON(messagesKey, updated, true);
  } catch {
    // ignore
  }

  broadcastRoomEvent(roomId, "new_message", message);
  return true;
}

export async function deleteRoomMessage(roomId: string, messageId: string): Promise<boolean> {
  const messagesKey = `room:${roomId}:messages`;
  try {
    const existing = (await getJSON<MessageItem[]>(messagesKey, true)) || [];
    const updated = existing.filter((m) => m.id !== messageId);
    await setJSON(messagesKey, updated, true);
    delKey(`pdf:${messageId}`, true).catch(() => {});
  } catch {
    // ignore
  }

  broadcastRoomEvent(roomId, "delete_message", { id: messageId });
  return true;
}

export async function fetchRoomMutes(roomId: string): Promise<Record<string, number>> {
  const mutesKey = `room:${roomId}:mutes`;
  const mutes = await getJSON<Record<string, number>>(mutesKey, true);
  return mutes || {};
}

export async function saveRoomMutes(roomId: string, mutes: Record<string, number>): Promise<boolean> {
  const mutesKey = `room:${roomId}:mutes`;
  const ok = await setJSON(mutesKey, mutes, true);
  broadcastRoomEvent(roomId, "room_mutes", mutes);
  return ok;
}

export function broadcastRoomEvent(
  roomId: string,
  event: "new_message" | "delete_message" | "update_message" | "room_mutes",
  payload: any
): void {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(`bac_channel_${roomId}`);
      bc.postMessage({ event, payload });
      bc.close();
    }
  } catch {
    // ignore
  }
}

export interface RoomSubscriptionHandlers {
  onMessage: (message: MessageItem) => void;
  onDelete: (messageId: string) => void;
  onMutes: (mutes: Record<string, number>) => void;
}

export function subscribeToRoom(
  roomId: string,
  handlers: RoomSubscriptionHandlers
): () => void {
  let localBc: BroadcastChannel | null = null;

  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      localBc = new BroadcastChannel(`bac_channel_${roomId}`);
      localBc.onmessage = (e) => {
        const { event, payload } = e.data || {};
        if (event === "new_message" && payload) {
          handlers.onMessage(payload);
        } else if (event === "delete_message" && payload?.id) {
          handlers.onDelete(payload.id);
        } else if (event === "room_mutes" && payload) {
          handlers.onMutes(payload);
        }
      };
    }
  } catch {
    // ignore
  }

  return () => {
    if (localBc) {
      try {
        localBc.close();
      } catch {
        // ignore
      }
    }
  };
}

// ━━━━━━━━━━━━━━━━━━━━ CHAT MEDIA VAULT ━━━━━━━━━━━━━━━━━━━━
export const MEDIA_VAULT_KEY = "chat_media_vault:all";

export async function recordChatMedia(items: ChatMediaItem[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    const existing = (await getJSON<ChatMediaItem[]>(MEDIA_VAULT_KEY, true)) || [];
    const cutoff = Date.now() - MEDIA_VAULT_RETENTION_MS;
    const validExisting = existing.filter((m) => m.createdAt && m.createdAt >= cutoff);
    const existingIds = new Set(validExisting.map((m) => m.id));
    const toAdd = items.filter((m) => !existingIds.has(m.id) && m.createdAt >= cutoff);
    const updated = [...toAdd, ...validExisting].slice(0, 300);
    await setJSON(MEDIA_VAULT_KEY, updated, true);
  } catch (err) {
    console.error("Failed to record chat media vault item:", err);
  }
}

export async function getChatMediaVault(): Promise<ChatMediaItem[]> {
  try {
    const raw = (await getJSON<ChatMediaItem[]>(MEDIA_VAULT_KEY, true)) || [];
    const cutoff = Date.now() - MEDIA_VAULT_RETENTION_MS;
    const valid = raw.filter((item) => item.createdAt && item.createdAt >= cutoff);
    if (valid.length !== raw.length) {
      setJSON(MEDIA_VAULT_KEY, valid, true).catch(() => {});
    }
    return valid;
  } catch {
    return [];
  }
}

export async function purgeExpiredMediaVault(): Promise<{ purgedCount: number; remainingCount: number }> {
  try {
    const raw = (await getJSON<ChatMediaItem[]>(MEDIA_VAULT_KEY, true)) || [];
    const cutoff = Date.now() - MEDIA_VAULT_RETENTION_MS;
    const valid = raw.filter((item) => item.createdAt && item.createdAt >= cutoff);
    const purgedCount = raw.length - valid.length;
    if (purgedCount > 0) {
      await setJSON(MEDIA_VAULT_KEY, valid, true);
    }
    return { purgedCount, remainingCount: valid.length };
  } catch {
    return { purgedCount: 0, remainingCount: 0 };
  }
}

export async function deleteChatMediaItem(id: string): Promise<boolean> {
  try {
    const existing = (await getJSON<ChatMediaItem[]>(MEDIA_VAULT_KEY, true)) || [];
    const updated = existing.filter((m) => m.id !== id);
    await setJSON(MEDIA_VAULT_KEY, updated, true);
    return true;
  } catch {
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━ STUDENT FEEDBACK ━━━━━━━━━━━━━━━━━━━━
export const STUDENT_FEEDBACKS_KEY = "student_feedbacks:all";

export async function submitStudentFeedback(fb: StudentFeedbackItem): Promise<boolean> {
  try {
    const existing = (await getJSON<StudentFeedbackItem[]>(STUDENT_FEEDBACKS_KEY, true)) || [];
    const updated = [fb, ...existing.filter((item) => item.id !== fb.id)].slice(0, 500);
    await setJSON(STUDENT_FEEDBACKS_KEY, updated, true);
    void pushRequest("feedback", fb);
    return true;
  } catch (err) {
    console.error("Failed to save student feedback:", err);
    return false;
  }
}

export async function getStudentFeedbacks(): Promise<StudentFeedbackItem[]> {
  try {
    const local = (await getJSON<StudentFeedbackItem[]>(STUDENT_FEEDBACKS_KEY, true)) || [];
    return mergeById(local, await pullRequests<StudentFeedbackItem>("feedback"));
  } catch {
    return [];
  }
}

export async function deleteStudentFeedback(id: string): Promise<boolean> {
  try {
    const existing = (await getJSON<StudentFeedbackItem[]>(STUDENT_FEEDBACKS_KEY, true)) || [];
    const updated = existing.filter((f) => f.id !== id);
    await setJSON(STUDENT_FEEDBACKS_KEY, updated, true);
    void deleteRequestRemote("feedback", id);
    return true;
  } catch {
    return false;
  }
}

export async function toggleResolveStudentFeedback(id: string, resolved?: boolean): Promise<boolean> {
  try {
    const existing = (await getJSON<StudentFeedbackItem[]>(STUDENT_FEEDBACKS_KEY, true)) || [];
    const updated = existing.map((f) => (f.id === id ? { ...f, resolved: resolved !== undefined ? resolved : !f.resolved } : f));
    await setJSON(STUDENT_FEEDBACKS_KEY, updated, true);
    void updateRequestRemote("feedback", id, { resolved: updated.find((f) => f.id === id)?.resolved === true });
    return true;
  } catch {
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━ ELITE & PROFESSOR APPLICATIONS & DEV APPLICANT FILES ━━━━━━━━━━━━━━━━━━━━
export const ELITE_APPLICATIONS_KEY = "elite_applications:all";
export const DEV_APPLICANTS_INDEX_KEY = "dev:applicants_registry";

export interface DevApplicantFile {
  username: string;
  applicantRole: "student" | "professor";
  specialty?: string;
  discordUsername?: string;
  email: string;
  branch: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  uploadedPdfs: { id: string; title: string; url?: string; dataUrl?: string; uploadedAt: number }[];
}

export async function getDevApplicantFile(username: string): Promise<DevApplicantFile | null> {
  if (!username) return null;
  try {
    return await getJSON<DevApplicantFile>(`dev:applicant:${username.toLowerCase()}`, true);
  } catch {
    return null;
  }
}

export async function submitEliteApplication(app: EliteApplicationItem): Promise<boolean> {
  try {
    const devRecord: DevApplicantFile = {
      username: app.username,
      applicantRole: app.applicantRole || "student",
      specialty: app.specialty,
      discordUsername: app.discordUsername,
      email: app.email,
      branch: app.branch,
      status: app.status || "pending",
      createdAt: app.createdAt || Date.now(),
      uploadedPdfs: app.uploadedPdfs || [],
    };

    await setJSON(`dev:applicant:${app.username.toLowerCase()}`, devRecord, true);

    const registry = (await getJSON<string[]>(DEV_APPLICANTS_INDEX_KEY, true)) || [];
    if (!registry.includes(app.username.toLowerCase())) {
      registry.unshift(app.username.toLowerCase());
      await setJSON(DEV_APPLICANTS_INDEX_KEY, registry, true);
    }

    const existing = (await getJSON<EliteApplicationItem[]>(ELITE_APPLICATIONS_KEY, true)) || [];
    const updated = [app, ...existing.filter((item) => item.id !== app.id)].slice(0, 500);
    await setJSON(ELITE_APPLICATIONS_KEY, updated, true);
    void pushRequest("elite", app);
    return true;
  } catch (err) {
    console.error("Failed to save elite application:", err);
    return false;
  }
}

export async function getEliteApplications(): Promise<EliteApplicationItem[]> {
  try {
    const local = (await getJSON<EliteApplicationItem[]>(ELITE_APPLICATIONS_KEY, true)) || [];
    return mergeById(local, await pullRequests<EliteApplicationItem>("elite"));
  } catch {
    return [];
  }
}

export async function updateEliteApplicationStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string
): Promise<boolean> {
  try {
    const existing = (await getJSON<EliteApplicationItem[]>(ELITE_APPLICATIONS_KEY, true)) || [];
    const updated = existing.map((a) => {
      if (a.id === id) {
        try {
          getJSON<DevApplicantFile>(`dev:applicant:${a.username.toLowerCase()}`, true).then((dev) => {
            if (dev) {
              dev.status = status;
              setJSON(`dev:applicant:${a.username.toLowerCase()}`, dev, true);
            }
          });
        } catch {
          // ignore
        }
        return { ...a, status, reviewedAt: Date.now(), reviewedBy };
      }
      return a;
    });
    await setJSON(ELITE_APPLICATIONS_KEY, updated, true);
    void updateRequestRemote("elite", id, { status, reviewedAt: Date.now(), reviewedBy });
    return true;
  } catch (err) {
    console.error("Failed to update elite application status:", err);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━ DYNAMIC FAQS ━━━━━━━━━━━━━━━━━━━━
export const DYNAMIC_FAQS_KEY = "faqs:dynamic_list";

export async function getDynamicFaqs(): Promise<FaqItem[]> {
  try {
    const local = (await getJSON<FaqItem[]>(DYNAMIC_FAQS_KEY, true)) || [];
    return mergeById(local, await loadStoreCollection<FaqItem>("faqs"));
  } catch {
    return [];
  }
}

export async function saveDynamicFaq(faq: FaqItem): Promise<boolean> {
  try {
    const existing = (await getJSON<FaqItem[]>(DYNAMIC_FAQS_KEY, true)) || [];
    const updated = [faq, ...existing.filter((f) => f.id !== faq.id)];
    await setJSON(DYNAMIC_FAQS_KEY, updated, true);
    void pushStoreItem("faqs", faq);
    return true;
  } catch {
    return false;
  }
}

export async function deleteDynamicFaq(faqId: string): Promise<boolean> {
  try {
    const existing = (await getJSON<FaqItem[]>(DYNAMIC_FAQS_KEY, true)) || [];
    const updated = existing.filter((f) => f.id !== faqId);
    await setJSON(DYNAMIC_FAQS_KEY, updated, true);
    void deleteStoreItem("faqs", faqId);
    return true;
  } catch {
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━ USER COMPLAINTS & REPORTS ━━━━━━━━━━━━━━━━━━━━
export const COMPLAINT_REPORTS_KEY = "complaint_reports:all";

export async function submitComplaintReport(report: ComplaintReport): Promise<boolean> {
  try {
    const existing = (await getJSON<ComplaintReport[]>(COMPLAINT_REPORTS_KEY, true)) || [];
    const updated = [report, ...existing].slice(0, 500);
    await setJSON(COMPLAINT_REPORTS_KEY, updated, true);
    void pushRequest("complaint", report);
    return true;
  } catch (err) {
    console.error("Failed to submit complaint report:", err);
    return false;
  }
}

export async function getComplaintReports(): Promise<ComplaintReport[]> {
  try {
    const local = (await getJSON<ComplaintReport[]>(COMPLAINT_REPORTS_KEY, true)) || [];
    return mergeById(local, await pullRequests<ComplaintReport>("complaint"));
  } catch {
    return [];
  }
}

export async function deleteComplaintReport(reportId: string): Promise<boolean> {
  try {
    const existing = (await getJSON<ComplaintReport[]>(COMPLAINT_REPORTS_KEY, true)) || [];
    const updated = existing.filter((r) => r.id !== reportId);
    await setJSON(COMPLAINT_REPORTS_KEY, updated, true);
    void deleteRequestRemote("complaint", reportId);
    return true;
  } catch {
    return false;
  }
}

export async function deleteEliteApplication(appId: string): Promise<boolean> {
  try {
    const existing = (await getJSON<EliteApplicationItem[]>(ELITE_APPLICATIONS_KEY, true)) || [];
    const target = existing.find((a) => a.id === appId);
    const updated = existing.filter((a) => a.id !== appId);
    await setJSON(ELITE_APPLICATIONS_KEY, updated, true);
    void deleteRequestRemote("elite", appId);
    if (target?.username) {
      await deleteDevApplicantFile(target.username);
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteDevApplicantFile(username: string): Promise<boolean> {
  try {
    const uNorm = username.toLowerCase();
    await delKey(`dev:applicant:${uNorm}`, true);
    await delKey(`dev:applicant:${uNorm}`, false);
    const registry = (await getJSON<string[]>(DEV_APPLICANTS_INDEX_KEY, true)) || [];
    const updatedRegistry = registry.filter((u) => u.toLowerCase() !== uNorm);
    await setJSON(DEV_APPLICANTS_INDEX_KEY, updatedRegistry, true);
    return true;
  } catch {
    return false;
  }
}

