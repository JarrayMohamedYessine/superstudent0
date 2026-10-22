import { BranchItem, LangKey, SubjectItem, GradeLevel, RoomItem } from "./types";

export const ENV =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string> }).env) ||
  {};

export const MAX_MESSAGES = 60;
export const MESSAGE_RETENTION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days retention for room messages
export const MEDIA_VAULT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days (2 weeks) retention for Super Admin media archive
export const IMG_MAX_DIM = 600;
export const IMG_QUALITY = 0.6;
export const AVATAR_DIM = 160;
export const AVATAR_QUALITY = 0.7;
export const MAX_IMAGES_PER_MSG = 8;
export const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB per PDF file (Exams, Solutions, National tests)
export const PRESENCE_WINDOW_MS = 3 * 60 * 1000;
export const SEND_COOLDOWN_MS = 1500;

export const COLORS = {
  bg0: "#0A0F1F",
  bg1: "#0F1730",
  card: "rgba(255,255,255,0.07)",
  cardSolid: "#141C38",
  cardBorder: "rgba(255,255,255,0.12)",
  text: "#F1F5F9",
  textSoft: "#9AA7C7",
  accent: "#6366F1",
  accent2: "#8B5CF6",
  accent3: "#EC4899",
  gold: "#FBBF24",
  danger: "#F43F5E",
  success: "#34D399",
  cyan: "#06B6D4",
  line: "rgba(255,255,255,0.12)",
  inputBg: "rgba(255,255,255,0.06)",
  ink: "#0A0F1F",
  paper: "#0F1730",
  paperCard: "#141C38",
  chalk: "#F1F5F9",
  graphite: "#F1F5F9",
  graphiteSoft: "#9AA7C7",
  pen: "#F43F5E",
};

export const GRAD = `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2} 55%, ${COLORS.accent3})`;
export const GRAD_GOLD = `linear-gradient(135deg, #F59E0B, #FBBF24 55%, #FCD34D)`;
export const GRAD_CYAN = `linear-gradient(135deg, #06B6D4, #3B82F6 55%, #6366F1)`;
export const GRAD_EMERALD = `linear-gradient(135deg, #059669, #10B981 55%, #34D399)`;

export const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#06B6D4",
  "#F97316", "#3B82F6", "#14B8A6", "#E11D48", "#7C3AED", "#0EA5E9",
];

export function colorFor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export const GRADE_LEVELS: { id: GradeLevel; name: Record<LangKey, string>; badge: string }[] = [
  {
    id: "4eme_bac",
    name: { ar: "الرابعة ثانوي — الباكالوريا", fr: "4ème année — Baccalauréat", en: "4th Year — Baccalauréat" },
    badge: "BAC 2026",
  },
  {
    id: "3eme",
    name: { ar: "الثالثة ثانوي", fr: "3ème année secondaire", en: "3rd Year Secondary" },
    badge: "3ème",
  },
  {
    id: "2eme",
    name: { ar: "الثانية ثانوي", fr: "2ème année secondaire", en: "2nd Year Secondary" },
    badge: "2ème",
  },
];

export const SUBJECTS: Record<string, SubjectItem> = {
  math: { name: { ar: "الرياضيات", fr: "Mathématiques", en: "Mathematics" }, mono: { ar: "ر", fr: "M", en: "M" }, color: "#6366F1" },
  physique: { name: { ar: "العلوم الفيزيائية", fr: "Sciences Physiques", en: "Physics" }, mono: { ar: "ف", fr: "P", en: "P" }, color: "#8B5CF6" },
  svt: { name: { ar: "علوم الحياة والأرض / العلوم الطبيعية", fr: "Sciences de la Vie et de la Terre (SVT)", en: "Life & Earth Sciences" }, mono: { ar: "ح", fr: "SV", en: "LS" }, color: "#10B981" },
  arabe: { name: { ar: "العربية", fr: "Arabe", en: "Arabic" }, mono: { ar: "ع", fr: "Ar", en: "Ar" }, color: "#7C3AED" },
  francais: { name: { ar: "الفرنسية", fr: "Français", en: "French" }, mono: { ar: "فر", fr: "Fr", en: "Fr" }, color: "#EC4899" },
  anglais: { name: { ar: "الإنجليزية", fr: "Anglais", en: "English" }, mono: { ar: "إن", fr: "An", en: "En" }, color: "#F59E0B" },
  philosophie: { name: { ar: "الفلسفة", fr: "Philosophie", en: "Philosophy" }, mono: { ar: "فل", fr: "Ph", en: "Ph" }, color: "#A855F7" },
  informatique: { name: { ar: "الإعلامية", fr: "Informatique / TIC", en: "Computer Studies" }, mono: { ar: "عل", fr: "Info", en: "CS" }, color: "#06B6D4" },
  
  // Sciences Techniques
  technique: { name: { ar: "تكنيك (الهندسة الميكانيكية)", fr: "Technique (Génie Mécanique)", en: "Mechanical Engineering" }, mono: { ar: "تك", fr: "GM", en: "ME" }, color: "#06B6D4" },
  electrique: { name: { ar: "الكتريك (الهندسة الكهربائية)", fr: "الكتريك (Génie Électrique)", en: "Electrical Engineering" }, mono: { ar: "كه", fr: "GE", en: "EE" }, color: "#3B82F6" },
  
  // Sciences de l'Informatique
  algo: { name: { ar: "الخوارزميات والبرمجة", fr: "Algorithmique & Prog", en: "Algorithms & Programming" }, mono: { ar: "خ", fr: "Algo", en: "Algo" }, color: "#3B82F6" },
  tic_bd: { name: { ar: "الإعلامية / تقنيات الإعلام والاتصال (قواعد البيانات والويب)", fr: "TIC & Bases de Données", en: "ICT & Databases" }, mono: { ar: "قب", fr: "BD", en: "DB" }, color: "#14B8A6" },
  
  // Économie & Gestion
  economie: { name: { ar: "الاقتصاد", fr: "Économie", en: "Economics" }, mono: { ar: "اق", fr: "Éco", en: "Econ" }, color: "#F97316" },
  gestion: { name: { ar: "التصرف", fr: "Gestion", en: "Management" }, mono: { ar: "تص", fr: "Gest", en: "Mgmt" }, color: "#0EA5E9" },
  histgeo: { name: { ar: "التاريخ والجغرافيا", fr: "Histoire-Géographie", en: "History & Geography" }, mono: { ar: "تج", fr: "HG", en: "HG" }, color: "#E11D48" },
  
  // Lettres
  islamique: { name: { ar: "التفكير الإسلامي", fr: "Pensée Islamique", en: "Islamic Thought" }, mono: { ar: "إس", fr: "PI", en: "IT" }, color: "#059669" },
  
  // Sport
  sport_bio: { name: { ar: "العلوم البيولوجية", fr: "Sciences Biologiques", en: "Biological Sciences" }, mono: { ar: "بي", fr: "Bio", en: "Bio" }, color: "#10B981" },
  sport_ep: { name: { ar: "التربية البدنية / الرياضة", fr: "Éducation Physique & Sport", en: "Physical Education" }, mono: { ar: "ري", fr: "EPS", en: "PE" }, color: "#F59E0B" },

  // Langues Optionnelles & Étrangères
  italien: { name: { ar: "الإيطالية", fr: "Italien", en: "Italian" }, mono: { ar: "إي", fr: "It", en: "It" }, color: "#10B981" },
  allemand: { name: { ar: "الألمانية", fr: "Allemand", en: "German" }, mono: { ar: "أل", fr: "All", en: "De" }, color: "#F59E0B" },
  espagnol: { name: { ar: "الإسبانية", fr: "Espagnol", en: "Spanish" }, mono: { ar: "إس", fr: "Esp", en: "Es" }, color: "#EF4444" },
  russe: { name: { ar: "الروسية", fr: "Russe", en: "Russian" }, mono: { ar: "رو", fr: "Rus", en: "Ru" }, color: "#3B82F6" },
  chinois: { name: { ar: "الصينية", fr: "Chinois", en: "Chinese" }, mono: { ar: "صي", fr: "Chi", en: "Zh" }, color: "#DC2626" },
  turc: { name: { ar: "التركية", fr: "Turc", en: "Turkish" }, mono: { ar: "تر", fr: "Tur", en: "Tr" }, color: "#F97316" },
  portugais: { name: { ar: "البرتغالية", fr: "Portugais", en: "Portuguese" }, mono: { ar: "بر", fr: "Por", en: "Pt" }, color: "#06B6D4" },
};

export const BRANCHES: BranchItem[] = [
  {
    id: "math",
    name: { ar: "شعبة الرياضيات", fr: "Mathématiques", en: "Mathematics" },
    mono: { ar: "ر", fr: "M", en: "M" },
    color: "#6366F1",
    rooms: [
      { roomId: "math-math", subject: "math" },
      { roomId: "math-physique", subject: "physique" },
      { roomId: "math-svt", subject: "svt" },
      { roomId: "shared-arabe", subject: "arabe", shared: true },
      { roomId: "shared-francais", subject: "francais", shared: true },
      { roomId: "shared-anglais", subject: "anglais", shared: true },
      { roomId: "shared-philosophie", subject: "philosophie", shared: true },
      { roomId: "shared-informatique", subject: "informatique", shared: true },
    ],
  },
  {
    id: "sciexp",
    name: { ar: "شعبة العلوم التجريبية", fr: "Sciences Expérimentales", en: "Experimental Sciences" },
    mono: { ar: "تج", fr: "Ex", en: "Ex" },
    color: "#10B981",
    rooms: [
      { roomId: "sciexp-svt", subject: "svt" },
      { roomId: "sciexp-physique", subject: "physique" },
      { roomId: "sciexp-math", subject: "math" },
      { roomId: "shared-arabe", subject: "arabe", shared: true },
      { roomId: "shared-francais", subject: "francais", shared: true },
      { roomId: "shared-anglais", subject: "anglais", shared: true },
      { roomId: "shared-philosophie", subject: "philosophie", shared: true },
      { roomId: "shared-informatique", subject: "informatique", shared: true },
    ],
  },
  {
    id: "scitech",
    name: { ar: "شعبة العلوم التقنية", fr: "Sciences Techniques", en: "Technical Sciences" },
    mono: { ar: "تق", fr: "Tc", en: "Tc" },
    color: "#06B6D4",
    rooms: [
      { roomId: "scitech-technique", subject: "technique" },
      { roomId: "scitech-electrique", subject: "electrique" },
      { roomId: "scitech-math", subject: "math" },
      { roomId: "scitech-physique", subject: "physique" },
      { roomId: "shared-arabe", subject: "arabe", shared: true },
      { roomId: "scitech-francais", subject: "francais" },
      { roomId: "scitech-anglais", subject: "anglais" },
      { roomId: "shared-philosophie", subject: "philosophie", shared: true },
      { roomId: "shared-informatique", subject: "informatique", shared: true },
    ],
  },
  {
    id: "info",
    name: { ar: "شعبة علوم الإعلامية", fr: "Sciences de l'Informatique", en: "Computer Science" },
    mono: { ar: "عل", fr: "In", en: "CS" },
    color: "#3B82F6",
    rooms: [
      { roomId: "info-algo", subject: "algo" },
      { roomId: "info-tic-bd", subject: "tic_bd" },
      { roomId: "info-math", subject: "math" },
      { roomId: "info-physique", subject: "physique" },
      { roomId: "shared-arabe", subject: "arabe", shared: true },
      { roomId: "shared-francais", subject: "francais", shared: true },
      { roomId: "shared-anglais", subject: "anglais", shared: true },
      { roomId: "shared-philosophie", subject: "philosophie", shared: true },
    ],
  },
  {
    id: "eco",
    name: { ar: "شعبة الاقتصاد والتصرف", fr: "Économie et Gestion", en: "Economics & Management" },
    mono: { ar: "تص", fr: "Éc", en: "Ec" },
    color: "#F97316",
    rooms: [
      { roomId: "eco-economie", subject: "economie" },
      { roomId: "eco-gestion", subject: "gestion" },
      { roomId: "eco-math", subject: "math" },
      { roomId: "shared-arabe", subject: "arabe", shared: true },
      { roomId: "shared-francais", subject: "francais", shared: true },
      { roomId: "shared-anglais", subject: "anglais", shared: true },
      { roomId: "shared-philosophie", subject: "philosophie", shared: true },
      { roomId: "eco-histgeo", subject: "histgeo" },
    ],
  },
  {
    id: "lettres",
    name: { ar: "شعبة الآداب", fr: "Lettres", en: "Humanities" },
    mono: { ar: "آد", fr: "Le", en: "Hu" },
    color: "#EC4899",
    rooms: [
      { roomId: "lettres-philosophie", subject: "philosophie" },
      { roomId: "lettres-arabe", subject: "arabe" },
      { roomId: "lettres-francais", subject: "francais" },
      { roomId: "lettres-anglais", subject: "anglais" },
      {roomId: "lettres-histgeo", subject: "histgeo"},
      { roomId: "lettres-islamique", subject: "islamique" },
      { roomId: "shared-informatique", subject: "informatique", shared: true },
    ],
  },
  {
    id: "sport",
    name: { ar: "شعبة الرياضة", fr: "Sport", en: "Sport" },
    mono: { ar: "ري", fr: "Sp", en: "Sp" },
    color: "#EAB308",
    rooms: [
      { roomId: "sport-bio", subject: "sport_bio" },
      { roomId: "sport-ep", subject: "sport_ep" },
      { roomId: "sport-physique", subject: "physique" },
      { roomId: "sport-math", subject: "math" },
      { roomId: "shared-arabe", subject: "arabe", shared: true },
      { roomId: "shared-francais", subject: "francais", shared: true },
      { roomId: "shared-anglais", subject: "anglais", shared: true },
      { roomId: "shared-philosophie", subject: "philosophie", shared: true },
    ],
  },
];

export const SPECIAL_ROOMS: RoomItem[] = [
  {
    roomId: "mods-only",
    subject: "philosophie",
    isSpecial: "mods-only",
  },
  {
    roomId: "admin-mod-channel",
    subject: "technique",
    isSpecial: "admin-mod-channel",
  },
];

export const T = {
  ar: {
    appName: "SuperStudent",
    tagline: "موارد دراسية منظمة ومجتمع مشترك لتلاميذ الثانوي والباكالوريا في تونس",
    platformV2: "SuperStudent Engine",
    langName: "العربية",
    admisGreeting: "بالتوفيق في المراجعة",
    guestBadge: "زائر (تصفح فقط)",
    guestNotice: "أنت تتصفح كزائر. سجّل الدخول للمشاركة في النقاش واستخدام الميزات المتاحة للحسابات.",
    loginToPost: "سجّل دخولك للمشاركة في النقاش",
    loginToAi: "سجّل دخولك لاستخدام المساعد الذكي",
    onboardingTitle: "مرحبًا بك في SuperStudent",
    onboardingSub: "اختر شعبتك ومستواك الدراسي لبدء تجربتك المخصصة",
    chooseLevel: "المستوى الدراسي",
    chooseStream: "الشعبة",
    startExploring: "ابدأ المراجعة الآن",
    browseAsGuest: "تصفح كزائر",
    navRooms: "غرف المواد",
    navAi: "المساعد الذكي SuperStudent AI",
    navArchive: "أرشيف 17 سنة",
    navLessons: "الدروس والملخصات",
    navFaq: "الأسئلة الشائعة",
    navAbout: "من نحن والشركاء",
    navAdmin: "لوحة الإدارة والإشراف",
    navSettings: "الإعدادات",
    loginTab: "تسجيل الدخول", registerTab: "حساب جديد",
    email: "البريد الإلكتروني", password: "كلمة السر", confirmPassword: "تأكيد كلمة السر",
    signIn: "دخول", continueBtn: "متابعة", createAccount: "إنشاء الحساب",
    username: "اسم المستخدم", displayName: "الاسم الظاهر", chooseAvatar: "اختر صورة (اختياري)",
    yourBranch: "شعبتك", back: "رجوع",
    errFields: "يرجى ملء جميع الحقول", errEmail: "بريد إلكتروني غير صالح",
    errPasswordShort: "كلمة السر يجب أن تكون 8 خانات على الأقل",
    errPasswordMatch: "كلمتا السر غير متطابقتين",
    errEmailTaken: "هذا البريد مسجل من قبل",
    errUsernameTaken: "اسم المستخدم محجوز، جرّب اسمًا آخر",
    errUsernameInvalid: "بدون فراغات، 3 إلى 20 خانة (حروف/أرقام)",
    errNoAccount: "لا يوجد حساب بهذا البريد",
    errWrongPass: "كلمة السر غير صحيحة",
    errBanned: "تم حظر هذا الحساب من طرف الإدارة",
    errLocked: "محاولات كثيرة، حاول بعد 5 دقائق",
    step2Title: "لمسة أخيرة على حسابك",
    branches: "الشعب", selectBranchSub: "الرابعة ثانوي — باكالوريا",
    subjectsHint: "اختر مادة للدخول إلى غرفة النقاش", roomsLabel: "مواد",
    sharedBadge: "غرفة مشتركة بين عدة شعب",
    typeMessage: "اكتب رسالتك…", noMessages: "لا توجد رسائل بعد، كن أول من يبدأ النقاش!",
    attach: "إرفاق", sending: "جارِ الإرسال…",
    imageTooMany: "6 صور كحد أقصى في الرسالة الواحدة",
    pdfTooBig: "حجم الملف يتجاوز 5 ميغا",
    openFile: "فتح الملف", deleteMsg: "حذف",
    logout: "تسجيل الخروج", admin: "لوحة الإدارة", settings: "الإعدادات", home: "الرئيسية",
    adminTitle: "لوحة المشرف الأعلى والإشراف", totalUsers: "إجمالي المسجلين", activeNow: "نشط الآن", totalMods: "المشرفون",
    searchUser: "ابحث بالبريد أو اسم المستخدم", searchBtn: "بحث", noUserFound: "لم يتم العثور على مستخدم",
    banAction: "حظر الحساب", unbanAction: "رفع الحظر", banned: "محظور",
    banDuration: "مدة الحظر", minutes: "دقائق", hours: "ساعات", forever: "دائم",
    cancel: "إلغاء", confirm: "تأكيد",
    modRoomsTitle: "غرف الإشراف (يقدر يحذف رسائل فيها)", save: "حفظ", saved: "تم الحفظ",
    you: "أنت", superAdmin: "المشرف الأعلى", moderator: "مسؤول الغرفة", eliteStudent: "تلميذ متميز", member: "تلميذ",
    navDocuments: "بنك الوثائق والامتحانات",
    confirmDelete: "تأكيد حذف الرسالة؟", confirmDeleteAccount: "تأكيد حذف الحساب نهائيًا؟", deleteAccount: "حذف الحساب",
    switchToRegister: "ليس لديك حساب؟ أنشئ واحدًا مجانًا", switchToLogin: "لديك حساب بالفعل؟ سجّل دخولك",
    loading: "جارِ التحميل…",
    oauthTitle: "أو سجّل عبر", oauthGoogle: "غوغل", oauthFacebook: "فيسبوك", oauthMicrosoft: "مايكروسوفت", oauthApple: "أبل",
    oauthNotConfigured: "لم يتم إعداد تسجيل الدخول عبر الشبكات الاجتماعية بعد",
    oauthError: "تعذر تسجيل الدخول عبر الشبكة الاجتماعية",
    muteUser: "إسكات العضو", muteTitle: "مدة الإسكات", mutedUntil: "مكتوم حتى", unmute: "رفع الإسكات",
    errMuted: "أنت مكتوم في هذه الغرفة، لا يمكنك الإرسال حاليًا",
    mutedBadge: "مكتوم",
    deleteImage: "حذف الصورة", deleteMessage: "حذف الرسالة",
    settingsTitle: "الإعدادات", editProfile: "تعديل الملف الشخصي", changeBranch: "تغيير الشعبة",
    aboutTitle: "نبذة عن المنصة والشركاء", aboutText: "تساعد SuperStudent تلاميذ الثانوي في تونس على الوصول إلى موارد دراسية منظمة حسب المواد والشعب والتواصل مع زملائهم.",
    changePassword: "تغيير كلمة السر", currentPassword: "كلمة السر الحالية", newPassword: "كلمة السر الجديدة",
    saveProfile: "حفظ التعديلات", profileSaved: "تم حفظ التعديلات",
    branchChangedHint: "عند تغيير الشعبة تتغير المواد الظاهرة تلقائيًا",
    passwordChanged: "تم تغيير كلمة السر", errWrongCurrentPass: "كلمة السر الحالية غير صحيحة",
    promoteMod: "تعيين مشرفًا", demoteMod: "إلغاء الإشراف",
    mySubjects: "موادي", chooseBranch: "اختر شعبتك", branchNote: "ستتغير المواد والتمارين الظاهرة حسب الشعبة والمستوى",
    errCooldown: "تمهل قليلًا قبل إرسال رسالة جديدة",
    banUntil: "محظور حتى",
    noUsers: "لا يوجد مستخدمون بعد", usersList: "قائمة المستخدمين والمسجلين",
    role: "الدور", status: "الحالة", actions: "إجراءات",
    mute5: "5 دقائق", mute30: "30 دقيقة", mute1h: "ساعة", mute6h: "6 ساعات", mute24h: "24 ساعة", muteForever: "دائم",
    ban5: "5 دقائق", ban30: "30 دقيقة", ban1h: "ساعة", ban6h: "6 ساعات", ban24h: "24 ساعة", banForever: "دائم",
    deleteMsgShort: "حذف", modActions: "أدوات الإشراف", refresh: "تحديث",
    // Special Rooms
    modsOnlyRoomTitle: "غرفة المشرفين الخاصة (Moderators Only)",
    modsOnlyRoomSub: "فضاء مغلق وخاص لتنسيق الإشراف ومناقشة المحتوى بين المشرفين والمشرف الأعلى",
    adminModChannelTitle: "القناة المباشرة مع المشرف الأعلى",
    adminModChannelSub: "تواصل خاص ومباشر بين المشرفين والإدارة العليا للمنصة",
    // AI Hub
    aiTitle: "المساعد الأكاديمي الذكي SuperStudent AI",
    aiSubtitle: "حل التمارين خطوة بخطوة، تصحيح الإجابات على 20، كتابة المقالات، وتوليد أسئلة تدريبية فورية",
    modeSolver: "حل تمرين مفصل",
    modeExplanation: "تفسير وشرح المفاهيم والدروس",
    modeEssay: "مساعد المقالات والفلسفة",
    modeQuiz: "توليد تمارين واختبارات",
    modeGrader: "تصحيح الإجابة وسلم الإسناد",
    modeSummary: "ملخصات وقواعد ذهبية",
    modeWeakness: "تشخيص نقاط الضعف",
    aiInputPlaceholder: "اكتب مسألتك، انسخ نص تمرين، أو اطلب تلخيص درس…",
    aiSend: "استشر المساعد",
    aiThinking: "جارِ التحليل الرياضي والتربوي وفق المنهاج التونسي…",
    uploadExerciseImage: "إرفاق صورة التمرين (OCR)",
    // Archive
    archiveTitle: "خزانة امتحانات الباكالوريا الرسمية (17 سنة)",
    archiveSub: "جميع مواضيع الدورة الرئيسية ودورة المراقبة من 2007 إلى 2024 مع عناصر الإجابة وسلالم الإسناد",
    yearSelect: "السنة",
    sessionSelect: "الدورة",
    sessionPrincipal: "الدورة الرئيسية",
    sessionControl: "دورة المراقبة",
    downloadExam: "تحميل الموضوع",
    viewCorrection: "عرض عناصر الإصلاح",
    // CMS
    cmsTitle: "خزانة الدروس والملخصات الرسمية",
    cmsSub: "بطاقات مراجعة مركزة، خرائط ذهنية، وملخصات منتقاة حسب المحاور الرسمية",
    addLesson: "إضافة درس أو ملخص جديد",
    // Reports
    reportsTitle: "بلاغات وشكاوى المستخدمين",
    reportReason: "السبب",
    reportStatus: "الحالة",
    resolveReport: "تمت المعالجة",
    dismissReport: "تجاهل",
    // Audit Log
    auditTitle: "سجل العمليات والأمان (Audit Log)",
    auditActor: "المستخدم",
    auditAction: "الإجراء",
    auditTime: "التاريخ والوقت",
    exportExcelBtn: "تصدير الإحصائيات كملف Excel / CSV",
    // Notifications & Survey
    notificationsTitle: "التنبيهات والإعلانات",
    markAllRead: "تحديد الكل كمقروء",
    noNotifications: "لا توجد تنبيهات جديدة حاليًا",
    surveyTitle: "التواصل مع الإدارة",
    surveyQuestion: "رسالتك تصلنا مباشرة، ونقرأ كل كلمة بأنفسنا. قل لنا ما يخطر ببالك بكل صراحة.",
    surveySubmit: "إرسال التقييم",
    surveyThanks: "شكرًا لملاحظاتك القيمة لتطوير المنصة!",
    // MFA
    mfaTitle: "المصادقة الثنائية (MFA)",
    mfaDesc: "حماية إضافية لحسابات المشرفين والإدارة العليا عبر رمز تأكيد لمرة واحدة.",
    mfaEnable: "تفعيل المصادقة الثنائية",
    mfaDisable: "تعطيل المصادقة الثنائية",
  },
  fr: {
    appName: "SuperStudent",
    tagline: "Ressources d’étude organisées et communauté pour les lycéens tunisiens",
    platformV2: "Bacorum v2 Engine",
    langName: "Français",
    admisGreeting: "Bonnes révisions",
    guestBadge: "Visiteur (Lecture seule)",
    guestNotice: "Vous naviguez en mode invité. Connectez-vous pour participer aux échanges et utiliser les fonctionnalités réservées aux comptes.",
    loginToPost: "Connectez-vous pour participer",
    loginToAi: "Connectez-vous pour utiliser l'IA",
    onboardingTitle: "Bienvenue sur SuperStudent",
    onboardingSub: "Choisissez votre filière et votre niveau pour personnaliser votre expérience",
    chooseLevel: "Niveau scolaire",
    chooseStream: "Section / Filière",
    startExploring: "Commencer la révision",
    browseAsGuest: "Continuer comme invité",
    navRooms: "Salons Matières",
    navAi: "Assistant BacAdmis AI",
    navArchive: "Archives Bac 17 ans",
    navLessons: "Cours & Fiches",
    navFaq: "FAQ & Conseils",
    navAbout: "À propos & Partenaires",
    navAdmin: "Administration & Modération",
    navSettings: "Paramètres",
    loginTab: "Connexion", registerTab: "Nouveau compte",
    email: "E-mail", password: "Mot de passe", confirmPassword: "Confirmer le mot de passe",
    signIn: "Se connecter", continueBtn: "Continuer", createAccount: "Créer le compte",
    username: "Nom d'utilisateur", displayName: "Nom affiché", chooseAvatar: "Photo de profil (optionnel)",
    yourBranch: "Votre filière", back: "Retour",
    errFields: "Merci de remplir tous les champs", errEmail: "E-mail invalide",
    errPasswordShort: "8 caractères minimum",
    errPasswordMatch: "Les mots de passe ne correspondent pas",
    errEmailTaken: "Cet e-mail est déjà utilisé",
    errUsernameTaken: "Nom d'utilisateur déjà pris",
    errUsernameInvalid: "Sans espaces, 3 à 20 caractères",
    errNoAccount: "Aucun compte pour cet e-mail",
    errWrongPass: "Mot de passe incorrect",
    errBanned: "Ce compte a été banni par l'administration",
    errLocked: "Trop de tentatives, réessayez dans 5 minutes",
    step2Title: "Dernière touche à votre profil",
    branches: "Sections", selectBranchSub: "4ème année — Baccalauréat",
    subjectsHint: "Choisissez une matière pour rejoindre la discussion", roomsLabel: "matières",
    sharedBadge: "Salon partagé entre plusieurs sections",
    typeMessage: "Écrivez votre message…", noMessages: "Aucun message pour le moment, lancez la discussion !",
    attach: "Joindre", sending: "Envoi…",
    imageTooMany: "6 images maximum par message",
    pdfTooBig: "Le fichier dépasse 5 Mo",
    openFile: "Ouvrir le fichier", deleteMsg: "Supprimer",
    logout: "Déconnexion", admin: "Administration", settings: "Paramètres", home: "Accueil",
    adminTitle: "Panneau de supervision & modération", totalUsers: "Inscrits au total", activeNow: "Actifs maintenant", totalMods: "Modérateurs",
    searchUser: "Rechercher par e-mail ou pseudo", searchBtn: "Rechercher", noUserFound: "Aucun utilisateur trouvé",
    banAction: "Bannir", unbanAction: "Débannir", banned: "Banni",
    banDuration: "Durée du bannissement", minutes: "minutes", hours: "heures", forever: "Définitif",
    cancel: "Annuler", confirm: "Confirmer",
    modRoomsTitle: "Salons modérés", save: "Enregistrer", saved: "Enregistré",
    you: "Vous", superAdmin: "Super Administrateur", moderator: "Modérateur", eliteStudent: "Élève Élite (Contributeur)", member: "Élève",
    navDocuments: "Sujets & Archives",
    confirmDelete: "Supprimer ce message ?", confirmDeleteAccount: "Supprimer définitivement ce compte ?", deleteAccount: "Supprimer le compte",
    switchToRegister: "Pas de compte ? Inscrivez-vous gratuitement", switchToLogin: "Déjà un compte ? Connectez-vous",
    loading: "Chargement…",
    oauthTitle: "ou connectez-vous avec", oauthGoogle: "Google", oauthFacebook: "Facebook", oauthMicrosoft: "Microsoft", oauthApple: "Apple",
    oauthNotConfigured: "Connexion sociale non configurée",
    oauthError: "Échec de connexion sociale",
    muteUser: "Mettre en sourdine", muteTitle: "Durée", mutedUntil: "En sourdine jusqu'au", unmute: "Lever la sourdine",
    errMuted: "Vous êtes en sourdine dans ce salon",
    mutedBadge: "En sourdine",
    deleteImage: "Supprimer l'image", deleteMessage: "Supprimer le message",
    settingsTitle: "Paramètres", editProfile: "Modifier le profil", changeBranch: "Changer de section",
    aboutTitle: "À propos de la plateforme & Partenaires", aboutText: "SuperStudent aide les lycéens tunisiens à consulter des ressources organisées par matière et filière et à échanger avec d’autres élèves.",
    changePassword: "Changer le mot de passe", currentPassword: "Mot de passe actuel", newPassword: "Nouveau mot de passe",
    saveProfile: "Enregistrer", profileSaved: "Profil enregistré",
    branchChangedHint: "Changer de section adapte immédiatement vos salons et vos fiches",
    passwordChanged: "Mot de passe modifié", errWrongCurrentPass: "Mot de passe actuel incorrect",
    promoteMod: "Nommer modérateur", demoteMod: "Retirer la modération",
    mySubjects: "Mes matières", chooseBranch: "Choisissez votre section", branchNote: "Les matières affichées suivront votre filière",
    errCooldown: "Patientez un instant avant d'envoyer un nouveau message",
    banUntil: "Banni jusqu'au",
    noUsers: "Aucun utilisateur inscrit", usersList: "Registre des utilisateurs",
    role: "Rôle", status: "Statut", actions: "Actions",
    mute5: "5 min", mute30: "30 min", mute1h: "1 h", mute6h: "6 h", mute24h: "24 h", muteForever: "Définitif",
    ban5: "5 min", ban30: "30 min", ban1h: "1 h", ban6h: "6 h", ban24h: "24 h", banForever: "Définitif",
    deleteMsgShort: "Supprimer", modActions: "Outils de modération", refresh: "Actualiser",
    modsOnlyRoomTitle: "Salon privé des Modérateurs",
    modsOnlyRoomSub: "Espace réservé à l'équipe de modération et au Super Admin",
    adminModChannelTitle: "Canal direct Super Admin ↔ Modérateurs",
    adminModChannelSub: "Communication directe et prioritaire avec la direction",
    aiTitle: "Tuteur IA Académique SuperStudent AI",
    aiSubtitle: "Résolution étape par étape, notation sur 20, aide aux dissertations et générateur de quiz",
    modeSolver: "Résoudre un exercice",
    modeExplanation: "Explication pédagogique de cours",
    modeEssay: "Aide dissertation & essai",
    modeQuiz: "Générer un quiz de révision",
    modeGrader: "Évaluer ma copie sur 20",
    modeSummary: "Fiche de synthèse & formules",
    modeWeakness: "Diagnostiquer mes lacunes",
    aiInputPlaceholder: "Posez votre question, collez un énoncé ou demandez un résumé…",
    aiSend: "Consulter l'IA",
    aiThinking: "Analyse pédagogique en cours selon le programme tunisien…",
    uploadExerciseImage: "Photo de l'exercice (OCR)",
    archiveTitle: "Archives officielles du Baccalauréat (17 ans)",
    archiveSub: "Tous les sujets et corrigés officiels de 2007 à 2024 (Session principale & Contrôle)",
    yearSelect: "Année",
    sessionSelect: "Session",
    sessionPrincipal: "Session Principale",
    sessionControl: "Session de Contrôle",
    downloadExam: "Télécharger le sujet",
    viewCorrection: "Voir le corrigé officiel",
    cmsTitle: "Bibliothèque de cours et fiches",
    cmsSub: "Résumés de cours, cartes mentales et fiches mémo officielles",
    addLesson: "Ajouter une fiche / ressource",
    reportsTitle: "Signalements et réclamations",
    reportReason: "Motif",
    reportStatus: "Statut",
    resolveReport: "Résolu",
    dismissReport: "Classer",
    auditTitle: "Journal d'audit et sécurité",
    auditActor: "Auteur",
    auditAction: "Action",
    auditTime: "Horodatage",
    exportExcelBtn: "Exporter les données (CSV / Excel)",
    notificationsTitle: "Notifications & Annonces",
    markAllRead: "Tout marquer comme lu",
    noNotifications: "Aucune notification récente",
    surveyTitle: "Sondage de satisfaction",
    surveyQuestion: "Comment évaluez-vous votre expérience sur BacAdmis.ai ?",
    surveySubmit: "Envoyer l'évaluation",
    surveyThanks: "Merci pour vos retours précieux !",
    mfaTitle: "Authentification à deux facteurs (2FA)",
    mfaDesc: "Protection renforcée pour les comptes modérateurs et super admin.",
    mfaEnable: "Activer la 2FA",
    mfaDisable: "Désactiver la 2FA",
  },
  en: {
    appName: "SuperStudent",
    tagline: "Organized study resources and a shared community for Tunisian high-school students",
    platformV2: "SuperStudent Engine",
    langName: "English",
    admisGreeting: "Best wishes for your studies",
    guestBadge: "Guest (Read-Only)",
    guestNotice: "You are browsing as a guest. Sign in to join discussions and use features available to account holders.",
    loginToPost: "Sign in to participate",
    loginToAi: "Sign in to use AI assistant",
    onboardingTitle: "Welcome to SuperStudent",
    onboardingSub: "Select your track and grade level to tailor your study workspace",
    chooseLevel: "Grade Level",
    chooseStream: "Study Stream / Track",
    startExploring: "Start Studying Now",
    browseAsGuest: "Continue as Guest",
    navRooms: "Subject Rooms",
    navAi: "SuperStudent AI Tutor",
    navArchive: "17-Year Bac Archive",
    navLessons: "Lessons & Summaries",
    navFaq: "FAQ & Tips",
    navAbout: "About Us & Partners",
    navAdmin: "Admin & Moderation",
    navSettings: "Settings",
    loginTab: "Log in", registerTab: "New account",
    email: "Email", password: "Password", confirmPassword: "Confirm password",
    signIn: "Sign in", continueBtn: "Continue", createAccount: "Create account",
    username: "Username", displayName: "Display name", chooseAvatar: "Profile photo (optional)",
    yourBranch: "Your track", back: "Back",
    errFields: "Please fill in all fields", errEmail: "Invalid email",
    errPasswordShort: "Password must be at least 8 characters",
    errPasswordMatch: "Passwords do not match",
    errEmailTaken: "This email is already registered",
    errUsernameTaken: "Username taken, try another one",
    errUsernameInvalid: "No spaces, 3 to 20 characters",
    errNoAccount: "No account found for this email",
    errWrongPass: "Incorrect password",
    errBanned: "This account has been banned by the admin",
    errLocked: "Too many attempts, try again in 5 minutes",
    step2Title: "One last touch on your profile",
    branches: "Tracks", selectBranchSub: "4th year — Baccalauréat",
    subjectsHint: "Choose a subject to enter its room", roomsLabel: "subjects",
    sharedBadge: "Room shared across several tracks",
    typeMessage: "Type your message…", noMessages: "No messages yet, start the discussion!",
    attach: "Attach", sending: "Sending…",
    imageTooMany: "6 images maximum per message",
    pdfTooBig: "File exceeds 5 MB",
    openFile: "Open file", deleteMsg: "Delete",
    logout: "Log out", admin: "Admin panel", settings: "Settings", home: "Home",
    adminTitle: "Super Admin & Moderation Panel", totalUsers: "Total registered", activeNow: "Active now", totalMods: "Moderators",
    searchUser: "Search by email or username", searchBtn: "Search", noUserFound: "No user found",
    banAction: "Ban", unbanAction: "Unban", banned: "Banned",
    banDuration: "Ban duration", minutes: "minutes", hours: "hours", forever: "Permanent",
    cancel: "Cancel", confirm: "Confirm",
    modRoomsTitle: "Moderated rooms", save: "Save", saved: "Saved",
    you: "You", superAdmin: "Super Admin", moderator: "Moderator", eliteStudent: "Elite Student (Contributor)", member: "Student",
    navDocuments: "Subjects & Archive Bank",
    confirmDelete: "Delete this message?", confirmDeleteAccount: "Delete this account permanently?", deleteAccount: "Delete account",
    switchToRegister: "No account? Create one for free", switchToLogin: "Have an account? Sign in",
    loading: "Loading…",
    oauthTitle: "or continue with", oauthGoogle: "Google", oauthFacebook: "Facebook", oauthMicrosoft: "Microsoft", oauthApple: "Apple",
    oauthNotConfigured: "Social login is not configured yet",
    oauthError: "Social login failed",
    muteUser: "Mute user", muteTitle: "Mute duration", mutedUntil: "Muted until", unmute: "Unmute",
    errMuted: "You are muted in this room, sending is disabled",
    mutedBadge: "Muted",
    deleteImage: "Delete image", deleteMessage: "Delete message",
    settingsTitle: "Settings", editProfile: "Edit profile", changeBranch: "Change track",
    aboutTitle: "About the Platform & Partners", aboutText: "SuperStudent helps Tunisian high-school students find study resources organized by subject and study track and connect with other students.",
    changePassword: "Change password", currentPassword: "Current password", newPassword: "New password",
    saveProfile: "Save changes", profileSaved: "Profile saved",
    branchChangedHint: "Changing your track updates the displayed subjects and lessons automatically",
    passwordChanged: "Password changed", errWrongCurrentPass: "Current password is incorrect",
    promoteMod: "Make moderator", demoteMod: "Remove moderation",
    mySubjects: "My subjects", chooseBranch: "Choose your track", branchNote: "Displayed subjects follow your track and level",
    errCooldown: "Please wait a moment before sending a new message",
    banUntil: "Banned until",
    noUsers: "No users yet", usersList: "Registered accounts",
    role: "Role", status: "Status", actions: "Actions",
    mute5: "5 min", mute30: "30 min", mute1h: "1 h", mute6h: "6 h", mute24h: "24 h", muteForever: "Permanent",
    ban5: "5 min", ban30: "30 min", ban1h: "1 h", ban6h: "6 h", ban24h: "24 h", banForever: "Permanent",
    deleteMsgShort: "Delete", modActions: "Moderation tools", refresh: "Refresh",
    modsOnlyRoomTitle: "Private Moderators Room",
    modsOnlyRoomSub: "Restricted channel for moderators and Super Admin collaboration",
    adminModChannelTitle: "Direct Super Admin ↔ Moderators Channel",
    adminModChannelSub: "Direct prioritized private channel with the platform owner",
    aiTitle: "SuperStudent AI Academic Tutor",
    aiSubtitle: "Step-by-step exercise solver, 20/20 grading, essay advisor, and adaptive practice quiz generator",
    modeSolver: "Solve Exercise",
    modeExplanation: "Pedagogical Concept Explanation",
    modeEssay: "Essay & Philosophy Advisor",
    modeQuiz: "Practice Quiz Generator",
    modeGrader: "Grade My Answer (Out of 20)",
    modeSummary: "Revision Summary & Formulas",
    modeWeakness: "Diagnose Weak Points",
    aiInputPlaceholder: "Type your problem, paste exercise text, or ask for a concept review…",
    aiSend: "Ask AI Tutor",
    aiThinking: "Performing step-by-step pedagogical reasoning per the official Tunisian curriculum…",
    uploadExerciseImage: "Exercise Photo (OCR)",
    archiveTitle: "Official Baccalauréat Archives (17 Years)",
    archiveSub: "Complete exam papers and official marking schemes from 2007 to 2024 (Main & Control Sessions)",
    yearSelect: "Year",
    sessionSelect: "Session",
    sessionPrincipal: "Main Session",
    sessionControl: "Control Session",
    downloadExam: "Download Exam Paper",
    viewCorrection: "View Official Marking Scheme",
    cmsTitle: "Lessons & Summaries Repository",
    cmsSub: "Curated chapter summaries, mind maps, and key formulas for every track",
    addLesson: "Add New Lesson / Summary",
    reportsTitle: "User Reports & Moderation Queue",
    reportReason: "Reason",
    reportStatus: "Status",
    resolveReport: "Resolve",
    dismissReport: "Dismiss",
    auditTitle: "System & Security Audit Log",
    auditActor: "Actor",
    auditAction: "Action",
    auditTime: "Timestamp",
    ownershipPdfTitle: "Official Proof of Ownership Report (Super Admin PDF)",
    ownershipPdfDesc: "Downloadable formal PDF report in English verifying ownership by Mohamed Yessine Jarray with live platform metrics.",
    generatePdfBtn: "Generate Ownership Certificate (PDF)",
    exportExcelBtn: "Export Live Statistics (CSV / Excel)",
    notificationsTitle: "Notifications & Platform Announcements",
    markAllRead: "Mark all as read",
    noNotifications: "No new notifications",
    surveyTitle: "Student Satisfaction Survey",
    surveyQuestion: "How do you rate your learning experience on BacAdmis.ai this week?",
    surveySubmit: "Submit Feedback",
    surveyThanks: "Thank you for your valuable feedback!",
    mfaTitle: "Two-Factor Authentication (2FA)",
    mfaDesc: "Enhanced security for Moderator and Super Admin accounts.",
    mfaEnable: "Enable Two-Factor Authentication",
    mfaDisable: "Disable Two-Factor Authentication",
  },
};

export const MUTE_OPTS = [
  { key: "mute5", ms: 5 * 60 * 1000 },
  { key: "mute30", ms: 30 * 60 * 1000 },
  { key: "mute1h", ms: 60 * 60 * 1000 },
  { key: "mute6h", ms: 6 * 60 * 60 * 1000 },
  { key: "mute24h", ms: 24 * 60 * 60 * 1000 },
  { key: "muteForever", ms: Number.MAX_SAFE_INTEGER },
];

// One-way irreversible SHA-256 cryptographic hashes for Root SuperAdmins (Hides plain emails on GitHub)
export const ROOT_OWNER_HASHES = [
  "c2ec73ebec670123aaa362ab28963c46243185db42fdc57cc50670fe4b086587",
];

export async function isRootOwnerEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  if (norm === "learningmyj20@gmail.com") return true;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(norm);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    if (ROOT_OWNER_HASHES.includes(hex)) return true;
  } catch {
    // fallback
  }

  return false;
}

export const BAN_OPTS = [
  { key: "ban5", ms: 5 * 60 * 1000 },
  { key: "ban30", ms: 30 * 60 * 1000 },
  { key: "ban1h", ms: 60 * 60 * 1000 },
  { key: "ban6h", ms: 6 * 60 * 60 * 1000 },
  { key: "ban24h", ms: 24 * 60 * 60 * 1000 },
  { key: "banForever", ms: null },
];

export function isAccountBanned(acc?: { banned?: boolean; bannedUntil?: number | null } | null): boolean {
  if (!acc) return false;
  if (acc.bannedUntil) return acc.bannedUntil > Date.now();
  return !!acc.banned;
}

export function banRemainingMs(acc?: { banned?: boolean; bannedUntil?: number | null } | null): number {
  if (!acc) return 0;
  if (acc.bannedUntil) return Math.max(0, acc.bannedUntil - Date.now());
  return acc.banned ? Number.MAX_SAFE_INTEGER : 0;
}

export function isMuted(mutes?: Record<string, number> | null, username?: string | null): boolean {
  if (!mutes || !username) return false;
  const until = mutes[username];
  return !!until && until > Date.now();
}

export function mutedRemainingMs(mutes?: Record<string, number> | null, username?: string | null): number {
  if (!mutes || !username) return 0;
  const until = mutes[username];
  return until && until > Date.now() ? until - Date.now() : 0;
}

export function canUserPublishDocuments(acc?: { role?: string; email?: string; canUpload?: boolean } | null): boolean {
  if (!acc) return false;
  if (acc.role === "superadmin") return true;
  if (acc.role === "moderator") return true;
  if (acc.role === "elite_student") return true;
  if (acc.canUpload === true) return true;
  return false;
}

export function canUserModerateRoom(
  acc?: { role?: string; email?: string; moderatorRooms?: string[] } | null,
  roomId?: string
): boolean {
  if (!acc) return false;
  if (acc.role === "superadmin") return true;
  if (acc.role === "moderator") {
    if (!roomId) return true;
    return (acc.moderatorRooms || []).includes(roomId);
  }
  return false;
}

export function msToMinLabel(ms: number, lang: LangKey): string {
  const min = Math.max(1, Math.ceil(ms / 60000));
  if (lang === "ar") return `${min} دقيقة`;
  if (lang === "fr") return `${min} min`;
  return `${min} min`;
}

export const GOVERNORATES: string[] = [
  "تونس",
  "أريانة",
  "بن عروس",
  "منوبة",
  "نابل",
  "زغوان",
  "بنزرت",
  "باجة",
  "جندوبة",
  "الكاف",
  "سليانة",
  "سوسة",
  "المنستير",
  "المهدية",
  "صفاقس",
  "القيروان",
  "القصرين",
  "سيدي بوزيد",
  "قابس",
  "مدنين",
  "تطاوين",
  "قفصة",
  "توزر",
  "قبلي",
];

