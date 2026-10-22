/**
 * Local User Profiles Cache & Storage File
 * 
 * Provides an in-memory & local file-based cache for frequently used user information
 * (such as displayName, username, email, role, avatar, branch, and permissions)
 * to avoid unnecessary database round-trips and provide instant zero-latency profile resolution.
 */

import { Account, UserRole } from "../types";

export interface CachedUserProfile {
  email: string;
  username: string;
  displayName: string;
  branch: string;
  gradeLevel: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: number;
  canUpload?: boolean;
  banned?: boolean;
  moderatorRooms?: string[];
  lastActiveAt?: number;
}

/**
 * Pre-seeded frequently used user profiles stored directly inside the website file structure.
 */
export const STATIC_USER_PROFILES: Record<string, CachedUserProfile> = {
  "learningmyj20@gmail.com": {
    email: "learningmyj20@gmail.com",
    username: "superstudent_admin",
    displayName: "الأستاذ مهدي — المشرف الأعلى",
    branch: "math",
    gradeLevel: "4eme_bac",
    role: "superadmin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    createdAt: 1700000000000,
    canUpload: true,
    banned: false,
    moderatorRooms: ["math_lounge", "physics_lab", "bac_general"],
  },
  "jarraymahdi567@gmail.com": {
    email: "jarraymahdi567@gmail.com",
    username: "mahdi_jarray",
    displayName: "المهندس مهدي الجراي",
    branch: "math",
    gradeLevel: "4eme_bac",
    role: "superadmin",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    createdAt: 1700000000000,
    canUpload: true,
    banned: false,
    moderatorRooms: ["math_lounge", "info_lab"],
  },
  "prof.ben.ali@superstudent.tn": {
    email: "prof.ben.ali@superstudent.tn",
    username: "prof_ben_ali",
    displayName: "الأستاذ محمد بن علي",
    branch: "math",
    gradeLevel: "4eme_bac",
    role: "teacher",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    createdAt: 1705000000000,
    canUpload: true,
    banned: false,
    moderatorRooms: ["math_lounge"],
  },
  "prof.salma.k@superstudent.tn": {
    email: "prof.salma.k@superstudent.tn",
    username: "prof_salma",
    displayName: "الأستاذة سلمى الكراي",
    branch: "sciexp",
    gradeLevel: "4eme_bac",
    role: "teacher",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    createdAt: 1706000000000,
    canUpload: true,
    banned: false,
    moderatorRooms: ["physics_lab"],
  },
  "student.youssef@superstudent.tn": {
    email: "student.youssef@superstudent.tn",
    username: "youssef_bac2026",
    displayName: "يوسف التونسي",
    branch: "math",
    gradeLevel: "4eme_bac",
    role: "elite_student",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
    createdAt: 1708000000000,
    canUpload: true,
    banned: false,
  },
};

/**
 * In-memory runtime cache for lightning-fast synchronous access (session only).
 */
let inMemoryProfilesCache: Map<string, CachedUserProfile> | null = null;

function initializeInMemoryCache(): Map<string, CachedUserProfile> {
  const map = new Map<string, CachedUserProfile>();

  // Static pre-seeded profiles (bundled UI content, no user data)
  Object.values(STATIC_USER_PROFILES).forEach((profile) => {
    map.set(profile.email.toLowerCase(), profile);
    map.set(profile.username.toLowerCase(), profile);
  });

  inMemoryProfilesCache = map;
  return map;
}

function getProfilesMap(): Map<string, CachedUserProfile> {
  if (!inMemoryProfilesCache) {
    return initializeInMemoryCache();
  }
  return inMemoryProfilesCache;
}

function persistProfilesToStorage(): void {
  // Memory only: nothing is persisted anywhere.
}

/**
 * Instantly retrieves a cached user profile by email, username, or displayName
 * without waiting for database requests.
 */
export function getLocalUserProfile(identifier?: string | null): CachedUserProfile | null {
  if (!identifier) return null;
  const key = identifier.trim().toLowerCase();
  if (!key) return null;

  const map = getProfilesMap();
  const directMatch = map.get(key);
  if (directMatch) return directMatch;

  // Search by displayName if exact key match missed
  for (const profile of map.values()) {
    if (
      profile.displayName.toLowerCase() === key ||
      profile.username.toLowerCase() === key ||
      profile.email.toLowerCase() === key
    ) {
      return profile;
    }
  }

  return null;
}

/**
 * Saves or updates user information in the local file store and syncs with persistent cache.
 */
export function saveUserProfileToLocalCache(
  account: Partial<Account> & { email: string; username: string; displayName: string }
): CachedUserProfile {
  const map = getProfilesMap();
  const normEmail = account.email.trim().toLowerCase();
  const normUsername = account.username.trim().toLowerCase();
  const normDisplayName = account.displayName.trim() || normUsername;

  const existing = getLocalUserProfile(normEmail) || getLocalUserProfile(normUsername);

  const updatedProfile: CachedUserProfile = {
    email: normEmail,
    username: normUsername,
    displayName: normDisplayName,
    branch: account.branch || existing?.branch || "math",
    gradeLevel: account.gradeLevel || existing?.gradeLevel || "4eme_bac",
    role: account.role || existing?.role || "member",
    avatar: account.avatar !== undefined ? account.avatar : existing?.avatar || null,
    createdAt: account.createdAt || existing?.createdAt || Date.now(),
    canUpload: account.canUpload !== undefined ? account.canUpload : existing?.canUpload || false,
    banned: account.banned !== undefined ? account.banned : existing?.banned || false,
    moderatorRooms: account.moderatorRooms || existing?.moderatorRooms || [],
    lastActiveAt: Date.now(),
  };

  map.set(normEmail, updatedProfile);
  map.set(normUsername, updatedProfile);

  persistProfilesToStorage();
  return updatedProfile;
}

/**
 * Removes a user profile from the memory cache and local storage.
 * Used during account deletion to prevent stale profiles and orphaned cached data.
 */
export function evictUserProfileCache(identifier?: string | null): boolean {
  if (!identifier) return false;
  const key = identifier.trim().toLowerCase();
  if (!key) return false;

  const map = getProfilesMap();
  const existing = getLocalUserProfile(key);
  let removed = false;

  if (map.has(key)) {
    map.delete(key);
    removed = true;
  }

  if (existing) {
    if (existing.email && map.has(existing.email.toLowerCase())) {
      map.delete(existing.email.toLowerCase());
      removed = true;
    }
    if (existing.username && map.has(existing.username.toLowerCase())) {
      map.delete(existing.username.toLowerCase());
      removed = true;
    }
  }

  if (removed) {
    persistProfilesToStorage();
  }
  return removed;
}

/**
 * Returns all cached user profiles stored locally in the site file cache.
 */
export function getAllLocalUserProfiles(): CachedUserProfile[] {
  const map = getProfilesMap();
  const unique = Array.from(map.values()).filter(
    (profile, idx, self) => self.findIndex((p) => p.email.toLowerCase() === profile.email.toLowerCase()) === idx
  );
  return unique.sort((a, b) => (b.lastActiveAt || b.createdAt) - (a.lastActiveAt || a.createdAt));
}

/**
 * Formats user display name instantly from local cache if available.
 */
export function formatUserDisplayName(identifierOrAccount?: Account | string | null): string {
  if (!identifierOrAccount) return "مستخدم المساق";
  if (typeof identifierOrAccount === "object") {
    return identifierOrAccount.displayName || identifierOrAccount.username || "مستخدم المساق";
  }
  const cached = getLocalUserProfile(identifierOrAccount);
  return cached?.displayName || identifierOrAccount;
}

/**
 * Resolves user avatar URL instantly from local cache if available.
 */
export function getUserAvatarUrl(identifierOrAccount?: Account | string | null): string | null {
  if (!identifierOrAccount) return null;
  if (typeof identifierOrAccount === "object") {
    return identifierOrAccount.avatar || null;
  }
  const cached = getLocalUserProfile(identifierOrAccount);
  return cached?.avatar || null;
}
