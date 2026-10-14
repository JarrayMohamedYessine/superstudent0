/**
 * Zero-AI-Cost Greeting & Casual Opening Classifier
 * Detects casual greetings without consuming LLM inference tokens.
 * Produces personalized responses in < 50ms using real student profile context.
 */

export interface GreetingCheckResult {
  isPureGreeting: boolean;
  personalizedResponse?: string;
  detectedLang?: "ar" | "fr" | "en";
}

// Pure greeting patterns in Arabic, French, and English
const GREETING_PATTERNS_AR = [
  /^(السلام\s+عليكم(\s+ورحمة\s+الله(\s+وبركاته)?)?)$/i,
  /^(مرحبا|مرحبًا|أهلا|أهلاً|أهلا\s+وسهلا|أهلاً\s+وسهلاً|سلام)$/i,
  /^(صباح\s+الخير|مساء\s+الخير)$/i,
  /^(نهارك\s+سعيد|عسلامة|شحالك|شخبارك)$/i,
  /^(هل\s+تستطيع\s+مساعدتي\??|ممكن\s+تساعدني\??|تقدر\s+تعاوني\??|تعاوني\??)$/i,
  /^(من\s+أنت\??|شكون\s+أنت\??)$/i,
];

const GREETING_PATTERNS_FR = [
  /^(salut(\s+ça\s+va|\s+cv)?\??)$/i,
  /^(bonjour(\s+ça\s+va|\s+cv)?\??)$/i,
  /^(bonsoir\??)$/i,
  /^(coucou\??)$/i,
  /^(peux-tu\s+m'?aider\??|pouvez-vous\s+m'?aider\??)$/i,
  /^(est-ce\s+que\s+tu\s+peux\s+m'?aider\??)$/i,
  /^(qui\s+es-tu\??)$/i,
];

const GREETING_PATTERNS_EN = [
  /^(hello(\s+there)?\??)$/i,
  /^(hi(\s+there)?\??)$/i,
  /^(hey(\s+there)?\??)$/i,
  /^(good\s+morning|good\s+afternoon|good\s+evening)$/i,
  /^(can\s+you\s+help\s+me\??|could\s+you\s+help\s+me\??)$/i,
  /^(who\s+are\s+you\??)$/i,
];

// Educational question triggers that disqualify a message from being a pure greeting
// e.g. "Salut, résous cette équation" contains "résous" or math terms!
const QUESTION_INDICATORS = [
  /[+\-*/=<>√∫∑∏∆Δ]/, // Math symbols
  /\b(résous|calcul|détermine|montre|justifie|démontre|donne|explique|trouve|bac|exercice|devoir|synthèse|contrôle)\b/i,
  /\b(احسب|حلل|فسر|بين|برهن|استنتج|أوجد|حدد|قارن|وضح|علل|تمرين|امتحان|فرض|باك)\b/,
  /\b(solve|calculate|derive|prove|find|explain|exam|exercise)\b/i,
  /[0-9]{2,}/, // Numbers likely indicating exercise content
];

/**
 * Classifies if a user prompt is purely a greeting and returns a personalized answer.
 */
export function classifyGreeting(
  text: string,
  studentName?: string,
  branchLabel?: string,
  preferredLang: "ar" | "fr" | "en" = "ar"
): GreetingCheckResult {
  if (!text) return { isPureGreeting: false };
  const trimmed = text.trim();

  // If text is longer than 70 characters, it likely contains actual exercise material
  if (trimmed.length > 70) {
    return { isPureGreeting: false };
  }

  // Check if text contains question indicators
  for (const indicator of QUESTION_INDICATORS) {
    if (indicator.test(trimmed)) {
      return { isPureGreeting: false };
    }
  }

  // Check Arabic greetings
  for (const pattern of GREETING_PATTERNS_AR) {
    if (pattern.test(trimmed)) {
      const namePart = studentName && studentName.trim() && studentName.trim() !== "تلميذ" ? ` ${studentName.trim()}` : "";
      const branchPart = branchLabel ? ` (شعبة ${branchLabel})` : "";
      return {
        isPureGreeting: true,
        detectedLang: "ar",
        personalizedResponse: `أهلاً وسهلاً بك${namePart} في **BacAdmis.AI**${branchPart} 🇹🇳\n\nأنا هنا لمساعدتك في كافة مواد البكالوريا والتعليم الثانوي التونسي وفق المنهاج الرسمي المعتمد. يمكنك طرح أي سؤال، إرفاق مسألة أو فرض، وسأقوم بتحليله خطوة بخطوة بدقة تامة!\n\nكيف يمكنني مساعدتك الآن؟`,
      };
    }
  }

  // Check French greetings
  for (const pattern of GREETING_PATTERNS_FR) {
    if (pattern.test(trimmed)) {
      const namePart = studentName && studentName.trim() && studentName.trim() !== "Élève" ? ` ${studentName.trim()}` : "";
      const branchPart = branchLabel ? ` (Section ${branchLabel})` : "";
      return {
        isPureGreeting: true,
        detectedLang: "fr",
        personalizedResponse: `Bonjour${namePart} ! Bienvenue sur **BacAdmis.AI**${branchPart} 🇹🇳\n\nJe suis votre assistant pédagogique dédié aux programmes officiels du Baccalauréat et de l'enseignement secondaire tunisien.\n\nPosez votre question, partagez un exercice ou une épreuve pour obtenir une résolution méthodique conforme au barème officiel !`,
      };
    }
  }

  // Check English greetings
  for (const pattern of GREETING_PATTERNS_EN) {
    if (pattern.test(trimmed)) {
      const namePart = studentName && studentName.trim() ? ` ${studentName.trim()}` : "";
      return {
        isPureGreeting: true,
        detectedLang: "en",
        personalizedResponse: `Hello${namePart}! Welcome to **BacAdmis.AI** 🇹🇳\n\nI am your academic assistant dedicated to the official Tunisian secondary curriculum and Baccalaureate exams.\n\nHow can I help you excel in your studies today?`,
      };
    }
  }

  return { isPureGreeting: false };
}
