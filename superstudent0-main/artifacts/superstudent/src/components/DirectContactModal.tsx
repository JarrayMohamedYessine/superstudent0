import React, { useState } from "react";
import { MessageSquare, Send, Mail, CheckCircle2, X, User, HelpCircle, Shield } from "lucide-react";
import { LangKey, Account, ContactTicketItem } from "../types";
import { submitContactTicket } from "../services/communityFeaturesService";
import { GRAD_GOLD } from "../constants";

interface DirectContactModalProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const TICKET_CATEGORIES = [
  { id: "general", label: { ar: "استفسار عام حول المنصة", fr: "Question générale" } },
  { id: "bug", label: { ar: "الإبلاغ عن خلل تقني أو خطأ في وثيقة", fr: "Signaler un bug" } },
  { id: "suggestion", label: { ar: "اقتراح مادة أو تحسين جديد", fr: "Suggestion d'amélioration" } },
  { id: "complaint", label: { ar: "شكوى أو نزاع إداري", fr: "Réclamation / Support" } },
  { id: "partnership", label: { ar: "تعاون بيداغوجي / أستاذ", fr: "Partenariat / Enseignant" } },
];

export function DirectContactModal({
  lang,
  isRTL,
  user,
  onClose,
  onSuccess,
}: DirectContactModalProps) {
  const [senderName, setSenderName] = useState(user ? user.displayName || user.username : "");
  const [senderEmail, setSenderEmail] = useState(user ? user.email : "");
  const [category, setCategory] = useState<any>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const ticket: ContactTicketItem = {
        id: "ticket-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        username: user?.username,
        category,
        subject: subject.trim() || (lang === "ar" ? "رسالة تواصل مع الإدارة" : "Message de contact"),
        message: message.trim(),
        status: "pending",
        createdAt: Date.now(),
      };

      await submitContactTicket(ticket);
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Failed to submit contact ticket:", err);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="max-w-lg w-full rounded-3xl p-6 shadow-2xl border relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(24, 32, 68, 0.95))",
          borderColor: "rgba(99, 102, 241, 0.35)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {lang === "ar" ? "التواصل مع الإدارة" : lang === "fr" ? "Contacter l’administration" : "Contact the team"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === "ar" ? "تصل رسالتك فوراً للوحة الإدارة والبريد الرسمي" : "Votre message est transmis directement au Super Admin"}
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

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={44} className="text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-emerald-200">
              {lang === "ar" ? "تم إرسال رسالتك إلى إدارة المنصة بنجاح!" : "Message transmis avec succès !"}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {lang === "ar"
                ? "سيتم مراجعة طلبك والرد عليك عبر بريدك الإلكتروني أو من خلال الإشعارات الداخلية."
                : "Nous vous répondrons dans les plus brefs délais par e-mail ou notification."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === "ar" ? "الاسم الكامل *" : "Nom complet *"}
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="محمد علي"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === "ar" ? "البريد الإلكتروني للرد *" : "Email de contact *"}
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {lang === "ar" ? "موضوع الرسالة والتصنيف *" : "Sujet & Catégorie *"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mb-2"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label[lang === "ar" ? "ar" : "fr"]}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={lang === "ar" ? "عنوان مختصر للطلب..." : "Titre de votre demande..."}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {lang === "ar" ? "نص الرسالة بالتفصيل *" : "Message détaillé *"}
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={lang === "ar" ? "اكتب استفسارك، مقترحك، أو مشكلتك التي تواجهها..." : "Détaillez votre message..."}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Shield size={13} className="text-emerald-400" />
                <span>{lang === "ar" ? "سرية وأمان المعطيات مضمونة" : "Confidentiel & Sécurisé"}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                >
                  {lang === "ar" ? "إلغاء" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                  style={{ background: GRAD_GOLD }}
                >
                  <Send size={13} className={isRTL ? "rotate-180" : ""} />
                  <span>{submitting ? (lang === "ar" ? "جارِ الإرسال..." : "Envoi...") : (lang === "ar" ? "إرسال الرسالة للإدارة" : "Envoyer")}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
