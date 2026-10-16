import React, { useState } from "react";
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  CheckCircle,
  Tag,
  Search,
  FileText,
  UserCheck,
  Calendar,
} from "lucide-react";
import { Account, CMSLessonItem, GradeLevel, LangKey } from "../types";
import { BRANCHES, COLORS, GRAD, SUBJECTS, T } from "../constants";

interface LessonsLibraryProps {
  user: Account | null;
  lang: LangKey;
  isRTL: boolean;
  selectedBranch: string;
  selectedGrade: GradeLevel;
  onRequireAuth: () => void;
  onAskAiWithLesson?: (lessonTitle: string, content: string) => void;
}

const INITIAL_LESSONS: CMSLessonItem[] = [
  {
    id: "les-math-1",
    branchId: "math",
    subjectId: "math",
    gradeLevel: "4eme_bac",
    title: {
      ar: "ملخص المتتاليات العددية والتقارب (Suites Numériques)",
      fr: "Fiche synthèse : Suites Numériques & Convergence",
      en: "Summary: Numerical Sequences & Convergence",
    },
    content: `### 1. المتتاليات الحسابية والهندسية
- المتتالية الحسابية: $u_{n+1} = u_n + r$ ، المجموع $S_n = \\frac{n(u_0 + u_{n-1})}{2}$
- المتتالية الهندسية: $u_{n+1} = q \\times u_n$ ، المجموع $S_n = u_0 \\frac{1 - q^n}{1 - q}$

### 2. مبرهنة التقارب المونوتوني
- كل متتالية تزايدية ومكبورة هي متتالية متقاربة.
- كل متتالية تناقصية ومصغورة هي متتالية متقاربة.`,
    keyPoints: ["حساب المجموع بدقة", "دراسة الرتابة والمحدودية", "البرهان بالتراجع (Récurrence)"],
    author: "BacAdmis Academic Board",
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "les-philo-1",
    branchId: "lettres",
    subjectId: "philosophie",
    gradeLevel: "4eme_bac",
    title: {
      ar: "محور الإنساني بين الكثرة والوحدة (L'Humain : Unité et Diversité)",
      fr: "Fiche Révision Philosophie : L'Humain et la Culture",
      en: "Philosophy Summary: The Human Condition & Diversity",
    },
    content: `### الإشكالية المركزية:
هل تلغي الهوية الإنسانية الواحدة تنوع الثقافات وتعددها، أم أن التنوع هو عين التحقق الإنساني؟

### المرجعيات والشواهد المعتمدة:
- **كلود ليفي ستراوس (Claude Lévi-Strauss):** "الإنسانية ليست واحدة بل متعددة بتعدد أشكال ثقافاتها".
- **ابن خلدون:** مفهوم العمران البشري وطبائع الأمم.
- **إيمانويل كانط:** الكونية الأخلاقية والواجب الإنساني.`,
    keyPoints: ["ضبط مفهوم الإنسية والغيرية", "نقد التمركز العرقي والتعصب", "استثمار الشواهد الفلسفية المعمقة"],
    author: "Mohamed Yessine Jarray",
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "les-arabe-cnp-1",
    branchId: "all",
    subjectId: "arabe",
    gradeLevel: "4eme_bac",
    title: {
      ar: "كتاب النصوص الرسمي (CNP): المحور 1 - في التفكير العلمي",
      fr: "Manuel Officiel CNP : Axe 1 - La Pensée Scientifique",
      en: "Official CNP Text: Axis 1 - Scientific Thought",
    },
    content: `### المحور الأول: في التفكير العلمي (المركز الوطني البيداغوجي CNP)
- **نسبية المعرفة الحسية (التوحيدي):** قصة الفيل والعميان عن أفلاطون، النفي والاستدراك بـ (بل / لكن)، بنية النص التفسيري.
- **الشك طريق إلى اليقين (الجاحظ):** الشك المنهجي، التوقف والتثبت، نفي أفعال المقاربة (لا أكاد أشك / لا أكاد أوقن)، والخبر وأنواعه.
- **طريقة البحث العلمي عند ابن الهيثم:** الاستقراء وتصفح الجزئيات، تشريح العين، استعمال "إمّا" للتفصيل واستقصاء الفرضيات.
- **التشريح والدورة الدموية الصغرى (إبراهيم بن مراد عن ابن النفيس):** إثبات الدورة الرئوية الصغرى وتفنيد أقوال جالينوس وابن سينا.
- **فضل علم التاريخ (ابن خلدون):** تأسيس علم العمران ومطابقة الخبر للواقع وقوانين تحول الأحوال، تركيب الحصر (لا... إلا).
- **المفاضلة بين الحساب والبلاغة (التوحيدي):** الحجاج، الموضع (المشتمل أفضل من المشتمل عليه)، والتضاد والتفضيل.
- **في علوم اللسان (ابن خلدون):** أركان اللسان وتحديد الماهية بضميري الغيبة (هو / هي)، والسمع أبو الملكات.
- **إضافة العالم العربي (محمد السويسي):** تفنيد دعاوى الاستشراق حول النقل، والاستفهام بالهمزة المقترن بالنفي (ألم).
- **مضخة الجزري (خالد عزب):** علم الحيل، الكباسات والتروس المسننة وتحويل الحركة.`,
    keyPoints: [
      "إتقان بنية النص التفسيري والحجاجي (المعطى، الضمان، الموضع، النتيجة)",
      "توظيف النوافذ اللغوية: الحصر، الاستدراك، التفضيل، الاستفهام التقريري",
      "الاستعداد لتحرير مقال تحليلي وموضوع إنشائي في امتحان الباكالوريا"
    ],
    author: "CNP - المركز الوطني البيداغوجي",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "les-arabe-cnp-2",
    branchId: "all",
    subjectId: "arabe",
    gradeLevel: "4eme_bac",
    title: {
      ar: "كتاب النصوص الرسمي (CNP): المحور 3 و 4 - حوار الحضارات والفكر والفن",
      fr: "Manuel Officiel CNP : Axes 3 & 4 - Dialogue des Civilisations, Pensée & Arts",
      en: "Official CNP Text: Axes 3 & 4 - Dialogue of Civilizations & Arts",
    },
    content: `### المحور الثالث: في حوار الحضارات
- **الترجمة سبيل إلى حوار الحضارات (المنجي الشملي):** التفاعل الثقافي والأدب العالمي، التوكيد بالتكرار.
- **حتى ندخله آمنين (مصطفى المصمودي):** الثورة الرقمية ومخاطر العولمة، الروابط "على أنّ" (الاستدراك والحالية).
- **أمة تواجه عصراً جديداً (الشاذلي القليبي):** النعت ووظائفه التفسيرية، رهان الهوية والتحديث.
- **حتمية الحوار في عصر العولمة (توفيق بن عامر):** التعليل بـ (لأنّ) والاستنتاج بـ (إذن).
- **حضارة متجذرة (توفيق الحكيم):** ثنائية العقل والقلب بين الشرق والغرب، أسلوب القصر بـ (إنّما).
- **صدام أم ذوبان؟ (يحيى حقي):** أزمة الهوية والانبهار بالآخر، الإضراب بـ (بل).
- **الغرب في مرآة الذات (الطيب صالح):** المفعول المطلق ودوره، والاستفهام (التصديق والتصور).

### المحور الرابع: في الفكر والفن
- **السيف والقانون (توفيق الحكيم):** سلطة القانون مقابل سلطة السيف، استعمال "كلّ" للشمول والاستغراق.
- **التكنولوجيا الحديثة (محمد السيد عبد السلام):** "في" الزمانية وتنوع الحجج (سلطة، منطق، واقع).
- **الديمقراطية أولاً (عبد الرحمان منيف):** العدد الرتبي في ترتيب الحجاج.
- **المسرح والسينما (محمد مندور وعبد السلام المسدي):** الفن الملتزم، وظائف المسرح، المفعول لأجله، والتحقيق بـ "قد".`,
    keyPoints: [
      "استيعاب قضايا العصر: الهوية، العولمة، الديمقراطية، وتأثير الثورة الرقمية",
      "التمييز الدقيق بين شروط الحوار ومقاصده وعوائقه",
      "التحكم في أدوات الربط الحجاجي والتفسيري وصياغة الاستنتاجات"
    ],
    author: "CNP - المركز الوطني البيداغوجي",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "les-phys-1",
    branchId: "sciexp",
    subjectId: "physique",
    gradeLevel: "4eme_bac",
    title: {
      ar: "الدوال والاهتزازات الكهربائية RC و RLC في الفيزياء",
      fr: "Fiche de synthèse : Circuits RC et Oscillations RLC",
      en: "Synthesis Sheet: RC and RLC Oscillating Circuits",
    },
    content: `### المعادلة التفاضلية لدارة RC:
$$\\frac{du_C}{dt} + \\frac{1}{RC} u_C = \\frac{E}{RC}$$
ثابت الزمن $\\tau = RC$. عند $t = \\tau$ يصل الشحن إلى $63\\%$.

### الطاقة المخزنة:
$$E_C = \\frac{1}{2} C u_C^2 \\quad , \\quad E_L = \\frac{1}{2} L i^2$$`,
    keyPoints: ["استنتاج المعادلة التفاضلية بالتوتر والشحنة", "تحديد ثابت الزمن بيانيا وحسابيا", "انحفاظ الطاقة الكلية في غياب المقاومة"],
    author: "BacAdmis Physics Team",
    createdAt: Date.now() - 86400000 * 8,
  },
];

export function LessonsLibrary({
  user,
  lang,
  isRTL,
  selectedBranch,
  selectedGrade,
  onRequireAuth,
  onAskAiWithLesson,
}: LessonsLibraryProps) {
  const t = T[lang];
  const [lessons, setLessons] = useState<CMSLessonItem[]>(INITIAL_LESSONS);
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("math");
  const [newContent, setNewContent] = useState("");
  const [newKeyPoints, setNewKeyPoints] = useState("");

  const canAddLesson = user && (user.role === "superadmin" || user.role === "moderator");

  const filteredLessons = lessons.filter((l) => {
    const matchSubject = activeSubject === "all" || l.subjectId === activeSubject;
    return matchSubject;
  });

  function handleCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const points = newKeyPoints
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const item: CMSLessonItem = {
      id: "les-" + Date.now(),
      branchId: selectedBranch,
      subjectId: newSubject,
      gradeLevel: selectedGrade,
      title: { ar: newTitle, fr: newTitle, en: newTitle },
      content: newContent,
      keyPoints: points.length > 0 ? points : [lang === "ar" ? "مفاهيم أساسية رسمية" : "Notions essentielles"],
      author: user?.displayName || user?.username || "Admin",
      createdAt: Date.now(),
    };

    setLessons([item, ...lessons]);
    setShowAddModal(false);
    setNewTitle("");
    setNewContent("");
    setNewKeyPoints("");
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 bac-in">
      {/* Header */}
      <div
        className="p-5 sm:p-7 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(99,102,241,0.18) 50%, rgba(16,185,129,0.15))",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #06B6D4, #3B82F6)" }}>
            <BookOpen size={26} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{t.cmsTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-300">{t.cmsSub}</p>
          </div>
        </div>

        {canAddLesson && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bac-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white cursor-pointer shadow-md"
            style={{ background: GRAD }}
          >
            <PlusCircle size={16} />
            <span>{t.addLesson}</span>
          </button>
        )}
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setActiveSubject("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeSubject === "all" ? "bg-indigo-600 text-white shadow-sm" : "bg-white/5 text-slate-400 hover:text-white"
          }`}
        >
          {lang === "ar" ? "جميع المواد" : "Toutes les matières"}
        </button>
        {Object.entries(SUBJECTS).map(([key, subj]) => {
          const active = activeSubject === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSubject(key)}
              className="bac-btn px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all"
              style={{
                background: active ? `${subj.color}35` : "rgba(255,255,255,0.04)",
                color: active ? "#FFF" : COLORS.textSoft,
                border: active ? `1px solid ${subj.color}` : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {subj.name[lang]}
            </button>
          );
        })}
      </div>

      {/* Lessons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map((les) => {
          const subj = SUBJECTS[les.subjectId];
          const color = subj?.color || "#6366F1";
          return (
            <div
              key={les.id}
              className="rounded-3xl p-5 flex flex-col justify-between"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="text-[11px] font-extrabold px-3 py-1 rounded-full"
                    style={{ background: `${color}25`, color: color, border: `1px solid ${color}40` }}
                  >
                    {subj?.name[lang] || les.subjectId}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {les.author}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2.5">{les.title[lang] || les.title.ar}</h3>

                <div className="p-3 rounded-2xl bg-black/20 text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed mb-3 max-h-40 overflow-y-auto border border-white/5">
                  {les.content}
                </div>

                {les.keyPoints && les.keyPoints.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {les.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                        <CheckCircle size={12} className="shrink-0 text-emerald-400" />
                        <span className="truncate">{pt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end">
                {onAskAiWithLesson && (
                  <button
                    onClick={() => onAskAiWithLesson(les.title[lang] || les.title.ar, les.content)}
                    className="bac-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                    style={{ background: GRAD }}
                  >
                    <Sparkles size={13} />
                    <span>{lang === "ar" ? "تدريب ذكي على هذا المحور" : "S'entraîner avec l'IA"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lesson Modal for Super Admin & Mods */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md bac-in">
          <div
            className="w-full max-w-xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            style={{
              background: COLORS.bg1,
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">{t.addLesson}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-white/5 rounded-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === "ar" ? "عنوان الدرس / المحور" : "Titre de la fiche"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: ملخص شامل في الدوال اللوغاريتمية والأسية"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === "ar" ? "المادة" : "Matière"}
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none"
                >
                  {Object.entries(SUBJECTS).map(([key, subj]) => (
                    <option key={key} value={key}>
                      {subj.name[lang]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === "ar" ? "المحتوى العلمي والقواعد الذهبية" : "Contenu et formules clés"}
                </label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="اكتب المحتوى، القواعد الأساسية، والصيغ الرسمية هنا…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === "ar" ? "النقاط المفتاحية (نقطة في كل سطر)" : "Points clés (un par ligne)"}
                </label>
                <textarea
                  rows={3}
                  value={newKeyPoints}
                  onChange={(e) => setNewKeyPoints(e.target.value)}
                  placeholder="نقطة 1&#10;نقطة 2&#10;نقطة 3"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bac-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-white/5 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bac-btn px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md"
                  style={{ background: GRAD }}
                >
                  {lang === "ar" ? "نشر في الخزانة" : "Publier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
