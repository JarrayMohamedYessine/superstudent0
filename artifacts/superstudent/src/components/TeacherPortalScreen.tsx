import React, { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  FileCheck,
  Sparkles,
  MessageSquare,
  Award,
  Upload,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Users,
  Send,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FolderOpen,
} from "lucide-react";
import { Account, LangKey, BacDocumentItem } from "../types";
import { SUBJECTS, BRANCHES } from "../constants";
import { TopBar } from "./Atoms";

interface TeacherPortalScreenProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account;
  onOpenAddDocument: () => void;
  onNavigateToRooms: (roomId?: string) => void;
  onNavigateToDocuments: () => void;
  onOpenSettings?: () => void;
  onOpenAdmin?: () => void;
  unreadNotifCount?: number;
}

export function TeacherPortalScreen({
  lang,
  isRTL,
  user,
  onOpenAddDocument,
  onNavigateToRooms,
  onNavigateToDocuments,
  onOpenSettings,
  onOpenAdmin,
  unreadNotifCount = 0,
}: TeacherPortalScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "guidelines" | "qa_hub" | "resources">("overview");

  // Sample pedagogical guidelines published by teachers
  const [tips, setTips] = useState<Array<{ id: string; subject: string; title: string; content: string; date: string }>>([
    {
      id: "tip-1",
      subject: "الرياضيات",
      title: "منهجية معالجة مسائل الأعداد المركبة والمتتاليات في البكالوريا",
      content: "ابدأ دائمًا بتحديد مجموعة التعريف والشروط الأولية، واحرص على كتابة البرهان بالتراجع خطوة بخطوة مع التعليل الرياضي الدقيق.",
      date: "أكتوبر 2026",
    },
    {
      id: "tip-2",
      subject: "الفيزياء والكيمياء",
      title: "كيف تتجنب خسارة النقاط في التحليل البعدي والوحدات الدولية",
      content: "تأكد من كتابة العلاقات الحرفية قبل التعويض العددي، وتحويل الوحدات إلى النظام العالمي (SI) بدقة مع الانتباه للأرقام المعنوية.",
      date: "أكتوبر 2026",
    },
    {
      id: "tip-3",
      subject: "الفلسفة",
      title: "بناء الإشكالية والمفهمة في مقال البكالوريا",
      content: "الإشكالية ليست مجرد سؤال بل هي إحراج نظري يقتضي لحظات تدرج محكمة ومساءلة نقدية للمفاهيم الأساسية.",
      date: "أكتوبر 2026",
    },
  ]);

  const [newTipSubject, setNewTipSubject] = useState("الرياضيات");
  const [newTipTitle, setNewTipTitle] = useState("");
  const [newTipContent, setNewTipContent] = useState("");
  const [tipSuccess, setTipSuccess] = useState(false);

  function handleAddTip(e: React.FormEvent) {
    e.preventDefault();
    if (!newTipTitle.trim() || !newTipContent.trim()) return;
    const newEntry = {
      id: `tip-${Date.now()}`,
      subject: newTipSubject,
      title: newTipTitle.trim(),
      content: newTipContent.trim(),
      date: "الآن",
    };
    setTips([newEntry, ...tips]);
    setNewTipTitle("");
    setNewTipContent("");
    setTipSuccess(true);
    setTimeout(() => setTipSuccess(false), 3000);
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
      <TopBar
        lang={lang}
        user={user}
        onOpenSettings={onOpenSettings}
        onOpenAdmin={user.role === "superadmin" ? onOpenAdmin : undefined}
        isRTL={isRTL}
        title={lang === "ar" ? "فضاء الأستاذ المعتمد" : "Espace Enseignant"}
        subtitle={lang === "ar" ? "منصة المساهمة البيداغوجية والتأطير الأكاديمي" : "Espace académique et pédagogique"}
        unreadNotificationsCount={unreadNotifCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ━━━━━━━━━━━━━━━━━━━━ TEACHER HERO BANNER ━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/70 border border-emerald-500/30 shadow-2xl">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 p-0.5 shadow-xl shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-emerald-400">
                  <GraduationCap size={32} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>{lang === "ar" ? "أستاذ معتمد ومؤطر أكاديمي" : "Enseignant Certifié"}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    SuperStudent Faculty
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {lang === "ar" ? `مرحباً بك أستاذ ${user.displayName}` : `Bienvenue Professeur ${user.displayName}`}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {lang === "ar"
                    ? "فضاء خاص بك لنشر الإصلاحات النموذجية، وتزويد التلاميذ بالنصائح المنهجية، والإشراف على الأسئلة في قاعات المذاكرة."
                    : "Votre espace dédié pour partager les corrigés, dispenser des conseils méthodologiques et encadrer les élèves."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={onOpenAddDocument}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <PlusCircle size={16} />
                <span>{lang === "ar" ? "نشر وثيقة / إصلاح نموذجي" : "Publier un corrigé / cours"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━ METRICS CARDS ━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">
              {lang === "ar" ? "المساهمات المنشورة" : "Contributions"}
            </span>
            <p className="text-2xl font-black text-emerald-400">12</p>
            <span className="text-[10px] text-slate-500">{lang === "ar" ? "وثيقة وإصلاح معتمد" : "documents publiés"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">
              {lang === "ar" ? "تحميلات التلاميذ" : "Téléchargements"}
            </span>
            <p className="text-2xl font-black text-cyan-400">3,450+</p>
            <span className="text-[10px] text-slate-500">{lang === "ar" ? "تلميذ استفاد منها" : "élèves bénéficiaires"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">
              {lang === "ar" ? "نقاط الامتنان والتأثير" : "Reconnaissance"}
            </span>
            <p className="text-2xl font-black text-amber-400">99.4%</p>
            <span className="text-[10px] text-slate-500">{lang === "ar" ? "تقييم إيجابي من التلاميذ" : "avis positifs"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-md">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">
              {lang === "ar" ? "شارة الأستاذ" : "Statut Enseignant"}
            </span>
            <p className="text-sm font-bold text-teal-300 mt-1 flex items-center gap-1">
              <Award size={16} className="text-emerald-400" />
              <span>{lang === "ar" ? "نشط ومعتمد" : "Certifié"}</span>
            </p>
            <span className="text-[10px] text-slate-500">{lang === "ar" ? "كامل الصلاحيات البيداغوجية" : "Accès complet"}</span>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━ TABS NAVIGATION ━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "overview" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            <span>{lang === "ar" ? "لوحة التوجيه والعمل البيداغوجي" : "Vue d’ensemble"}</span>
          </button>

          <button
            onClick={() => setActiveTab("guidelines")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "guidelines" ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={14} />
            <span>{lang === "ar" ? "النصائح والتوجيهات المنهجية للبكالوريا" : "Conseils méthodologiques"}</span>
          </button>

          <button
            onClick={() => setActiveTab("qa_hub")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "qa_hub" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare size={14} />
            <span>{lang === "ar" ? "قاعات المذاكرة وتأطير التلاميذ" : "Encadrement & Salons"}</span>
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━ TAB CONTENT: OVERVIEW ━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Action Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {lang === "ar" ? "إضافة وثائق وفروض تأليفية مع الإصلاح النموذجي" : "Ajouter des sujets avec corrigés"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {lang === "ar" ? "تُبرز مساهماتك في بنك الوثائق مع شارة «أستاذ معتمد»" : "Vos publications apparaîtront avec le badge enseignant"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenAddDocument}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <PlusCircle size={14} />
                    <span>{lang === "ar" ? "إضافة الآن" : "Ajouter"}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === "ar"
                      ? "بصفتك أستاذًا، يمكنك رفع وثائق حتى 25 ميغابايت لكل ملف (الموضوع + الإصلاح) مع قراءة تفاعلية مباشرة، ليتمكن تلاميذ كافة الشعب من الاستفادة منها مباشرة."
                      : "Vous pouvez importer des documents jusqu’à 25 Mo avec prévisualisation et corrigés."}
                  </p>
                </div>
              </div>

              {/* Study Rooms Direct Access */}
              <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-indigo-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {lang === "ar" ? "قاعات المذاكرة التفاعلية للشعب" : "Salons de discussion des filières"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {lang === "ar" ? "الإجابة على أسئلة التلاميذ وتقديم التوضيحات المباشرة" : "Répondre aux questions des élèves en direct"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateToRooms()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>{lang === "ar" ? "دخول القاعات" : "Ouvrir les salons"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {BRANCHES.slice(0, 6).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onNavigateToRooms(b.id)}
                      className="p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-left rtl:text-right transition-all cursor-pointer group"
                    >
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {b.name[lang]}
                      </p>
                      <span className="text-[10px] text-slate-500">غرفة المادة والمذاكرة</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Award size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {lang === "ar" ? "ميثاق الأستاذ المؤطر" : "Charte Enseignant"}
                  </h3>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{lang === "ar" ? "تقديم إصلاحات نموذجية مدعمة بالتوجيهات وسلم التنقيط." : "Fournir des corrigés détaillés et clairs."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{lang === "ar" ? "تحفيز التلاميذ ومساعدتهم على تجاوز الصعوبات المنهجية." : "Encourager les élèves et clarifier la méthodologie."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{lang === "ar" ? "التأكد من خلو الملفات من أي حقوق ملكية مانعة للمشاركة التعليمية." : "Respecter les règles de partage académique libre."}</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/30 text-center space-y-3">
                <Sparkles size={28} className="text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">
                  {lang === "ar" ? "شكراً لعطائكم المستمر" : "Merci pour votre engagement"}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === "ar"
                    ? "مساهماتكم البيداغوجية هي حجر الأساس في نجاح وتفوق تلاميذ البكالوريا في كامل تراب الجمهورية التونسية."
                    : "Votre contribution soutient la réussite de milliers de bacheliers."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━ TAB CONTENT: GUIDELINES & TIPS ━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "guidelines" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Tip Form */}
            <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-emerald-500/30 space-y-4 shadow-xl h-fit">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === "ar" ? "نشر نصيحة أو توجيه منهجي" : "Publier un conseil"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === "ar" ? "يظهر في الصفحة الرئيسية وقاعات المذاكرة" : "Visible sur l’accueil et les salons"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddTip} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {lang === "ar" ? "المادة" : "Matière"}
                  </label>
                  <select
                    value={newTipSubject}
                    onChange={(e) => setNewTipSubject(e.target.value)}
                    className="w-full bg-[#1E293B] text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(SUBJECTS).map(([k, s]) => (
                      <option key={k} value={s.name[lang]}>
                        {s.name[lang]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {lang === "ar" ? "عنوان التوجيه / المهارة" : "Titre"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTipTitle}
                    onChange={(e) => setNewTipTitle(e.target.value)}
                    placeholder={lang === "ar" ? "مثال: كيفية تجنب الأخطاء الشائعة في..." : "Ex: Comment éviter les erreurs dans..."}
                    className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {lang === "ar" ? "نص النصيحة والتوجيه المنهجي" : "Contenu du conseil"}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newTipContent}
                    onChange={(e) => setNewTipContent(e.target.value)}
                    placeholder={lang === "ar" ? "اكتب توجيهاتك ونصائحك الدقيقة للتلاميذ..." : "Rédigez vos recommandations..."}
                    className="w-full bg-[#1E293B] text-white text-xs rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {tipSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    {lang === "ar" ? "✅ تم نشر التوجيه المنهجي بنجاح!" : "Conseil publié avec succès !"}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Send size={14} />
                  <span>{lang === "ar" ? "نشر التوجيه الآن" : "Publier"}</span>
                </button>
              </form>
            </div>

            {/* Published Tips List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{lang === "ar" ? "التوجيهات المنهجية المنشورة من طرف الأساتذة" : "Conseils méthodologiques publiés"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {tips.length}
                </span>
              </h3>

              <div className="space-y-3">
                {tips.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-3xl bg-[#0F172A]/90 border border-slate-800 space-y-2.5 shadow-md hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {t.subject}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock size={12} />
                        <span>{t.date}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{t.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.content}</p>

                    <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800">
                      <GraduationCap size={13} className="text-emerald-400" />
                      <span>{lang === "ar" ? `توجيه معتمد من الأستاذ: ${user.displayName}` : `Conseil certifié par Prof. ${user.displayName}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━ TAB CONTENT: QA HUB ━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "qa_hub" && (
          <div className="p-8 rounded-3xl bg-[#0F172A]/90 border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === "ar" ? "قاعات المذاكرة التفاعلية ومرافقة التلاميذ" : "Accompagnement dans les salons"}
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
              {lang === "ar"
                ? "انضم الآن إلى قاعات المذاكرة التفاعلية حسب الشعبة والمادة لمتابعة استفسارات التلاميذ، ومشاركتهم الحلول النموذجية، وتقديم الإرشاد الأكاديمي المباشر."
                : "Rejoignez les salons d’étude pour encadrer les élèves et répondre à leurs questions."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateToRooms()}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all hover:scale-105"
              >
                <ExternalLink size={16} />
                <span>{lang === "ar" ? "الانتقال إلى قاعات المذاكرة الآن" : "Ouvrir les salons d’étude"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
