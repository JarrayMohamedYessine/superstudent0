import React, { useState, useEffect } from "react";
import { ImageLightbox } from "./ImageLightbox";
import {
  Users as UsersIcon,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  Trash2,
  AlertTriangle,
  FileText,
  Download,
  Award,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldAlert,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  FolderArchive,
  Layers,
  Star,
  MessageSquareHeart,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  HelpCircle,
  PlusCircle,
  Edit3,
  Megaphone,
  X,
  Copy,
  Database,
  Key,
  Cloud,
  Code2,
  Crown,
  Radio,
} from "lucide-react";
import { Account, AuditLogEntry, ComplaintReport, LangKey, ChatMediaItem, MessageItem, StudentFeedbackItem, EliteApplicationItem, FaqItem, HomepageAnnouncement, SuperAnnouncement, UserRole } from "../types";
import {
  COLORS,
  GRAD,
  GRAD_GOLD,
  SUBJECTS,
  BRANCHES,
  T,
  BAN_OPTS,
  PRESENCE_WINDOW_MS,
  MESSAGE_RETENTION_MS,
  MEDIA_VAULT_RETENTION_MS,
  isAccountBanned,
} from "../constants";
import {
  getJSON,
  setJSON,
  delKey,
  listKeys,
  normEmail,
  formatDateTime,
  getChatMediaVault,
  deleteChatMediaItem,
  purgeExpiredMediaVault,
  getStudentFeedbacks,
  deleteStudentFeedback,
  toggleResolveStudentFeedback,
  getEliteApplications,
  updateEliteApplicationStatus,
  getDynamicFaqs,
  saveDynamicFaq,
  deleteDynamicFaq,
  promoteToModeratorRPC,
  demoteModeratorRPC,
  promoteToSuperAdminRPC,
  demoteSuperAdminRPC,
  banUserRPC,
  unbanUserRPC,
  setEliteStudentRPC,
  setUserCanUploadRPC,
  resolveEliteApplicationRPC,
  deleteUserAccountRPC,
} from "../services/dataService";
import {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
  getAllSuperAnnouncements,
  deleteSuperAnnouncement,
} from "../services/announcementService";

import { TopBar, Avatar, Chip, FieldShell, PrimaryButton, Spinner } from "./Atoms";
import { createNotification } from "../services/notificationService";

const UNIQUE_ROOMS = (() => {
  const seen = new Set<string>();
  const list: {
    roomId: string;
    subject: string;
    shared: boolean;
    branchName: Record<LangKey, string>;
  }[] = [];
  BRANCHES.forEach((b) => {
    b.rooms.forEach((r) => {
      if (seen.has(r.roomId)) return;
      seen.add(r.roomId);
      list.push({
        roomId: r.roomId,
        subject: r.subject,
        shared: !!r.shared,
        branchName: b.name,
      });
    });
  });
  return list;
})();

const ANNOUNCEMENT_BADGES = [
  { ar: "إعلان رسمي", fr: "Annonce officielle", en: "Official announcement" },
  { ar: "تنبيه هام", fr: "Information importante", en: "Important notice" },
  { ar: "تحديث المنصة", fr: "Mise à jour", en: "Platform update" },
  { ar: "دورات ومراجعات", fr: "Cours et révisions", en: "Courses and revision" },
  { ar: "تهنئة وتشجيع", fr: "Félicitations", en: "Congratulations" },
];

interface AdminScreenProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account;
  onLogout: () => void;
  onBack: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export function AdminScreen({
  lang,
  isRTL,
  user,
  onLogout,
  onBack,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: AdminScreenProps) {
  const t = T[lang];
  const [activeTab, setActiveTab] = useState<"users" | "elite_apps" | "feedbacks" | "faqs_tab" | "announcements" | "media" | "reports" | "audit" | "export" | "telegram_cloud">("users");
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  // Telegram Cloud & In-Memory Moderation Blacklist State
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [moderationStatus, setModerationStatus] = useState<any>(null);
  const [loadingTgStatus, setLoadingTgStatus] = useState(false);
  const [cleaningCache, setCleaningCache] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [manualBanInput, setManualBanInput] = useState("");
  const [manualBanReason, setManualBanReason] = useState("");

  const [activeNow, setActiveNow] = useState<number | null>(null);
  const [totalMods, setTotalMods] = useState<number | null>(null);
  const [totalMediaCount, setTotalMediaCount] = useState<number>(0);
  const [users, setUsers] = useState<Account[]>([]);
  const [userFilterRole, setUserFilterRole] = useState<"all" | "superadmin" | "moderator" | "elite_student" | "can_upload" | "member" | "banned">("all");
  const [userFilterSearch, setUserFilterSearch] = useState<string>("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Account | "notfound" | null>(null);
  const [pendingMods, setPendingMods] = useState<string[]>([]);
  const [savingMods, setSavingMods] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [banBusy, setBanBusy] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);

  // Admin Announcements State
  const [announcements, setAnnouncements] = useState<HomepageAnnouncement[]>([]);
  const [superAnnouncements, setSuperAnnouncements] = useState<SuperAnnouncement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showCreateAnnModal, setShowCreateAnnModal] = useState(false);
  const [annTitleAr, setAnnTitleAr] = useState("");
  const [annTitleFr, setAnnTitleFr] = useState("");
  const [annTitleEn, setAnnTitleEn] = useState("");
  const [annMessageAr, setAnnMessageAr] = useState("");
  const [annMessageFr, setAnnMessageFr] = useState("");
  const [annMessageEn, setAnnMessageEn] = useState("");
  const [annBadge, setAnnBadge] = useState("إعلان إداري رسمي");
  const [annTargetRoles, setAnnTargetRoles] = useState<string[]>(["all"]);
  const [annTargetBranches, setAnnTargetBranches] = useState<string[]>(["all"]);
  const [annDurationHours, setAnnDurationHours] = useState<number>(24);
  const [annStyle, setAnnStyle] = useState<"gold" | "emerald" | "indigo" | "rose" | "cyan">("gold");
  const [savingAnn, setSavingAnn] = useState(false);
  const [annFormError, setAnnFormError] = useState("");

  async function loadAnnouncementsData() {
    setLoadingAnnouncements(true);
    try {
      const [list, superList] = await Promise.all([
        getAllAnnouncements(),
        getAllSuperAnnouncements(),
      ]);
      setAnnouncements(list);
      setSuperAnnouncements(superList);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  }

  async function handleDeleteSuperAnn(id: string) {
    const res = await deleteSuperAnnouncement(id, user);
    if (res.success) {
      setSuperAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleCreateAnnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!annTitleAr.trim()) {
      setAnnFormError(lang === "ar" ? "يرجى كتابة عنوان الإعلان" : lang === "fr" ? "Saisissez un titre." : "Enter an announcement title.");
      return;
    }
    if (!annMessageAr.trim()) {
      setAnnFormError(lang === "ar" ? "يرجى كتابة نص الإعلان" : lang === "fr" ? "Saisissez le texte de l’annonce." : "Enter the announcement text.");
      return;
    }
    setSavingAnn(true);
    setAnnFormError("");

    const res = await createAnnouncement(
      {
        title: {
          ar: annTitleAr.trim(),
          fr: annTitleFr.trim() || annTitleAr.trim(),
          en: annTitleEn.trim() || annTitleAr.trim(),
        },
        message: {
          ar: annMessageAr.trim(),
          fr: annMessageFr.trim() || annMessageAr.trim(),
          en: annMessageEn.trim() || annMessageAr.trim(),
        },
        targetRoles: annTargetRoles.length === 0 ? ["all"] : annTargetRoles,
        targetBranches: annTargetBranches.length === 0 ? ["all"] : annTargetBranches,
        durationHours: Math.max(12, Math.min(72, annDurationHours)),
        badge: {
          ar: annBadge.trim() || "إعلان رسمي",
          fr: "Annonce Officielle",
          en: "Official Announcement",
        },
        style: annStyle,
      },
      user.email
    );

    setSavingAnn(false);
    if (res.success) {
      setShowCreateAnnModal(false);
      setAnnTitleAr("");
      setAnnTitleFr("");
      setAnnTitleEn("");
      setAnnMessageAr("");
      setAnnMessageFr("");
      setAnnMessageEn("");
      await loadAnnouncementsData();
    } else {
      setAnnFormError(res.error || (lang === "ar" ? "تعذر إنشاء الإعلان." : lang === "fr" ? "Impossible de créer l’annonce." : "Could not create the announcement."));
    }
  }

  async function handleDeleteAnn(id: string) {
    await deleteAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleToggleAnn(id: string, currentActive: boolean) {
    await toggleAnnouncementActive(id, !currentActive);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !currentActive } : a))
    );
  }

  async function loadTelegramAndModerationStatus() {
    // Server status removed: no cloud service is contacted; the panels stay empty.
    setTelegramStatus(null);
    setModerationStatus(null);
    setLoadingTgStatus(false);
  }

  async function handleTriggerCleanup() {
    setCleaningCache(true);
    setCleanupMessage(null);
    try {
      setCleanupMessage("لا يوجد تخزين خارجي في هذا الإصدار: لا يوجد ما يمكن تنظيفه.");
    } finally {
      setCleaningCache(false);
    }
  }

  async function handleManualBanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualBanInput.trim()) return;
    // Server-side moderation removed: the action does nothing and contacts no service.
    setManualBanInput("");
    setManualBanReason("");
  }

  async function handleManualUnban(id: string) {
    void id;
    // Server-side moderation removed: the action does nothing and contacts no service.
  }

  // Admin FAQ State
  const [adminFaqs, setAdminFaqs] = useState<FaqItem[]>([]);
  const [loadingAdminFaqs, setLoadingAdminFaqs] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingAdminFaqId, setEditingAdminFaqId] = useState<string | null>(null);
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");
  const [faqCat, setFaqCat] = useState("عام");
  const [savingAdminFaq, setSavingAdminFaq] = useState(false);

  async function loadAdminFaqs() {
    setLoadingAdminFaqs(true);
    try {
      const list = await getDynamicFaqs();
      setAdminFaqs(list);
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    } finally {
      setLoadingAdminFaqs(false);
    }
  }

  async function handleAdminSaveFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!faqQ.trim() || !faqA.trim()) return;
    setSavingAdminFaq(true);
    try {
      const item: FaqItem = {
        id: editingAdminFaqId || `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        question: faqQ.trim(),
        answer: faqA.trim(),
        category: faqCat.trim() || "عام",
        authorEmail: user.email,
        authorRole: user.role,
        createdAt: Date.now(),
      };
      await saveDynamicFaq(item);
      await loadAdminFaqs();
      setFaqQ("");
      setFaqA("");
      setEditingAdminFaqId(null);
      setShowFaqModal(false);
    } catch (err) {
      console.error("Failed to save FAQ:", err);
    } finally {
      setSavingAdminFaq(false);
    }
  }

  async function handleAdminDeleteFaq(id: string) {
    await deleteDynamicFaq(id);
    setAdminFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  // Elite Applications State
  const [eliteApps, setEliteApps] = useState<EliteApplicationItem[]>([]);
  const [loadingEliteApps, setLoadingEliteApps] = useState(false);
  const [eliteFilterStatus, setEliteFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [previewProofModal, setPreviewProofModal] = useState<string | null>(null);

  // Student Feedbacks State
  const [feedbacks, setFeedbacks] = useState<StudentFeedbackItem[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>("all");


  // Media Vault State
  const [mediaList, setMediaList] = useState<ChatMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaFilterType, setMediaFilterType] = useState<"all" | "image" | "pdf">("all");
  const [mediaFilterRoom, setMediaFilterRoom] = useState<string>("all");
  const [mediaSearchQuery, setMediaSearchQuery] = useState<string>("");
  const [previewMediaModal, setPreviewMediaModal] = useState<ChatMediaItem | null>(null);
  const [proofViewer, setProofViewer] = useState<{ src: string; title: string } | null>(null);

  // Complaints state
  const [reports, setReports] = useState<ComplaintReport[]>([]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  async function loadFeedbacksData() {
    setLoadingFeedbacks(true);
    try {
      const items = await getStudentFeedbacks();
      setFeedbacks(items);
    } catch (err) {
      console.error("Error loading feedbacks:", err);
    } finally {
      setLoadingFeedbacks(false);
    }
  }

  async function loadEliteApplicationsData() {
    setLoadingEliteApps(true);
    try {
      const apps = await getEliteApplications();
      setEliteApps(apps);
    } catch (err) {
      console.error("Error loading elite applications:", err);
    } finally {
      setLoadingEliteApps(false);
    }
  }

  async function handleReviewEliteApp(app: EliteApplicationItem, newStatus: "approved" | "rejected") {
    const ok = await updateEliteApplicationStatus(app.id, newStatus, user.email);
    if (!ok) return;

    if (newStatus === "approved") {
      // Automatically upgrade account role based on applicant role (teacher vs elite_student)
      const targetAcc = await getJSON<Account>(`account:${normEmail(app.email)}`, true);
      if (targetAcc) {
        const assignedRole: UserRole = (app.applicantRole as string) === "professor" || (app.applicantRole as string) === "teacher" ? "teacher" : "elite_student";
        const updatedAcc: Account = { ...targetAcc, role: assignedRole, canUpload: true };
        await setJSON(`account:${normEmail(app.email)}`, updatedAcc, true);
        // update in-memory users list if present
        setUsers((prev) => prev.map((u) => (u.email === app.email ? updatedAcc : u)));
        if (result && result !== "notfound" && result.email === app.email) {
          setResult(updatedAcc);
        }
      }

      // Send congratulations notification to the approved student and platform
      try {
        await createNotification({
          title: {
            ar: "تمت الموافقة على طلب مساهمتك.",
            fr: "Votre demande de contribution a été approuvée.",
            en: "Your contributor application has been approved.",
          },
          message: {
            ar: `تهانينا @${app.username}! تمت مراجعة ملفك واعتماد عضويتك كتلميذ متميز، لديك الآن صلاحية رفع ونشر الفروض والملخصات حتى 30 مرة.`,
            fr: `Félicitations @${app.username}! Votre profil élève d'élite a été validé.`,
            en: `Congratulations @${app.username}! Your elite student profile is approved.`,
          },
          type: "elite_upgrade",
          recipientRole: "all",
          targetEmail: app.email,
          iconType: "star",
          badgeLabel: { ar: "ترقية متميز", fr: "Élite", en: "Elite" },
          actionUrl: "documents",
        });
      } catch {
        // ignore
      }
    }

    setEliteApps((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? { ...a, status: newStatus, reviewedAt: Date.now(), reviewedBy: user.email }
          : a
      )
    );
  }


  async function handleToggleResolveFb(item: StudentFeedbackItem) {
    const nextStatus = !item.resolved;
    await toggleResolveStudentFeedback(item.id, nextStatus);
    setFeedbacks((prev) =>
      prev.map((fb) => (fb.id === item.id ? { ...fb, resolved: nextStatus } : fb))
    );
  }

  async function handleDeleteFb(id: string) {
    await deleteStudentFeedback(id);
    setFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
  }

  async function loadMediaVault() {
    setLoadingMedia(true);
    try {
      const vaultItems = await getChatMediaVault();
      const itemMap = new Map<string, ChatMediaItem>();
      const mediaCutoff = Date.now() - MEDIA_VAULT_RETENTION_MS; // 14 days retention
      const roomMsgCutoff = Date.now() - MESSAGE_RETENTION_MS; // 5 days retention

      vaultItems.forEach((it) => {
        if (it.createdAt && it.createdAt >= mediaCutoff) {
          itemMap.set(it.id, it);
        }
      });

      for (const room of UNIQUE_ROOMS) {
        try {
          const msgs = (await getJSON<MessageItem[]>(`room:${room.roomId}:messages`, true)) || [];
          for (const m of msgs) {
            if (!m.createdAt || m.createdAt < roomMsgCutoff) continue;
            if (m.images && m.images.length > 0) {
              m.images.forEach((imgData, idx) => {
                const id = `media-img-${m.id}-${idx}`;
                if (!itemMap.has(id)) {
                  const s = SUBJECTS[room.subject];
                  const roomTitleStr = s ? `${s.name[lang] || s.name.ar} (${room.roomId})` : room.roomId;
                  itemMap.set(id, {
                    id,
                    messageId: m.id,
                    roomId: room.roomId,
                    roomTitle: roomTitleStr,
                    senderUsername: m.username,
                    senderDisplayName: m.displayName,
                    senderAvatar: m.avatar,
                    textSnippet: m.text,
                    type: "image",
                    dataUrl: imgData,
                    createdAt: m.createdAt,
                  });
                }
              });
            }
            if (m.pdf) {
              const id = `media-pdf-${m.id}`;
              if (!itemMap.has(id)) {
                const s = SUBJECTS[room.subject];
                const roomTitleStr = s ? `${s.name[lang] || s.name.ar} (${room.roomId})` : room.roomId;
                itemMap.set(id, {
                  id,
                  messageId: m.id,
                  roomId: room.roomId,
                  roomTitle: roomTitleStr,
                  senderUsername: m.username,
                  senderDisplayName: m.displayName,
                  senderAvatar: m.avatar,
                  textSnippet: m.text,
                  type: "pdf",
                  url: m.pdf.url,
                  fileName: m.pdf.fileName,
                  sizeKB: m.pdf.sizeKB,
                  createdAt: m.createdAt,
                });
              }
            }
          }
        } catch {
          // ignore
        }
      }

      const combined = Array.from(itemMap.values());
      combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setMediaList(combined);
      setTotalMediaCount(combined.length);
    } catch (err) {
      console.error("Error loading chat media vault:", err);
    } finally {
      setLoadingMedia(false);
    }
  }

  async function loadStats() {
    const keys = await listKeys("account:", true);
    setTotalUsers(keys.length);
    const presence =
      (await getJSON<Record<string, number>>("presence-registry", true)) || {};
    const now = Date.now();
    setActiveNow(
      Object.values(presence).filter((ts) => now - ts < PRESENCE_WINDOW_MS)
        .length
    );
    const accounts: Account[] = [];
    for (const k of keys.slice(0, 300)) {
      const acc = await getJSON<Account>(k, true);
      if (acc) accounts.push(acc);
    }
    accounts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setUsers(accounts);
    setTotalMods(
      accounts.filter(
        (a) => a.role === "moderator" || (a.moderatorRooms || []).length > 0
      ).length
    );
    loadMediaVault();
    loadFeedbacksData();
    loadEliteApplicationsData();
  }

  async function handleDeleteMediaVaultItem(item: ChatMediaItem) {
    await deleteChatMediaItem(item.id);
    setMediaList((prev) => prev.filter((m) => m.id !== item.id));
    setTotalMediaCount((prev) => Math.max(0, prev - 1));
  }

  function handleDownloadMediaItem(item: ChatMediaItem) {
    const link = document.createElement("a");
    if (item.type === "image" && item.dataUrl) {
      link.href = item.dataUrl;
      link.download = `superstudent_img_${item.senderUsername}_${Date.now()}.jpg`;
    } else if (item.url) {
      link.href = item.url;
      link.target = "_blank";
      link.download = item.fileName || `document_${Date.now()}.pdf`;
    } else if (item.dataUrl) {
      link.href = item.dataUrl;
      link.download = item.fileName || `document_${Date.now()}.pdf`;
    } else {
      return;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleRefresh() {
    setRefreshBusy(true);
    await loadStats();
    setRefreshBusy(false);
  }

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResult(null);
    setSavedFlash(false);
    let account: Account | null = null;
    if (q.includes("@")) {
      account = await getJSON<Account>(`account:${normEmail(q)}`, true);
    } else {
      const idx = await getJSON<{ email: string }>(
        `usernameIndex:${q.toLowerCase()}`,
        true
      );
      if (idx && idx.email)
        account = await getJSON<Account>(`account:${idx.email}`, true);
    }
    setSearching(false);
    if (account) {
      setResult(account);
      setPendingMods(account.moderatorRooms || []);
      setDelConfirm(false);
    } else {
      setResult("notfound");
    }
  }

  function toggleMod(roomId: string) {
    setPendingMods((prev) =>
      prev.includes(roomId) ? prev.filter((r) => r !== roomId) : [...prev, roomId]
    );
    setSavedFlash(false);
  }

  async function handleSaveMods() {
    if (!result || result === "notfound") return;
    setSavingMods(true);
    if (pendingMods.length > 0) {
      await promoteToModeratorRPC(result.email, pendingMods);
    } else {
      await demoteModeratorRPC(result.email);
    }
    const updated: Account = {
      ...result,
      moderatorRooms: pendingMods,
      role: pendingMods.length ? "moderator" : (result.role === "superadmin" ? "superadmin" : "member"),
    };
    setSavingMods(false);
    setResult(updated);
    setSavedFlash(true);
    await loadStats();
  }

  async function handleToggleBan(ms: number | null) {
    if (!result || result === "notfound" || isSelf) return;
    setBanBusy(true);
    const { success } = await banUserRPC(result.email, ms);
    setBanBusy(false);
    if (success) {
      const updated: Account = {
        ...result,
        banned: ms == null,
        bannedUntil: ms == null ? null : Date.now() + ms,
      };
      setResult(updated);
      try {
        await createNotification({
          title: {
            ar: "إشعار إداري: تقييد الحساب",
            fr: "Notification administrative : compte limité",
            en: "Administrative notice: account restricted",
          },
          message: {
            ar: ms == null
              ? `تم اتخاذ إجراء حظر دائم بحق الحساب @${result.username} بسبب مخالفة ضوابط الاستخدام.`
              : `تم تقييد حساب @${result.username} مؤقتاً لمدة ${Math.round(ms / 60000)} دقيقة.`,
            fr: ms == null
              ? `Le compte @${result.username} a été banni de manière permanente pour non-respect des règles.`
              : `Le compte @${result.username} a été suspendu temporairement pour ${Math.round(ms / 60000)} minutes.`,
            en: ms == null
              ? `Account @${result.username} has been permanently restricted.`
              : `Account @${result.username} has been temporarily restricted for ${Math.round(ms / 60000)} mins.`,
          },
          type: "moderation_ban",
          recipientRole: "all",
          targetEmail: result.email,
          iconType: "shield",
          badgeLabel: { ar: "إجراء إداري", fr: "Modération", en: "Moderation" },
        });
      } catch {
        // ignore
      }
      await loadStats();
    }
  }

  async function handleUnban() {
    if (!result || result === "notfound") return;
    setBanBusy(true);
    const { success } = await unbanUserRPC(result.email);
    setBanBusy(false);
    if (success) {
      const updated: Account = { ...result, banned: false, bannedUntil: null };
      setResult(updated);
      await loadStats();
    }
  }

  async function handleDeleteAccount() {
    if (!result || result === "notfound" || isSelf) return;
    await deleteUserAccountRPC(result.email);
    const presence =
      (await getJSON<Record<string, number>>("presence-registry", true)) || {};
    delete presence[result.email];
    await setJSON("presence-registry", presence, true);
    setResult(null);
    await loadStats();
  }

  function exportCsv() {
    const headers = ["Username", "DisplayName", "Email", "Role", "Branch", "Banned", "CreatedAt"];
    const rows = users.map((u) => [
      u.username,
      `"${u.displayName.replace(/"/g, '""')}"`,
      u.email,
      u.role,
      u.branch || "math",
      isAccountBanned(u) ? "YES" : "NO",
      new Date(u.createdAt || 0).toISOString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bacadmis_users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const isSelf =
    result && result !== "notfound" && result.email === user.email;
  const isBanned =
    result && result !== "notfound" && isAccountBanned(result);

  // Average Rating
  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
      : "5.0";

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${COLORS.bg0}, ${COLORS.bg1})`,
      }}
    >
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={t.adminTitle}
        accent={COLORS.gold}
        onBack={onBack}
        user={user}
        onLogout={onLogout}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="bac-scroll flex-1 px-4 py-5 overflow-y-auto flex flex-col gap-5 max-w-5xl mx-auto w-full">
        {/* Metric Cards (Comprehensive Live Platform KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            className="bac-card-shadow rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${COLORS.line}`,
            }}
          >
            <UsersIcon size={18} color={COLORS.accent} />
            <p className="text-2xl font-black mt-1 text-white">{totalUsers === null ? "…" : totalUsers}</p>
            <p className="text-[11px] text-slate-400">{t.totalUsers}</p>
          </div>

          <div
            className="bac-card-shadow rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${COLORS.line}`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mb-1" />
            <p className="text-2xl font-black text-white">{activeNow === null ? "…" : activeNow}</p>
            <p className="text-[11px] text-slate-400">{t.activeNow}</p>
          </div>

          <div
            className="bac-card-shadow rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${COLORS.line}`,
            }}
          >
            <ShieldCheck size={18} color={COLORS.gold} />
            <p className="text-2xl font-black text-white">{totalMods === null ? "…" : totalMods}</p>
            <p className="text-[11px] text-slate-400">{t.totalMods}</p>
          </div>

          <div
            className="bac-card-shadow rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${COLORS.line}`,
            }}
          >
            <Star size={18} className="text-amber-400 fill-amber-400" />
            <p className="text-2xl font-black text-amber-300">{avgRating} ⭐</p>
            <p className="text-[11px] text-slate-400">{lang === "ar" ? "رضا التلاميذ" : lang === "fr" ? "Note moyenne" : "Student rating"}</p>
          </div>

          <div
            className="bac-card-shadow rounded-2xl p-4 col-span-2 sm:col-span-1"
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${COLORS.line}`,
            }}
          >
            <FolderArchive size={18} className="text-violet-400" />
            <p className="text-2xl font-black text-white">{totalMediaCount}</p>
            <p className="text-[11px] text-slate-400">{lang === "ar" ? "ملفات وصور الأرشيف" : lang === "fr" ? "Fichiers et images" : "Archived files and images"}</p>
          </div>
        </div>

        {/* Mobile Navigation Picker (Visible on mobile/tablet portrait) */}
        <div className="block sm:hidden">
          <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
            {lang === "ar" ? "اختر قسم لوحة التحكم:" : lang === "fr" ? "Choisissez une section :" : "Choose a dashboard section:"}
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => {
                const tab = e.target.value as any;
                setActiveTab(tab);
                if (tab === "elite_apps") loadEliteApplicationsData();
                if (tab === "feedbacks") loadFeedbacksData();
                if (tab === "faqs_tab") loadAdminFaqs();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm outline-none focus:border-indigo-500 shadow-md"
            >
              <option value="users">{t.usersList} ({users.length})</option>
              <option value="elite_apps">{lang === "ar" ? "طلبات المساهمة والنخبة" : "Demandes de contribution"} ({eliteApps.filter(a => a.status === "pending").length})</option>
              <option value="feedbacks">{lang === "ar" ? "تقييمات وآراء التلاميذ (التواصل مع الإدارة)" : lang === "fr" ? "Avis et évaluations" : "Student feedback"} ({feedbacks.length})</option>
              <option value="faqs_tab">{lang === "ar" ? "إدارة الأسئلة الشائعة" : lang === "fr" ? "Gérer la FAQ" : "Manage FAQ"}</option>
            </select>
          </div>
        </div>

        {/* Desktop / Tablet Sub-Tabs Bar */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === "users" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            {t.usersList} ({users.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("elite_apps");
              loadEliteApplicationsData();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "elite_apps" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Award size={14} />
            <span>{lang === "ar" ? "طلبات المساهمة والنخبة" : "Demandes"}</span>
            {eliteApps.filter((a) => a.status === "pending").length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-purple-400 text-slate-950 font-bold">
                {eliteApps.filter((a) => a.status === "pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("feedbacks");
              loadFeedbacksData();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "feedbacks" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquareHeart size={14} />
            <span>{lang === "ar" ? "تقييمات وآراء التلاميذ" : lang === "fr" ? "Avis et évaluations" : "Student feedback"}</span>
            {feedbacks.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 font-mono text-white">
                {feedbacks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("faqs_tab");
              loadAdminFaqs();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "faqs_tab" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <HelpCircle size={14} />
            <span>{lang === "ar" ? "إدارة الأسئلة الشائعة" : lang === "fr" ? "Gestion de la FAQ" : "Manage FAQ"}</span>
            {adminFaqs.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 font-mono text-white">
                {adminFaqs.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Users & Moderation */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div>
              <div className="flex gap-2 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide px-1 flex-1 self-center text-slate-400">
                  {t.searchUser}
                </p>
                <button
                  onClick={handleRefresh}
                  className="bac-btn rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer bg-white/5 text-white"
                >
                  {refreshBusy ? <Spinner size={13} /> : <RefreshCw size={13} />}{" "}
                  {t.refresh}
                </button>
              </div>
              <div className="flex gap-2">
                <FieldShell icon={<Search size={15} color={COLORS.textSoft} />}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    dir="ltr"
                    placeholder={t.searchUser}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    className="flex-1 py-2.5 text-sm bg-transparent outline-none text-white min-w-0"
                  />
                </FieldShell>
                <button
                  onClick={handleSearch}
                  className="bac-btn rounded-xl px-4 cursor-pointer font-semibold text-sm text-white"
                  style={{ background: GRAD }}
                >
                  {searching ? <Spinner size={16} /> : t.searchBtn}
                </button>
              </div>
            </div>

            {result === "notfound" && (
              <div className="text-center text-sm py-4 text-slate-400">
                {t.noUserFound}
              </div>
            )}

            {result && result !== "notfound" && (
              <div
                className="bac-card-shadow bac-in rounded-3xl p-5"
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: `1px solid ${COLORS.line}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={result.avatar}
                    name={result.displayName}
                    colorSeed={result.username}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate text-white">
                      {result.displayName}{" "}
                      {isSelf && <span className="text-xs font-normal text-slate-400">({t.you})</span>}
                      {result.role === "superadmin" && (
                        <span className="text-xs font-normal ml-1 text-amber-400">· {t.superAdmin}</span>
                      )}
                      {result.role === "moderator" && (
                        <span className="text-xs font-normal ml-1 text-indigo-400">· {t.moderator}</span>
                      )}
                      {result.role === "elite_student" && (
                        <span className="text-xs font-normal ml-1 text-amber-400">· {lang === "ar" ? "تلميذ مساهم" : lang === "fr" ? "Élève contributeur" : "Student contributor"}</span>
                      )}
                      {result.canUpload && (
                        <span className="text-xs font-normal ml-1 text-emerald-400">· {lang === "ar" ? "مسموح له برفع الوثائق" : lang === "fr" ? "Autorisé à publier" : "Can publish documents"}</span>
                      )}
                    </p>
                    <p className="text-xs truncate text-slate-400" dir="ltr">
                      @{result.username} · {result.email}
                    </p>
                    <p className="text-xs mt-0.5 text-slate-400">
                      {lang === "ar" ? `الشعبة: ${result.branch || "رياضيات"}` : lang === "fr" ? `Filière : ${result.branch || "math"}` : `Study track: ${result.branch || "math"}`} · {formatDateTime(result.createdAt || 0, lang)}
                      {isBanned && (
                        <span className="ml-2 font-semibold text-red-400">
                          {t.banned}
                          {result.bannedUntil ? ` · ${t.banUntil} ${formatDateTime(result.bannedUntil, lang)}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {result.role === "superadmin" && !isSelf ? (
                  <div className="mt-3 flex gap-2">
                    <p className="text-xs rounded-lg px-3 py-2 bg-amber-400/10 text-amber-400 font-bold flex-1">
                      {t.superAdmin}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="text-xs self-center font-semibold text-slate-400">{t.banDuration}:</span>
                      {BAN_OPTS.map((o) => (
                        <button
                          key={o.key}
                          onClick={() => handleToggleBan(o.ms)}
                          disabled={banBusy}
                          className="bac-btn text-xs rounded-full px-2.5 py-1 font-semibold cursor-pointer"
                          style={{
                            background: isBanned ? "rgba(255,255,255,.08)" : "rgba(244,63,94,.14)",
                            color: isBanned ? COLORS.textSoft : "#FDA4AF",
                          }}
                        >
                          {t[o.key as keyof typeof t]}
                        </button>
                      ))}
                      {isBanned && (
                        <button
                          onClick={handleUnban}
                          disabled={banBusy}
                          className="bac-btn text-xs rounded-full px-2.5 py-1 font-semibold cursor-pointer flex items-center gap-1 bg-emerald-500/20 text-emerald-300"
                        >
                          <Check size={12} /> {t.unbanAction}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      {/* Teacher Role Toggle */}
                      <button
                        onClick={async () => {
                          const newRole = (result.role as string) === "teacher" ? "member" : "teacher";
                          const updated: Account = { ...result, role: newRole, canUpload: true };
                          const ok = await setJSON(`account:${result.email}`, updated, true);
                          if (ok) {
                            setResult(updated);
                            setUsers((prev) => prev.map((u) => (u.email === result.email ? updated : u)));
                          }
                        }}
                        className={`bac-btn flex-1 rounded-xl py-2 text-xs font-bold cursor-pointer min-w-[140px] border transition-all ${
                          (result.role as string) === "teacher"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {(result.role as string) === "teacher"
                          ? (lang === "ar" ? "👨‍🏫 أستاذ معتمد (إلغاء)" : "Enseignant (Retirer)")
                          : (lang === "ar" ? "👨‍🏫 ترقية إلى أستاذ معتمد" : "Promouvoir Enseignant")}
                      </button>

                      {/* Elite Student Role Toggle */}
                      <button
                        onClick={async () => {
                          const newRole = result.role === "elite_student" ? "member" : "elite_student";
                          const updated: Account = { ...result, role: newRole, canUpload: true };
                          const ok = await setJSON(`account:${result.email}`, updated, true);
                          if (ok) {
                            setResult(updated);
                            setUsers((prev) => prev.map((u) => (u.email === result.email ? updated : u)));
                          }
                        }}
                        className={`bac-btn flex-1 rounded-xl py-2 text-xs font-bold cursor-pointer min-w-[140px] border transition-all ${
                          result.role === "elite_student"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {result.role === "elite_student"
                          ? (lang === "ar" ? "⭐ تلميذ متميز (إلغاء)" : "Élève Élite (Retirer)")
                          : (lang === "ar" ? "⭐ ترقية إلى تلميذ متميز" : "Promouvoir Élève Élite")}
                      </button>

                      {/* Document Publishing Permission Toggle */}
                      <button
                        onClick={async () => {
                          const nextUpload = !result.canUpload;
                          const updated: Account = { ...result, canUpload: nextUpload };
                          const ok = await setJSON(`account:${result.email}`, updated, true);
                          if (ok) {
                            setResult(updated);
                            setUsers((prev) => prev.map((u) => (u.email === result.email ? updated : u)));
                          }
                        }}
                        className={`bac-btn flex-1 rounded-xl py-2 text-xs font-bold cursor-pointer min-w-[150px] border transition-all ${
                          result.canUpload
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {result.canUpload
                          ? (lang === "ar" ? "إلغاء إذن رفع الوثائق" : "Retirer l’autorisation de publier")
                          : (lang === "ar" ? "منح إذن رفع الوثائق والفروض" : "Autoriser la publication")}
                      </button>

                      {!isSelf && (
                        <button
                          onClick={async () => {
                            const newRole = result.role === "superadmin" ? "member" : "superadmin";
                            const updated: Account = { ...result, role: newRole };
                            const ok = await setJSON(`account:${result.email}`, updated, true);
                            if (ok) {
                              setResult(updated);
                              setUsers((prev) => prev.map((u) => (u.email === result.email ? updated : u)));
                            }
                          }}
                          className="bac-btn rounded-xl px-3 py-2 text-xs font-bold cursor-pointer bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        >
                          {result.role === "superadmin" ? "إلغاء المشرف الأعلى" : "تعيين مشرف أعلى / مالك"}
                        </button>
                      )}

                      {!isSelf &&
                        (delConfirm ? (
                          <>
                            <button
                              onClick={handleDeleteAccount}
                              className="bac-btn rounded-xl px-4 py-2 text-xs font-bold cursor-pointer bg-red-600 text-white"
                            >
                              {t.confirm}
                            </button>
                            <button
                              onClick={() => setDelConfirm(false)}
                              className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer bg-white/10 text-white"
                            >
                              {t.cancel}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDelConfirm(true)}
                            className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer bg-red-500/15 text-red-300"
                          >
                            <Trash2 size={12} /> {t.deleteAccount}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Users Registry List with Filters */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide px-1 flex items-center gap-1.5 text-slate-400">
                  <UsersIcon size={13} /> {t.usersList} ({users.length})
                </p>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[11px] overflow-x-auto">
                  {(["all", "superadmin", "teacher", "elite_student", "can_upload", "member", "banned"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserFilterRole(r as any)}
                      className={`px-2 py-1 rounded-lg font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                        userFilterRole === r ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {r === "all"
                        ? (lang === "ar" ? "الكل" : lang === "fr" ? "Tous" : "All")
                        : r === "teacher"
                        ? (lang === "ar" ? "أساتذة" : "Enseignants")
                        : r === "elite_student"
                        ? (lang === "ar" ? "تلاميذ متميزون" : "Élèves Élite")
                        : r === "member"
                        ? (lang === "ar" ? "تلاميذ عاديون" : "Élèves Standards")
                        : r === "can_upload"
                        ? (lang === "ar" ? "إذن النشر" : lang === "fr" ? "Publication" : "Publishing")
                        : r === "superadmin"
                        ? (lang === "ar" ? "مالك / مشرف" : "Propriétaire")
                        : r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {users
                  .filter((u) => {
                    if (userFilterRole === "all") return true;
                    if (userFilterRole === "banned") return isAccountBanned(u);
                    if (userFilterRole === "superadmin") return u.role === "superadmin";
                    if (userFilterRole === "moderator") return u.role === "moderator" || (u.moderatorRooms || []).length > 0;
                    if ((userFilterRole as string) === "elite_student") return u.role === "elite_student";
                    if ((userFilterRole as string) === "can_upload") return !!u.canUpload;
                    return u.role === "member";
                  })
                  .map((u) => {
                    const banned = isAccountBanned(u);
                    const isMod = u.role === "moderator" || (u.moderatorRooms || []).length > 0;
                    return (
                      <button
                        key={u.email}
                        onClick={() => {
                          setResult(u);
                          setPendingMods(u.moderatorRooms || []);
                          setDelConfirm(false);
                          setSavedFlash(false);
                        }}
                        className="bac-btn bac-in flex items-center gap-2.5 rounded-xl px-3 py-2 text-start cursor-pointer w-full"
                        style={{
                          background:
                            result && result !== "notfound" && result.email === u.email
                              ? "rgba(99,102,241,.16)"
                              : "rgba(255,255,255,.05)",
                          border: `1px solid ${
                            result && result !== "notfound" && result.email === u.email
                              ? "rgba(129,140,248,.5)"
                              : COLORS.line
                          }`,
                        }}
                      >
                        <Avatar src={u.avatar} name={u.displayName} colorSeed={u.username} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-white">{u.displayName}</p>
                          <p className="text-[11px] truncate text-slate-400" dir="ltr">
                            @{u.username} · {u.email} · {u.branch || "math"}
                          </p>
                        </div>
                        {u.role === "superadmin" && (
                          <Chip color={COLORS.gold} bg="rgba(251,191,36,.16)">
                            {lang === "ar" ? "👑 المالك والمشرف الأعلى" : "SuperAdmin"}
                          </Chip>
                        )}
                        {((u.role as string) === "teacher" || u.role === "moderator") && u.role !== "superadmin" && (
                          <Chip color="#A5B4FC" bg="rgba(99,102,241,.2)">
                            {lang === "ar" ? "👨‍🏫 أستاذ معتمد" : "Enseignant"}
                          </Chip>
                        )}
                        {u.role === "elite_student" && (
                          <Chip color="#FBBF24" bg="rgba(251,191,36,.15)">
                            {lang === "ar" ? "⭐ تلميذ متميز" : "Élève Élite"}
                          </Chip>
                        )}
                        {u.canUpload && u.role !== "superadmin" && (u.role as string) !== "teacher" && u.role !== "elite_student" && (
                          <Chip color="#34D399" bg="rgba(52,211,153,.15)">
                            {lang === "ar" ? "إذن النشر" : "Publication"}
                          </Chip>
                        )}
                        {banned && (
                          <Chip color="#FDA4AF" bg="rgba(244,63,94,.16)">
                            {t.banned}
                          </Chip>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Student Feedbacks & Ratings (تقييمات وآراء التلاميذ) */}
        {activeTab === "feedbacks" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquareHeart size={18} className="text-amber-400" />
                  <span>{lang === "ar" ? "تقييمات وملاحظات التلاميذ (المشرف الأعلى)" : "Évaluations et Avis des Élèves"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "تصل هنا مباشرة جميع تقييمات التلاميذ للمنصة والمساعد الذكي BacAdmis.ai والغرف."
                    : "Tous les retours et notes des élèves arrivent directement dans cet espace d'administration."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadFeedbacksData}
                  disabled={loadingFeedbacks}
                  className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/15 text-white"
                >
                  {loadingFeedbacks ? <Spinner size={13} /> : <RefreshCw size={13} />}
                  <span>{t.refresh}</span>
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold">{lang === "ar" ? "التصنيف:" : "Catégorie :"}</span>
              {[
                { id: "all", label: lang === "ar" ? "الكل" : "Tous" },
                { id: "ai_assistant", label: lang === "ar" ? "المساعد الذكي" : "Tuteur AI" },
                { id: "rooms", label: lang === "ar" ? "الغرف والملفات" : "Salons" },
                { id: "general", label: lang === "ar" ? "المنصة العامة" : "Plateforme" },
                { id: "suggestion", label: lang === "ar" ? "اقتراحات" : "Suggestions" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFeedbackCategoryFilter(c.id)}
                  className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                    feedbackCategoryFilter === c.id
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Feedback List */}
            {loadingFeedbacks ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Spinner size={28} />
                <p className="text-xs font-semibold">{lang === "ar" ? "جارٍ تحميل التقييمات..." : lang === "fr" ? "Chargement…" : "Loading feedback…"}</p>
              </div>
            ) : (
              (() => {
                const filtered = feedbacks.filter(
                  (f) => feedbackCategoryFilter === "all" || f.category === feedbackCategoryFilter
                );

                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 bg-white/5 rounded-2xl border border-white/10">
                      <Star size={36} className="text-slate-600" />
                      <p className="text-xs font-medium">
                        {lang === "ar" ? "لا توجد تقييمات في هذا التصنيف حاليًا." : lang === "fr" ? "Aucun avis dans cette catégorie pour le moment." : "No feedback in this category yet."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3 relative hover:border-amber-400/40 transition-all shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar src={fb.avatar} name={fb.displayName} colorSeed={fb.username} size={30} />
                              <div>
                                <p className="text-xs font-bold text-white leading-tight">{fb.displayName}</p>
                                <p className="text-[10px] text-slate-400">
                                  @{fb.username} • {fb.branch || "Math"}
                                </p>
                              </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={12}
                                  className={s <= fb.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                                />
                              ))}
                              <span className="text-[11px] font-bold text-amber-400 ml-1">{fb.rating}/5</span>
                            </div>
                          </div>

                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                            {fb.category === "ai_assistant"
                              ? "المساعد الذكي"
                              : fb.category === "rooms"
                              ? "الغرف والمحادثات"
                              : fb.category === "suggestion"
                              ? "اقتراح تلميذ"
                              : "تجربة المنصة"}
                          </span>

                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-black/20 p-2.5 rounded-xl border border-white/5">
                            "{fb.comment}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
                          <span>{formatDateTime(fb.createdAt, lang)}</span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleResolveFb(fb)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors flex items-center gap-1 ${
                                fb.resolved
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              }`}
                            >
                              {fb.resolved ? <Check size={11} /> : <Clock size={11} />}
                              <span>{fb.resolved ? (lang === "ar" ? "تمت المعالجة" : lang === "fr" ? "Traité" : "Resolved") : (lang === "ar" ? "قيد المتابعة" : lang === "fr" ? "En cours" : "In progress")}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteFb(fb.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TAB: Contributor & Elite Applications (طلبات المساهمة والنخبة) */}
        {activeTab === "elite_apps" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-purple-400" />
                  <span>{lang === "ar" ? "طلبات الانضمام والمساهمة (النخبة وهيئة التدريس)" : "Demandes de contribution & élite"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "تصل هنا جميع طلبات التلاميذ والأساتذة للمساهمة ورفع الملفات، مع إمكانية الترقية التلقائية أو الرفض بنقرة واحدة."
                    : "Passez en revue les candidatures pour rejoindre le rang d'élève d'élite ou enseignant."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadEliteApplicationsData}
                  disabled={loadingEliteApps}
                  className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/15 text-white"
                >
                  <RefreshCw size={13} className={loadingEliteApps ? "animate-spin" : ""} />
                  <span>{t.refresh || (lang === "ar" ? "تحديث" : "Actualiser")}</span>
                </button>
              </div>
            </div>

            {loadingEliteApps ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Spinner size={28} />
                <p className="text-xs font-semibold">{lang === "ar" ? "جارٍ تحميل الطلبات..." : "Chargement des demandes..."}</p>
              </div>
            ) : eliteApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 bg-white/5 rounded-2xl border border-white/10">
                <Award size={36} className="text-slate-600" />
                <p className="text-xs font-medium">
                  {lang === "ar" ? "لا توجد أي طلبات مساهمة مسجلة حاليًا." : "Aucune demande de contribution enregistrée."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {eliteApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3 relative hover:border-purple-400/40 transition-all shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar src="" name={app.displayName} colorSeed={app.username} size={34} />
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{app.displayName || app.username}</p>
                            <p className="text-[11px] text-slate-400" dir="ltr">@{app.username} • {app.email}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            app.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : app.status === "rejected"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          }`}
                        >
                          {app.status === "approved"
                            ? (lang === "ar" ? "معتمد ✓" : "Approuvé")
                            : app.status === "rejected"
                            ? (lang === "ar" ? "مرفوض ✕" : "Refusé")
                            : (lang === "ar" ? "قيد المراجعة ⏳" : "En attente")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[11px] mb-2 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                          {lang === "ar" ? "الرتبة المطلوبة:" : "Rôle:"}{" "}
                          <strong className="text-purple-300">
                            {((app.applicantRole as string) || (app.roleRequested as string)) === "professor" || ((app.applicantRole as string) || (app.roleRequested as string)) === "teacher"
                              ? (lang === "ar" ? "أستاذ (Enseignant)" : "Enseignant")
                              : (lang === "ar" ? "تلميذ متميز / مساهم" : "Élève d'élite")}
                          </strong>
                        </span>
                        {app.discordUsername && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                            Discord: <strong>{app.discordUsername}</strong>
                          </span>
                        )}
                        {app.branch && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            {lang === "ar" ? "الشعبة:" : "Section:"} <strong className="text-indigo-300">{app.branch}</strong>
                          </span>
                        )}
                        {app.averageScore && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            {lang === "ar" ? "المعدل:" : "Moyenne:"} <strong className="text-amber-300">{app.averageScore}/20</strong>
                          </span>
                        )}
                      </div>

                      {(app.reason || app.statement) && (
                        <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5 whitespace-pre-wrap mb-2">
                          {app.reason || app.statement}
                        </p>
                      )}

                      {/* Proof Image attached by applicant */}
                      {app.proofImageUrl && (
                        <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                          <p className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                            <span>📷 {lang === "ar" ? "وثيقة الإثبات المرفقة من المترشح (شهادة / كشف أعداد):" : "Preuve jointe :"}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setProofViewer({ src: app.proofImageUrl as string, title: app.displayName || app.username })}
                            className="block w-full text-start rounded-lg overflow-hidden border border-purple-500/40 group relative cursor-zoom-in"
                          >
                            <img
                              src={app.proofImageUrl}
                              alt="Proof"
                              className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                              <span>🔍 {lang === "ar" ? "انقر للفتح بالحجم الكامل" : "Ouvrir l'image"}</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                      <span>{new Date(app.submittedAt || Date.now()).toLocaleDateString(lang === "ar" ? "ar-TN" : "fr-FR")}</span>

                      <div className="flex items-center gap-1.5">
                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleReviewEliteApp(app, "approved")}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors shadow flex items-center gap-1"
                            >
                              <Check size={12} />
                              <span>{lang === "ar" ? "قبول وترقية" : "Accepter"}</span>
                            </button>
                            <button
                              onClick={() => handleReviewEliteApp(app, "rejected")}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors shadow flex items-center gap-1"
                            >
                              <X size={12} />
                              <span>{lang === "ar" ? "رفض" : "Refuser"}</span>
                            </button>
                          </>
                        )}
                        {app.status !== "pending" && (
                          <span className="text-slate-400 text-[11px]">
                            {app.reviewedBy ? `${lang === "ar" ? "بواسطة:" : "Par:"} ${app.reviewedBy}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FAQs Management (إدارة وتنزيل الأسئلة الشائعة) */}
        {activeTab === "faqs_tab" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle size={18} className="text-blue-400" />
                  <span>{lang === "ar" ? "إدارة الأسئلة الشائعة" : lang === "fr" ? "Gestion de la FAQ" : "Manage frequently asked questions"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "صلاحية حصرية للمشرف الأعلى والمشرفين لإضافة وتعديل وحذف الأسئلة، وتظهر للتلاميذ فوراً بنفس التنسيق التفاعلي."
                    : "Ajoutez, modifiez ou supprimez les questions officielles affichées aux élèves."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAdminFaqs}
                  disabled={loadingAdminFaqs}
                  className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/15 text-white"
                >
                  <RefreshCw size={13} className={loadingAdminFaqs ? "animate-spin" : ""} />
                  <span>{t.refresh || (lang === "ar" ? "تحديث" : lang === "fr" ? "Actualiser" : "Refresh")}</span>
                </button>

                <button
                  onClick={() => {
                    setEditingAdminFaqId(null);
                    setFaqQ("");
                    setFaqA("");
                    setFaqCat("عام");
                    setShowFaqModal(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-md flex items-center gap-1.5"
                >
                  <PlusCircle size={14} />
                  <span>{lang === "ar" ? "إضافة سؤال جديد" : lang === "fr" ? "Ajouter une question" : "Add question"}</span>
                </button>
              </div>
            </div>

            {loadingAdminFaqs ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {lang === "ar" ? "جارٍ تحميل الأسئلة الشائعة…" : lang === "fr" ? "Chargement de la FAQ…" : "Loading FAQ…"}
              </div>
            ) : adminFaqs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs flex flex-col items-center gap-2">
                <HelpCircle size={32} className="text-slate-500" />
                <p>
                  {lang === "ar"
                    ? "لا توجد أي أسئلة شائعة مسجلة حالياً. اضغط على الزر أعلاه لإضافة أول سؤال."
                    : "Aucune question enregistrée pour le moment."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminFaqs.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {item.category || "عام"}
                          </span>
                          <h4 className="text-sm font-bold text-white">{item.question}</h4>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                          {item.answer}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingAdminFaqId(item.id);
                            setFaqQ(item.question);
                            setFaqA(item.answer);
                            setFaqCat(item.category || "عام");
                            setShowFaqModal(true);
                          }}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-300 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleAdminDeleteFaq(item.id)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      <span>{item.authorEmail ? `الكاتب: ${item.authorEmail} (${item.authorRole || "mod"})` : "المشرف"}</span>
                      <span>{formatDateTime(item.createdAt, lang)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin FAQ Modal */}
            {showFaqModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="max-w-lg w-full bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle size={18} className="text-blue-400" />
                      <h3 className="text-base font-black text-white">
                        {editingAdminFaqId
                          ? lang === "ar" ? "تعديل السؤال الشائع" : lang === "fr" ? "Modifier la question" : "Edit question"
                          : lang === "ar" ? "إضافة سؤال شائع جديد" : lang === "fr" ? "Ajouter une question" : "Add question"}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowFaqModal(false)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleAdminSaveFaq} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "نص السؤال *" : lang === "fr" ? "Question *" : "Question *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={faqQ}
                        onChange={(e) => setFaqQ(e.target.value)}
                        placeholder={lang === "ar" ? "مثال: كيفية احتساب معدل الباكالوريا؟" : lang === "fr" ? "Ex. : Comment calculer la moyenne du bac ?" : "e.g. How is the baccalaureate average calculated?"}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "التصنيف" : lang === "fr" ? "Catégorie" : "Category"}
                      </label>
                      <input
                        type="text"
                        value={faqCat}
                        onChange={(e) => setFaqCat(e.target.value)}
                        placeholder="عام، الامتحانات، المنهاج"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "الإجابة النموذجية والتفصيلية *" : lang === "fr" ? "Réponse *" : "Answer *"}
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={faqA}
                        onChange={(e) => setFaqA(e.target.value)}
                        placeholder={lang === "ar" ? "اكتب الإجابة الكاملة والتفصيلية..." : lang === "fr" ? "Rédigez votre réponse…" : "Write the full answer…"}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowFaqModal(false)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        disabled={savingAdminFaq}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-lg"
                      >
                        {savingAdminFaq
                          ? lang === "ar" ? "جارٍ الحفظ…" : lang === "fr" ? "Enregistrement…" : "Saving…"
                          : lang === "ar" ? "حفظ السؤال" : lang === "fr" ? "Enregistrer la question" : "Save question"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Homepage Announcements Management (إعلانات الصفحة الرئيسية 12-72 ساعة) */}
        {activeTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-amber-400" />
                  <h3 className="text-sm font-black text-white">
                    {lang === "ar" ? "إدارة إعلانات ورسائل الصفحة الرئيسية" : lang === "fr" ? "Gestion des annonces de l’accueil" : "Manage home announcements"}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "رسائل المشرف الأعلى التي تظهر في الصفحة الرئيسية مع اختيار الفئة المستهدفة، الشعب، والمدة (12 - 72 ساعة)."
                    : lang === "fr" ? "Annonces ciblées par rôle et filière, visibles de 12 à 72 heures." : "Announcements targeted by role and study track, visible for 12–72 hours."}
                </p>
              </div>

              <button
                onClick={() => {
                  setAnnFormError("");
                  setAnnTitleAr("");
                  setAnnTitleFr("");
                  setAnnTitleEn("");
                  setAnnMessageAr("");
                  setAnnMessageFr("");
                  setAnnMessageEn("");
                  setAnnTargetRoles(["all"]);
                  setAnnTargetBranches(["all"]);
                  setAnnDurationHours(24);
                  setAnnStyle("gold");
                  setAnnBadge("إعلان إداري رسمي");
                  setShowCreateAnnModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <PlusCircle size={16} />
                <span>{lang === "ar" ? "نشر إعلان جديد في الرئيسية" : lang === "fr" ? "Créer une annonce" : "Create announcement"}</span>
              </button>
            </div>

            {loadingAnnouncements ? (
              <div className="flex items-center justify-center py-16">
                <Spinner size={30} />
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 bg-white/5 rounded-2xl border border-white/10">
                <Megaphone size={36} className="text-slate-600" />
                <p className="text-xs font-medium">
                  {lang === "ar" ? "لا توجد إعلانات منشورة حاليًا." : lang === "fr" ? "Aucune annonce active." : "No active announcements."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => {
                  const isExpired = ann.expiresAt <= Date.now();
                  const remainingMs = ann.expiresAt - Date.now();
                  const remainingH = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
                  const remainingM = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

                  const titleText =
                      typeof ann.title === "object"
                       ? ann.title[lang] || (lang === "en" ? "Announcement" : ann.title.ar || "")
                      : ann.title;
                  const messageText =
                      typeof ann.message === "object"
                       ? ann.message[lang] || (lang === "en" ? "No announcement text is available in English." : ann.message.ar || "")
                      : ann.message;
                  const badgeText =
                      typeof ann.badge === "object"
                       ? ann.badge[lang] || (lang === "en" ? "Announcement" : ann.badge.ar || "")
                       : ann.badge || (lang === "ar" ? "إعلان رسمي" : lang === "fr" ? "Annonce officielle" : "Official announcement");

                  return (
                    <div
                      key={ann.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        ann.isActive && !isExpired
                          ? "bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-500/5"
                          : "bg-slate-900/50 border-white/10 opacity-75"
                      }`}
                    >
                      {/* Top Row: Badge, Status, Remaining, Actions */}
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {badgeText}
                          </span>

                          {ann.isActive && !isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>{lang === "ar" ? "يظهر في الرئيسية الآن" : lang === "fr" ? "Visible sur l’accueil" : "Visible on home"}</span>
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {lang === "ar" ? "منتهي الصلاحية" : lang === "fr" ? "Expiré" : "Expired"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              {lang === "ar" ? "متوقف مؤقتًا" : lang === "fr" ? "Désactivé" : "Paused"}
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                            <Clock size={12} />
                            <span>
                              {isExpired
                                ? (lang === "ar" ? "انتهت المدة" : lang === "fr" ? "Terminé" : "Ended")
                                : (lang === "ar" ? `متبقي: ${remainingH} ساعة و ${remainingM} دقيقة` : lang === "fr" ? `Reste ${remainingH} h ${remainingM} min` : `${remainingH} hr ${remainingM} min left`)}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAnn(ann.id, ann.isActive)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                              ann.isActive
                                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {ann.isActive ? (lang === "ar" ? "إيقاف العرض" : lang === "fr" ? "Désactiver" : "Pause") : (lang === "ar" ? "تفعيل العرض" : lang === "fr" ? "Activer" : "Activate")}
                          </button>

                          <button
                            onClick={() => handleDeleteAnn(ann.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                            title={lang === "ar" ? "حذف الإعلان" : lang === "fr" ? "Supprimer l’annonce" : "Delete announcement"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Title & Message */}
                      <div className="space-y-1.5 mb-3">
                        <h4 className="font-extrabold text-sm sm:text-base text-white">{titleText}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-black/20 p-3 rounded-xl border border-white/5">
                          {messageText}
                        </p>
                      </div>

                      {/* Targeting Details */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 flex-wrap gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span>
                            {lang === "ar" ? "الفئات المستهدفة: " : lang === "fr" ? "Rôles : " : "Target roles: "}
                            <strong className="text-slate-200 font-semibold">
                              {ann.targetRoles.includes("all")
                                ? (lang === "ar" ? "الجميع (الكل)" : lang === "fr" ? "Tous" : "Everyone")
                                : ann.targetRoles.join(", ")}
                            </strong>
                          </span>

                          <span>•</span>

                          <span>
                            {lang === "ar" ? "الشعب المستهدفة: " : lang === "fr" ? "Filières : " : "Study tracks: "}
                            <strong className="text-slate-200 font-semibold">
                              {ann.targetBranches.includes("all")
                                ? (lang === "ar" ? "جميع الشعب" : lang === "fr" ? "Toutes" : "All")
                                : ann.targetBranches.map((bId) => BRANCHES.find((b) => b.id === bId)?.mono[lang] || bId).join(", ")}
                            </strong>
                          </span>

                          <span>•</span>

                          <span>
                            {lang === "ar" ? "المدة الإجمالية: " : lang === "fr" ? "Durée : " : "Duration: "}
                            <strong className="text-slate-200 font-semibold">{ann.durationHours} {lang === "ar" ? "ساعة" : lang === "fr" ? "h" : "hr"}</strong>
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-500">
                          {formatDateTime(ann.createdAt, lang)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━ SECTION: PUBLIC SUPER ANNOUNCEMENTS & LIVE CLASSES ━━━━━━━━━━━━━━━━━━━━ */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio size={18} className="text-emerald-400" />
                    <span>{lang === "ar" ? "إعلانات المنصة والحصص المباشرة (فضاء الإعلانات)" : "Annonces & Classes en direct"}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === "ar"
                      ? "إدارة وحذف الحصص المباشرة، التنبيهات، وبلاغات الأساتذة والتلاميذ المتميزين."
                      : "Gérer et supprimer les classes en direct, alertes et astuces."}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-300">
                  {superAnnouncements.length} {lang === "ar" ? "منشور" : "posts"}
                </span>
              </div>

              {superAnnouncements.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400">
                  {lang === "ar" ? "لا توجد منشورات في فضاء الإعلانات حاليًا." : "Aucune publication."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {superAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col justify-between gap-3 shadow-md hover:border-amber-500/30 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/10 text-white">
                            <span>
                              {item.type === "live_class"
                                ? "🎓 حصة مباشرة"
                                : item.type === "alert"
                                ? "⚠️ تنبيه"
                                : item.type === "announcement"
                                ? "📢 إعلان"
                                : "💡 نصيحة"}
                            </span>
                          </span>

                          <button
                            onClick={() => handleDeleteSuperAnn(item.id)}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer"
                            title={lang === "ar" ? "حذف نهائي بصفتك المشرف" : "Supprimer"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {item.title && (
                          <h4 className="text-xs font-black text-white line-clamp-1">{item.title}</h4>
                        )}

                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-lg">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <Avatar src={item.authorAvatar} name={item.authorDisplayName} colorSeed={item.authorUsername} size={18} />
                          <span className="font-bold text-slate-200 truncate">{item.authorDisplayName || item.authorUsername}</span>
                          <span className="text-[9px] text-slate-500">({item.authorRole})</span>
                        </div>
                        <span>{formatDateTime(item.createdAt, lang)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Announcement Modal */}
            {showCreateAnnModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
                <div className="max-w-2xl w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 bac-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                        <Megaphone size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">
                        {lang === "ar" ? "إنشاء إعلان جديد للصفحة الرئيسية" : lang === "fr" ? "Créer une annonce pour l’accueil" : "Create a home announcement"}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {lang === "ar" ? "يظهر الإعلان للمستخدمين المحددين خلال المدة المختارة." : lang === "fr" ? "L’annonce sera visible par les personnes choisies pendant la durée définie." : "The announcement will appear to selected users for the chosen duration."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateAnnModal(false)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {annFormError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>{annFormError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateAnnSubmit} className="space-y-4 text-xs text-slate-200">
                    {/* Badge / Tag Selection */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">
                        {lang === "ar" ? "شارة الإعلان" : lang === "fr" ? "Libellé de l’annonce" : "Announcement label"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ANNOUNCEMENT_BADGES.map((badge) => (
                          <button
                            type="button"
                            key={badge.en}
                            onClick={() => setAnnBadge(badge.ar)}
                            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                              annBadge === badge.ar
                                ? "bg-amber-500 text-slate-950 font-black shadow"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {badge[lang]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title (Arabic) */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">
                        {lang === "ar" ? "عنوان الإعلان بالعربية *" : lang === "fr" ? "Titre de l’annonce en arabe *" : "Announcement title in Arabic *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={annTitleAr}
                        onChange={(e) => setAnnTitleAr(e.target.value)}
                        placeholder={lang === "ar" ? "مثال: انطلاق مراجعة مادة الرياضيات للدورة الرئيسية" : lang === "fr" ? "Le titre en arabe" : "Arabic title"}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">{lang === "ar" ? "عنوان الإعلان بالفرنسية *" : lang === "fr" ? "Titre de l’annonce en français *" : "Announcement title in French *"}</label>
                      <input type="text" required value={annTitleFr} onChange={(e) => setAnnTitleFr(e.target.value)} placeholder={lang === "fr" ? "Titre en français" : lang === "en" ? "French title" : "العنوان بالفرنسية"} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">{lang === "ar" ? "عنوان الإعلان بالإنجليزية *" : lang === "fr" ? "Titre de l’annonce en anglais *" : "Announcement title in English *"}</label>
                      <input type="text" required value={annTitleEn} onChange={(e) => setAnnTitleEn(e.target.value)} placeholder={lang === "en" ? "English title" : lang === "fr" ? "Titre en anglais" : "العنوان بالإنجليزية"} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
                    </div>

                    {/* Message (Arabic) */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">
                        {lang === "ar" ? "نص الإعلان بالعربية *" : lang === "fr" ? "Texte de l’annonce en arabe *" : "Announcement text in Arabic *"}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={annMessageAr}
                        onChange={(e) => setAnnMessageAr(e.target.value)}
                        placeholder={lang === "ar" ? "اكتب نص الإعلان بالعربية..." : lang === "fr" ? "Texte en arabe" : "Arabic announcement text"}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">{lang === "ar" ? "نص الإعلان بالفرنسية *" : lang === "fr" ? "Texte de l’annonce en français *" : "Announcement text in French *"}</label>
                      <textarea required rows={3} value={annMessageFr} onChange={(e) => setAnnMessageFr(e.target.value)} placeholder={lang === "fr" ? "Texte en français" : lang === "en" ? "French announcement text" : "نص الإعلان بالفرنسية"} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">{lang === "ar" ? "نص الإعلان بالإنجليزية *" : lang === "fr" ? "Texte de l’annonce en anglais *" : "Announcement text in English *"}</label>
                      <textarea required rows={3} value={annMessageEn} onChange={(e) => setAnnMessageEn(e.target.value)} placeholder={lang === "en" ? "English announcement text" : lang === "fr" ? "Texte en anglais" : "نص الإعلان بالإنجليزية"} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed" />
                    </div>

                    {/* Duration Selection (12 to 72 Hours) */}
                    <div className="space-y-1.5 bg-slate-800/50 p-3.5 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-400" />
                          <span>{lang === "ar" ? "مدة بقاء الإعلان (12 إلى 72 ساعة) *" : lang === "fr" ? "Durée d’affichage (12 à 72 heures) *" : "Display duration (12–72 hours) *"}</span>
                        </label>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                          {annDurationHours} {lang === "ar" ? "ساعة" : lang === "fr" ? "heures" : "hours"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {[12, 24, 36, 48, 72].map((hrs) => (
                          <button
                            type="button"
                            key={hrs}
                            onClick={() => setAnnDurationHours(hrs)}
                            className={`flex-1 py-1.5 rounded-xl font-bold font-mono text-xs cursor-pointer transition-all ${
                              annDurationHours === hrs
                                ? "bg-amber-500 text-slate-950 font-black shadow-md"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            {hrs}h
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target Roles */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">
                        {lang === "ar" ? "الفئات المستهدفة بالإعلان *" : lang === "fr" ? "Rôles ciblés *" : "Target roles *"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "all", ar: "الجميع", fr: "Tout le monde", en: "Everyone" },
                          { id: "member", ar: "التلاميذ", fr: "Élèves", en: "Students" },
                          { id: "elite_student", ar: "المساهمون", fr: "Contributeurs", en: "Contributors" },
                          { id: "moderator", ar: "المشرفون", fr: "Modérateurs", en: "Moderators" },
                        ].map((roleObj) => {
                          const active = annTargetRoles.includes(roleObj.id);
                          return (
                            <button
                              type="button"
                              key={roleObj.id}
                              onClick={() => {
                                if (roleObj.id === "all") {
                                  setAnnTargetRoles(["all"]);
                                } else {
                                  let next = annTargetRoles.filter((r) => r !== "all");
                                  if (active) {
                                    next = next.filter((r) => r !== roleObj.id);
                                    if (next.length === 0) next = ["all"];
                                  } else {
                                    next.push(roleObj.id);
                                  }
                                  setAnnTargetRoles(next);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer border transition-all ${
                                active
                                  ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                              }`}
                            >
                              {roleObj[lang]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Branches */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">
                        {lang === "ar" ? "الشعب المستهدفة بالإعلان *" : lang === "fr" ? "Filières ciblées *" : "Target study tracks *"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAnnTargetBranches(["all"])}
                          className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer border transition-all ${
                            annTargetBranches.includes("all")
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                          }`}
                        >
                          {lang === "ar" ? "جميع الشعب" : lang === "fr" ? "Toutes les filières" : "All study tracks"}
                        </button>
                        {BRANCHES.map((b) => {
                          const active = annTargetBranches.includes(b.id);
                          return (
                            <button
                              type="button"
                              key={b.id}
                              onClick={() => {
                                let next = annTargetBranches.filter((x) => x !== "all");
                                if (active) {
                                  next = next.filter((x) => x !== b.id);
                                  if (next.length === 0) next = ["all"];
                                } else {
                                  next.push(b.id);
                                }
                                setAnnTargetBranches(next);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer border transition-all ${
                                active
                                  ? "bg-indigo-600/40 text-indigo-200 border-indigo-500 font-bold"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                              }`}
                            >
                              {b.name[lang]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Style Theme */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">
                        {lang === "ar" ? "المظهر اللوني للإعلان" : lang === "fr" ? "Thème de l’annonce" : "Announcement theme"}
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { id: "gold", label: { ar: "ذهبي", fr: "Doré", en: "Gold" }, color: "#F59E0B" },
                          { id: "emerald", label: { ar: "زمردي", fr: "Émeraude", en: "Emerald" }, color: "#10B981" },
                          { id: "indigo", label: { ar: "نيلي", fr: "Indigo", en: "Indigo" }, color: "#6366F1" },
                          { id: "rose", label: { ar: "وردي", fr: "Rose", en: "Rose" }, color: "#F43F5E" },
                          { id: "cyan", label: { ar: "سماوي", fr: "Cyan", en: "Cyan" }, color: "#06B6D4" },
                        ].map((th) => (
                          <button
                            type="button"
                            key={th.id}
                            onClick={() => setAnnStyle(th.id as any)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                              annStyle === th.id
                                ? "bg-white/10 text-white border-white shadow"
                                : "bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
                            }`}
                          >
                            <span style={{ color: th.color }} className="mr-1">●</span>
                            <span>{th.label[lang]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowCreateAnnModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                      >
                        {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        disabled={savingAnn}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-white font-black cursor-pointer shadow-lg"
                      >
                        {savingAnn
                          ? (lang === "ar" ? "جارٍ النشر…" : lang === "fr" ? "Publication…" : "Publishing…")
                          : (lang === "ar" ? "نشر الإعلان في الرئيسية" : lang === "fr" ? "Publier l’annonce" : "Publish announcement")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Chat Media & Files Vault (الأرشيف الشامل للصور والملفات) */}
        {activeTab === "media" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderArchive size={18} className="text-violet-400" />
                  <span>{lang === "ar" ? "أرشيف وسائط غرف المحادثة" : lang === "fr" ? "Archives des médias des salons" : "Chat room media archive"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "ar"
                    ? "جميع الصور وملفات PDF المرسلة داخل غرف المحادثات — تُحذف الوثائق تلقائياً بعد أسبوعين (14 يوماً) لتفريغ مساحة التخزين."
                    : lang === "fr" ? "Les fichiers et images partagés dans les salons sont supprimés après 14 jours." : "Files and images shared in rooms are removed after 14 days."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const res = await purgeExpiredMediaVault();
                    await loadMediaVault();
                    if (res.purgedCount > 0) {
                      alert(
                        lang === "ar"
                          ? `تم تنظيف وتفريغ ${res.purgedCount} ملف وصورة قديمة تعدت أسبوعين بنجاح!`
                          : lang === "fr" ? `${res.purgedCount} fichiers expirés ont été supprimés.` : `${res.purgedCount} expired files were deleted.`
                      );
                    }
                  }}
                  disabled={loadingMedia}
                  className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30"
                  title={lang === "ar" ? "حذف الملفات الأقدم من 14 يومًا" : lang === "fr" ? "Supprimer les fichiers de plus de 14 jours" : "Delete files older than 14 days"}
                >
                  <span>{lang === "ar" ? "حذف الملفات الأقدم من 14 يومًا" : lang === "fr" ? "Supprimer les fichiers de plus de 14 jours" : "Delete files older than 14 days"}</span>
                </button>

                <button
                  onClick={loadMediaVault}
                  disabled={loadingMedia}
                  className="bac-btn rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/15 text-white"
                >
                  {loadingMedia ? <Spinner size={13} /> : <RefreshCw size={13} />}
                  <span>{t.refresh}</span>
                </button>
              </div>
            </div>

            {/* Auto-cleanup policy banner */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs text-violet-200">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
              <span>
                {lang === "ar"
                  ? "سياسة التخزين: تُحذف رسائل الغرف بعد 5 أيام وملفات الوسائط بعد 14 يومًا."
                  : lang === "fr" ? "Conservation : les messages des salons sont supprimés après 5 jours et les fichiers multimédias après 14 jours."
                  : "Retention: room messages are deleted after 5 days and media files after 14 days."}
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setMediaFilterType("all")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mediaFilterType === "all" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {lang === "ar" ? "الكل" : lang === "fr" ? "Tous" : "All"} ({mediaList.length})
                </button>
                <button
                  onClick={() => setMediaFilterType("image")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    mediaFilterType === "image" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ImageIcon size={12} />
                  <span>{lang === "ar" ? "صور" : lang === "fr" ? "Images" : "Images"} ({mediaList.filter((m) => m.type === "image").length})</span>
                </button>
                <button
                  onClick={() => setMediaFilterType("pdf")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    mediaFilterType === "pdf" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText size={12} />
                  <span>{lang === "ar" ? "ملفات PDF" : lang === "fr" ? "Fichiers PDF" : "PDF files"} ({mediaList.filter((m) => m.type === "pdf").length})</span>
                </button>
              </div>

              {/* Room Filter */}
              <select
                value={mediaFilterRoom}
                onChange={(e) => setMediaFilterRoom(e.target.value)}
                className="bg-white/5 border border-white/10 text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  {lang === "ar" ? "كل غرف المحادثة" : lang === "fr" ? "Tous les salons" : "All rooms"}
                </option>
                {UNIQUE_ROOMS.map((r) => {
                  const s = SUBJECTS[r.subject];
                  const label = s ? (s.name[lang] || s.name.ar) : r.roomId;
                  return (
                    <option key={r.roomId} value={r.roomId} className="bg-slate-900 text-white">
                      {label} ({r.roomId})
                    </option>
                  );
                })}
              </select>

              {/* Search Query */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === "ar" ? "بحث باسم الطالب أو الملف..." : lang === "fr" ? "Rechercher un élève ou un fichier…" : "Search by student or file…"}
                  value={mediaSearchQuery}
                  onChange={(e) => setMediaSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full placeholder:text-slate-500"
                />
                {mediaSearchQuery && (
                  <button onClick={() => setMediaSearchQuery("")} className="text-slate-400 hover:text-white text-xs">
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Media Items List */}
            {(() => {
              const q = mediaSearchQuery.trim().toLowerCase();
              const filtered = mediaList.filter((item) => {
                if (mediaFilterType !== "all" && item.type !== mediaFilterType) return false;
                if (mediaFilterRoom !== "all" && item.roomId !== mediaFilterRoom) return false;
                if (q) {
                  const matchUser = (item.senderUsername || "").toLowerCase().includes(q);
                  const matchDisplay = (item.senderDisplayName || "").toLowerCase().includes(q);
                  const matchRoom = (item.roomTitle || item.roomId || "").toLowerCase().includes(q);
                  const matchFile = (item.fileName || "").toLowerCase().includes(q);
                  const matchText = (item.textSnippet || "").toLowerCase().includes(q);
                  if (!matchUser && !matchDisplay && !matchRoom && !matchFile && !matchText) return false;
                }
                return true;
              });

              if (loadingMedia) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <Spinner size={28} />
                    <p className="text-xs font-semibold">{lang === "ar" ? "جارٍ تحميل وسائط المحادثات..." : lang === "fr" ? "Chargement des médias…" : "Loading chat media…"}</p>
                  </div>
                );
              }

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 bg-white/5 rounded-2xl border border-white/10">
                    <FolderArchive size={36} className="text-slate-600" />
                    <p className="text-xs font-medium">
                      {lang === "ar" ? "لا توجد صور أو ملفات تطابق الفلاتر المحددة." : lang === "fr" ? "Aucun fichier ne correspond aux filtres." : "No images or files match the selected filters."}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:border-violet-500/50 transition-all"
                    >
                      {/* Media Thumbnail */}
                      <div
                        onClick={() => setPreviewMediaModal(item)}
                        className="relative w-full aspect-square bg-black/40 overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        {item.type === "image" && item.dataUrl ? (
                          <img
                            src={item.dataUrl}
                            alt={lang === "ar" ? "مرفق من المحادثة" : lang === "fr" ? "Pièce jointe du salon" : "Chat attachment"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-3 text-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                              <FileText size={24} />
                            </div>
                            <span className="text-[10px] font-mono text-slate-300 max-w-[120px] truncate">
                              {item.fileName || "document.pdf"}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {item.sizeKB ? `${item.sizeKB} KB` : lang === "ar" ? "ملف PDF" : lang === "fr" ? "Fichier PDF" : "PDF file"}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                            <ZoomIn size={16} />
                          </span>
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className="p-2.5 flex flex-col gap-1.5 bg-slate-900/60">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar src={item.senderAvatar} name={item.senderDisplayName} colorSeed={item.senderUsername} size={20} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-white truncate leading-tight">
                              {item.senderDisplayName}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate font-mono">
                              @{item.senderUsername}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-violet-300">
                          <span className="truncate max-w-[110px]">{item.roomTitle || item.roomId}</span>
                          <span className="text-slate-500 text-[9px]">{formatDateTime(item.createdAt, lang)}</span>
                        </div>

                        {item.textSnippet && (
                          <p className="text-[10px] text-slate-300 italic truncate bg-white/5 px-1.5 py-0.5 rounded">
                            "{item.textSnippet}"
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10">
                          <button
                            onClick={() => handleDownloadMediaItem(item)}
                            className="flex-1 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            title={lang === "ar" ? "تحميل الملف" : lang === "fr" ? "Télécharger le fichier" : "Download file"}
                          >
                            <Download size={11} />
                            <span>{lang === "ar" ? "تحميل" : lang === "fr" ? "Télécharger" : "Download"}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMediaVaultItem(item)}
                            className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-[10px] cursor-pointer transition-colors"
                            title={lang === "ar" ? "حذف من الأرشيف" : lang === "fr" ? "Supprimer de l’archive" : "Delete from archive"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: Reports & Complaints */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.reportsTitle}</h3>
              <span className="text-xs text-slate-400">{reports.length} {lang === "ar" ? "شكوى وبلاغ" : lang === "fr" ? "signalements" : "reports"}</span>
            </div>

            <div className="space-y-2.5">
              {reports.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-xs">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                  {lang === "ar" ? "لا توجد شكاوى أو بلاغات معلقة حاليًا." : lang === "fr" ? "Aucun signalement en attente." : "No pending reports."}
                </div>
              ) : (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-400">{lang === "ar" ? "بلاغ ضد" : lang === "fr" ? "Signalement contre" : "Report about"}: @{r.reportedUser}</span>
                        <span className="text-[10px] text-slate-500">{lang === "ar" ? "من" : lang === "fr" ? "Par" : "By"}: @{r.reporterUsername}</span>
                      </div>
                      <p className="text-xs text-slate-300">{r.reason}</p>
                      <p className="text-[10px] text-slate-500">{formatDateTime(r.createdAt, lang)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status === "pending" ? (
                        <button
                          onClick={() =>
                            setReports((prev) =>
                              prev.map((rep) => (rep.id === r.id ? { ...rep, status: "resolved" } : rep))
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer"
                        >
                          {lang === "ar" ? "تعليم كمكتمل" : lang === "fr" ? "Résoudre" : "Mark as resolved"}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> {lang === "ar" ? "تمت المعالجة" : lang === "fr" ? "Résolu" : "Resolved"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Audit Logs */}
        {activeTab === "audit" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">{t.auditTitle}</h3>
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-xs">
                  <FileText size={24} className="mx-auto mb-2 text-slate-500 opacity-60" />
                  {lang === "ar" ? "سجل التدقيق فارغ حاليًا. ستظهر فيه العمليات الجديدة." : lang === "fr" ? "Le journal est vide. Les prochaines opérations y seront enregistrées." : "The audit log is empty. New actions will appear here."}
                </div>
              ) : (
                auditLogs.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-indigo-300">{a.action}</p>
                      <p className="text-slate-400">{a.details} • {a.actorEmail} ({a.actorRole})</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatDateTime(a.timestamp, lang)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: Export & Ownership Certificate & Weekly Report */}
        {activeTab === "export" && (
          <div className="space-y-4">
            {/* Weekly Status Report Generator */}
            <div className="p-5 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 shadow-xl">

            </div>

            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download size={18} className="text-emerald-400" />
                <span>{lang === "ar" ? "تصدير البيانات والتقارير" : lang === "fr" ? "Exporter les données et rapports" : "Export data and reports"}</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === "ar"
                  ? "يمكنك تنزيل تقرير كامل بقائمة الحسابات والمستخدمين المسجلين بصيغة CSV أو استخراج وثيقة إثبات ملكية المنصة للمشرف الأعلى."
                  : lang === "fr" ? "Téléchargez la liste des comptes au format CSV ou ouvrez le certificat de propriété." : "Download account data as CSV or open the ownership certificate."}
              </p>

              <div className="flex gap-3 flex-wrap pt-2">
                <button
                  onClick={exportCsv}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Download size={14} />
                  <span>{lang === "ar" ? "تصدير المستخدمين (CSV)" : lang === "fr" ? "Exporter les utilisateurs (CSV)" : "Export users (CSV)"}</span>
                </button>

              </div>
            </div>
          </div>
        )}

        {/* TAB: Telegram Bot Unlimited Storage & Dual-Cache Proxy */}
        {activeTab === "telegram_cloud" && (
          <div className="space-y-6">
            {/* Architecture Overview Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                    <Cloud size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                      <span>{lang === "ar" ? "تخزين الملفات عبر تلغرام والتخزين المؤقت المزدوج" : lang === "fr" ? "Stockage Telegram et double cache" : "Telegram storage and dual cache"}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {lang === "ar" ? "حماية الوركر نشطة" : lang === "fr" ? "Protection active" : "Protection active"}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      {lang === "ar"
                        ? "تُخزّن الملفات عبر Telegram Bot API مع وسيط تخزين مؤقت."
                        : lang === "fr" ? "Les fichiers sont stockés via l’API Telegram avec un système de cache." : "Files are stored via the Telegram Bot API with caching."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadTelegramAndModerationStatus}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
                >
                  <RefreshCw size={14} className={loadingTgStatus ? "animate-spin text-indigo-400" : ""} />
                  <span>{lang === "ar" ? "تحديث المؤشرات" : lang === "fr" ? "Actualiser" : "Refresh metrics"}</span>
                </button>
              </div>

              {/* Architecture 3-Step Flow Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px]">1</span>
                    <span>{lang === "ar" ? "الملفات العامة (CDN)" : lang === "fr" ? "Fichiers publics (CDN)" : "Public assets (CDN)"}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {lang === "ar" ? "تُقدّم الواجهة والملفات الثابتة عبر شبكة توصيل المحتوى." : lang === "fr" ? "Les pages et fichiers statiques sont servis par le CDN." : "The CDN serves the interface and static files."}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
                    <span>{lang === "ar" ? "التحقق من الحظر" : lang === "fr" ? "Vérification des blocages" : "Blocklist checks"}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {lang === "ar" ? "تُفحص قائمة الحظر في الذاكرة قبل متابعة الطلب." : lang === "fr" ? "La liste de blocage est vérifiée en mémoire avant de poursuivre la requête." : "The blocklist is checked in memory before a request continues."}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
                    <span>{lang === "ar" ? "التخزين المؤقت (SSD وRAM)" : lang === "fr" ? "Cache (SSD et RAM)" : "Caching (SSD and RAM)"}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {lang === "ar" ? "تُحفظ الملفات التي جُلبت من تلغرام مؤقتًا على القرص والذاكرة." : lang === "fr" ? "Les fichiers récupérés depuis Telegram sont mis en cache sur le disque et en mémoire." : "Files retrieved from Telegram are cached on disk and in memory."}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  {lang === "ar" ? "ملفات التخزين المؤقت على القرص" : lang === "fr" ? "Fichiers en cache sur disque" : "Disk cache files"}
                </span>
                <p className="text-xl sm:text-2xl font-black text-cyan-400">
                  {telegramStatus?.cachedFilesCount ?? "0"}
                </p>
                <span className="text-[10px] text-slate-500">
                  {telegramStatus?.totalCachedDiskMb ?? "0.00"} MB {lang === "ar" ? "مساحة مستخدمة" : lang === "fr" ? "utilisés" : "used"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  {lang === "ar" ? "صور الحسابات في الذاكرة" : lang === "fr" ? "Avatars en mémoire" : "Avatars in memory"}
                </span>
                <p className="text-xl sm:text-2xl font-black text-indigo-400">
                  {telegramStatus?.inMemoryAvatarsCount ?? "0"}
                </p>
                <span className="text-[10px] text-slate-500">
                  TTL 24h · {lang === "ar" ? "تجديد تلقائي" : lang === "fr" ? "renouvellement automatique" : "automatic refresh"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  {lang === "ar" ? "الحسابات المحظورة" : lang === "fr" ? "Comptes bloqués" : "Blocked accounts"}
                </span>
                <p className="text-xl sm:text-2xl font-black text-rose-400">
                  {moderationStatus?.totalBannedUsers ?? "0"}
                </p>
                <span className="text-[10px] text-slate-500">
                  {moderationStatus?.totalBannedIps ?? "0"} IPs {lang === "ar" ? "محظورة" : lang === "fr" ? "bloquées" : "blocked"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  {lang === "ar" ? "حالة بوت تلغرام" : lang === "fr" ? "État du bot Telegram" : "Telegram bot status"}
                </span>
                <p className="text-sm sm:text-base font-bold text-emerald-400 mt-1">
                  {telegramStatus?.botConfigured
                    ? (lang === "ar" ? "متصل" : lang === "fr" ? "Connecté" : "Connected")
                    : (lang === "ar" ? "وضع الوكيل المحلي" : lang === "fr" ? "Mode proxy local" : "Local proxy mode")}
                </p>
                <span className="text-[10px] text-slate-500">
                  {lang === "ar" ? "تخزين الملفات" : lang === "fr" ? "Stockage des fichiers" : "File storage"}
                </span>
              </div>
            </div>

            {/* Cache Cleaning Routine (Step 6) */}
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Clock size={16} className="text-cyan-400" />
                    <span>{lang === "ar" ? "التنظيف المجدول للملفات المؤقتة" : lang === "fr" ? "Nettoyage programmé du cache" : "Scheduled cache cleanup"}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === "ar"
                      ? "يحذف النظام يوميًا الملفات المخزنة مؤقتًا التي لم تُفتح منذ أكثر من 7 أيام."
                      : lang === "fr" ? "Le système supprime chaque jour les fichiers en cache inutilisés depuis plus de 7 jours." : "The system removes cached files not opened for more than 7 days."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerCleanup}
                  disabled={cleaningCache}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={cleaningCache ? "animate-spin" : ""} />
                  <span>{cleaningCache ? (lang === "ar" ? "جارِ التنظيف..." : lang === "fr" ? "Nettoyage..." : "Cleaning...") : (lang === "ar" ? "تشغيل التنظيف اليدوي الآن" : lang === "fr" ? "Nettoyer le cache" : "Clean cache now")}</span>
                </button>
              </div>

              {cleanupMessage && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  {cleanupMessage}
                </div>
              )}
            </div>

            {/* Step 1: Immediate In-Memory Blacklist Management */}
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldAlert size={18} className="text-rose-400" />
                <h4 className="font-bold text-sm text-white">
                  {lang === "ar" ? "إدارة قائمة الحظر المؤقتة" : lang === "fr" ? "Gérer la liste de blocage en mémoire" : "Manage the in-memory blocklist"}
                </h4>
              </div>

              {/* Add to Blacklist Form */}
              <form onSubmit={handleManualBanSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={manualBanInput}
                  onChange={(e) => setManualBanInput(e.target.value)}
                  placeholder={lang === "ar" ? "اسم المستخدم أو البريد أو عنوان IP..." : lang === "fr" ? "Nom d’utilisateur, e-mail ou adresse IP…" : "Username, email, or IP address…"}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <input
                  type="text"
                  value={manualBanReason}
                  onChange={(e) => setManualBanReason(e.target.value)}
                  placeholder={lang === "ar" ? "سبب الحظر..." : lang === "fr" ? "Motif du blocage…" : "Reason for blocking…"}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!manualBanInput.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer shadow disabled:opacity-40"
                >
                  {lang === "ar" ? "حظر فوري" : lang === "fr" ? "Bannir immédiatement" : "Ban immediately"}
                </button>
              </form>

              {/* Banned Users & IPs List */}
              {moderationStatus?.bannedUsers?.length > 0 || moderationStatus?.bannedIps?.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    {lang === "ar" ? "الحسابات وعناوين IP المحظورة:" : lang === "fr" ? "Comptes et adresses IP bloqués :" : "Blocked accounts and IP addresses:"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {moderationStatus?.bannedUsers?.map((u: string) => (
                      <span
                        key={u}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30"
                      >
                        <UserX size={13} />
                        <span>@{u}</span>
                        <button
                          type="button"
                          onClick={() => handleManualUnban(u)}
                          className="hover:text-white cursor-pointer ml-1"
                          title={lang === "ar" ? "إلغاء الحظر" : lang === "fr" ? "Débloquer" : "Unblock"}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}

                    {moderationStatus?.bannedIps?.map((ip: string) => (
                      <span
                        key={ip}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono"
                      >
                        <span>IP: {ip}</span>
                        <button
                          type="button"
                          onClick={() => handleManualUnban(ip)}
                          className="hover:text-white cursor-pointer ml-1"
                          title={lang === "ar" ? "إلغاء الحظر" : lang === "fr" ? "Débloquer" : "Unblock"}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-1">
                  {lang === "ar" ? "لا توجد حسابات أو عناوين IP محظورة حاليًا." : lang === "fr" ? "Aucun compte ni adresse IP bloqué pour le moment." : "No accounts or IP addresses are currently blocked."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {proofViewer && (
        <ImageLightbox images={[proofViewer.src]} title={proofViewer.title} lang={lang} onClose={() => setProofViewer(null)} />
      )}

      {/* Lightbox / Zoom Modal for Chat Media */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal TopBar */}
            <div className="px-5 py-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  src={previewMediaModal.senderAvatar}
                  name={previewMediaModal.senderDisplayName}
                  colorSeed={previewMediaModal.senderUsername}
                  size={30}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {previewMediaModal.senderDisplayName} (@{previewMediaModal.senderUsername})
                  </p>
                  <p className="text-[11px] text-violet-400 truncate font-mono">
                    {previewMediaModal.roomTitle || previewMediaModal.roomId} · {formatDateTime(previewMediaModal.createdAt, lang)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadMediaItem(previewMediaModal)}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                >
                  <Download size={14} />
                  <span>{lang === "ar" ? "تحميل عالي الدقة" : "Télécharger"}</span>
                </button>
                <button
                  onClick={() => setPreviewMediaModal(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Image Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50 min-h-[300px]">
              {previewMediaModal.dataUrl && previewMediaModal.type === "image" ? (
                <img
                  src={previewMediaModal.dataUrl}
                  alt="High res preview"
                  className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />
              ) : previewMediaModal.dataUrl && previewMediaModal.type === "pdf" ? (
                <iframe
                  src={previewMediaModal.dataUrl}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-2xl"
                />
              ) : previewMediaModal.url ? (
                <iframe
                  src={previewMediaModal.url}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-2xl"
                />
              ) : null}
            </div>

            {/* Modal Caption if any */}
            {previewMediaModal.textSnippet && (
              <div className="px-5 py-3 bg-white/5 border-t border-white/10 text-xs text-slate-300">
                <span className="text-slate-400 font-bold ml-1">نص الرسالة المصاحبة:</span>
                "{previewMediaModal.textSnippet}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
