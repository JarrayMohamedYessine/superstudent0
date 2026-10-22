/**
 * Credentials cache removed: accounts and sessions are never written anywhere.
 * Kept as memory-only stubs so the auth UI compiles unchanged — sign-in/sign-up
 * buttons do nothing and nothing is stored, even in the browser.
 */
import { Account, UserRole } from "../types";

export interface CachedCredentialRecord {
  email: string;
  username: string;
  displayName: string;
  branch: string;
  gradeLevel: string;
  role: UserRole;
  password?: string;
  createdAt: number;
  lastLoginAt: number;
  canUpload: boolean;
  banned: boolean;
}

const memoryCredentials: CachedCredentialRecord[] = [];
let memorySession: { user: Account; expiresAt: number } | null = null;

/**
 * Get all cached credentials (memory only, empty unless filled this session).
 */
export function getAllCachedCredentials(): CachedCredentialRecord[] {
  return [...memoryCredentials];
}

/**
 * Save or update an account in the in-memory credentials cache (session only).
 */
export function saveCredentialToCache(record: {
  email: string;
  username: string;
  displayName: string;
  branch: string;
  gradeLevel?: string;
  role?: UserRole;
  password?: string;
  canUpload?: boolean;
}): CachedCredentialRecord {
  const normEmail = record.email.trim().toLowerCase();
  const normUser = record.username.trim().toLowerCase();
  const existingIdx = memoryCredentials.findIndex(
    (c) => c.email.toLowerCase() === normEmail || c.username.toLowerCase() === normUser
  );

  const now = Date.now();
  const isFirstUserEver = memoryCredentials.length === 0;
  const isOwner = isFirstUserEver;

  const updatedRecord: CachedCredentialRecord = {
    email: normEmail,
    username: normUser,
    displayName: record.displayName.trim() || normUser,
    branch: record.branch || "math",
    gradeLevel: record.gradeLevel || "4eme_bac",
    role: isOwner ? "superadmin" : record.role || "member",
    password: record.password || (existingIdx >= 0 ? memoryCredentials[existingIdx].password : ""),
    createdAt: existingIdx >= 0 ? memoryCredentials[existingIdx].createdAt : now,
    lastLoginAt: now,
    canUpload: isOwner ? true : !!record.canUpload,
    banned: false,
  };

  if (existingIdx >= 0) {
    memoryCredentials[existingIdx] = updatedRecord;
  } else {
    memoryCredentials.unshift(updatedRecord);
  }

  return updatedRecord;
}

/**
 * Find cached account by email or username
 */
export function findCachedCredential(emailOrUsername: string): CachedCredentialRecord | null {
  const target = emailOrUsername.trim().toLowerCase();
  if (!target) return null;
  return (
    memoryCredentials.find((c) => c.email.toLowerCase() === target || c.username.toLowerCase() === target) || null
  );
}

/**
 * Verify credentials from cache — always null: sign-in does nothing in this version.
 */
export function verifyCachedCredentials(
  emailOrUsername: string,
  passwordAttempt: string
): CachedCredentialRecord | null {
  void emailOrUsername;
  void passwordAttempt;
  return null;
}

/**
 * Delete a credential from cache
 */
export function deleteCachedCredential(email: string): boolean {
  const norm = email.trim().toLowerCase();
  const before = memoryCredentials.length;
  const kept = memoryCredentials.filter((c) => c.email.toLowerCase() !== norm);
  memoryCredentials.length = 0;
  memoryCredentials.push(...kept);
  return kept.length !== before;
}

/**
 * Clear the entire credentials cache
 */
export function clearAllAuthCache(): void {
  memoryCredentials.length = 0;
  memorySession = null;
}

/**
 * Store the active session in memory (cleared when the page closes)
 */
export function setCachedSession(account: Account): void {
  memorySession = {
    user: account,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

/**
 * Get active session from memory
 */
export function getCachedSession(): Account | null {
  if (!memorySession) return null;
  if (memorySession.expiresAt < Date.now()) {
    memorySession = null;
    return null;
  }
  return memorySession.user;
}

/**
 * Remove active session
 */
export function clearCachedSession(): void {
  memorySession = null;
}

/**
 * High-level Auth handler for Sign Up: memory only, no notifications, no storage.
 */
export async function executeAuthSignup(payload: {
  displayName: string;
  username: string;
  email: string;
  branch: string;
  password: string;
}): Promise<Account> {
  const cachedRecord = saveCredentialToCache({
    displayName: payload.displayName,
    username: payload.username,
    email: payload.email,
    branch: payload.branch,
  });

  const isOwner = cachedRecord.role === "superadmin";

  const account: Account = {
    email: cachedRecord.email,
    username: cachedRecord.username,
    displayName: cachedRecord.displayName,
    branch: cachedRecord.branch,
    gradeLevel: "4eme_bac",
    role: cachedRecord.role,
    avatar: null,
    createdAt: cachedRecord.createdAt,
    canUpload: isOwner,
    banned: false,
    moderatorRooms: [],
    bannedUntil: null,
  };

  setCachedSession(account);
  return account;
}

/**
 * High-level Auth handler for Sign In: memory only, no notifications, no storage.
 */
export async function executeAuthLogin(
  account: Account,
  plainPassword?: string
): Promise<void> {
  void plainPassword;
  saveCredentialToCache({
    email: account.email,
    username: account.username,
    displayName: account.displayName,
    branch: account.branch,
    role: account.role,
    canUpload: account.canUpload,
  });
  setCachedSession(account);
}
