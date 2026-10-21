import React, { useState, useEffect } from "react";
import {
  Megaphone,
  X,
  Clock,
  Sparkles,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Account, HomepageAnnouncement, LangKey } from "../types";
import {
  getActiveAnnouncementForUser,
  dismissAnnouncementPermanently,
} from "../services/announcementService";

interface HomepageAnnouncementBannerProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
}

export function HomepageAnnouncementBanner({
  lang,
  isRTL,
  user,
}: HomepageAnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<HomepageAnnouncement | null>(null);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function fetchAnn() {
      const ann = await getActiveAnnouncementForUser(user);
      if (isMounted) {
        setAnnouncement(ann);
      }
    }
    fetchAnn();

    // Re-check periodically
    const interval = setInterval(fetchAnn, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Live countdown
  useEffect(() => {
    if (!announcement?.expiresAt) return;

    function updateRemaining() {
      if (!announcement) return;
      const now = Date.now();
      const diff = announcement.expiresAt - now;
      if (diff <= 0) {
        setTimeLeftStr(lang === "ar" ? "منتهي الصلاحية" : "Expiré");
        return;
      }
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const totalMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (lang === "ar") {
        if (totalHours > 0) {
          setTimeLeftStr(`متبقي: ${totalHours} ساعة و ${totalMinutes} دقيقة`);
        } else {
          setTimeLeftStr(`متبقي: ${totalMinutes} دقيقة`);
        }
      } else if (lang === "fr") {
        if (totalHours > 0) {
          setTimeLeftStr(`Reste: ${totalHours}h ${totalMinutes}min`);
        } else {
          setTimeLeftStr(`Reste: ${totalMinutes}min`);
        }
      } else {
        if (totalHours > 0) {
          setTimeLeftStr(`Remaining: ${totalHours}h ${totalMinutes}m`);
        } else {
          setTimeLeftStr(`Remaining: ${totalMinutes}m`);
        }
      }
    }

    updateRemaining();
    const timer = setInterval(updateRemaining, 30000);
    return () => clearInterval(timer);
  }, [announcement, lang]);

  if (!announcement || sessionDismissed) {
    return null;
  }

  const titleText =
    typeof announcement.title === "object"
      ? announcement.title[lang] || announcement.title["ar"] || ""
      : announcement.title;

  const messageText =
    typeof announcement.message === "object"
      ? announcement.message[lang] || announcement.message["ar"] || ""
      : announcement.message;

  const badgeText: string =
    typeof announcement.badge === "object" && announcement.badge !== null
      ? announcement.badge[lang] || announcement.badge["ar"] || ""
      : typeof announcement.badge === "string"
      ? announcement.badge
      : lang === "ar"
      ? "إعلان رسمي"
      : "Annonce Officielle";

  function handleTemporaryDismiss() {
    // Dismiss for current session only (will show again on reload/next open)
    setSessionDismissed(true);
  }

  function handlePermanentDismiss() {
    // Dismiss permanently for this announcement ID
    if (announcement) {
      dismissAnnouncementPermanently(announcement.id);
    }
    setSessionDismissed(true);
  }

  // Style configurations
  const styleConfigs = {
    gold: {
      border: "border-amber-500/40 hover:border-amber-400/60",
      bg: "bg-gradient-to-r from-[#1A1605]/95 via-[#1E1906]/90 to-[#0F172A]/95",
      glow: "shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]",
      badgeBg: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30",
      iconColor: "text-amber-400",
      accentText: "text-amber-300",
      pill: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    },
    emerald: {
      border: "border-emerald-500/40 hover:border-emerald-400/60",
      bg: "bg-gradient-to-r from-[#061C14]/95 via-[#0A261D]/90 to-[#0F172A]/95",
      glow: "shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]",
      badgeBg: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
      iconColor: "text-emerald-400",
      accentText: "text-emerald-300",
      pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    },
    rose: {
      border: "border-rose-500/40 hover:border-rose-400/60",
      bg: "bg-gradient-to-r from-[#200A12]/95 via-[#2A0E1A]/90 to-[#0F172A]/95",
      glow: "shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)]",
      badgeBg: "bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
      iconColor: "text-rose-400",
      accentText: "text-rose-300",
      pill: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    },
    cyan: {
      border: "border-cyan-500/40 hover:border-cyan-400/60",
      bg: "bg-gradient-to-r from-[#061A24]/95 via-[#092230]/90 to-[#0F172A]/95",
      glow: "shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]",
      badgeBg: "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
      iconColor: "text-cyan-400",
      accentText: "text-cyan-300",
      pill: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    },
    indigo: {
      border: "border-indigo-500/40 hover:border-indigo-400/60",
      bg: "bg-gradient-to-r from-[#12112A]/95 via-[#181639]/90 to-[#0F172A]/95",
      glow: "shadow-[0_0_25px_-5px_rgba(99,102,241,0.25)]",
      badgeBg: "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30",
      iconColor: "text-indigo-400",
      accentText: "text-indigo-300",
      pill: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    },
  };

  const styleKey =
    announcement.style && announcement.style in styleConfigs
      ? (announcement.style as keyof typeof styleConfigs)
      : "gold";
  const currentTheme = styleConfigs[styleKey];

  return (
    <div
      id="homepage-admin-announcement-floating"
      className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-xl z-50 pointer-events-auto bac-in"
    >
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border ${currentTheme.border} ${currentTheme.bg} ${currentTheme.glow} backdrop-blur-2xl p-4 sm:p-5 shadow-2xl transition-all duration-300`}
        style={{
          boxShadow: "0 20px 50px -10px rgba(0,0,0,0.8), 0 0 30px -5px rgba(245,158,11,0.2)",
        }}
      >
        {/* Decorative ambient background flares */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Badge, Time Left, Dismiss X */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${currentTheme.badgeBg}`}
            >
              <Megaphone size={13} className={currentTheme.iconColor} />
              <span>{badgeText}</span>
            </span>

            {timeLeftStr && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold border ${currentTheme.pill}`}
                title={lang === "ar" ? "الوقت المتبقي لظهور الإعلان" : "Temps restant avant expiration"}
              >
                <Clock size={11} className="animate-pulse" />
                <span>{timeLeftStr}</span>
              </span>
            )}
          </div>

          {/* Dismiss 'X' Button (Temporary for session) */}
          <div className="flex items-center gap-1">
            <button
              id="btn-dismiss-announcement-temp"
              onClick={handleTemporaryDismiss}
              className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm border border-white/10"
              title={
                lang === "ar"
                  ? "إخفاء مؤقت (سيظهر مرة أخرى عند فتح الموقع)"
                  : "Masquer temporairement (réapparaîtra à la prochaine ouverture)"
              }
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Center Body: Title and Message */}
        <div className="relative z-10 space-y-2">
          <h4 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
            <span>{titleText}</span>
          </h4>

          <p className="text-xs sm:text-sm text-slate-200/95 leading-relaxed max-h-36 overflow-y-auto pr-1">
            {messageText}
          </p>
        </div>

        {/* Bottom Bar: Permanent Dismiss Option & Actions */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap relative z-10 text-xs">
          <div className="flex items-center gap-2">
            {/* Permanent Dismiss Button */}
            <button
              id="btn-dismiss-announcement-permanent"
              onClick={handlePermanentDismiss}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-white/10 transition-colors cursor-pointer"
            >
              <EyeOff size={13} />
              <span>{lang === "ar" ? "عدم الظهور مرة أخرى" : "Ne plus afficher"}</span>
            </button>
          </div>

          {/* Official Signature */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-purple-400" />
            <span>{lang === "ar" ? "إدارة SuperStudent الرسمية" : "Administration SuperStudent"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
