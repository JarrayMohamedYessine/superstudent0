import React, { useState } from "react";
import { X, Crown, Sparkles, CheckCircle, Lock } from "lucide-react";
import { LangKey, Account } from "../types";

interface EliteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LangKey;
  isRTL?: boolean;
  user?: Account | null;
  onRequireAuth?: () => void;
}

export function EliteStudentModal({
  isOpen,
  onClose,
  lang,
  isRTL = true,
  user,
  onRequireAuth,
}: EliteStudentModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [highSchool, setHighSchool] = useState("");
  const [average, setAverage] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">
              {lang === "ar" ? "برنامج التلميذ المتميز (Elite Student)" : "Programme Élève d'Élite"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!user ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">
                  {lang === "ar" ? "تسجيل الدخول مطلوب للترشح" : "Connexion requise pour postuler"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === "ar"
                    ? "يجب إنشاء حساب أو تسجيل الدخول أولاً لتقديم طلب الانضمام لبرنامج النخبة والمساهمة في المنصة."
                    : "Vous devez être connecté pour déposer votre candidature au programme d'élite."}
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
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-lg">
                {lang === "ar" ? "تم إرسال طلب الانضمام بنجاح!" : "Candidature envoyée avec succès !"}
              </h4>
              <p className="text-xs text-slate-400">
                {lang === "ar"
                  ? "سيتم مراجعة ملفك وتفعيل شارة التميز وإذن رفع الوثائق في بنك الملفات لحسابك."
                  : "Votre dossier sera examiné et le statut contributeur d'élite sera activé."}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold mt-4 cursor-pointer"
              >
                {lang === "ar" ? "حسناً" : "D'accord"}
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === "ar"
                  ? "يمنح برنامج النخبة للتلاميذ المتميزين في المعاهد التونسية شارة «تلميذ متميز»، وإذن نشر الفروض والإصلاحات في بنك الوثائق، وأولوية التأطير في قاعات المذاكرة."
                  : "Le programme d'élite permet de publier des documents, d'obtenir le badge officiel et d'encadrer les salons."}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {lang === "ar" ? "المعهد الثانوي والولاية *" : "Lycée et Gouvernorat *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={highSchool}
                    onChange={(e) => setHighSchool(e.target.value)}
                    placeholder={lang === "ar" ? "المعهد النموذجي بأريانة / تونس..." : "Ex: Lycée Pilote..."}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {lang === "ar" ? "معدل الثلاثي الفارط *" : "Moyenne trimestrielle *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={average}
                    onChange={(e) => setAverage(e.target.value)}
                    placeholder={lang === "ar" ? "مثال: 16.75" : "Ex: 16.75"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (highSchool.trim() && average.trim()) {
                    setSubmitted(true);
                  }
                }}
                disabled={!highSchool.trim() || !average.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === "ar" ? "تقديم طلب الترشح لبرنامج النخبة" : "Déposer ma candidature"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
