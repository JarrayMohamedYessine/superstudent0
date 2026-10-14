import { LangKey } from "../types";

export interface OfficialBacExamMeta {
  year: number;
  session: "principale" | "controle";
  branchId: string;
  subjectId: string;
  examTitle: Record<LangKey, string>;
  topicsCovered: string[];
  baremeOutLine: {
    section: string;
    points: number;
    description: string;
  }[];
  officialCorrectionSummary: Record<LangKey, string>;
  commonStudentPitfalls: string[];
  keyFormulasAndTheorems: string[];
}

export interface CurricularChapterMeta {
  id: string;
  branchId: string;
  subjectId: string;
  title: Record<LangKey, string>;
  prerequisites: string[];
  coreCompetencies: string[];
  summaryOutline: string[];
}

// Complete registry of official curriculum & exam correction standards
export const CURRICULUM_CHAPTERS: CurricularChapterMeta[] = [
  {
    id: "chap-math-analysis",
    branchId: "math",
    subjectId: "math",
    title: {
      ar: "التحليل: النهايات، الاستمرار، الاشتقاق والدوال الأسية واللوغاريتمية",
      fr: "Analyse : Limites, Continuité, Dérivation, Exponentielle & Logarithme",
      en: "Analysis: Limits, Continuity, Differentiation, Exp & Log Functions",
    },
    prerequisites: ["حساب النهايات الأولية", "قواعد الاشتقاق الأساسية", "دراسة إشارة الدوال"],
    coreCompetencies: [
      "تطبيق مبرهنة القيم الوسيطية (Théorème des Valeurs Intermédiaires)",
      "إنشاء جدول التغيرات ورسم المنحنى البياني بدقة (Tableau de variation & Tracé de Cf)",
      "حساب التكاملات باستعمال المكاملة بالأجزاء والمكاملة بالتغيير",
      "حل المعادلات التفاضلية من الدرجة الأولى والثانية",
    ],
    summaryOutline: [
      "1. الاستمرار والاشتقاق ومبرهنة التزايدات المنتهية (Théorème des accroissements finis)",
      "2. الدالة الأسية النيبيرية exp(x) والدالة اللوغاريتمية ln(x)",
      "3. حساب المساحات والحجوم عبر التكامل المحدد",
    ],
  },
  {
    id: "chap-math-complex",
    branchId: "math",
    subjectId: "math",
    title: {
      ar: "الأعداد المركبة والتحويلات النقطية في المستوي",
      fr: "Nombres Complexes et Transformations du Plan",
      en: "Complex Numbers and Geometric Transformations",
    },
    prerequisites: ["الحساب المثلثي", "الأشكال الهندسية في المستوي المنسوب لمعلم"],
    coreCompetencies: [
      "التحويل بين الشكل الجبري والمثلثي والآسي للأعداد المركبة",
      "حل معادلات الدرجة الثانية والثالثة في C وتفسير الجذور هندسياً",
      "التعرف على طبيعة التحويل النقطي (الإزاحة، التحاكي، الدوران، التشابه المباشر)",
    ],
    summaryOutline: [
      "1. العمدة والمعيار وخواص القوى (Formule de Moivre & Notation d'Euler)",
      "2. الكتابة المركبة للتحويلات النقطية: z' = az + b",
      "3. حساب الزوايا والمسافات عبر نسب الأعداد المركبة",
    ],
  },
  {
    id: "chap-phys-rc-rlc",
    branchId: "sciexp",
    subjectId: "physique",
    title: {
      ar: "الفيزياء: ثنائي القطب RC والاهتزازات الكهربائية RLC الحرة والقسرية",
      fr: "Physique : Dipôle RC & Oscillations Électriques Libres et Forcées (RLC)",
      en: "Physics: RC Dipole & Free/Forced Electrical Oscillations (RLC)",
    },
    prerequisites: ["قانون أوم وقانون جمع التوترات", "مفهوم السعة C والتحريض الذاتي L"],
    coreCompetencies: [
      "إقامة المعادلة التفاضلية لتوتر المكثفة أو شدة التيار الكهربائي",
      "حل المعادلة في حالتي الشحن والتفريغ وتحديد ثابت الزمن tau = RC",
      "دراسة التجاوب الكهربائي وحساب طاقة الدارة الكلية",
    ],
    summaryOutline: [
      "1. ثنائي القطب RC: ثابت الزمن وتوازن الطاقة",
      "2. دارة LC المثالية: اهتزازات جيبية غير مخمدة والتردد الخاص",
      "3. دارة RLC الموالية في النظام القسري وظاهرة التجاوب في الشدة والتوتر",
    ],
  },
  {
    id: "chap-svt-genetics",
    branchId: "sciexp",
    subjectId: "svt",
    title: {
      ar: "علوم الحياة والأرض: علم الوراثة البشرية ووراثة الثنائيات الصبغية",
      fr: "SVT : Génétique Humaine et Brassage Chromosomique",
      en: "Life Sciences: Human Genetics and Chromosomal Crossover",
    },
    prerequisites: ["الانقسام المنصف والإخصاب", "مفهوم المورثة والأليل والنمط الظاهري والوراثي"],
    coreCompetencies: [
      "تحليل شجرة النسب (Arbre Généalogique) لتحديد صفة متنحية أو سائدة ومرتبطة بجنس أو لا",
      "التفريق بين الارتباط المطلق والارتباط النسبي مع العبور (Crossing-over)",
      "حساب نسب الأنماط الوراثية وتطبيق قوانين مندل",
    ],
    summaryOutline: [
      "1. الانقسام المنصف والخلط الصبغي (Brassage interchromosomique & intrachromosomique)",
      "2. تحليل التزاوجات في الهجونة الثنائية وحساب مسافات الخريطة الصبغية",
      "3. التشخيص الوراثي للأمراض المنقولة بشجرات النسب",
    ],
  },
  {
    id: "chap-philo-human",
    branchId: "lettres",
    subjectId: "philosophie",
    title: {
      ar: "الفلسفة: الإنسان بين الوحدة والكثرة / الخصوصية والكونية / الدولة والسياسة",
      fr: "Philosophie : L'Humain, Spécificité & Universalité, L'État et le Pouvoir",
      en: "Philosophy: The Human Being, Particularity vs Universality, Politics & State",
    },
    prerequisites: ["منهجية المقال الفلسفي (المقدمة، التفكيك، الأطروحة، المناقشة، التركيب)"],
    coreCompetencies: [
      "استيعاب الإحراج الفلسفي والتناظر بين الثابت والمتغير في الطبيعة الإنسانية",
      "استدعاء واستثمار الشواهد الفلسفية المعمقة (Descartes, Kant, Hegel, Nietzsche, Levi-Strauss)",
      "بناء نقاش نقدي متوازن مع تقديم بدائل فلسفية رصينة",
    ],
    summaryOutline: [
      "1. محور الإنساني بين الكثرة والوحدة: الجسد والوعي والغيرية",
      "2. محور الخصوصية والكونية: صراع الثقافات وتأصيل الحوار الإنساني المشترك",
      "3. محور السياسة والدولة: بين هاجس الحرية وضرورة النظام",
    ],
  },
  {
    id: "chap-info-algo-sql",
    branchId: "info",
    subjectId: "algo",
    title: {
      ar: "الإعلامية: الخوارزميات المتقدمة، التراجع (Récursivité) وقواعد البيانات SQL",
      fr: "Informatique : Algorithmique Avancée, Récursivité & Requêtes SQL",
      en: "Computer Science: Advanced Algorithms, Recursion & SQL Databases",
    },
    prerequisites: ["البنيات التكرارية والشرطية", "الجداول والسلاسل الرمزية في Python 3"],
    coreCompetencies: [
      "تحليل المشكلة وصياغة خوارزمية تراجعية أو فرز متقدم (Tri fusion, Tri rapide)",
      "كتابة دوال وإجراءات فرعية بدقة مع معالجة الاستثناءات",
      "تنفيذ استعلامات SQL مركبة (SELECT avec JOIN, GROUP BY, HAVING, Sous-requêtes)",
    ],
    summaryOutline: [
      "1. الفرز التراجعي ومعالجة الملفات النصية والثنائية",
      "2. استراتيجيات البحث المتقدم وهياكل البيانات المركبة",
      "3. نمذجة قواعد البيانات العلاقية ولغة SQL القياسية",
    ],
  },
  {
    id: "chap-eco-growth",
    branchId: "eco",
    subjectId: "economie",
    title: {
      ar: "الاقتصاد: النمو الاقتصادي، التضخم المالي والتجارة الدولية",
      fr: "Économie : Croissance Économique, Inflation & Commerce International",
      en: "Economics: Economic Growth, Inflation & International Trade",
    },
    prerequisites: ["حساب الناتج المحلي الإجمالي PIB", "مؤشرات التجارة والبطالة والتضخم"],
    coreCompetencies: [
      "تحليل جداول الإحصائيات الاقتصادية واستخراج معدلات التغير ونسب التغطية",
      "التفريق بين نظريات التجارة الحرة والحمائية (Smith, Ricardo, Krugman)",
      "صياغة مقال اقتصادي مهيكل مع إبراز العلاقات السببية والسياسات المقترحة",
    ],
    summaryOutline: [
      "1. عوامل النمو الاقتصادي والتراكم الرأسمالي والتجديد التكنولوجي",
      "2. السياسات النقدية والمالية لمكافحة التضخم وتنشيط التشغيل",
      "3. العولمة والتكتلات الاقتصادية وموقع الاقتصاد التونسي في المبادلات الدولية",
    ],
  },
];

// Sample of official Tunisian Baccalaureate Exam Barèmes & Standards for AI Knowledge Retrieval
export const OFFICIAL_BAC_EXAMS: OfficialBacExamMeta[] = [
  {
    year: 2024,
    session: "principale",
    branchId: "math",
    subjectId: "math",
    examTitle: {
      ar: "امتحان الرياضيات — الدورة الرئيسية باكالوريا 2024",
      fr: "Épreuve de Mathématiques — Session Principale Bac 2024",
      en: "Mathematics Exam — Main Session Bac 2024",
    },
    topicsCovered: ["الأعداد المركبة في المستوي", "الهندسة الفضائية والمعالم", "دراسة دالة أسية وحساب المساحة والتكامل", "المتتاليات العددية والتقارب"],
    baremeOutLine: [
      { section: "التمرين 1 (الأعداد المركبة)", points: 5, description: "حل المعادلة في C، الشكل المثلثي، والتحويل النقطي z' = e^(i pi/3) z + 1" },
      { section: "التمرين 2 (الهندسة الفضائية)", points: 4, description: "معادلة المستوي، تقاطع مستقيم ومستو، وحساب مسافة نقطة عن مستو" },
      { section: "التمرين 3 (المتتاليات)", points: 4, description: "البرهان بالتراجع، المتتالية المساعدة الهندسية، وحساب النهاية" },
      { section: "المسألة الرئيسية (التحليل والدوال)", points: 7, description: "دراسة تغيرات f(x) = (x-1)e^(-x) + 2، رسم المنحنى، وحساب التكامل بالتجزئة" },
    ],
    officialCorrectionSummary: {
      ar: "توزيع النقاط النموذجي: 0.5 لكل نهاية وتعليل، 1 نقطة لرسم المنحنى البياني مع توضيح الفروع اللانهائية والمقارب الأفقي y=2، 1.5 نقطة للتكامل بالتجزئة.",
      fr: "Barème officiel : 0.5 pt par limite justifiée, 1 pt pour le tracé soigné avec asymptotes et tangentes, 1.5 pt pour l'intégration par parties.",
      en: "Official Scheme: 0.5 pt per justified limit, 1 pt for accurate curve sketch with asymptotes, 1.5 pt for integration by parts.",
    },
    commonStudentPitfalls: [
      "نسيان ذكر استمرار الدالة قبل تطبيق مبرهنة القيم الوسيطية",
      "الخطأ في إشارة المشتقة لدالة مركبة u(x)*e^(v(x))",
      "إهمال الوحدة الهندسية لمساحة الحيز (unité d'aire = ||i|| * ||j|| cm²)",
    ],
    keyFormulasAndTheorems: [
      "\\int u'(x)e^{u(x)}dx = e^{u(x)} + C",
      "\\lim_{x \\to +\\infty} \\frac{e^x}{x^n} = +\\infty",
      "Distance d(M, P) = \\frac{|ax_0 + by_0 + cz_0 + d|}{\\sqrt{a^2 + b^2 + c^2}}",
    ],
  },
  {
    year: 2024,
    session: "principale",
    branchId: "sciexp",
    subjectId: "physique",
    examTitle: {
      ar: "امتحان العلوم الفيزيائية — الدورة الرئيسية باكالوريا 2024",
      fr: "Épreuve de Sciences Physiques — Session Principale Bac 2024",
      en: "Physics & Chemistry Exam — Main Session Bac 2024",
    },
    topicsCovered: ["الكيمياء: حركية التفاعلات والأسترة وحلمأة الإستير", "الفيزياء: ثنائي القطب RC", "الاهتزازات الميكانيكية الحرة والمخمدة", "الفيزياء النووية والتناقص الإشعاعي"],
    baremeOutLine: [
      { section: "الكيمياء (التفاعلات الحركية)", points: 7, description: "جدول تقدم التفاعل، حساب السرعة الحجمية بيانياً، وثابت التوازن K للأسترة" },
      { section: "الفيزياء 1 (ثنائي القطب RC)", points: 5, description: "المعادلة التفاضلية للتوتر uc(t)، استنتاج tau = RC بيانيا، وحساب الطاقة الكهربائية" },
      { section: "الفيزياء 2 (الاهتزازات الميكانيكية)", points: 4.5, description: "تطبيق القانون الثاني لنيوتن، المعادلة التفاضلية لـ x(t)، ودراسة طاقة الهزاز" },
      { section: "الفيزياء 3 (النووي)", points: 3.5, description: "قوانين سودي للانحفاظ، طاقة الربط لكل نكليون، وحساب النشاط الإشعاعي A(t)" },
    ],
    officialCorrectionSummary: {
      ar: "يتم إسناد العلامة الكاملة عند كتابة الوحدات الدولية SI الصحيحة (V, A, s, J, Bq, MeV). الخطوات الرياضية يجب أن تسبق بتحديد الجملة المدروسة والمعلم المعتمد.",
      fr: "Attribution des points : rigueur sur les unités SI, écriture explicite des lois de Newton et Soddy, tracé précis des tangentes à l'origine.",
      en: "Marking criteria: SI units required, explicit statement of physical laws, precise graphical tangent measurement.",
    },
    commonStudentPitfalls: [
      "نسيان تحويل ميلي ثانية ms إلى ثانية s عند حساب ثابت الزمن tau",
      "الخطأ في حساب ميل المماس للسرعة الحجمية لتفاعل كيميائي",
      "إهمال الإشارة السالبة في قانون التناقص الإشعاعي",
    ],
    keyFormulasAndTheorems: [
      "\\tau = R C \\quad , \\quad E_C = \\frac{1}{2} C u_C^2",
      "v(t) = \\frac{1}{V} \\frac{dx}{dt}",
      "\\Delta E = [Z m_p + (A-Z)m_n - m(X)] c^2",
    ],
  },
];
