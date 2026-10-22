import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Edit3,
  Trash2,
  AlertTriangle,
  Radio,
  Megaphone,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  BellRing,
  Eye,
  Download,
  FileText,
  FileCheck,
} from "lucide-react";
import { Account, AnnouncementType, BacDocumentItem, LangKey, SuperAnnouncement } from "../types";
import { SUBJECTS, BRANCHES, GRAD, GRAD_GOLD } from "../constants";
import {
  getAllSuperAnnouncements,
  deleteSuperAnnouncement,
  canUserPublishAnyAnnouncement,
  canUserEditAnnouncement,
  canUserDeleteAnnouncement,
  isUserOwner,
} from "../services/announcementService";
import { TopBar, Avatar } from "./Atoms";
import { SuperAnnouncementModal } from "./SuperAnnouncementModal";
import { openInGooglePdfViewer } from "../utils/pdfNativeHelper";

interface AnnouncementsScreenProps {
  user: Account | null;
  lang: LangKey;
  isRTL: boolean;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  onRequireAuth: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

const TYPE_METAS: Record<
  AnnouncementType,
  {
    emoji: string;
    label: { ar: string; fr: string; en: string };
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    cardBorder: string;
    glowColor: string;
  }
> = {
  live_class: {
    emoji: "🎓",
    label: { ar: "حصة مباشرة", fr: "Classe en direct", en: "Live Class" },
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/30",
    cardBorder: "border-emerald-500/20 hover:border-emerald-500/40",
    glowColor: "rgba(16, 185, 129, 0.15)",
  },
  alert: {
    emoji: "⚠️",
    label: { ar: "تنبيه هام", fr: "Alerte", en: "Alert" },
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/30",
    cardBorder: "border-rose-500/20 hover:border-rose-500/40",
    glowColor: "rgba(244, 63, 94, 0.15)",
  },
  announcement: {
    emoji: "📢",
    label: { ar: "إعلان عام", fr: "Annonce", en: "Announcement" },
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-300",
    badgeBorder: "border-indigo-500/30",
    cardBorder: "border-indigo-500/20 hover:border-indigo-500/40",
    glowColor: "rgba(99, 102, 241, 0.15)",
  },
  tip: {
    emoji: "💡",
    label: { ar: "نصيحة وتوجيه", fr: "Astuce & Conseil", en: "Tip" },
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/30",
    cardBorder: "border-amber-500/20 hover:border-amber-500/40",
    glowColor: "rgba(245, 158, 11, 0.15)",
  },
};

export function AnnouncementsScreen({
  user,
  lang,
  isRTL,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onRequireAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: AnnouncementsScreenProps) {
  const [announcements, setAnnouncements] = useState<SuperAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | AnnouncementType>("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SuperAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SuperAnnouncement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [readerDoc, setReaderDoc] = useState<BacDocumentItem | null>(null);
  const [readerTab, setReaderTab] = useState<"exam" | "corrige">("exam");

  const canPublish = canUserPublishAnyAnnouncement(user);

  const handleOpenPdfPreview = (
    ann: SuperAnnouncement,
    file: { id?: string; name: string; size?: string; url?: string; dataUrl?: string },
    isCorrige = false,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const pdfUrl = file.dataUrl || file.url;
    
    const docItem: BacDocumentItem = {
      id: ann.id || `ann_${Date.now()}`,
      title: file.name || ann.title || "ملف مرفق بالإعلان",
      subjectId: ann.subjectId || "math",
      branchIds: ann.targetBranches || ["math"],
      type: isCorrige ? "correction" : "cours",
      trimestre: "all",
      hasCorrige: Boolean(isCorrige || (ann.correctionPdfs && ann.correctionPdfs.length > 0)),
      fileSize: file.size || "1.5 MB",
      pdfUrl: isCorrige ? undefined : pdfUrl,
      pdfDataUrl: isCorrige ? undefined : pdfUrl,
      corrigePdfUrl: isCorrige ? pdfUrl : undefined,
      corrigePdfDataUrl: isCorrige ? pdfUrl : undefined,
      examFileName: file.name,
      corrigeFileName: file.name,
      authorDisplayName: ann.authorDisplayName || ann.authorUsername,
      authorRole: ann.authorRole,
      createdAt: ann.createdAt || Date.now(),
      downloadCount: 120,
      contentSnippet: ann.content,
    };

    if (pdfUrl) {
      openInGooglePdfViewer(pdfUrl, file.name || ann.title);
    }
  };

  const handleDownloadPdf = (file: { name?: string; url?: string; dataUrl?: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const fileUrl = file.dataUrl || file.url;
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = file.name || "ملف_الإعلان.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Load announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const list = await getAllSuperAnnouncements();
      setAnnouncements(list);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Filtered List
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // 1. Type filter
      if (selectedTypeFilter !== "all" && ann.type !== selectedTypeFilter) {
        return false;
      }

      // 2. Branch / Stream filter (show announcements for target stream or all streams)
      // Owner and Teachers are NEVER restricted to any branch (they see all announcements)
      const isOwnerOrTeacher = isUserOwner(user) || user?.role === "teacher" || user?.role === "superadmin";
      const effectiveBranch =
        selectedBranchFilter !== "all"
          ? selectedBranchFilter
          : !isOwnerOrTeacher && user?.branch && user.branch !== "all"
          ? user.branch
          : null;

      if (effectiveBranch) {
        const isAll =
          ann.isAllBranches ||
          !ann.targetBranches ||
          ann.targetBranches.length === 0 ||
          ann.targetBranches.includes("all");
        if (!isAll && (!ann.targetBranches || !ann.targetBranches.includes(effectiveBranch))) {
          return false;
        }
      }

      // 4. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ann.title?.toLowerCase().includes(q);
        const matchContent = ann.content.toLowerCase().includes(q);
        const matchAuthor = (ann.authorDisplayName || ann.authorUsername).toLowerCase().includes(q);
        const matchSubject = ann.subjectId && SUBJECTS[ann.subjectId]?.name[lang]?.toLowerCase().includes(q);
        const matchPlatform = ann.platform?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchAuthor && !matchSubject && !matchPlatform) {
          return false;
        }
      }

      return true;
    });
  }, [announcements, selectedTypeFilter, selectedSubjectFilter, selectedBranchFilter, searchQuery, user?.branch, lang]);

  const handleCreateSuccess = (newAnn: SuperAnnouncement) => {
    setAnnouncements((prev) => {
      const index = prev.findIndex((a) => a.id === newAnn.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = newAnn;
        return next;
      }
      return [newAnn, ...prev];
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);
    try {
      const res = await deleteSuperAnnouncement(deleteTarget.id, user);
      if (res.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert(res.error || "تعذر حذف الإعلان");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRelativeDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return lang === "ar" ? "منذ قليل" : "À l'instant";
    if (hours < 24) return lang === "ar" ? `منذ ${hours} ساعة` : `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return lang === "ar" ? "أمس" : "Hier";
    if (days < 7) return lang === "ar" ? `منذ ${days} أيام` : `Il y a ${days}j`;
    return new Date(timestamp).toLocaleDateString(lang === "ar" ? "ar-TN" : "fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTypeFilter("all");
    setSelectedSubjectFilter("all");
    setSelectedBranchFilter("all");
  };

  return (
    <div className="w-full flex flex-col min-h-screen bac-in pb-20">
      {/* Top Bar Header */}
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={lang === "ar" ? "الإعلانات والحصص المباشرة" : lang === "fr" ? "Annonces & Directs" : "Announcements & Live"}
        subtitle={
          lang === "ar"
            ? "متابعة الحصص التفاعلية، التنبيهات الرسمية، والنصائح التوجيهية"
            : lang === "fr"
            ? "Classes en direct, alertes et fiches méthodologiques"
            : "Live classes, alerts, and proven study tips"
        }
        accent="linear-gradient(90deg, #F59E0B 0%, #10B981 50%, #6366F1 100%)"
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenSettings={onOpenSettings}
        onRequireAuth={onRequireAuth}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-5 space-y-6">
        {/* Hero Section */}
        <div
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-white/10"
          style={{
            background: "linear-gradient(135deg, #0B132B 0%, #1C2541 50%, #0F172A 100%)",
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #F59E0B 0%, #10B981 100%)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm">
                <Sparkles size={13} className="text-amber-400" />
                <span>{lang === "ar" ? "مساحة المستجدات والدروس" : "Actualités & Directs"}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {lang === "ar"
                  ? "فضاء الإعلانات والحصص المباشرة"
                  : lang === "fr"
                  ? "Annonces & Classes en Direct"
                  : "Announcements & Live Classes"}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {lang === "ar"
                  ? "ابق على اطلاع دائم بمواعيد الحصص المباشرة، التنبيهات المنهجية، البلاغات الهامة، والنصائح الذهبية لباكالوريا 2026."
                  : lang === "fr"
                  ? "Restez informé des sessions interactives, alertes et astuces d'apprentissage pour le Bac 2026."
                  : "Stay up to date with live classes, study tips, and academic alerts for the 2026 Baccalaureate."}
              </p>
            </div>

            {/* Action button (Role-Aware) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {canPublish ? (
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setIsModalOpen(true);
                  }}
                  className="px-5 py-3 rounded-2xl font-black text-sm text-slate-950 flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer hover:shadow-amber-500/20"
                  style={{ background: GRAD_GOLD }}
                >
                  <PlusCircle size={18} className="text-slate-950 font-black" />
                  <span>
                    {user?.role === "elite_student"
                      ? lang === "ar"
                        ? "نشر نصيحة وتوجيه 💡"
                        : "Partager une astuce 💡"
                      : lang === "ar"
                      ? "نشر إعلان / حصة مباشرة"
                      : "Créer une annonce / direct"}
                  </span>
                </button>
              ) : !user ? (
                <button
                  onClick={onRequireAuth}
                  className="px-5 py-3 rounded-2xl font-bold text-xs text-white bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{lang === "ar" ? "تسجيل الدخول للمشاركة" : "Connexion"}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-lg">
          {/* Type Filter Chips & Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Segmented Type Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedTypeFilter("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTypeFilter === "all"
                    ? "bg-white text-slate-950 shadow-md font-black"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
                }`}
              >
                {lang === "ar" ? "الكل" : "Tous"} ({announcements.length})
              </button>

              {(["live_class", "alert", "announcement", "tip"] as AnnouncementType[]).map((type) => {
                const meta = TYPE_METAS[type];
                const count = announcements.filter((a) => a.type === type).length;
                const isSelected = selectedTypeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.badgeText} border ${meta.badgeBorder} shadow-sm font-black`
                        : "bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label[lang] || meta.label.ar}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Reset Filters button if type is active */}
            <div className="flex items-center gap-2">
              {(selectedTypeFilter !== "all" ||
                selectedBranchFilter !== "all") && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>{lang === "ar" ? "إلغاء التصفية" : "Réinitialiser"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Announcements List / Grid */}
        {loading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/6" />
                  </div>
                </div>
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-16 bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white/5 mx-auto flex items-center justify-center text-slate-400">
              <BellRing size={28} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-black text-white">
                {lang === "ar" ? "لم يتم العثور على إعلانات" : "Aucune annonce trouvée"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === "ar"
                  ? "لا توجد نتائج تطابق معايير البحث والتصفية المحددة حاليًا."
                  : "Aucune publication ne correspond à vos filtres actuels."}
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>{lang === "ar" ? "عرض جميع الإعلانات" : "Réinitialiser les filtres"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => {
              const meta = TYPE_METAS[ann.type];
              const canEdit = canUserEditAnnouncement(user, ann);
              const canDelete = canUserDeleteAnnouncement(user, ann);
              const subjectInfo = ann.subjectId ? SUBJECTS[ann.subjectId] : null;

              return (
                <div
                  key={ann.id}
                  className={`p-5 sm:p-6 rounded-3xl bg-slate-900/80 border ${meta.cardBorder} transition-all duration-200 space-y-4 relative overflow-hidden shadow-lg hover:shadow-2xl`}
                  style={{
                    boxShadow: `0 10px 30px -10px ${meta.glowColor}`,
                  }}
                >
                  {/* Card Header: Type Badge, Subject / Streams & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        <span>{meta.emoji}</span>
                        <span>{meta.label[lang] || meta.label.ar}</span>
                      </span>

                      {/* Subject Badge inside Card */}
                      {subjectInfo && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white border shadow-sm"
                          style={{
                            backgroundColor: `${subjectInfo.color}25`,
                            borderColor: `${subjectInfo.color}60`,
                          }}
                        >
                          <BookOpen size={12} style={{ color: subjectInfo.color }} />
                          <span>{subjectInfo.name[lang] || subjectInfo.name.ar}</span>
                        </span>
                      )}
                    </div>

                    {/* Author / Owner Actions (Edit & Delete) */}
                    {(canEdit || canDelete) && (
                      <div className="flex items-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingAnnouncement(ann);
                              setIsModalOpen(true);
                            }}
                            title={lang === "ar" ? "تعديل الإعلان" : "Modifier"}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(ann)}
                            title={lang === "ar" ? "حذف الإعلان" : "Supprimer"}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title (if present) */}
                  {ann.title && (
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                      {ann.title}
                    </h2>
                  )}

                  {/* Live Class Interactive Schedule & Platform Bar */}
                  {ann.type === "live_class" && (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Date & Time details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        {ann.date && (
                          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                            <Calendar size={14} className="text-emerald-400" />
                            <span>{ann.date}</span>
                          </div>
                        )}
                        {ann.startTime && (
                          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                            <Clock size={14} className="text-emerald-400" />
                            <span>
                              {ann.startTime} {ann.endTime ? `➔ ${ann.endTime}` : ""}
                            </span>
                          </div>
                        )}
                        {ann.platform && (
                          <div className="flex items-center gap-1.5 text-slate-300 font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                            <Video size={13} className="text-indigo-400" />
                            <span>{ann.platform}</span>
                          </div>
                        )}
                      </div>

                      {/* Join Button / Link Status */}
                      <div>
                        {ann.joinUrl ? (
                          <a
                            href={ann.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-slate-950 transition-all transform active:scale-95 shadow-md shadow-emerald-500/30 cursor-pointer"
                            style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}
                          >
                            <span>{lang === "ar" ? "الانضمام للحصة المباشرة" : "Rejoindre la séance"}</span>
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 bg-white/5 border border-white/5">
                            <Clock size={12} />
                            <span>
                              {lang === "ar" ? "سيُضاف رابط الحصة قبل الانطلاق" : "Lien disponible bientôt"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Content Body (Preserving line breaks) */}
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                    {ann.content}
                  </div>

                  {/* Attached PDF Documents Section */}
                  {((ann.pdfAttachments && ann.pdfAttachments.length > 0) || ann.pdfAttachmentUrl) && (
                    <div className="pt-2 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-400" />
                        <span>{lang === "ar" ? "الوثائق وملخصات الحصة المرفقة:" : "Documents joints:"}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {ann.pdfAttachments && ann.pdfAttachments.length > 0 ? (
                          ann.pdfAttachments.map((file, idx) => (
                            <div
                              key={file.id || idx}
                              className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                  <BookOpen size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-bold text-white block break-words leading-snug">
                                    {file.name}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {/* View Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenPdfPreview(ann, file, false, e)}
                                  className="py-2 px-3.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                                  title={lang === "ar" ? "مشاهدة عبر قارئ PDF" : "Voir le document"}
                                >
                                  <Eye size={14} className="text-indigo-300" />
                                  <span>{lang === "ar" ? "مشاهدة" : "Voir"}</span>
                                </button>

                                {/* Direct Download Button */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDownloadPdf(file, e)}
                                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                                  title={lang === "ar" ? "تحميل الملف" : "Télécharger"}
                                >
                                  <Download size={14} />
                                  <span>{lang === "ar" ? "تحميل" : "Télécharger"}</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                <BookOpen size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-sm font-bold text-white block break-words leading-snug">
                                  {ann.pdfAttachmentName || (lang === "ar" ? "ملف الحصة المرفق" : "Document joint")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleOpenPdfPreview(
                                    ann,
                                    { name: ann.pdfAttachmentName || "وثيقة.pdf", url: ann.pdfAttachmentUrl, dataUrl: ann.pdfAttachmentUrl },
                                    false,
                                    e
                                  )
                                }
                                className="py-2 px-3.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                <Eye size={14} className="text-indigo-300" />
                                <span>{lang === "ar" ? "مشاهدة" : "Voir"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDownloadPdf({ name: ann.pdfAttachmentName || "ملف.pdf", url: ann.pdfAttachmentUrl, dataUrl: ann.pdfAttachmentUrl }, e)}
                                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                <Download size={14} />
                                <span>{lang === "ar" ? "تحميل" : "Télécharger"}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Correction PDFs Section ("قسم الإصلاح والحلول") */}
                  {ann.correctionPdfs && ann.correctionPdfs.length > 0 && (
                    <div className="pt-3 space-y-2 border-t border-emerald-500/20 mt-3">
                      <div className="text-[11px] font-black text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{lang === "ar" ? "قسم الإصلاح والحلول النموذجية:" : "Corrigés et solutions:"}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {ann.correctionPdfs.map((file, idx) => (
                          <div
                            key={file.id || idx}
                            className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                                <FileCheck size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white block break-words">{file.name}</span>
                                  <span className="text-[9px] bg-emerald-500/30 px-2 py-0.5 rounded-full text-emerald-300 font-black">
                                    {lang === "ar" ? "إصلاح ✓" : "Corrigé"}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-300/80">
                                  {file.size || "1.2 MB"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {/* View Correction Button */}
                              <button
                                type="button"
                                onClick={(e) => handleOpenPdfPreview(ann, file, true, e)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-200 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                <Eye size={13} className="text-emerald-300" />
                                <span>{lang === "ar" ? "مشاهدة" : "Voir"}</span>
                              </button>

                              {/* Download Correction Button */}
                              <button
                                type="button"
                                onClick={(e) => handleDownloadPdf(file, e)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                <Download size={13} />
                                <span>{lang === "ar" ? "تحميل" : "Télécharger"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer: Author Identity & Relative Time */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={ann.authorAvatar}
                        username={ann.authorUsername}
                        displayName={ann.authorDisplayName}
                        size={32}
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white">{ann.authorDisplayName || ann.authorUsername}</span>
                          {ann.authorRole === "elite_student" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              <span>{lang === "ar" ? "تلميذ متميز" : "Élève Élite"}</span>
                            </span>
                          )}
                          {ann.authorRole === "teacher" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              👨‍🏫 {lang === "ar" ? "أستاذ معتمد" : "Enseignant"}
                            </span>
                          )}
                          {ann.authorRole === "superadmin" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              👑 {lang === "ar" ? "الإدارة" : "Admin"}
                            </span>
                          )}
                          {(!ann.authorRole || ann.authorRole === "member") && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400">
                              🎓 {lang === "ar" ? "تلميذ مسجل" : "Membre"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatRelativeDate(ann.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Announcement Modal */}
      <SuperAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        user={user}
        lang={lang}
        isRTL={isRTL}
        editAnnouncement={editingAnnouncement}
        onSuccess={handleCreateSuccess}
      />

      {/* Owner / Author Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {lang === "ar" ? "تأكيد حذف الإعلان" : "Confirmer la suppression"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === "ar"
                  ? `هل أنت متأكد من حذف هذا الإعلان (${deleteTarget.title || deleteTarget.content.slice(0, 30)}...)؟ لا يمكن التراجع عن هذا الإجراء.`
                  : "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible."}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {lang === "ar" ? "إلغاء" : "Annuler"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <span>{lang === "ar" ? "جاري الحذف..." : "Suppression..."}</span>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{lang === "ar" ? "حذف نهائي" : "Supprimer"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
