import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { LangKey } from "../types";
import { BRANCHES, COLORS, GRAD, SUBJECTS } from "../constants";

interface BacArchiveHubProps {
  lang: LangKey;
  isRTL: boolean;
  selectedBranch: string;
}

interface StudyTip {
  title: Record<LangKey, string>;
  description: Record<LangKey, string>;
  notions: Record<LangKey, string[]>;
}

export function BacArchiveHub({
  lang,
  isRTL,
  selectedBranch,
}: BacArchiveHubProps) {
  const [activeBranch, setActiveBranch] = useState<string>(selectedBranch || "math");

  const isAr = lang === "ar";

  // Real, accurate guidance for studying Tunisian Bac past papers by branch
  const BRANCH_STUDY_GUIDES: Record<string, StudyTip> = {
    math: {
      title: {
        ar: "توجيهات شعبة الرياضيات",
        fr: "Directives Section Mathématiques",
        en: "Mathematics Section Guidelines",
      },
      description: {
        ar: "التركيز الأكبر في امتحانات الرياضيات والفيزياء الرسمية يكون على مهارات البرهنة، التحليل الرياضي الشامل، وفهم البنى الجبرية.",
        fr: "La priorité absolue est donnée à la rigueur de la démonstration, l'analyse globale et la maîtrise des structures algébraires.",
        en: "Focus is placed on rigorous proofs, comprehensive function analysis, and algebraic structures.",
      },
      notions: {
        ar: [
          "دراسة الدوال الأسية واللوغاريتمية والتقارب المتتالي",
          "الأعداد المركبة والتحويلات النقطية في المستوي",
          "الحساب في Z والبحث عن القواسم والمضاعفات",
          "الهندسة الفضائية والاحتمالات الشرطية",
        ],
        fr: [
          "Étude approfondie des fonctions exponentielles & logarithmiques",
          "Nombres complexes et similitudes planes directes",
          "Arithmétique dans Z (PGCD, PPCM, congruences)",
          "Géométrie dans l'espace et probabilités conditionnelles",
        ],
        en: [
          "Advanced exponential & logarithmic functions study",
          "Complex numbers and plane transformations",
          "Number theory in Z (GCD, LCM, congruences)",
          "Space geometry and conditional probabilities",
        ],
      },
    },
    sciexp: {
      title: {
        ar: "توجيهات شعبة العلوم التجريبية",
        fr: "Directives Section Sciences Expérimentales",
        en: "Experimental Sciences Section Guidelines",
      },
      description: {
        ar: "مادة علوم الحياة والأرض (SVT) تتطلب منهجية صارمة في تحليل الرسوم البيانية، تفسير النتائج التجريبية، وصياغة الخلاصة التركيبية.",
        fr: "L'épreuve de SVT exige une méthodologie rigoureuse de description, d'analyse de documents et de synthèse scientifique.",
        en: "SVT exams require structured document analysis, scientific reasoning, and clear synthesis drafting.",
      },
      notions: {
        ar: [
          "منهجية التحليل والتفسير والاستنتاج في مادة العلوم (SVT)",
          "الفيزياء: الميكانيك، الكهرباء (RC, RL, RLC)، والكيمياء العضوية",
          "علوم الحياة: التكاثر، علم المناعة، والوراثة البشرية",
          "التنظيم العصبي والهرموني وضغط الدم",
        ],
        fr: [
          "Méthodologie d'analyse et d'interprétation des courbes (SVT)",
          "Physique : Mécanique, Circuits RC/RL/RLC, Oscillations",
          "Biologie : Immunologie, Génétique humaine, Procréation",
          "Neurophysiologie et régulation de la pression artérielle",
        ],
        en: [
          "Scientific reasoning & curve interpretation methodology (SVT)",
          "Physics: Mechanics, RC/RL/RLC circuits, Oscillations",
          "Biology: Immunology, Human genetics, Reproduction",
          "Neurophysiology and blood pressure regulation",
        ],
      },
    },
    technique: {
      title: {
        ar: "توجيهات شعبة العلوم التقنية",
        fr: "Directives Section Sciences Techniques",
        en: "Technical Sciences Section Guidelines",
      },
      description: {
        ar: "امتحان التكنولوجيا ينقسم إلى هندسة ميكانيكية وهندسة كهربائية، ويتطلب دقة عالية في قراءة الكراسات التقنية ورسم القطع.",
        fr: "L'épreuve de Technologie combine génie mécanique et génie électrique. Elle requiert une grande habileté de lecture technique.",
        en: "The Technology exam combines mechanical and electrical engineering. Precision in drafting and reading technical files is key.",
      },
      notions: {
        ar: [
          "الهندسة الميكانيكية: دراسة النظم الميكانيكية والرسم الصناعي",
          "الهندسة الكهربائية: الدوائر الإلكترونية والمنطق التعاقبي",
          "تحليل الوظائف والأنظمة الآلية (GRAFCET)",
          "مقاومة المواد وحساب الإجهادات الميكانيكية",
        ],
        fr: [
          "Génie Mécanique : Analyse des systèmes et dessin industriel",
          "Génie Électrique : Logique séquentielle, microcontrôleurs",
          "Analyse fonctionnelle et description automatisée (GRAFCET)",
          "Résistance des matériaux (RDM) et dimensionnement",
        ],
        en: [
          "Mechanical Engineering: System analysis and industrial drawing",
          "Electrical Engineering: Sequential logic, microcontrollers",
          "Functional analysis and automated system description (GRAFCET)",
          "Strength of materials (RDM) and mechanical sizing",
        ],
      },
    },
    info: {
      title: {
        ar: "توجيهات شعبة علوم الإعلامية",
        fr: "Directives Section Sciences de l'Informatique",
        en: "Computer Sciences Section Guidelines",
      },
      description: {
        ar: "تركز اختبارات الخوارزميات والبرمجة على تحويل المشاكل إلى كود بايثون متكامل وخالٍ من الأخطاء المنطقية، مع فهم عميق لقواعد البيانات.",
        fr: "L'accent est mis sur la traduction logique de problèmes complexes en scripts Python propres et la conception relationnelle SQL.",
        en: "Focus is on logical translation of complex problems into clean Python scripts and relational SQL database design.",
      },
      notions: {
        ar: [
          "الخوارزميات والبرمجة بلغة بايثون (بنى البيانات المتقدمة والمثابرة)",
          "قواعد البيانات والويب: لغة الاستعلام الهيكلية (SQL) وتطبيقات الويب",
          "الشبكات السلكية واللاسلكية وأنظمة الحماية الرقمية",
          "معمارية الحاسوب وأنظمة التشغيل والعتاد",
        ],
        fr: [
          "Algorithmique & Programmation Python (Structures avancées)",
          "Bases de données et Web : Requêtes SQL complexes et intégration",
          "Architecture des réseaux, protocoles et sécurité informatique",
          "Systèmes d'exploitation et composants matériels",
          "Traitement de données et programmation récursive",
        ],
        en: [
          "Algorithms & Python Programming (Advanced data structures)",
          "Databases & Web: Relational SQL queries and web integration",
          "Network architecture, routing protocols, and IT security",
          "Operating systems and hardware components",
          "Recursive programming and data processing techniques",
        ],
      },
    },
    eco: {
      title: {
        ar: "توجيهات شعبة الاقتصاد والتصرف",
        fr: "Directives Section Économie & Gestion",
        en: "Economics & Management Section Guidelines",
      },
      description: {
        ar: "تعتمد اختبارات التصرف على دقة الحسابات المحاسبية وتفسير التوازنات المالية للشركات، بينما يتطلب الاقتصاد تحليلاً بيانياً معبراً.",
        fr: "Les examens de Gestion reposent sur la rigueur des calculs comptables, tandis que l'Économie exige une bonne analyse graphique.",
        en: "Management exams rely on rigorous accounting calculations, while Economics demands strong graphical and macro-analysis.",
      },
      notions: {
        ar: [
          "الاقتصاد: التضخم، البطالة، التنمية، والسياسات النقدية والمالية",
          "التصرف: محاسبة التسيير، الميزانية الوظيفية، وجداول التدفقات النقية",
          "التحليل المالي واحتساب الفوائد والاستثمارات للمؤسسة",
          "الرياضيات المالية والإحصاء الرياضي والاحتمالات البسيطة",
        ],
        fr: [
          "Économie : Croissance, inflation, chômage et mondialisation",
          "Gestion : Comptabilité financière, analyse des coûts, seuil de rentabilité",
          "Analyse financière, ratios de liquidité et de solvabilité",
          "Mathématiques financières : Intérêts composés et annuités",
        ],
        en: [
          "Economics: Growth, inflation, unemployment, and globalization",
          "Management: Financial accounting, cost analysis, break-even point",
          "Financial analysis, liquidity and solvency ratios",
          "Financial mathematics: Compound interest and annuities",
        ],
      },
    },
    lettres: {
      title: {
        ar: "توجيهات شعبة الآداب",
        fr: "Directives Section Lettres",
        en: "Letters Section Guidelines",
      },
      description: {
        ar: "التفوق في شعبة الآداب يعتمد على جودة الصياغة اللغوية، عمق التحليل الفلسفي، وقدرة الطالب على بناء مقال متماسك الحجج.",
        fr: "L'excellence en section Lettres repose sur la richesse de la rédaction, la rigueur de l'argumentation et la profondeur philosophique.",
        en: "Success in the Letters section depends on rich vocabulary, structured argumentative essays, and deep philosophical insights.",
      },
      notions: {
        ar: [
          "العربية: دراسة المحاور الأدبية (الحماسة، شعر الإباحية، والمنهج النقدي)",
          "الفلسفة: المفاهيم الكبرى (الكونية، الخصوصية، العمل، والسيادة والحرية)",
          "الفرنسية والإنجليزية: تحليل النصوص الأدبية وصياغة المقالات التعبيرية",
          "التاريخ والجغرافيا: دراسة الوثائق وخرائط الجغرافيا الاقتصادية للبلاد",
        ],
        fr: [
          "Arabe : Étude des thèmes classiques (El Hamassa, modernité littéraire)",
          "Philosophie : Universel et particulier, État et liberté, art et technique",
          "Français & Anglais : Analyse textuelle, essais argumentatifs et synthèse",
          "Histoire-Géo : Analyse critique de documents historiques et cartographie",
        ],
        en: [
          "Arabic: Classical themes study and literary criticism models",
          "Philosophy: Universal vs particular, state and freedom, art and technology",
          "French & English: Textual analysis, essay writing, and literary synthesis",
          "History & Geography: Critical analysis of maps, data sheets and historical logs",
        ],
      },
    },
  };

  const selectedGuide = BRANCH_STUDY_GUIDES[activeBranch] || BRANCH_STUDY_GUIDES.math;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 bac-in">
      {/* Premium Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(99,102,241,0.15) 50%, rgba(236,72,153,0.08))",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: GRAD }}>
              <Award size={26} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isAr ? "دليل وكراسة امتحانات الباكالوريا الرسمية" : "Guide Officiel des Examens du Baccalauréat"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {isAr
                  ? "المنهجية الرسمية وتوجيهات التفوق لاجتياز امتحانات وزارة التربية التونسية"
                  : "Méthodologie et conseils officiels pour réussir les épreuves du Ministère de l'Éducation"}
              </p>
            </div>
          </div>

          <a
            href="https://www.bacweb.tn"
            target="_blank"
            referrerPolicy="no-referrer"
            rel="noopener noreferrer"
            className="bac-btn shrink-0 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>{isAr ? "زيارة موقع وزارة التربية Bacweb" : "Visiter Bacweb Officiel"}</span>
          </a>
        </div>
      </div>

      {/* Reals vs Fakes Notification Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
        <HelpCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
        <div className="text-xs sm:text-sm text-slate-300 space-y-1">
          <p className="font-bold text-white">
            {isAr ? "توضيح هام حول دقة الأمان والمصداقية الأكاديمية:" : "Clarification importante sur la rigueur et l'intégrité académique :"}
          </p>
          <p className="leading-relaxed text-slate-400">
            {isAr
              ? "نحن نرفض نهائياً تحويل ملفات الـ PDF الرسمية للباكالوريا إلى كود برمجي وهمي أو روابط مزيفة. الامتحانات الرسمية تحتوي على نصوص وصور ومعادلات معقدة ودقيقة لا يمكن تمثيلها ببيانات وهمية. للحصول على أقصى دقة وجودة، اتبع المنهجية الموثوقة للتطبيق أدناه."
              : "Nous refusons catégoriquement de simuler de faux fichiers PDF officiels sous forme de code textuel généré. Les épreuves officielles contiennent des graphes, équations et structures complexes. Pour une étude rigoureuse, veuillez suivre la méthode officielle ci-dessous."}
          </p>
        </div>
      </div>

      {/* The 3-Step Success Guide using Real PDFs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-white text-sm">
            {isAr ? "تحميل الموضوع الرسمي" : "Télécharger l'épreuve"}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? "اذهب إلى الموقع الرسمي للمندوبية أو موقع Bacweb لحفظ ملف PDF الحقيقي بالكامل مع الإصلاح المعتمد لعامك المستهدف."
              : "Rendez-vous sur le site officiel du Ministère de l'Éducation (Bacweb) pour télécharger l'épreuve officielle en format PDF."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-white text-sm">
            {isAr ? "الرفع إلى بنك الوثائق" : "Uploader sur la plateforme"}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? "افتح صفحة 'بنك الوثائق والامتحانات' في حسابك على تطبيقنا، وقم برفع الملف ليتم فهرسته وحفظه سحابياً على خوادم Supabase الآمنة."
              : "Ouvrez l'onglet 'Sujets & Archives' et déposez-y le PDF pour l'ajouter à la base de données cloud sécurisée de Supabase."}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-white text-sm">
            {isAr ? "التحميل المباشر والتنظيم" : "Téléchargement & Révision"}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? "حمّل الملفات أو الإصلاح النموذجي الرسمي مباشرة بصيغة PDF عالية الجودة للمراجعة والطباعة."
              : "Téléchargez les sujets ou les corrigés officiels en haute qualité pour réviser et imprimer."}
          </p>
        </div>
      </div>

      {/* Interactive Section Advisory */}
      <div className="p-6 rounded-3xl bg-[#0F172A]/80 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-black text-white text-base">
              {isAr ? "مستشار التوجيه الأكاديمي والمنهجي" : "Conseiller d'Orientation Académique"}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? "توجيهات مخصصة لكل شعبة للتعامل الذكي مع مواضيع الباكالوريا" : "Directives ciblées par section pour maîtriser les épreuves nationales"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {BRANCHES.map((b) => {
              const active = activeBranch === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBranch(b.id)}
                  className="bac-btn px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                  style={{
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    color: active ? "#FFF" : "#9AA7C7",
                    border: active ? `2px solid ${b.color}` : "1px solid transparent",
                  }}
                >
                  {b.mono[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Branch Study Guide Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-amber-400" size={18} />
              <h4 className="font-bold text-white text-sm">{selectedGuide.title[lang]}</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedGuide.description[lang]}
            </p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? "الشعبة المحددة حالياً" : "SECTION SÉLECTIONNÉE"}
                </p>
                <p className="text-xs font-extrabold text-white">
                  {BRANCHES.find((b) => b.id === activeBranch)?.name[lang]}
                </p>
              </div>
              <Layers className="text-slate-500" size={24} />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h5 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <Layers size={14} />
              <span>{isAr ? "أهم المحاور ومنهجية الأسئلة الرسمية:" : "Notions clés & méthodologie de l'examen :"}</span>
            </h5>
            <ul className="space-y-2.5">
              {selectedGuide.notions[lang].map((n, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Useful References for Official Tunisian Education Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <FileText className="text-indigo-400" size={20} />
          <h4 className="font-bold text-white text-sm">
            {isAr ? "موقع الباكالوريا التونسية الرسمي" : "Portail Officiel Bacweb Tunisie"}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? "مستودع وزارة التربية الذي يحتوي على جميع الاختبارات مصنفة ومؤرشفة للتحميل المباشر بصيغة PDF."
              : "Le référentiel national officiel fournissant les fichiers PDF épreuves et corrigés de toutes les sessions."}
          </p>
          <a
            href="https://www.bacweb.tn"
            target="_blank"
            referrerPolicy="no-referrer"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:underline mt-1"
          >
            <span>www.bacweb.tn</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <UploadCloud className="text-emerald-400" size={20} />
          <h4 className="font-bold text-white text-sm">
            {isAr ? "كيف تدمجهم وتشاركهم هنا؟" : "Comment collaborer ici ?"}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? "إذا قمت بتحميل ملف الامتحان والإصلاح، قم برفعه فوراً في بنك الوثائق. سيستفيد جميع زملائك من الملف وستتاح لهم ميزة مراجعته بالذكاء الاصطناعي."
              : "Une fois le PDF téléchargé, uploadez-le dans notre section Documents. Toute la communauté en profitera pour réviser avec l'IA."}
          </p>
        </div>
      </div>
    </div>
  );
}
