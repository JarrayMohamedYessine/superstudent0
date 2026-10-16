import { LangKey } from "../types";

export type BackgroundCategory = "section" | "subject";

export interface BackgroundMeta {
  id: string;
  category: BackgroundCategory;
  targetKey: string; // e.g. 'math', 'sciexp', 'philosophie', etc.
  number: number;
  title: {
    fr: string;
    ar: string;
    en: string;
  };
  subtitle: {
    fr: string;
    ar: string;
    en: string;
  };
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    deepBase: string;
    glow: string;
    name: string;
  };
  motifs: string[];
  designIntent: {
    fr: string;
    ar: string;
  };
}

// EXACTLY 25 UNIQUE BACKGROUNDS: 7 Sections + 18 Subjects
export const SECTION_BACKGROUNDS: BackgroundMeta[] = [
  {
    id: "sec_math",
    category: "section",
    targetKey: "math",
    number: 1,
    title: {
      fr: "Section Mathématiques",
      ar: "شعبة الرياضيات",
      en: "Mathematics Section",
    },
    subtitle: {
      fr: "Raisonnement scientifique, analyse globale, physique et modélisation",
      ar: "التفكير العلمي التحليلي الشامل والفيزياء المتقدمة",
      en: "Advanced Scientific Reasoning & Universal Modeling",
    },
    palette: {
      primary: "#6366F1",
      secondary: "#4F46E5",
      accent: "#38BDF8",
      deepBase: "#030718",
      glow: "rgba(99, 102, 241, 0.35)",
      name: "Cosmic Indigo & Deep Royal Sapphire",
    },
    motifs: [
      "Calculus & Topology Grids",
      "Quantum Physics Waves",
      "Harmonic Coordinate Meshes",
      "Analytical Polyhedra",
      "Astrophysical Geometry",
    ],
    designIntent: {
      fr: "Représente l'intégralité de la section Mathématiques : alliance entre abstraction pure, physique fondamentale, esprit critique et rigueur analytique.",
      ar: "يعبر عن الهوية الكاملة لشعبة الرياضيات: التفكير المنطقي التجريدي، الفيزياء النظرية، والنمذجة الرياضية الكونية الشاملة.",
    },
  },
  {
    id: "sec_sciexp",
    category: "section",
    targetKey: "sciexp",
    number: 2,
    title: {
      fr: "Section Sciences Expérimentales",
      ar: "شعبة العلوم التجريبية",
      en: "Experimental Sciences Section",
    },
    subtitle: {
      fr: "Sciences de la vie, chimie moléculaire, physique appliquée et recherche",
      ar: "البيولوجيا، الكيمياء الجزيئية، الفيزياء المخبرية والبحث العلمي",
      en: "Life Sciences, Molecular Chemistry & Laboratory Research",
    },
    palette: {
      primary: "#10B981",
      secondary: "#06B6D4",
      accent: "#34D399",
      deepBase: "#021216",
      glow: "rgba(16, 185, 129, 0.32)",
      name: "Bioluminescent Emerald & Oceanic Teal",
    },
    motifs: [
      "Double Helix DNA Ribbons",
      "Molecular Benzene Rings",
      "Cellular Membranes",
      "Laboratory Spectrometry Waves",
      "Biospheric Energy Nodes",
    ],
    designIntent: {
      fr: "Incarnation complète des sciences expérimentales : synergie entre le vivant, les réactions chimiques, les lois physiques et la méthode empirique.",
      ar: "تجسيد شامل لعلوم الطبيعة والحياة، الكيمياء التحليلية، والفيزياء التجريبية الميدانية في إطار بصري هادئ وفخم.",
    },
  },
  {
    id: "sec_scitech",
    category: "section",
    targetKey: "scitech",
    number: 3,
    title: {
      fr: "Section Sciences Techniques",
      ar: "شعبة العلوم التقنية",
      en: "Technical Sciences Section",
    },
    subtitle: {
      fr: "Génie mécanique, électronique de pointe, conception et modélisation industrielle",
      ar: "الهندسة الميكانيكية، الأنظمة الكهربائية الذكية، والتصميم الصناعي",
      en: "Mechanical Engineering, Smart Electronics & CAD Innovation",
    },
    palette: {
      primary: "#06B6D4",
      secondary: "#3B82F6",
      accent: "#67E8F9",
      deepBase: "#031120",
      glow: "rgba(6, 182, 212, 0.35)",
      name: "Electric Cyan & High-Precision Cobalt",
    },
    motifs: [
      "Precision Planetary Gears",
      "Printed Circuit Waveguides",
      "Isometric Blueprint Grids",
      "Robotic Kinematic Axes",
      "Oscilloscope Waveforms",
    ],
    designIntent: {
      fr: "Représente la puissance de l'ingénierie technique : union de la mécanique de précision, des microcontrôleurs électroniques et de la modélisation technologique.",
      ar: "يعكس عراقة وقوة الهندسة التقنية: التناغم التام بين الميكانيك الصناعي والدوائر الإلكترونية المتطورة والأنظمة الآلية.",
    },
  },
  {
    id: "sec_info",
    category: "section",
    targetKey: "info",
    number: 4,
    title: {
      fr: "Section Sciences de l'Informatique",
      ar: "شعبة علوم الإعلامية",
      en: "Computer Science Section",
    },
    subtitle: {
      fr: "Architecture logicielle, algorithmique avancée, réseaux et technologies web",
      ar: "هندسة البرمجيات، الخوارزميات الذكية، وقواعد البيانات والشبكات",
      en: "Software Engineering, Advanced Algorithms & Digital Networks",
    },
    palette: {
      primary: "#3B82F6",
      secondary: "#7C3AED",
      accent: "#38BDF8",
      deepBase: "#030B22",
      glow: "rgba(59, 130, 246, 0.38)",
      name: "Cyber Azure & Neural Violet",
    },
    motifs: [
      "Distributed Node Topologies",
      "Binary Stream Constellations",
      "Recursive Algorithmic Trees",
      "Microservice Mesh Graphs",
      "Silico-Optical Fiber Waves",
    ],
    designIntent: {
      fr: "Atmosphère futuriste et académique de l'informatique moderne : logique algorithmique, flux de données massifs et architecture système.",
      ar: "فضاء رقمي مستقبلي وأكاديمي راقٍ: شبكات البيانات العصبية، الهياكل الخوارزمية، ومعمارية النظم السحابية.",
    },
  },
  {
    id: "sec_eco",
    category: "section",
    targetKey: "eco",
    number: 5,
    title: {
      fr: "Section Économie & Gestion",
      ar: "شعبة الاقتصاد والتصرف",
      en: "Economics & Management Section",
    },
    subtitle: {
      fr: "Macroéconomie, stratégie d'entreprise, modélisation financière et statistiques",
      ar: "التحليل الاقتصادي الكلي، التخطيط الاستراتيجي، والمالية والمحاسبة",
      en: "Macroeconomics, Corporate Strategy & Financial Modeling",
    },
    palette: {
      primary: "#F59E0B",
      secondary: "#F97316",
      accent: "#FCD34D",
      deepBase: "#120B1C",
      glow: "rgba(245, 158, 11, 0.32)",
      name: "Prestige Amber Gold & Dark Imperial Obsidian",
    },
    motifs: [
      "Exponential Growth Curves",
      "Multidimensional Data Radar",
      "Organizational Tree Matrices",
      "Market Dynamic Equilibrium Lines",
      "Global Trade Flow Vectors",
    ],
    designIntent: {
      fr: "Élégance institutionnelle et analytique : synthèse des flux financiers mondiaux, de la gestion organisationnelle et des indicateurs de croissance.",
      ar: "هيبة وقوة العلوم الاقتصادية والتصرفية: مؤشرات النمو الاستثماري، التوازن الهيكلي، والتخطيط الاستراتيجي المستدام.",
    },
  },
  {
    id: "sec_lettres",
    category: "section",
    targetKey: "lettres",
    number: 6,
    title: {
      fr: "Section Lettres & Sciences Humaines",
      ar: "شعبة الآداب والعلوم الإنسانية",
      en: "Literature & Humanities Section",
    },
    subtitle: {
      fr: "Éloquence littéraire, pensée critique, histoire des civilisations et polyglottisme",
      ar: "البلاغة الأدبية، الفلسفة النقدية، التاريخ الحضاري واللغات العالمية",
      en: "Literary Eloquence, Critical Thought & Global Humanities",
    },
    palette: {
      primary: "#EC4899",
      secondary: "#9333EA",
      accent: "#F472B6",
      deepBase: "#14061A",
      glow: "rgba(236, 72, 153, 0.32)",
      name: "Aristocratic Rose-Plum & Deep Amethyst",
    },
    motifs: [
      "Illuminated Manuscript Arcs",
      "Classical Architrave Forms",
      "Cartographic Compass Roses",
      "Metaphorical Thought Spheres",
      "Chronological Civilization Strata",
    ],
    designIntent: {
      fr: "Profondeur culturelle et humaniste : hommage aux grands textes universels, au dialogue philosophique et à la richesse des civilisations.",
      ar: "عمق إنساني وحضاري رفيع: تلتقي فيه بلاغة البيان العربي، روائع الأدب العالمي، النقد الفلسفي، وسفر التاريخ والجغرافيا.",
    },
  },
  {
    id: "sec_sport",
    category: "section",
    targetKey: "sport",
    number: 7,
    title: {
      fr: "Section Sport & Sciences du Mouvement",
      ar: "شعبة الرياضة وعلوم الحركة",
      en: "Sport & Kinematic Sciences Section",
    },
    subtitle: {
      fr: "Biomécanique, physiologie de l'effort, dynamique athlétique et dépassement",
      ar: "البيوميكانيك، فيزيولوجيا الجهد البدني، والطاقة الحركية الرياضية",
      en: "Biomechanics, Exercise Physiology & Athletic Energy",
    },
    palette: {
      primary: "#EAB308",
      secondary: "#10B981",
      accent: "#FDE047",
      deepBase: "#0F1419",
      glow: "rgba(234, 179, 8, 0.32)",
      name: "Olympic Gold & Kinetic Emerald",
    },
    motifs: [
      "Dynamic Kinematic Vectors",
      "Athletic Track Perspective Curves",
      "Pulse & Cardiac Biometrics",
      "Parabolic Trajectory Arcs",
      "Biomechanics Joint Geometry",
    ],
    designIntent: {
      fr: "Énergie kinétique et science du mouvement : allie la physiologie du corps humain, la géométrie des trajectoires et l'esprit olympique.",
      ar: "طاقة حركية وعلمية نابضة بالحياة: تجمع بين فيزيولوجيا الجسد، ديناميكية مسارات الحركة، وروح التحدي والتفوق الرياضي.",
    },
  },
];

export const SUBJECT_BACKGROUNDS: BackgroundMeta[] = [
  {
    id: "subj_math",
    category: "subject",
    targetKey: "math",
    number: 8,
    title: { fr: "Mathématiques", ar: "الرياضيات", en: "Mathematics" },
    subtitle: { fr: "Algèbre, analyse, géométrie dans l'espace et probabilités", ar: "الجبر، التحليل، الهندسة الفضائية والاحتمالات", en: "Algebra, Calculus, Spatial Geometry & Probability" },
    palette: { primary: "#6366F1", secondary: "#4338CA", accent: "#A5B4FC", deepBase: "#04091C", glow: "rgba(99, 102, 241, 0.4)", name: "Cosmic Royal Indigo" },
    motifs: ["Integral Curves ∫", "Summation Sigma ∑", "Complex Plane Coordinates", "Vector Hyperplanes", "Golden Spiral & Pi π"],
    designIntent: { fr: "Immersion dans l'univers de l'analyse mathématique avec équations spatiales et courbes harmoniques.", ar: "فضاء رياضي نقي يبرز جماليات التكامل، الهندسة الفضائية، والمصفوفات الحسابية." },
  },
  {
    id: "subj_physique",
    category: "subject",
    targetKey: "physique",
    number: 9,
    title: { fr: "Sciences Physiques", ar: "العلوم الفيزيائية", en: "Physics & Chemistry" },
    subtitle: { fr: "Mécanique ondulatoire, électromagnétisme, optique et chimie organique", ar: "الميكانيك الموجي، الكهرومغناطيسية، والبنية الذرية", en: "Wave Mechanics, Electromagnetism & Atomic Physics" },
    palette: { primary: "#8B5CF6", secondary: "#6D28D9", accent: "#C084FC", deepBase: "#07071F", glow: "rgba(139, 92, 246, 0.4)", name: "Quantum Violet & Astral Cyan" },
    motifs: ["Orbital Electron Ellipses", "Sinusoidal Standing Waves", "Photon Energy Packets", "Magnetic Field Lines", "Spectroscopic Bands"],
    designIntent: { fr: "Ambiance de physique quantique et ondulatoire avec champs électromagnétiques et orbites atomiques.", ar: "أجواء فيزيائية متألقة بمجالات الطاقة الكهرومغناطيسية والمسارات الذرية المتوازنة." },
  },
  {
    id: "subj_svt",
    category: "subject",
    targetKey: "svt",
    number: 10,
    title: { fr: "Sciences de la Vie et de la Terre (SVT)", ar: "علوم الحياة والأرض", en: "Life & Earth Sciences" },
    subtitle: { fr: "Génétique moléculaire, immunologie, neurophysiologie et géologie", ar: "علم الوراثة الجزيئية، المناعة، والجيولوجيا", en: "Molecular Genetics, Immunology & Geology" },
    palette: { primary: "#10B981", secondary: "#047857", accent: "#6EE7B7", deepBase: "#021415", glow: "rgba(16, 185, 129, 0.4)", name: "Bioluminescent Jade & Earth Teal" },
    motifs: ["Chromosomal Karyotypes", "Synaptic Neuro-Vesicles", "Tectonic Fault Lines", "Cellular Mitochondria", "Double-Helix Strands"],
    designIntent: { fr: "Exploration microscopique et géologique : filaments d'ADN, vésicules synaptiques et strates terrestres.", ar: "عالم الأحياء الدقيقة والجيولوجيا: خيوط الوراثة، التشابكات العصبية، وطبقات القشرة الأرضية." },
  },
  {
    id: "subj_technique",
    category: "subject",
    targetKey: "technique",
    number: 11,
    title: { fr: "Génie Mécanique / Technique", ar: "تكنيك (الهندسة الميكانيكية)", en: "Mechanical Engineering" },
    subtitle: { fr: "Cinématique, transmission de puissance, statique et DAO/CAO", ar: "علم الحركة، نقل الحركة، والتحليل الميكانيكي الدقيق", en: "Kinematics, Power Transmission & CAD Modeling" },
    palette: { primary: "#06B6D4", secondary: "#0891B2", accent: "#67E8F9", deepBase: "#031422", glow: "rgba(6, 182, 212, 0.4)", name: "Metallic Cyan & CAD Navy" },
    motifs: ["Epicyclic Gear Trains", "Tolerance Datum Symbols", "Cross-Sectional Hatching", "Hydraulic Actuator Lines", "Bearing Assemblies"],
    designIntent: { fr: "Atmosphère de bureau d'études mécaniques : engrenages de précision, coupes techniques et cotations DAO.", ar: "أجواء الهندسة الميكانيكية الرفيعة: مسننات الحركة الدقيقة، المقاطع التقنية والمخططات الهندسية." },
  },
  {
    id: "subj_electrique",
    category: "subject",
    targetKey: "electrique",
    number: 12,
    title: { fr: "Génie Électrique / Électrique", ar: "الكتريك (الهندسة الكهربائية)", en: "Electrical Engineering" },
    subtitle: { fr: "Électronique numérique, microcontrôleurs, Grafcet et signaux", ar: "الأنظمة المنطقية، المتحكمات الدقيقة، ومخططات Grafcet", en: "Digital Electronics, Microcontrollers & Signal Processing" },
    palette: { primary: "#3B82F6", secondary: "#1D4ED8", accent: "#93C5FD", deepBase: "#030E26", glow: "rgba(59, 130, 246, 0.4)", name: "High-Voltage Azure & Circuit Blue" },
    motifs: ["Microchip Pin Busses", "Logic Gate Networks", "Grafcet Sequential Steps", "Square Clock Waveforms", "PCB Copper Traces"],
    designIntent: { fr: "Plongée dans l'électronique de pointe : bus de données, portes logiques et oscillateurs de commande.", ar: "فضاء الإلكترونيك والأنظمة الآلية: مسارات الدوائر المطبوعة، البوابات المنطقية ومخططات التزامن." },
  },
  {
    id: "subj_informatique",
    category: "subject",
    targetKey: "informatique",
    number: 13,
    title: { fr: "Informatique (Tronc Commun)", ar: "الإعلامية (المادة الموحدة)", en: "Computer Studies" },
    subtitle: { fr: "Outils numériques, bureautique avancée, initiation web et réseaux", ar: "التقنيات الرقمية، الشبكات وأساسيات التطوير", en: "Digital Technologies, Networks & Web Basics" },
    palette: { primary: "#0EA5E9", secondary: "#0284C7", accent: "#7DD3FC", deepBase: "#021124", glow: "rgba(14, 165, 233, 0.4)", name: "Sky Tech & Digital Cobalt" },
    motifs: ["Network Gateway Routers", "Data Packet Streams", "Cloud Architecture Clusters", "Hyperlink Nodes", "Pixel Grid Matrices"],
    designIntent: { fr: "Visualisation des flux numériques, des réseaux d'ordinateurs et des protocoles de communication modernes.", ar: "تصميم يعبر عن شبكات الاتصال الرقمية، الحوسبة السحابية وتبادل البيانات السلس." },
  },
  {
    id: "subj_algo",
    category: "subject",
    targetKey: "algo",
    number: 14,
    title: { fr: "Algorithmique & Programmation", ar: "الخوارزميات والبرمجة", en: "Algorithms & Programming" },
    subtitle: { fr: "Structures de données, récursivité, tri et programmation Python", ar: "هياكل البيانات، الخوارزميات التكرارية ولغة بايثون", en: "Data Structures, Recursion, Sorting & Python" },
    palette: { primary: "#3B82F6", secondary: "#6366F1", accent: "#38BDF8", deepBase: "#040D26", glow: "rgba(59, 130, 246, 0.4)", name: "Deep Navy & Algorithmic Indigo" },
    motifs: ["Binary Search Trees", "Hash Table Buckets", "Recursive Call Stacks", "Flowchart Decision Rhombi", "Abstract Code Brackets {}"],
    designIntent: { fr: "Esthétique algorithmique pure : arbres de recherche binaires, tables de hachage et graphes de décision.", ar: "عالم المنطق البرمجي المجرد: أشجار البحث الثنائية، كتل الدوال والمسارات التكرارية." },
  },
  {
    id: "subj_economie",
    category: "subject",
    targetKey: "economie",
    number: 15,
    title: { fr: "Économie", ar: "الاقتصاد", en: "Economics" },
    subtitle: { fr: "Croissance, politique monétaire, commerce international et inflation", ar: "النمو الاقتصادي، السياسة النقدية، والتجارة الدولية", en: "Economic Growth, Monetary Policy & Trade" },
    palette: { primary: "#F97316", secondary: "#C2410C", accent: "#FDBA74", deepBase: "#160C18", glow: "rgba(249, 115, 22, 0.4)", name: "Golden Amber & Economic Rust" },
    motifs: ["Supply & Demand Crossings", "Lorenz Inequality Curves", "Monetary Flow Loops", "GDP Growth Histograms", "Exchange Rate Fluctuations"],
    designIntent: { fr: "Élégance des théories économiques : courbes de Phillips, équilibre offre-demande et flux macroéconomiques.", ar: "تجسيد بصري لمفاهيم الاقتصاد: منحنيات التوازن بين العرض والطلب ومؤشرات التنمية والتبادل التجاري." },
  },
  {
    id: "subj_gestion",
    category: "subject",
    targetKey: "gestion",
    number: 16,
    title: { fr: "Gestion", ar: "التصرف", en: "Management & Accounting" },
    subtitle: { fr: "Comptabilité financière, seuil de rentabilité, trésorerie et bilan", ar: "المحاسبة المالية، عتبة المردودية، والموازنة التقديرية", en: "Financial Accounting, Break-Even & Balance Sheets" },
    palette: { primary: "#0EA5E9", secondary: "#0369A1", accent: "#38BDF8", deepBase: "#031222", glow: "rgba(14, 165, 233, 0.4)", name: "Executive Teal & Financial Navy" },
    motifs: ["Double-Entry Balance Pillars", "Break-Even Intersection Lines", "Cash Flow Gantt Bars", "Strategic Matrix Quadrants", "Financial Ratio Graphs"],
    designIntent: { fr: "Structure et rigueur de la gestion : tableaux de bord d'entreprise, seuil de rentabilité et équilibre bilanciel.", ar: "دقة وهيكلية علم التصرف: جداول التمويل، نقطة التعادل ومؤشرات الأداء المالي." },
  },
  {
    id: "subj_arabe",
    category: "subject",
    targetKey: "arabe",
    number: 17,
    title: { fr: "Arabe (Langue & Littérature)", ar: "اللغة العربية والإنشاء", en: "Arabic Literature" },
    subtitle: { fr: "Analyse textuelle, poésie classique, argumentation et stylistique", ar: "تحليل النصوص الأدبية، الشعر، البلاغة والإنشاء", en: "Textual Analysis, Classical Poetry & Rhetoric" },
    palette: { primary: "#7C3AED", secondary: "#581C87", accent: "#C084FC", deepBase: "#0D061A", glow: "rgba(124, 58, 237, 0.4)", name: "Imperial Damask Violet & Gold Accents" },
    motifs: ["Fluid Calligraphic Arcs", "Poetic Diwan Folios", "Arabesque Geometry", "Ink Stroke Dynamics", "Abstract Diacritical Points"],
    designIntent: { fr: "Noblesse de la langue arabe : volutes calligraphiques abstraites, arabesques fines et élégance littéraire.", ar: "فخامة وأصالة لغة الضاد: انحناءات خطية تجريدية، زخارف هندسية أندلسية وبلاغة الإنشاء." },
  },
  {
    id: "subj_francais",
    category: "subject",
    targetKey: "francais",
    number: 18,
    title: { fr: "Français", ar: "اللغة الفرنسية", en: "French Language & Literature" },
    subtitle: { fr: "Essai littéraire, synthèse de documents, figures de style et prose", ar: "المقالة الأدبية، التحليل النصي، والبلاغة الفرنسية", en: "Literary Essay, Stylistics & Document Synthesis" },
    palette: { primary: "#EC4899", secondary: "#BE185D", accent: "#F472B6", deepBase: "#14071A", glow: "rgba(236, 72, 153, 0.4)", name: "Bordeaux Rose & Literary Plum" },
    motifs: ["Open Quarto Book Folios", "Quill Feather Silhouettes", "Classical Typography Serifs", "Dialogue Bubble Overlays", "Literary Chapter Flourishes"],
    designIntent: { fr: "Raffinement littéraire : pages de grimoires reliés, volutes d'encre et structure d'essai argumentatif.", ar: "رقي وفخامة الأدب الفرنسي: صفحات المخطوطات، ريشة الكتابة ونماذج المقال الأدبي المقارن." },
  },
  {
    id: "subj_anglais",
    category: "subject",
    targetKey: "anglais",
    number: 19,
    title: { fr: "Anglais", ar: "اللغة الإنجليزية", en: "English Language" },
    subtitle: { fr: "Reading comprehension, essay writing, idioms and communication", ar: "الفهم النصي، التعبير الكتابي والتواصل العالمي", en: "Reading Comprehension, Essay & Global Discourse" },
    palette: { primary: "#F59E0B", secondary: "#B45309", accent: "#FCD34D", deepBase: "#120E1C", glow: "rgba(245, 158, 11, 0.4)", name: "Oxford Amber & Cosmopolitan Gold" },
    motifs: ["Meridian Globe Longitudes", "Speech Synthesis Waves", "Vocabulary Concordance Nodes", "Academic Thesis Scrolls", "Global Communication Arcs"],
    designIntent: { fr: "Ambiance académique internationale : méridiens du globe, ondes de dialogue et argumentation structurée.", ar: "طابع أكاديمي عالمي: خطوط الطول الجغرافية، موجات الحوار الفكري والتواصل الدولي الراقي." },
  },
  {
    id: "subj_philosophie",
    category: "subject",
    targetKey: "philosophie",
    number: 20,
    title: { fr: "Philosophie", ar: "الفلسفة", en: "Philosophy" },
    subtitle: { fr: "Épistémologie, métaphysique, morale, politique et dialectique", ar: "نظرية المعرفة، الوجود، الأخلاق، والسياسة", en: "Epistemology, Ethics, Metaphysics & Dialectics" },
    palette: { primary: "#A855F7", secondary: "#7E22CE", accent: "#D8B4FE", deepBase: "#0E071A", glow: "rgba(168, 85, 247, 0.4)", name: "Athenian Purple & Deep Contemplation" },
    motifs: ["Classical Ionic Columns", "Dialectical Triad Spirals", "Abstract Thinker Contour", "Golden Ratio Fibonacci Grids", "Symbol of Psyche Ψ"],
    designIntent: { fr: "Atmosphère contemplative et dialectique : colonnades antiques, spirale du doute méthodique et symbole Psi.", ar: "فضاء الفكر والتأمل الفلسفي: أعمدة الحكمة اليونانية، لولب الشك المنهجي، وحوار العقل والوجود." },
  },
  {
    id: "subj_histoire",
    category: "subject",
    targetKey: "histoire",
    number: 21,
    title: { fr: "Histoire", ar: "التاريخ", en: "History" },
    subtitle: { fr: "Histoire contemporaine, relations internationales, Tunisie au XXe siècle", ar: "التاريخ المعاصر، العلاقات الدولية، وتاريخ تونس الحديث", en: "Contemporary History & Tunisian Independence" },
    palette: { primary: "#E11D48", secondary: "#9F1239", accent: "#FDA4AF", deepBase: "#160712", glow: "rgba(225, 29, 72, 0.4)", name: "Historical Crimson & Antique Bronze" },
    motifs: ["Chronological Timeline Strata", "Antique Seal Monograms", "Cartographic Treaty Boundaries", "Archival Document Edges", "Monumental Obelisk Lines"],
    designIntent: { fr: "Mémoire et profondeur historique : frises chronologiques des grandes époques, sceaux d'archives et repères du XXe siècle.", ar: "عبق التاريخ والذاكرة الوطنية: خطوط الزمن المعاصر، أختام المعاهدات الدبلوماسية وسفر الكفاح الوطني." },
  },
  {
    id: "subj_geographie",
    category: "subject",
    targetKey: "geographie",
    number: 22,
    title: { fr: "Géographie", ar: "الجغرافيا", en: "Geography" },
    subtitle: { fr: "Mondialisation, organisation de l'espace mondial et aménagement", ar: "العولمة، تباين المجال العالمي والتهيئة الترابية", en: "Globalization, Spatial Dynamics & Cartography" },
    palette: { primary: "#059669", secondary: "#047857", accent: "#34D399", deepBase: "#02130F", glow: "rgba(5, 150, 105, 0.4)", name: "Cartographic Emerald & Earth Topo" },
    motifs: ["Topographic Elevation Contours", "Mercator Projection Grids", "Geographic Spatial Clusters", "Compass Rose Quadrants", "Hydrological Basin Arcs"],
    designIntent: { fr: "Richesse cartographique : courbes de niveau topographiques, méridiens de projection et pôles de la mondialisation.", ar: "دقة الجغرافيا والخرائط: خطوط الارتفاع الطوبوغرافية، شبكات الإحداثيات المكانية ومحاور التجارة العالمية." },
  },
  {
    id: "subj_sport_bio",
    category: "subject",
    targetKey: "sport_bio",
    number: 23,
    title: { fr: "Sciences Biologiques (Sport)", ar: "العلوم البيولوجية (شعبة الرياضة)", en: "Biological Sciences (Sport)" },
    subtitle: { fr: "Physiologie neuromusculaire, filières énergétiques et biomécanique", ar: "الفيزيولوجيا العضلية، مسالك الطاقة، والديناميكا الحيوية", en: "Neuromuscular Physiology & Energy Pathways" },
    palette: { primary: "#10B981", secondary: "#0D9488", accent: "#5EEAD4", deepBase: "#021415", glow: "rgba(16, 185, 129, 0.4)", name: "Cellular Cyan & Kinetic Emerald" },
    motifs: ["Myofibril Sarcomere Grids", "ATP Energy Pathway Loops", "Cardiorespiratory Flow Spirals", "Lactate Threshold Curves", "Muscle Fiber Bundles"],
    designIntent: { fr: "Biologie de la performance humaine : filaments d'actine-myosine, voies métaboliques ATP et échanges respiratoires.", ar: "بيولوجيا الأداء الرياضي العالي: اللييفات العضلية، مسارات إنتاج طاقة ATP والتكيف القلبي الرئوي." },
  },
  {
    id: "subj_sport_ep",
    category: "subject",
    targetKey: "sport_ep",
    number: 24,
    title: { fr: "Éducation Physique & Sport (EPS)", ar: "التربية البدنية / الرياضة", en: "Physical Education & Athletics" },
    subtitle: { fr: "Spécialités athlétiques, sports collectifs, gymnastique et tactique", ar: "الاختصاصات الفردية والجماعية، الجمباز والتكتيك الرياضي", en: "Athletics, Collective Sports & Movement Strategy" },
    palette: { primary: "#EAB308", secondary: "#CA8A04", accent: "#FEF08A", deepBase: "#141108", glow: "rgba(234, 179, 8, 0.4)", name: "Olympic Laurels & Track Gold" },
    motifs: ["Athletic Running Track Lanes", "Parabolic Ballistic Arcs", "Kinematic Human Silhouette Arcs", "Tactical Pitch Formations", "Olympic Flame Rays"],
    designIntent: { fr: "Dynamisme et discipline sportive : couloirs de piste d'athlétisme, trajectoires paraboliques et schémas tactiques.", ar: "حركية وانضباط رياضي: أروقة مضمار ألعاب القوى، مسارات الكرات المقوسة والمخططات التكتيكية." },
  },
  {
    id: "subj_islamique",
    category: "subject",
    targetKey: "islamique",
    number: 25,
    title: { fr: "Pensée Islamique", ar: "التفكير الإسلامي", en: "Islamic Thought & Civilization" },
    subtitle: { fr: "Ijtihad, valeurs universelles, éthique, dialogue et civilisation", ar: "الاجتهاد، مقاصد الشريعة، القيم الحضارية، وأخلاقيات الحوار", en: "Ijtihad, Civilization Values & Ethical Dialogue" },
    palette: { primary: "#059669", secondary: "#065F46", accent: "#FCD34D", deepBase: "#03140F", glow: "rgba(5, 150, 105, 0.4)", name: "Zaytouna Emerald & Andalusian Gold" },
    motifs: ["Girih Geometric Star Tessellations", "Andalusian Horseshoe Arch Arcs", "Illuminated Manuscript Border Curves", "Calligraphic Harmony Flourishes", "Spiritual Radiance Nodes"],
    designIntent: { fr: "Sérénité académique et beauté géométrique : étoiles islamiques polygonales, arcs outrepassés et rayonnement intellectuel.", ar: "سكينة وجمالية روحية وحضارية: النجوم الثمانية والفسيفساء الهندسية الإسلامية المستلهمة من عراقة جامع الزيتونة." },
  },
];

export const ALL_25_BACKGROUNDS: BackgroundMeta[] = [
  ...SECTION_BACKGROUNDS,
  ...SUBJECT_BACKGROUNDS,
];

export function getBackgroundMetaById(id: string): BackgroundMeta | undefined {
  return ALL_25_BACKGROUNDS.find((b) => b.id === id);
}

export function getSectionBackgroundMeta(branchId: string): BackgroundMeta | undefined {
  return SECTION_BACKGROUNDS.find((b) => b.targetKey === branchId);
}

export function getSubjectBackgroundMeta(subjectId: string): BackgroundMeta | undefined {
  // Normalize mapping for aliases
  const aliasMap: Record<string, string> = {
    tic_bd: "informatique",
    bd: "informatique",
  };
  const key = aliasMap[subjectId] || subjectId;
  return SUBJECT_BACKGROUNDS.find((b) => b.targetKey === key);
}
