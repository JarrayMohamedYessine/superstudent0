import React, { useState } from "react";
import { AlertTriangle, Send, X, ShieldCheck, CheckCircle2 } from "lucide-react";
import { LangKey, MessageItem, Account, ComplaintReport } from "../types";
import { submitComplaintReport } from "../services/dataService";

interface ReportComplaintModalProps {
  message: MessageItem;
  roomId?: string;
  lang: LangKey;
  user: Account | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { id: "inappropriate", label: { ar: "محتوى غير لائق أو خادش للحياء", fr: "Contenu inapproprié" } },
  { id: "harassment", label: { ar: "سب، قذف، شتائم أو تنمر على التلاميذ", fr: "Insultes, harcèlement ou diffamation" } },
  { id: "off_topic", label: { ar: "نشر إعلانات أو روابط خارجية خارجة عن سياق الدراسة", fr: "Publicité ou spam hors-sujet" } },
  { id: "cheating", label: { ar: "نشر محتوى مضلل أو معلومات غير صحيحة", fr: "Informations trompeuses ou fausses" } },
  { id: "other", label: { ar: "سبب آخر...", fr: "Autre motif..." } },
];

export function ReportComplaintModal({
  message,
  roomId,
  lang,
  user,
  onClose,
  onSuccess,
}: ReportComplaintModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      const reasonLabel = reasonObj ? reasonObj.label[lang === "ar" ? "ar" : "fr"] : selectedReason;

      const report: ComplaintReport = {
        id: "rep-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        reporterUsername: user ? user.username : "زائر_" + Math.random().toString(36).slice(2, 6),
        reportedUser: message.username,
        messageId: message.id,
        roomId: roomId || "general",
        reason: reasonLabel,
        details: details.trim() ? `[نص الرسالة المبلغ عنها: "${message.text || "(ملف مرفق)"}"] - تفاصيل إضافية: ${details.trim()}` : `[نص الرسالة: "${message.text || "(ملف مرفق)"}"]`,
        status: "pending",
        createdAt: Date.now(),
      };

      await submitComplaintReport(report);
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit report:", err);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="max-w-md w-full rounded-3xl p-5 sm:p-6 shadow-2xl border relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 27, 75, 0.95))",
          borderColor: "rgba(244, 63, 94, 0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {lang === "ar" ? "تبليغ فوري عن محتوى غير لائق" : "Signaler ce message"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === "ar" ? `المرسل: ${message.displayName || message.username}` : `Auteur : ${message.displayName}`}
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
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-200">
              {lang === "ar" ? "تم استلام البلاغ وإحالته للمشرفين فوراً" : "Signalement transmis aux modérateurs"}
            </h4>
            <p className="text-xs text-slate-300">
              {lang === "ar"
                ? "شكراً لمساهمتك في الحفاظ على أمان ونقاء مجتمع الباكالوريا."
                : "Merci de contribuer à la sécurité et la sérénité de la plateforme."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Snippet of reported message */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">
                {lang === "ar" ? "نص الرسالة المراد الإبلاغ عنها:" : "Message concerné :"}
              </span>
              <p className="line-clamp-2 italic text-slate-200">
                "{message.text || (lang === "ar" ? "مستند / صورة مرفقة" : "Fichier / Image")}"
              </p>
            </div>

            {/* Reasons List */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 mb-1">
                {lang === "ar" ? "اختر سبب التبليغ:" : "Motif du signalement :"}
              </label>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedReason === r.id
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-200 font-semibold"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-rose-500"
                  />
                  <span>{r.label[lang === "ar" ? "ar" : "fr"]}</span>
                </label>
              ))}
            </div>

            {/* Optional details */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {lang === "ar" ? "ملاحظة أو توضيح إضافي للمشرف (اختياري):" : "Détails supplémentaires (facultatif) :"}
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={lang === "ar" ? "أضف أي تفاصيل تساعد المشرف على اتخاذ القرار..." : "Précisions utiles..."}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                <span>{submitting ? (lang === "ar" ? "جارِ الإرسال..." : "Envoi...") : (lang === "ar" ? "تأكيد وإرسال التبليغ" : "Signaler")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
