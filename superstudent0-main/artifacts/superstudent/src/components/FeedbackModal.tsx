import React, { useState } from "react";
import { X, MessageSquarePlus, Star, Send, CheckCircle, Lock } from "lucide-react";
import { LangKey, Account } from "../types";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LangKey;
  isRTL?: boolean;
  user?: Account | null;
  onRequireAuth?: () => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  lang,
  isRTL = true,
  user,
  onRequireAuth,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onClose();
      onRequireAuth?.();
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setComment("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">
              {lang === "ar" ? "آراء وملاحظات التلاميذ" : "Avis et Évaluations"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!user ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">
                  {lang === "ar" ? "تسجيل الدخول مطلوب" : "Connexion requise"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === "ar"
                    ? "إرسال التقييمات والملاحظات متاح حصرياً للحسابات المسجلة لضمان جودة وموثوقية الآراء."
                    : "L’envoi d’avis et d’évaluations est réservé aux membres connectés."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequireAuth?.();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{lang === "ar" ? "تسجيل الدخول / إنشاء حساب" : "Se Connecter"}</span>
              </button>
            </div>
          ) : submitted ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-base">
                {lang === "ar" ? "شكراً جزيلاً لتقييمك وملاحظاتك!" : "Merci pour votre retour !"}
              </h4>
              <p className="text-xs text-slate-400">
                {lang === "ar" ? "نعمل باستمرار على تطوير المنصة لخدمتكم." : "Nous développons constamment la plateforme."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                  {lang === "ar" ? "كيف تقيم تجربتك مع منصة SuperStudent؟" : "Comment évaluez-vous votre expérience ?"}
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === "ar" ? "اقتراحاتك أو ملاحظاتك" : "Vos suggestions"}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={lang === "ar" ? "شاركنا بأي تحسين أو ميزة ترغب في إضافتها للمنصة..." : "Partagez vos idées d'amélioration..."}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "إرسال التقييم" : "Envoyer"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
