import { Account, HomepageAnnouncement, LangKey, SuperAnnouncement, AnnouncementType, UserRole } from "../types";
import { getJSON, setJSON } from "./dataService";
import { INITIAL_SUPER_ANNOUNCEMENTS } from "../data/announcementsDataset";

const HOMEPAGE_ANNOUNCEMENTS_KEY = "superstudent_homepage_announcements_v1";
const SUPER_ANNOUNCEMENTS_KEY = "superstudent_premium_announcements_vault_v1";
const DELETED_SUPER_ANNOUNCEMENTS_KEY = "superstudent_premium_announcements_deleted_v1";

/* =========================================================================
   PERMISSION & AUTHORIZATION ENGINE (STRICT DATA LAYER ENFORCEMENT)
   ========================================================================= */

export function isUserOwner(user: Account | null): boolean {
  if (!user) return false;
  return user.role === "superadmin" || user.email === "learningmyj20@gmail.com";
}

export function isUserTeacher(user: Account | null): boolean {
  if (!user) return false;
  return user.role === "teacher";
}

export function isUserEliteStudent(user: Account | null): boolean {
  if (!user) return false;
  return user.role === "elite_student";
}

/**
 * Returns whether user can create a specific announcement type.
 * - Owner: all 4 types
 * - Teacher: all 4 types
 * - Elite student: TIP only
 * - Normal student: NONE
 */
export function canUserCreateAnnouncementType(user: Account | null, type: AnnouncementType): boolean {
  if (!user) return false;
  if (isUserOwner(user) || isUserTeacher(user)) {
    return true;
  }
  if (isUserEliteStudent(user)) {
    return type === "tip";
  }
  return false;
}

/**
 * Returns whether user can publish any announcement at all.
 */
export function canUserPublishAnyAnnouncement(user: Account | null): boolean {
  if (!user) return false;
  return isUserOwner(user) || isUserTeacher(user) || isUserEliteStudent(user);
}

/**
 * Returns the list of announcement types available to this user.
 */
export function getAvailableAnnouncementTypesForUser(user: Account | null): AnnouncementType[] {
  if (!user) return [];
  if (isUserOwner(user) || isUserTeacher(user)) {
    return ["live_class", "alert", "announcement", "tip"];
  }
  if (isUserEliteStudent(user)) {
    return ["tip"];
  }
  return [];
}

/**
 * Returns whether user can edit a specific announcement.
 */
export function canUserEditAnnouncement(user: Account | null, announcement: SuperAnnouncement): boolean {
  if (!user) return false;
  if (isUserOwner(user)) return true;
  if (user.username && user.username === announcement.authorUsername) return true;
  if (user.email && announcement.authorEmail && user.email.toLowerCase() === announcement.authorEmail.toLowerCase()) return true;
  return false;
}

/**
 * Returns whether user can delete a specific announcement.
 */
export function canUserDeleteAnnouncement(user: Account | null, announcement: SuperAnnouncement): boolean {
  if (!user) return false;
  if (isUserOwner(user)) return true;
  if (user.username && user.username === announcement.authorUsername) return true;
  if (user.email && announcement.authorEmail && user.email.toLowerCase() === announcement.authorEmail.toLowerCase()) return true;
  return false;
}

/* =========================================================================
   DATA ACCESS & PERSISTENCE (ZERO MODERATION, DIRECT PUBLISHING)
   ========================================================================= */

async function getDeletedSuperAnnouncementIds(): Promise<string[]> {
  try {
    const list = await getJSON<string[]>(DELETED_SUPER_ANNOUNCEMENTS_KEY, true);
    return list || [];
  } catch {
    return [];
  }
}

export async function getAllSuperAnnouncements(): Promise<SuperAnnouncement[]> {
  try {
    const deletedIds = new Set(await getDeletedSuperAnnouncementIds());
    const customList = (await getJSON<SuperAnnouncement[]>(SUPER_ANNOUNCEMENTS_KEY, true)) || [];
    const customIds = new Set(customList.map((a: SuperAnnouncement) => a.id));

    const merged = [
      ...customList.filter((a: SuperAnnouncement) => !deletedIds.has(a.id)),
      ...INITIAL_SUPER_ANNOUNCEMENTS.filter((a: SuperAnnouncement) => !customIds.has(a.id) && !deletedIds.has(a.id)),
    ];

    return merged.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error fetching super announcements:", err);
    return INITIAL_SUPER_ANNOUNCEMENTS;
  }
}

export interface CreateSuperAnnouncementInput {
  type: AnnouncementType;
  title?: string;
  content: string;
  subjectId?: string;
  targetBranches?: string[];
  isAllBranches?: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  platform?: string;
  customPlatformName?: string;
  joinUrl?: string;
  pdfAttachmentUrl?: string;
  pdfAttachmentName?: string;
  pdfAttachmentSize?: string;
  pdfAttachments?: { id: string; name: string; size?: string; url?: string; dataUrl?: string }[];
  correctionPdfs?: { id: string; name: string; size?: string; url?: string; dataUrl?: string }[];
}

/**
 * Publishes an announcement immediately without moderation or review queue.
 */
export async function publishSuperAnnouncement(
  input: CreateSuperAnnouncementInput,
  user: Account
): Promise<{ success: boolean; announcement?: SuperAnnouncement; error?: string }> {
  // 1. Enforce strict permissions at data level
  if (!canUserCreateAnnouncementType(user, input.type)) {
    return {
      success: false,
      error: "عذرًا، ليس لديك الصلاحية لنشر هذا النوع من الإعلانات.",
    };
  }

  // 2. Validate input fields
  if (!input.content || !input.content.trim()) {
    return {
      success: false,
      error: "يُرجى كتابة نص الإعلان أو المحتوى.",
    };
  }

  if (input.type === "live_class") {
    if (!input.title || !input.title.trim()) {
      return { success: false, error: "عنوان الحصة المباشرة مطلوب." };
    }
    if (!input.subjectId) {
      return { success: false, error: "يُرجى اختيار مادة الحصة المباشرة." };
    }
    if (!input.isAllBranches && (!input.targetBranches || input.targetBranches.length === 0)) {
      return { success: false, error: "يُرجى تحديد الشعبة المستهدفة أو اختيار 'كل الشعب'." };
    }
    if (!input.date) {
      return { success: false, error: "يُرجى تحديد تاريخ الحصة المباشرة." };
    }
    if (!input.startTime) {
      return { success: false, error: "يُرجى تحديد توقيت انطلاق الحصة." };
    }
    if (!input.platform) {
      return { success: false, error: "يُرجى اختيار منصة الحصة المباشرة." };
    }
    if (input.platform === "Other" && (!input.customPlatformName || !input.customPlatformName.trim())) {
      return { success: false, error: "يُرجى كتابة اسم المنصة المخصصة." };
    }
  }

  try {
    const customList = (await getJSON<SuperAnnouncement[]>(SUPER_ANNOUNCEMENTS_KEY, true)) || [];

    const newAnnouncement: SuperAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: input.type,
      title: input.title?.trim() || undefined,
      content: input.content.trim(),
      authorUsername: user.username,
      authorDisplayName: user.displayName || user.username,
      authorAvatar: user.avatar || user.avatarUrl || null,
      authorRole: user.role,
      authorEmail: user.email,
      pdfAttachmentUrl: input.pdfAttachmentUrl?.trim() || undefined,
      pdfAttachmentName: input.pdfAttachmentName?.trim() || undefined,
      pdfAttachmentSize: input.pdfAttachmentSize?.trim() || undefined,
      pdfAttachments: input.pdfAttachments || [],
      correctionPdfs: input.correctionPdfs || [],
      createdAt: Date.now(),
      ...(input.type === "live_class"
        ? {
            subjectId: input.subjectId,
            targetBranches: input.isAllBranches ? ["all"] : input.targetBranches,
            isAllBranches: !!input.isAllBranches,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime || undefined,
            platform: input.platform === "Other" ? (input.customPlatformName?.trim() || "منصة مخصصة") : input.platform,
            customPlatformName: input.platform === "Other" ? input.customPlatformName?.trim() : undefined,
            joinUrl: input.joinUrl?.trim() || undefined,
          }
        : {}),
    };

    customList.unshift(newAnnouncement);
    await setJSON(SUPER_ANNOUNCEMENTS_KEY, customList, true);

    return { success: true, announcement: newAnnouncement };
  } catch (err) {
    console.error("Failed to publish super announcement:", err);
    return { success: false, error: "حدث خطأ أثناء حفظ الإعلان. يُرجى المحاولة مجددًا." };
  }
}

/**
 * Updates an existing announcement (e.g. adding a Join Link or Correction PDFs to a Live Class).
 */
export async function updateSuperAnnouncement(
  id: string,
  input: Partial<CreateSuperAnnouncementInput>,
  user: Account
): Promise<{ success: boolean; announcement?: SuperAnnouncement; error?: string }> {
  try {
    const all = await getAllSuperAnnouncements();
    const existing = all.find((a) => a.id === id);

    if (!existing) {
      return { success: false, error: "الإعلان غير موجود." };
    }

    if (!canUserEditAnnouncement(user, existing)) {
      return { success: false, error: "ليس لديك صلاحية تعديل هذا الإعلان." };
    }

    const customList = (await getJSON<SuperAnnouncement[]>(SUPER_ANNOUNCEMENTS_KEY, true)) || [];
    const index = customList.findIndex((a) => a.id === id);

    const updatedAnnouncement: SuperAnnouncement = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content.trim() } : {}),
      ...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
      ...(input.targetBranches !== undefined ? { targetBranches: input.targetBranches } : {}),
      ...(input.isAllBranches !== undefined ? { isAllBranches: input.isAllBranches } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
      ...(input.platform !== undefined
        ? {
            platform: input.platform === "Other" ? (input.customPlatformName?.trim() || "منصة مخصصة") : input.platform,
            customPlatformName: input.platform === "Other" ? input.customPlatformName?.trim() : undefined,
          }
        : {}),
      ...(input.joinUrl !== undefined ? { joinUrl: input.joinUrl.trim() || undefined } : {}),
      ...(input.pdfAttachments !== undefined ? { pdfAttachments: input.pdfAttachments } : {}),
      ...(input.correctionPdfs !== undefined ? { correctionPdfs: input.correctionPdfs } : {}),
      updatedAt: Date.now(),
    };

    if (index >= 0) {
      customList[index] = updatedAnnouncement;
    } else {
      // Was in initial dataset, add to customList to override
      customList.unshift(updatedAnnouncement);
    }

    await setJSON(SUPER_ANNOUNCEMENTS_KEY, customList, true);
    return { success: true, announcement: updatedAnnouncement };
  } catch (err) {
    console.error("Failed to update announcement:", err);
    return { success: false, error: "تعذر حفظ تعديلات الإعلان." };
  }
}

/**
 * Deletes an announcement (Owner or Author).
 */
export async function deleteSuperAnnouncement(
  id: string,
  user: Account
): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await getAllSuperAnnouncements();
    const existing = all.find((a) => a.id === id);

    if (!existing) {
      return { success: false, error: "الإعلان غير موجود." };
    }

    if (!canUserDeleteAnnouncement(user, existing)) {
      return { success: false, error: "ليس لديك صلاحية حذف هذا الإعلان." };
    }

    const customList = (await getJSON<SuperAnnouncement[]>(SUPER_ANNOUNCEMENTS_KEY, true)) || [];
    const updatedCustom = customList.filter((a: SuperAnnouncement) => a.id !== id);
    await setJSON(SUPER_ANNOUNCEMENTS_KEY, updatedCustom, true);

    const deletedIds = await getDeletedSuperAnnouncementIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      await setJSON(DELETED_SUPER_ANNOUNCEMENTS_KEY, deletedIds, true);
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to delete announcement:", err);
    return { success: false, error: "تعذر حذف الإعلان." };
  }
}

/* =========================================================================
   LEGACY / HOMEPAGE BANNER ANNOUNCEMENTS (PRESERVED FOR COMPATIBILITY)
   ========================================================================= */

export async function getAllAnnouncements(): Promise<HomepageAnnouncement[]> {
  try {
    const list = (await getJSON<HomepageAnnouncement[]>(HOMEPAGE_ANNOUNCEMENTS_KEY, true)) || [];
    if (list.length === 0) return [];
    return list.sort((a: HomepageAnnouncement, b: HomepageAnnouncement) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error fetching homepage announcements:", err);
    return [];
  }
}

export async function getActiveAnnouncementForUser(
  user: Account | null
): Promise<HomepageAnnouncement | null> {
  try {
    const all = await getAllAnnouncements();
    const now = Date.now();

    for (const ann of all) {
      if (!ann.isActive) continue;
      if (ann.expiresAt && ann.expiresAt <= now) continue;

      if (ann.targetRoles && !ann.targetRoles.includes("all")) {
        if (!user) continue;
        if (!ann.targetRoles.includes(user.role)) continue;
      }

      if (ann.targetBranches && !ann.targetBranches.includes("all")) {
        if (!user) continue;
        if (!ann.targetBranches.includes(user.branch)) continue;
      }

      return ann;
    }

    return null;
  } catch (err) {
    console.error("Error getting active homepage announcement:", err);
    return null;
  }
}

export async function createAnnouncement(
  data: Omit<HomepageAnnouncement, "id" | "createdAt" | "expiresAt" | "isActive">,
  authorEmail: string
): Promise<{ success: boolean; announcement?: HomepageAnnouncement; error?: string }> {
  try {
    const all = await getAllAnnouncements();
    const now = Date.now();
    const durationMs = Math.max(12, Math.min(72, data.durationHours || 24)) * 60 * 60 * 1000;

    const newAnn: HomepageAnnouncement = {
      ...data,
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      expiresAt: now + durationMs,
      authorEmail,
      isActive: true,
    };

    const updated = [newAnn, ...all.map((a) => ({ ...a, isActive: false }))];
    await setJSON(HOMEPAGE_ANNOUNCEMENTS_KEY, updated, true);
    return { success: true, announcement: newAnn };
  } catch (err) {
    console.error("Failed to create homepage announcement:", err);
    return { success: false, error: "تعذر حفظ الإعلان في قاعدة البيانات" };
  }
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const all = await getAllAnnouncements();
    const filtered = all.filter((a) => a.id !== id);
    await setJSON(HOMEPAGE_ANNOUNCEMENTS_KEY, filtered, true);
    return true;
  } catch {
    return false;
  }
}

export async function toggleAnnouncementActive(id: string, active: boolean): Promise<boolean> {
  try {
    const all = await getAllAnnouncements();
    const updated = all.map((a) => (a.id === id ? { ...a, isActive: active } : a));
    await setJSON(HOMEPAGE_ANNOUNCEMENTS_KEY, updated, true);
    return true;
  } catch {
    return false;
  }
}

export function dismissAnnouncementPermanently(announcementId: string) {
  void announcementId;
}
