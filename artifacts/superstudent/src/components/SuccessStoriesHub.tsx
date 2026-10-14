import React, { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Sparkles,
  Heart,
  Share2,
  CheckCircle2,
  GraduationCap,
  Quote,
  Send,
  PlusCircle,
  Filter,
  Check,
  ChevronRight,
} from "lucide-react";
import { LangKey, Account, SuccessStoryItem } from "../types";
import { BRANCHES, COLORS, GRAD, GRAD_GOLD } from "../constants";
import { getSuccessStories, submitSuccessStory } from "../services/communityFeaturesService";
import { TopBar } from "./Atoms";

interface SuccessStoriesHubProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  onRequireAuth?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export function SuccessStoriesHub({
  lang,
  isRTL,
  user,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onRequireAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: SuccessStoriesHubProps) {
  const [stories, setStories] = useState<SuccessStoryItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState("");
  const [branchId, setBranchId] = useState("math");
  const [bacYear, setBacYear] = useState(2024);
  const [bacScore, setBacScore] = useState("18.25");
  const [faculty, setFaculty] = useState("");
  const [quote, setQuote] = useState("");
  const [advice, setAdvice] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getSuccessStories();
      setStories(data.filter((s) => s.status === "approved" || s.consentConfirmed));
      setLoading(false);
    }
    load();
  }, []);

  const filteredStories = stories.filter((s) => {
    if (selectedBranch === "all") return true;
    return s.branchId === selectedBranch;
  });

  async function handleSubmitStory(e: React.FormEvent) {
    e.preventDefault();
    if (!consentChecked) {
      alert(lang === "ar" ? "يرجى تأكيد الموافقة الصريحة على نشر تجربتك." : "Veuillez accepter la publication.");
      return;
    }

    const numScore = parseFloat(bacScore);
    if (isNaN(numScore) || numScore < 10 || numScore > 20) {
      alert(lang === "ar" ? "يرجى كتابة معدل صحيح بين 10 و 20." : "Veuillez entrer une moyenne valide.");
      return;
    }

    setSubmitting(true);
    try {
      const newStory: SuccessStoryItem = {
        id: "story-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        studentName: fullName.trim(),
        branchId,
        bacYear: Number(bacYear),
        bacScore: numScore,
        orientationFaculty: faculty.trim() || (lang === "ar" ? "المعهد العالي النموذجي" : "Université"),
        quote: quote.trim(),
        keyAdvice: advice.trim(),
        consentConfirmed: true,
        status: "approved",
        createdAt: Date.now(),
      };

      await submitSuccessStory(newStory);
      setStories((prev) => [newStory, ...prev]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        setFullName("");
        setQuote("");
        setAdvice("");
        setFaculty("");
        setConsentChecked(false);
      }, 1800);
    } catch (err) {
      console.error("Failed to submit story:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full flex flex-col min-h-screen">
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={lang === "ar" ? "قصص نجاح وإلهام الباكالوريا" : "Success Stories & Témoignages"}
        subtitle={lang === "ar" ? "تجارب حقيقية من متفوقي الدورات السابقة ونصائح التوجيه الجامعي" : "Parcours d'excellence & Conseils d'anciens lauréats"}
        accent="linear-gradient(90deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%)"
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenSettings={onOpenSettings}
        onRequireAuth={onRequireAuth}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 bac-in pb-20">
        {/* Hero Section */}
        <div
          className="p-6 sm:p-8 rounded-3xl shadow-xl text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(236, 72, 153, 0.18) 100%)",
            border: "1px solid rgba(251, 191, 36, 0.35)",
          }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg" style={{ background: GRAD_GOLD }}>
            <Trophy size={28} className="text-slate-950" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {lang === "ar" ? "لوحة شرف وإلهام الباكالوريا التونسية 🇹🇳" : "Galerie d'Honneur & Témoignages"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl mx-auto leading-relaxed">
            {lang === "ar"
              ? "نخبة من تلاميذ الباكالوريا في تونس يشاركونكم أسرار النجاح، تنظيم أوقات المراجعة، وطرق اختيار الشعبة والتوجيه الجامعي بموافقتهم الصريحة."
              : "Découvrez les retours d'expérience et conseils méthodologiques de bacheliers tunisiens ayant excellé dans leurs filières."}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setShowSubmitModal(true);
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
              style={{ background: GRAD_GOLD }}
            >
              <PlusCircle size={15} />
              <span>{lang === "ar" ? "أنا ناجح سابق: شارك تجربتك وقصتك" : "Partager mon témoignage"}</span>
            </button>
          </div>
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 bac-scroll">
          <button
            onClick={() => setSelectedBranch("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedBranch === "all"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {lang === "ar" ? "جميع الشعب (الكل)" : "Toutes les filières"}
          </button>
          {BRANCHES.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBranch(b.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedBranch === b.id
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {b.name[lang] || b.name.ar}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            {lang === "ar" ? "جارِ تحميل قصص النجاح..." : "Chargement..."}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/5 border border-white/10 text-slate-400 text-xs">
            {lang === "ar" ? "لا توجد قصص منشورة لهذه الشعبة حالياً." : "Aucun témoignage pour cette filière."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStories.map((story) => {
              const branchMeta = BRANCHES.find((b) => b.id === story.branchId);
              return (
                <div
                  key={story.id}
                  className="p-5 sm:p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between shadow-xl space-y-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(15, 23, 48, 0.95), rgba(24, 32, 68, 0.9))",
                    borderColor: "rgba(251, 191, 36, 0.25)",
                  }}
                >
                  {/* Top: Student Header & Score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base shadow-md">
                        {story.studentName.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                          <span>{story.studentName}</span>
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {branchMeta ? branchMeta.name[lang] || branchMeta.name.ar : story.branchId} • {story.bacYear}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                        {story.bacScore.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">{lang === "ar" ? "معدل الباكالوريا" : "Moyenne"}</span>
                    </div>
                  </div>

                  {/* Orientation Faculty */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-indigo-300">
                    <GraduationCap size={16} className="text-indigo-400 shrink-0" />
                    <span className="font-semibold truncate">{story.orientationFaculty}</span>
                  </div>

                  {/* Quote */}
                  <div className="relative pl-3 rtl:pr-3 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 border-amber-400/60 text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                    <Quote size={12} className="inline mr-1 text-amber-400" />
                    "{story.quote}"
                  </div>

                  {/* Key Advice Box */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                    <span className="font-bold block mb-1 flex items-center gap-1 text-amber-300">
                      <Sparkles size={12} />
                      {lang === "ar" ? "النصيحة الذهبية للمترشحين:" : "Conseil clé :"}
                    </span>
                    <p className="text-slate-300 leading-relaxed">{story.keyAdvice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Story Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="max-w-lg w-full bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto bac-scroll">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <Trophy size={20} />
                  </div>
                  <h3 className="text-base font-black text-white">
                    {lang === "ar" ? "مشاركة تجربة وقصة نجاح في الباكالوريا" : "Partager votre succès"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </div>

              {submitSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-200">
                    {lang === "ar" ? "شكرًا لك. تم نشر قصتك." : lang === "fr" ? "Merci, votre histoire a été publiée." : "Thank you. Your story has been published."}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {lang === "ar" ? "ستكون تجربتك مصدر إلهام لآلاف التلاميذ في تونس." : "Votre parcours inspirera des milliers d'élèves."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitStory} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "الاسم واللقب *" : "Nom & Prénom *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: ياسمين التونسي"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "الشعبة *" : "Filière *"}
                      </label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                      >
                        {BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name[lang] || b.name.ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "سنة الباكالوريا *" : "Année du Bac *"}
                      </label>
                      <input
                        type="number"
                        min="2010"
                        max="2026"
                        required
                        value={bacYear}
                        onChange={(e) => setBacYear(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === "ar" ? "معدل الباكالوريا (/20) *" : "Moyenne (/20) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="10"
                        max="20"
                        required
                        value={bacScore}
                        onChange={(e) => setBacScore(e.target.value)}
                        placeholder="18.25"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === "ar" ? "الكلية أو المعهد الموجه إليه حالياً *" : "Orientation / Faculté *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      placeholder={lang === "ar" ? "مثال: كلية الطب، INSAT، IPEST، TBS، IHEC..." : "Ex: Faculté de Médecine, INSAT, IPEST..."}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === "ar" ? "كلمة أو مقولة تعبر عن مسيرتك *" : "Votre citation / philosophie *"}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder={lang === "ar" ? "ما هي قناعتك التي ساعدتك على التفوق؟" : "Votre phrase inspirante..."}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === "ar" ? "نصيحة عملية لتلاميذ الباكالوريا الجدد *" : "Conseil pratique pour les candidats *"}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      placeholder={lang === "ar" ? "كيف يراجعون، كيف يتعاملون مع الضغط، وكيف ينظمون أوقاتهم..." : "Conseils de révision, gestion du stress..."}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  {/* Explicit Consent Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 accent-amber-500 w-4 h-4"
                    />
                    <span>
                      {lang === "ar"
                        ? "أوافق صراحة وبكامل إرادتي على نشر اسمي ومعدلي وتجربتي على منصة BacAdmis.ai لإلهام وتوجيه تلاميذ الباكالوريا."
                        : "Je consens explicitement à la publication de mon témoignage et mes conseils."}
                    </span>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 cursor-pointer"
                    >
                      {lang === "ar" ? "إلغاء" : "Annuler"}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                      style={{ background: GRAD_GOLD }}
                    >
                      <Send size={13} className={isRTL ? "rotate-180" : ""} />
                      <span>{submitting ? (lang === "ar" ? "جارِ الإرسال..." : "Envoi...") : (lang === "ar" ? "إرسال ونشر القصة" : "Publier")}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
