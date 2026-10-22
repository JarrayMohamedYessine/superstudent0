import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  FileCheck2,
  ShieldCheck,
  Star,
  MessageSquare,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Account, LangKey } from "../types";
import {
  AppNotification,
  getUserNotifications,
  isNotificationUnread,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  clearAllNotifications,
} from "../services/notificationService";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Account | null;
  lang: LangKey;
  isRTL: boolean;
  onNavigateScreen?: (screenKey: string) => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  user,
  lang,
  isRTL,
  onNavigateScreen,
}: NotificationCenterModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);

  // Broadcast form state (for Super Admin & Mods)
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"staff" | "all" | "moderator" | "elite_student">("staff");
  const [broadcastType, setBroadcastType] = useState<"admin_broadcast" | "doc_approved" | "elite_upgrade" | "moderation_ban">("admin_broadcast");
  const [broadcasting, setBroadcasting] = useState(false);

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  useEffect(() => {
    if (isOpen && user) {
      loadNotifs();
    }
  }, [isOpen, user]);

  async function loadNotifs() {
    setLoading(true);
    setLoadError(false);
    try {
      const items = await getUserNotifications(user);
      setNotifications(items);
    } catch (err) {
      console.error("Error loading notifications in modal:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !user) return null;

  const unreadCount = notifications.filter((n) => isNotificationUnread(n, user)).length;
  const filteredNotifications =
    activeFilter === "unread"
      ? notifications.filter((n) => isNotificationUnread(n, user))
      : notifications;

  async function handleMarkRead(notif: AppNotification) {
    if (!user) return;
    await markNotificationAsRead(notif.id, user);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, readBy: [...n.readBy, (user.email || user.username).toLowerCase()] } : n
      )
    );
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsAsRead(user);
    const id = (user.email || user.username).toLowerCase();
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        readBy: n.readBy.includes(id) ? n.readBy : [...n.readBy, id],
      }))
    );
  }

  async function handleClearAll() {
    if (user?.role !== "superadmin") return;
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من مسح كافة التنبيهات من النظام؟" : lang === "fr" ? "Voulez-vous vraiment supprimer toutes les notifications ?" : "Are you sure you want to clear all notifications?")) {
      return;
    }
    await clearAllNotifications();
    setNotifications([]);
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setBroadcasting(true);
    try {
      const newNotif = await createNotification({
        recipientRole: broadcastTarget,
        title: {
          ar: broadcastTitle.trim(),
          fr: broadcastTitle.trim(),
          en: broadcastTitle.trim(),
        },
        message: {
          ar: broadcastMessage.trim(),
          fr: broadcastMessage.trim(),
          en: broadcastMessage.trim(),
        },
        type: broadcastType,
        iconType:
          broadcastType === "doc_approved"
            ? "file-check"
            : broadcastType === "elite_upgrade"
            ? "star"
            : broadcastType === "moderation_ban"
            ? "shield"
            : "message",
        badgeLabel: {
          ar:
            broadcastType === "doc_approved"
              ? "موافقة وثيقة"
              : broadcastType === "elite_upgrade"
              ? "ترقية تلميذ"
              : broadcastType === "moderation_ban"
              ? "إجراء حظر"
              : "تنبيه إداري",
          fr: "Alerte Officielle",
          en: "Official Alert",
        },
      });

      setNotifications((prev) => [newNotif, ...prev]);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setShowBroadcastForm(false);
    } catch (err) {
      console.error("Broadcast failed:", err);
    } finally {
      setBroadcasting(false);
    }
  }

  function formatRelativeTime(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return lang === "ar" ? "الآن" : lang === "fr" ? "À l’instant" : "Just now";
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return lang === "ar" ? `منذ ${mins} دقيقة` : lang === "fr" ? `Il y a ${mins} min` : `${mins} min ago`;
    }
    if (diff < 86400) {
      const hrs = Math.floor(diff / 3600);
      return lang === "ar" ? `منذ ${hrs} ساعة` : lang === "fr" ? `Il y a ${hrs} h` : `${hrs} hr ago`;
    }
    const days = Math.floor(diff / 86400);
    return lang === "ar" ? `منذ ${days} يوم` : lang === "fr" ? `Il y a ${days} j` : `${days} days ago`;
  }

  function getNotificationIcon(type: string, iconType?: string) {
    if (type === "doc_approved" || iconType === "file-check") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md shadow-emerald-900/30">
          <FileCheck2 size={20} className="text-emerald-400" />
        </div>
      );
    }
    if (type === "elite_upgrade" || iconType === "star") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-900/30">
          <Star size={20} className="text-amber-400 fill-amber-400/30" />
        </div>
      );
    }
    if (type === "moderation_ban" || iconType === "shield") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-md shadow-rose-900/30">
          <ShieldCheck size={20} className="text-rose-400" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/30">
        <Bell size={20} className="text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in" dir={isRTL ? "rtl" : "ltr"}>
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg border border-indigo-400/30">
              <Bell size={22} className="animate-bounce" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-lg border-2 border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {lang === "ar" ? "مركز التنبيهات والإشعارات" : lang === "fr" ? "Centre des notifications" : "Notifications"}
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {unreadCount} {lang === "ar" ? "جديد" : lang === "fr" ? "non lus" : "unread"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.role === "superadmin"
                  ? lang === "ar"
                    ? "لوحة إشعارات الإدارة — اعتمادات الوثائق والقرارات الإدارية"
                    : lang === "fr" ? "Notifications d’administration et de modération" : "Administrator and moderation notifications"
                  : user.role === "moderator"
                  ? lang === "ar"
                    ? "إشعارات المشرفين — متابعة الغرف والقرارات"
                    : lang === "fr" ? "Notifications de modération et des salons" : "Moderation and room notifications"
                  : lang === "ar"
                  ? "إشعارات التلميذ المتميز — ترقيات، اعتماد الفروض والتلاخيص"
                  : lang === "fr" ? "Notifications de contribution" : "Contributor notifications"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Filter Tabs + Actions */}
        <div className="px-4 sm:px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {lang === "ar" ? "جميع التنبيهات" : lang === "fr" ? "Toutes" : "All"} ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === "unread"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{lang === "ar" ? "غير المقروءة" : lang === "fr" ? "Non lues" : "Unread"}</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                title={lang === "ar" ? "تحديد الكل كمقروء" : lang === "fr" ? "Tout marquer comme lu" : "Mark all as read"}
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">{lang === "ar" ? "تحديد الكل كمقروء" : lang === "fr" ? "Tout marquer comme lu" : "Mark all read"}</span>
              </button>
            )}

            {user.role === "superadmin" && (
              <>
                <button
                  onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Send size={13} />
                  <span>{showBroadcastForm ? (lang === "ar" ? "إلغاء الإرسال" : lang === "fr" ? "Fermer" : "Cancel") : (lang === "ar" ? "إرسال تنبيه رسمي" : lang === "fr" ? "Diffuser" : "Send announcement")}</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                  title={lang === "ar" ? "مسح كافة الإشعارات" : lang === "fr" ? "Effacer les notifications" : "Clear notifications"}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Super Admin Send Alert Form Drawer */}
        {showBroadcastForm && user.role === "superadmin" && (
          <form onSubmit={handleSendBroadcast} className="p-4 sm:p-5 bg-indigo-950/40 border-b border-indigo-500/30 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-black">
              <Sparkles size={15} className="text-amber-400" />
              <span>{lang === "ar" ? "إرسال إشعار جديد" : lang === "fr" ? "Envoyer une nouvelle notification" : "Send a new notification"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "الفئة المستهدفة" : lang === "fr" ? "Destinataires" : "Recipients"}
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="staff">{lang === "ar" ? "المشرفون والمساهمون" : lang === "fr" ? "Modérateurs et contributeurs" : "Moderators and contributors"}</option>
                  <option value="elite_student">{lang === "ar" ? "المساهمون فقط" : lang === "fr" ? "Contributeurs uniquement" : "Contributors only"}</option>
                  <option value="moderator">{lang === "ar" ? "المشرفون فقط" : lang === "fr" ? "Modérateurs uniquement" : "Moderators only"}</option>
                  <option value="all">{lang === "ar" ? "كافة المستخدمين" : lang === "fr" ? "Tous les utilisateurs" : "All users"}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {lang === "ar" ? "نوع الإشعار" : lang === "fr" ? "Type de notification" : "Notification type"}
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin_broadcast">{lang === "ar" ? "إشعار إداري عام" : lang === "fr" ? "Annonce administrative" : "Administrative announcement"}</option>
                  <option value="doc_approved">{lang === "ar" ? "اعتماد وثيقة" : lang === "fr" ? "Document approuvé" : "Document approved"}</option>
                  <option value="elite_upgrade">{lang === "ar" ? "اعتماد مساهم" : lang === "fr" ? "Contribution approuvée" : "Contributor approved"}</option>
                  <option value="moderation_ban">{lang === "ar" ? "إجراء إشراف" : lang === "fr" ? "Action de modération" : "Moderation action"}</option>
                </select>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder={lang === "ar" ? "عنوان الإشعار" : lang === "fr" ? "Titre de la notification…" : "Notification title"}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={lang === "ar" ? "نص الإشعار والتفاصيل..." : lang === "fr" ? "Détails de la notification…" : "Notification details"}
                rows={2}
                required
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBroadcastForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={broadcasting}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send size={12} />
                <span>{broadcasting ? (lang === "ar" ? "جارٍ الإرسال..." : lang === "fr" ? "Envoi…" : "Sending…") : (lang === "ar" ? "إرسال التنبيه الآن" : lang === "fr" ? "Envoyer" : "Send notification")}</span>
              </button>
            </div>
          </form>
        )}

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bac-scroll">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-xs">{lang === "ar" ? "جارٍ تحميل الإشعارات..." : lang === "fr" ? "Chargement des notifications…" : "Loading notifications…"}</span>
            </div>
          ) : loadError ? (
            <div className="py-12 text-center">
              <p className="text-sm text-rose-300">{lang === "ar" ? "تعذر تحميل الإشعارات." : lang === "fr" ? "Impossible de charger les notifications." : "Could not load notifications."}</p>
              <button type="button" onClick={loadNotifs} className="mt-3 rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                {lang === "ar" ? "إعادة المحاولة" : lang === "fr" ? "Réessayer" : "Try again"}
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-800/80 border border-slate-700 text-slate-500 mx-auto flex items-center justify-center">
                <Bell size={28} />
              </div>
              <p className="text-sm font-bold text-slate-300">
                {activeFilter === "unread"
                  ? lang === "ar"
                    ? "لا توجد أي إشعارات جديدة غير مقروءة"
                    : lang === "fr" ? "Aucune notification non lue" : "No unread notifications"
                  : lang === "ar"
                  ? "سجل الإشعارات فارغ حالياً"
                  : lang === "fr" ? "Aucune notification" : "No notifications"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === "ar"
                  ? "عندما يقوم الإدارة باعتماد الوثائق، أو الموافقة على طلبات التميز والحظر ستظهر هنا فوراً."
                  : lang === "fr" ? "Les validations de documents et décisions apparaîtront ici." : "Document approvals and administrative updates will appear here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const unread = isNotificationUnread(notif, user);
              const titleText = notif.title[lang] || notif.title.ar || "";
              const msgText = notif.message[lang] || notif.message.ar || "";
              const badgeText = notif.badgeLabel?.[lang] || notif.badgeLabel?.ar;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (unread) handleMarkRead(notif);
                  }}
                  className={`group relative rounded-2xl p-4 transition-all duration-200 border cursor-pointer ${
                    unread
                      ? "bg-slate-800/90 border-indigo-500/50 shadow-lg shadow-indigo-950/40 hover:border-indigo-400"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                >
                  {/* Unread indicator beacon */}
                  {unread && (
                    <div className="absolute top-4 end-4 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    {getNotificationIcon(notif.type, notif.iconType)}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {badgeText && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              notif.type === "doc_approved"
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : notif.type === "elite_upgrade"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : notif.type === "moderation_ban"
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                            }`}
                          >
                            {badgeText}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                        </span>
                      </div>

                      <h3 className={`text-xs sm:text-sm font-black leading-snug ${unread ? "text-white" : "text-slate-200"}`}>
                        {titleText}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {msgText}
                      </p>

                      {notif.actionUrl && onNavigateScreen && (
                        <div className="pt-1.5 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (unread) handleMarkRead(notif);
                              onClose();
                              onNavigateScreen(notif.actionUrl!);
                            }}
                            className="px-3 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-indigo-100 text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>{lang === "ar" ? "عرض التفاصيل والانتقال" : lang === "fr" ? "Voir les détails" : "View details"}
                            </span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles size={12} className="text-indigo-400" />
          <span>
            {lang === "ar"
              ? "نظام التنبيهات صامت بالكامل ويعتمد على عداد الإشعارات لضمان تركيز التلاميذ."
              : lang === "fr" ? "Notifications discrètes avec un compteur." : "Notifications stay unobtrusive, with an unread count."}
          </span>
        </div>
      </div>
    </div>
  );
}
