import React, { useState, useRef } from "react";
import {
  Award,
  Sparkles,
  CheckCircle2,
  Send,
  Upload,
  Check,
  X,
  Star,
  Users,
  Volume2,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Briefcase,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { Account, LangKey, StudentFeedbackItem, EliteApplicationItem } from "../types";
import { GRAD, GRAD_GOLD, T } from "../constants";
import { TopBar } from "./Atoms";
import {
  submitStudentFeedback,
  submitEliteApplication,
  getEliteApplications,
  resizeToDataURL,
} from "../services/dataService";

interface FaqAndTrustProps {
  view: "faq" | "about" | "contribute";
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onBack?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  onRequireAuth?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export function FaqAndTrustPages({
  view,
  lang,
  isRTL,
  user,
  onBack,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onRequireAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: FaqAndTrustProps) {
  const t = T[lang];
  const [rating, setRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<"general" | "documents" | "rooms" | "suggestion">("general");
  const [feedbackText, setFeedbackText] = useState("");
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Elite Application State
  const [showEliteForm, setShowEliteForm] = useState(true);
  const [applicantRole, setApplicantRole] = useState<"student" | "professor">("student");
  const [discordUsername, setDiscordUsername] = useState("");
  const [eliteSchoolType, setEliteSchoolType] = useState<"pilot" | "general">("pilot");
  const [eliteScore, setEliteScore] = useState<string>("16.50");
  const [eliteReason, setEliteReason] = useState("");
  const [eliteProofImage, setEliteProofImage] = useState<string | null>(null);
  const [eliteSubmitting, setEliteSubmitting] = useState(false);
  const [eliteSubmitted, setEliteSubmitted] = useState(false);
  const [userAppStatus, setUserAppStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!user) {
      setUserAppStatus(null);
      return;
    }
    let isMounted = true;
    getEliteApplications()
      .then((apps) => {
        if (!isMounted) return;
        const myApp = apps.find(
          (a) =>
            (a.email && a.email.toLowerCase() === user.email.toLowerCase()) ||
            (a.username && a.username.toLowerCase() === user.username.toLowerCase())
        );
        if (myApp) {
          setUserAppStatus(myApp.status);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  const isAlreadyApprovedOrPromoted = Boolean(
    user &&
    (user.role === "teacher" ||
     user.role === "elite_student" ||
     user.role === "superadmin" ||
     user.role === "moderator" ||
     userAppStatus === "approved")
  );

  const isRejected = userAppStatus === "rejected";

  async function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setSurveySubmitting(true);
    try {
      const fbItem: StudentFeedbackItem = {
        id: "fb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
        branch: user.branch || "math",
        gradeLevel: user.gradeLevel,
        rating,
        category: feedbackCategory,
        comment: feedbackText.trim(),
        createdAt: Date.now(),
      };
      await submitStudentFeedback(fbItem);
      setSurveySubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setSurveySubmitted(true);
    } finally {
      setSurveySubmitting(false);
    }
  }

  async function handleProofImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataURL(file, 1200, 0.85, false);
      setEliteProofImage(dataUrl);
    } catch (err) {
      console.error("Proof image error:", err);
    }
  }

  async function handleEliteApplicationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (!discordUsername.trim()) {
      alert(lang === "ar" ? "يرجى إدخال اسم المستخدم في Discord ليتمكن المشرفون من التواصل معك." : lang === "fr" ? "Saisissez votre nom d’utilisateur Discord afin que les modérateurs puissent vous contacter." : "Enter your Discord username so moderators can contact you.");
      return;
    }

    const numScore = parseFloat(eliteScore);
    setEliteSubmitting(true);
    try {
      const appItem: EliteApplicationItem = {
        id: "elite-app-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        avatar: user.avatar,
        branch: user.branch || "math",
        gradeLevel: user.gradeLevel,
        applicantRole,
        discordUsername: discordUsername.trim(),
        schoolType: applicantRole === "student" ? eliteSchoolType : undefined,
        averageScore: applicantRole === "student" && !isNaN(numScore) ? numScore : undefined,
        reason: eliteReason.trim() || (lang === "ar" ? `طلب انضمام كـ ${applicantRole === "professor" ? "أستاذ" : "تلميذ متميز"}` : lang === "fr" ? "Demande de participation" : "Contributor application"),
        proofImageUrl: eliteProofImage || undefined,
        status: "pending",
        uploadedPdfs: [],
        createdAt: Date.now(),
      };
      await submitEliteApplication(appItem);
      setEliteSubmitted(true);
    } catch (err) {
      console.error("Failed to submit application:", err);
      setEliteSubmitted(true);
    } finally {
      setEliteSubmitting(false);
    }
  }

  if (view === "about") {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 bac-in">
        {/* Hero Card */}
        <div
          className="p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl text-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.15) 50%, rgba(251,191,36,0.18))",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-lg" style={{ background: GRAD }}>
            <Award size={32} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{t.aboutTitle}</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl mx-auto leading-relaxed">
            {t.aboutText}
          </p>
        </div>

        {/* Creator & Leadership Profile */}
        <div
          className="p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6"
          style={{
            background: "rgba(15,23,48,0.8)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-xl shrink-0" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            MY
          </div>
          <div className="text-center md:text-start space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h3 className="text-lg font-bold text-white">Mohamed Yessine Jarray</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {lang === "ar" ? "تطوير المنصة" : lang === "fr" ? "Développement de la plateforme" : "Platform development"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === "ar"
                ? "تجمع SuperStudent موارد دراسية منظمة حسب الشعبة، إلى جانب مساحة للتواصل بين التلاميذ."
                : lang === "fr" ? "SuperStudent rassemble des ressources organisées par filière et un espace d’échange entre élèves."
                : "Superstudent brings together study resources organized by track and a space for students to connect."}
            </p>
            <div className="text-xs text-indigo-300 font-mono">myessine976@gmail.com • learningmyj20@gmail.com</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "contribute") {
    return (
      <div className="w-full flex flex-col min-h-screen">
        <TopBar
          lang={lang}
          isRTL={isRTL}
          title={lang === "ar" ? "طلب المساهمة في المنصة" : lang === "fr" ? "Proposer sa contribution" : "Apply to contribute"}
          subtitle={lang === "ar" ? "قدّم طلب مساهمة بالموارد ودعم مجتمع الدراسة" : lang === "fr" ? "Proposez votre contribution et partagez vos ressources" : "Apply to contribute resources and support students"}
          accent="linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
          onBack={onBack}
          user={user}
          onLogout={onLogout}
          onOpenAdmin={onOpenAdmin}
          onOpenSettings={onOpenSettings}
          onRequireAuth={onRequireAuth}
          onOpenNotifications={onOpenNotifications}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 bac-in pb-16">
          {/* ━━━━━━━━━━━━━━━━━━━━ SECTION 1: UPGRADE & PERKS (ترقية العضوية) ━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className="p-6 sm:p-7 rounded-3xl shadow-2xl border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(15,23,48,0.95) 50%, rgba(99,102,241,0.15))",
            borderColor: "rgba(251,191,36,0.35)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 shadow-lg">
                <Award size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {lang === "ar" ? "طلب المساهمة في المنصة" : lang === "fr" ? "Proposer sa contribution" : "Apply to contribute"}
                  </h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {lang === "ar" ? "مراجعة من الإدارة" : lang === "fr" ? "Examen par l’équipe" : "Reviewed by the team"}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {lang === "ar"
                    ? "يمكن للتلاميذ والأساتذة إرسال طلب للمساهمة بالموارد أو دعم مجتمع الدراسة."
                    : lang === "fr" ? "Les élèves et enseignants peuvent proposer des ressources ou aider la communauté étudiante."
                    : "Students and teachers can offer resources or support the student community."}
                </p>
              </div>
            </div>
          </div>

          {/* Core Perks Requested by the User */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} />
              <span>{lang === "ar" ? "طرق المساهمة:" : lang === "fr" ? "Façons de contribuer :" : "Ways to contribute:"}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Perk 1 */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-indigo-500/20 flex flex-col gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Volume2 size={16} />
                </div>
                <h5 className="text-xs font-bold text-white">
                  {lang === "ar" ? "1. دعم جلسات الدراسة" : lang === "fr" ? "1. Soutenir les séances d’étude" : "1. Support study sessions"}
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === "ar"
                    ? "المساعدة في تنظيم جلسات المراجعة الجماعية."
                    : lang === "fr" ? "Aider à organiser des séances de révision en groupe."
                    : "Help organize group study sessions."}
                </p>
              </div>

              {/* Perk 2 */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-purple-500/20 flex flex-col gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <h5 className="text-xs font-bold text-white">
                  {lang === "ar" ? "2. مساعدة الزملاء" : lang === "fr" ? "2. Aider les élèves" : "2. Help other students"}
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === "ar"
                    ? "المساهمة في تنظيم النقاشات وتبادل المعرفة."
                    : lang === "fr" ? "Contribuer à des échanges organisés et au partage des connaissances."
                    : "Contribute to organized discussion and shared learning."}
                </p>
              </div>

              {/* Perk 3 */}
              <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-500/20 flex flex-col gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <h5 className="text-xs font-bold text-white">
                  {lang === "ar" ? "3. مشاركة الموارد" : lang === "fr" ? "3. Partager des ressources" : "3. Share resources"}
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === "ar"
                    ? "إرسال وثائق مسموح بمشاركتها لإضافتها إلى بنك الوثائق."
                    : lang === "fr" ? "Proposer des documents que vous êtes autorisé à partager."
                    : "Submit documents that you are allowed to share."}
                </p>
              </div>
            </div>
          </div>

          {/* The Application Form (Gated for logged-in accounts) */}
          <div className="mt-5 pt-5 border-t border-white/10">
            {isAlreadyApprovedOrPromoted ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-200">
                  {lang === "ar" ? "تمت ترقية وتفعيل حسابك بنجاح ✓" : "Compte vérifié et activé ✓"}
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {lang === "ar"
                    ? "تمت الموافقة على طلبك وتفعيل رتبتك بنجاح، لذلك تم إزالة صفحة طلبات المساهمة من حسابك."
                    : "Votre candidature a été approuvée avec succès. Cette page n'est plus nécessaire."}
                </p>
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow cursor-pointer"
                  >
                    {lang === "ar" ? "العودة إلى الرئيسية" : "Retour à l'accueil"}
                  </button>
                )}
              </div>
            ) : isRejected ? (
              <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3">
                <X size={36} className="text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-rose-200">
                  {lang === "ar" ? "تمت مراجعة طلبك والرد عليه" : "Demande traitée"}
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {lang === "ar"
                    ? "تمت مراجعة طلب المساهمة السابق واتخاذ القرار، ولم تعد هذه الصفحة متاحة للتقديم مرة أخرى."
                    : "Votre demande a été traitée. Les nouvelles candidatures ne sont plus ouvertes."}
                </p>
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow cursor-pointer"
                  >
                    {lang === "ar" ? "العودة إلى الرئيسية" : "Retour à l'accueil"}
                  </button>
                )}
              </div>
            ) : !user ? (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center space-y-3">
                <Lock size={32} className="text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-amber-200">
                  {lang === "ar" ? "تقديم الطلبات متاح فقط للمستخدمين المسجلين" : "Connexion requise pour envoyer une demande"}
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {lang === "ar"
                    ? "يرجى تسجيل الدخول أو إنشاء حساب جديد للتمكن من تقديم طلب المساهمة والنخبة ونشر الموارد."
                    : "Veuillez vous connecter ou créer un compte pour soumettre votre candidature d'accès contributeur."}
                </p>
                <button
                  onClick={() => onRequireAuth?.()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {lang === "ar" ? "تسجيل الدخول / إنشاء حساب جديد" : "Se connecter / Créer un compte"}
                </button>
              </div>
            ) : eliteSubmitted ? (
              <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-200">
                  {lang === "ar" ? "تم إرسال طلبك بنجاح." : lang === "fr" ? "Votre demande a bien été envoyée." : "Your application has been submitted."}
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {lang === "ar"
                    ? "ستراجع الإدارة طلبك وتتواصل معك عند الحاجة."
                    : lang === "fr" ? "L’équipe étudiera votre demande et vous contactera si nécessaire."
                    : "The team will review your application and contact you if needed."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleEliteApplicationSubmit} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap size={15} className="text-amber-400" />
                  <span>{lang === "ar" ? "استمارة طلب الترقية والانضمام" : "Formulaire de Candidature"}</span>
                </h4>

                {/* Role Switcher: Student vs Professor */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    {lang === "ar" ? "صفتك الأكاديمية *" : "Votre statut *"}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setApplicantRole("student")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        applicantRole === "student"
                          ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-md"
                          : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <GraduationCap size={16} />
                      <span>{lang === "ar" ? "تلميذ متميز (16+ / معهد نموذجي)" : "Élève Élite (16+ / Pilote)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApplicantRole("professor")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                        applicantRole === "professor"
                          ? "bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-md"
                          : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Briefcase size={16} />
                      <span>{lang === "ar" ? "أستاذ (Enseignant)" : "Enseignant / Professeur"}</span>
                    </button>
                  </div>
                </div>

                {/* Discord Username Field (No example placeholder) */}
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                  <label className="block text-[11px] font-bold text-indigo-200">
                    {lang === "ar" ? "اسم المستخدم في ديسكورد (Discord Username) *" : "Pseudo Discord *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    placeholder=""
                    className="w-full bg-slate-900/90 border border-indigo-500/40 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-400 font-mono"
                  />
                  <p className="text-[11px] text-indigo-300 font-medium flex items-center gap-1.5">
                    <MessageSquare size={13} />
                    <span>
                      {lang === "ar"
                        ? "الرجاء كتابة اسم المستخدم في ديسكورد ليتواصل معك أحد المشرفين لتفعيل رتبتك."
                        : "Veuillez fournir votre pseudo Discord afin qu'un modérateur prenne contact avec vous."}
                    </span>
                  </p>
                </div>

                {/* Student specific fields (Only shown for student applicants) */}
                {applicantRole === "student" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {lang === "ar" ? "نوع المعهد" : "Type d'établissement"}
                      </label>
                      <select
                        value={eliteSchoolType}
                        onChange={(e) => setEliteSchoolType(e.target.value as "pilot" | "general")}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500"
                      >
                        <option value="pilot">{lang === "ar" ? "معهد نموذجي (Lycée Pilote)" : "Lycée Pilote"}</option>
                        <option value="general">{lang === "ar" ? "معهد عادي مع معدل تفوق 16+" : "Lycée Public / Privé (16+)"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {lang === "ar" ? "معدلك الأخير (/20)" : "Moyenne (/20)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={eliteScore}
                        onChange={(e) => setEliteScore(e.target.value)}
                        placeholder="16.50"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {lang === "ar" ? "رسالة تعريفية ومجال المساهمة" : "Message de motivation"}
                  </label>
                  <textarea
                    rows={2}
                    value={eliteReason}
                    onChange={(e) => setEliteReason(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "أرغب في المساهمة بنشر فروض نموذجية وملخصات دروس وفتح غرف صوتية لتأطير التلاميذ..."
                        : "Je souhaite partager mes résumés et animer des sessions vocales..."
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-500 placeholder:text-slate-600"
                  />
                </div>

                {/* Proof Image Upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {lang === "ar" ? "صورة الإثبات (كشف أعداد / بطاقة تعريف مدرسية أو مهنية)" : "Photo justificative (Bulletin ou carte)"}
                  </label>
                  <input
                    type="file"
                    ref={proofFileInputRef}
                    accept="image/*"
                    onChange={handleProofImageUpload}
                    className="hidden"
                  />

                  {eliteProofImage ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-emerald-500/30">
                      <img
                        src={eliteProofImage}
                        alt="Proof preview"
                        className="w-14 h-14 object-cover rounded-lg border border-white/10"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={13} /> {lang === "ar" ? "تم تحميل صورة الإثبات بنجاح" : "Image chargée"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {lang === "ar" ? "جاهزة للمعاينة والتدقيق من المشرف الأعلى" : "Prête pour vérification"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEliteProofImage(null)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => proofFileInputRef.current?.click()}
                      className="w-full p-3.5 rounded-xl border border-dashed border-white/20 hover:border-amber-400/50 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer transition-colors"
                    >
                      <Upload size={16} className="text-amber-400" />
                      <span>{lang === "ar" ? "انقر لرفع صورة كشف الأعداد أو الإثبات المهني (اختياري)" : "Ajouter une photo justificative (optionnel)"}</span>
                    </button>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={eliteSubmitting}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    style={{ background: GRAD_GOLD }}
                  >
                    <span>{eliteSubmitting ? (lang === "ar" ? "جاري الإرسال..." : "Envoi...") : (lang === "ar" ? "إرسال طلب الترقية للمشرفين" : "Envoyer la candidature")}</span>
                    <Send size={13} className={isRTL ? "rotate-180" : ""} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

  const FAQ_ITEMS = [
    {
      q: {
        ar: "كيف يمكنني تصفح وتحميل وثائق وامتحانات الباكالوريا؟",
        fr: "Comment consulter et télécharger les documents du bac ?",
        en: "How can I browse and download Baccalaureate documents?",
      },
      a: {
        ar: "يمكنك التوجه إلى قسم «بنك الوثائق» من شريط التنقل، واختيار الشعبة والمادة لتصفح الفروض والامتحانات الوطنية والملخصات مع الإصلاح وتحميلها بصيغة PDF مجاناً.",
        fr: "Accédez à la section « Documents », choisissez votre filière et votre matière pour consulter et télécharger les devoirs, examens et fiches corrigées en PDF.",
        en: "Go to the 'Documents' section from the navigation bar, choose your study track and subject to view and download exams and notes in PDF format.",
      },
    },
    {
      q: {
        ar: "ما هو مجتمع Discord وكيف أنضم إلى الغرف الدراسية؟",
        fr: "Qu’est-ce que la communauté Discord et comment la rejoindre ?",
        en: "What is the Discord community and how do I join?",
      },
      a: {
        ar: "هو مجتمع دراسي تفاعلي لتلاميذ الباكالوريا لتبادل الأسئلة وحل التمارين وتنظيم جلسات المراجعة. يمكنك الانضمام مباشرة بالنقر على زر «فتح رابط الدعوة» في قسم Discord.",
        fr: "C’est une communauté d’entraide entre élèves pour réviser et poser vos questions. Cliquez sur « Ouvrir le lien d’invitation » dans l’onglet Discord.",
        en: "It is a collaborative study community for students. You can join directly by clicking 'Open invite link' in the Discord section.",
      },
    },
    {
      q: {
        ar: "هل المنصة وكافة الملفات مجانية بالكامل؟",
        fr: "La plateforme et les documents sont-ils gratuits ?",
        en: "Is the platform and its content completely free?",
      },
      a: {
        ar: "نعم، كافة الموارد والامتحانات والملخصات المتاحة على المنصة مجانية بالكامل ومفتوحة لجميع تلاميذ الباكالوريا.",
        fr: "Oui, toutes les ressources, fiches et épreuves disponibles sur la plateforme sont entièrement gratuites.",
        en: "Yes, all study resources and documents available on the platform are completely free for all students.",
      },
    },
    {
      q: {
        ar: "كيف يمكنني تقديم اقتراح أو الإبلاغ عن مشكلة فنية؟",
        fr: "Comment envoyer une suggestion ou signaler un problème ?",
        en: "How can I submit a suggestion or report an issue?",
      },
      a: {
        ar: "يمكنك تقييم المنصة وتقديم اقتراحاتك عبر نموذج التقييم والمقترحات أدناه، أو مراسلة المطور مباشرة عبر البريد الإلكتروني.",
        fr: "Utilisez le formulaire d’avis ci-dessous ou contactez-nous par e-mail en bas de page.",
        en: "Use the feedback form below or contact us via the email listed at the bottom of the page.",
      },
    },
  ];

  return (
    <div className="w-full flex flex-col min-h-screen">
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={lang === "ar" ? "الأسئلة والدعم" : lang === "fr" ? "FAQ & Support" : "FAQ & Support"}
        subtitle={lang === "ar" ? "إجابات على الأسئلة الشائعة، التقييم، والدعم الفني" : lang === "fr" ? "Questions fréquentes, avis et support technique" : "Frequently asked questions, feedback and support"}
        accent="linear-gradient(90deg, #0284C7 0%, #06B6D4 100%)"
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenSettings={onOpenSettings}
        onRequireAuth={onRequireAuth}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 bac-in pb-16">
        {/* ━━━━━━━━━━━━━━━━━━━━ FAQ ACCORDION SECTION ━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className="p-6 sm:p-7 rounded-3xl shadow-xl border relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(2,132,199,0.12), rgba(15,23,48,0.95) 50%, rgba(6,182,212,0.15))",
            borderColor: "rgba(2,132,199,0.35)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0 shadow-lg">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {lang === "ar" ? "الأسئلة الشائعة" : lang === "fr" ? "Questions fréquentes" : "Frequently Asked Questions"}
              </h2>
              <p className="text-xs text-slate-300">
                {lang === "ar" ? "إجابات وتوضيحات سريعة حول استخدام المنصة ومميزاتها." : "Réponses rapides aux questions les plus fréquentes."}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-black/25 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-start cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {item.q[lang]}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5">
                      {item.a[lang]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━ SECTION 2: SATISFACTION SURVEY & REVIEWS ━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className="p-6 rounded-3xl shadow-xl"
          style={{
            background: "linear-gradient(135deg, rgba(20,28,56,0.9), rgba(15,23,48,0.9))",
            border: "1px solid rgba(251,191,36,0.25)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-400/20 text-amber-400">
              <Star size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === "ar" ? "التواصل مع الإدارة" : t.surveyTitle}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === "ar"
                  ? "رسالتك تصلنا مباشرة، ونقرأ كل كلمة بأنفسنا. قل لنا ما يخطر ببالك بكل صراحة."
                  : t.surveyQuestion}
              </p>
            </div>
          </div>

          {surveySubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center text-xs sm:text-sm text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              <span>{t.surveyThanks}</span>
            </div>
          ) : (
            <form onSubmit={handleSurveySubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">{lang === "ar" ? "تقييمك العام:" : "Note :"}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125"
                      >
                        <Star
                          size={24}
                          className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 font-semibold">{lang === "ar" ? "القسم:" : "Sujet :"}</span>
                  {[
                    { id: "general", label: lang === "ar" ? "عام" : "Général" },
                    { id: "documents", label: lang === "ar" ? "بنك الوثائق والأرشيف" : "Documents" },
                    { id: "rooms", label: lang === "ar" ? "غرف المراجعة" : "Salons" },
                    { id: "suggestion", label: lang === "ar" ? "مقترح ميزة" : "Idée" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackCategory(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                        feedbackCategory === cat.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={lang === "ar" ? "ما هي الميزات أو المواد التي ترغب في إضافتها؟ اكتب رأيك ومقترحاتك بكل حرية..." : "Suggestions d'amélioration..."}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={surveySubmitting || !feedbackText.trim()}
                  className="bac-btn px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  style={{ background: GRAD_GOLD }}
                >
                  <span>{surveySubmitting ? (lang === "ar" ? "جاري الإرسال..." : "Envoi...") : t.surveySubmit}</span>
                  <Send size={13} className={isRTL ? "rotate-180" : ""} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
