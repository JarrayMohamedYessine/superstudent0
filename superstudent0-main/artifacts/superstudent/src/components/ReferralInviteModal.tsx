import React, { useState } from "react";
import { UserPlus, Copy, Check, Share2, Users, Sparkles, MessageCircle, X } from "lucide-react";
import { LangKey, Account } from "../types";
import { GRAD_GOLD } from "../constants";

interface ReferralInviteModalProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onClose: () => void;
}

export function ReferralInviteModal({
  lang,
  isRTL,
  user,
  onClose,
}: ReferralInviteModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate unique clean invite code based on user's username
  const inviteCode = user
    ? `BAC2026-${user.username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "EXCEL"}`
    : "BAC2026-TUNISIE";

  const inviteUrl = window.location.origin;
  const shareText =
    lang === "ar"
      ? `🇹🇳 انضم إلي على منصة BacAdmis.ai لمراجعة الباكالوريا التونسية! بنك فروض مصلحة، أرشيف 17 سنة، ومساعد ذكاء اصطناعي تونسي مجاناً.\nرابط الدخول: ${inviteUrl}\nكود الانضمام: ${inviteCode}`
      : `🇹🇳 Rejoins-moi sur BacAdmis.ai pour préparer le Bac Tunisien ! Séries corrigées, 17 ans d'annales et tuteur IA.\nLien : ${inviteUrl}\nCode : ${inviteCode}`;

  function handleCopy() {
    navigator.clipboard?.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleWhatsAppShare() {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  }

  function handleTelegramShare() {
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="max-w-md w-full rounded-3xl p-6 shadow-2xl border relative overflow-hidden text-center"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.95))",
          borderColor: "rgba(251, 191, 36, 0.35)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div className="text-start">
              <h3 className="text-base font-black text-white">
                {lang === "ar" ? "دعوة زملاء الدراسة" : lang === "fr" ? "Inviter vos camarades" : "Invite classmates"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === "ar" ? "راجع جماعياً في غرف المواد وتشارك التلاخيص" : "Révisez ensemble dans les salons de matière"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Invite Code Box */}
        <div className="my-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {lang === "ar" ? "كود دعوتك الخاص للمشاركة:" : "Votre code d'invitation :"}
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-widest bg-black/40 py-2.5 px-4 rounded-xl border border-amber-400/30">
            {inviteCode}
          </div>
        </div>

        {/* Benefits Note (No monetary incentives - purely academic peer learning) */}
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 text-start space-y-1 mb-4">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>{lang === "ar" ? "المراجعة التشاركية لباكالوريا 2026:" : "Entraide solidaire :"}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {lang === "ar"
              ? "مشاركة المنصة مع زملائك في المعهد تتيح لكم تبادل الفروض التأليفية وحل سلاسل التمارين بشكل جماعي في غرف المواد المخصصة."
              : "Partagez la plateforme avec vos camarades de classe pour réviser ensemble et échanger les séries d'exercices."}
          </p>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            style={{
              background: copied ? "#10B981" : GRAD_GOLD,
              color: "#0f172a",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? (lang === "ar" ? "تم نسخ كود ورابط الدعوة!" : "Copié !") : (lang === "ar" ? "نسخ رابط وكود الدعوة" : "Copier le lien & code")}</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleTelegramShare}
              className="py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Share2 size={15} />
              <span>Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
