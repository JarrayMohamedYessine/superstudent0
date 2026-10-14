import { BranchItem, SubjectItem } from "../types";
import { BRANCHES, SUBJECTS } from "../constants";

export interface ThemeStyleConfig {
  backgroundGradient: string;
  cardBg: string;
  cardBorder: string;
  accentGlow: string;
  primaryColor: string;
  secondaryColor: string;
  badgeStyle: string;
  watermarkIconName?: string;
  subtlePatternSvg?: string;
}

// 1. Luxury Blue Master Baseline Theme
export const LUXURY_BLUE_BASE: ThemeStyleConfig = {
  backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(30, 58, 138, 0.45), transparent 70%), radial-gradient(900px 500px at 100% 100%, rgba(14, 165, 233, 0.2), transparent 50%), radial-gradient(800px 600px at 0% 50%, rgba(99, 102, 241, 0.18), transparent 50%), #040817`,
  cardBg: "rgba(10, 20, 48, 0.75)",
  cardBorder: "rgba(59, 130, 246, 0.28)",
  accentGlow: "rgba(59, 130, 246, 0.35)",
  primaryColor: "#3B82F6",
  secondaryColor: "#6366F1",
  badgeStyle: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
};

// 2. Stream-Specific Dynamic Backgrounds (تصبح الخلفية ذات طابع الشعبة عند اختيارها أو تسجيل الدخول)
export const STREAM_THEMES: Record<string, ThemeStyleConfig> = {
  math: {
    // Mathematics: Deep cosmic royal blue & indigo with calculus glow
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(99, 102, 241, 0.42), transparent 70%), radial-gradient(800px 500px at 95% 85%, rgba(139, 92, 246, 0.3), transparent 50%), radial-gradient(700px 400px at 5% 50%, rgba(59, 130, 246, 0.25), transparent 50%), #040819`,
    cardBg: "rgba(12, 20, 52, 0.8)",
    cardBorder: "rgba(99, 102, 241, 0.32)",
    accentGlow: "rgba(99, 102, 241, 0.45)",
    primaryColor: "#6366F1",
    secondaryColor: "#8B5CF6",
    badgeStyle: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  },
  sciexp: {
    // Experimental Sciences: Deep emerald oceanic navy with biological/chemical aura
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(16, 185, 129, 0.38), transparent 70%), radial-gradient(800px 500px at 90% 90%, rgba(6, 182, 212, 0.3), transparent 50%), radial-gradient(600px 400px at 5% 45%, rgba(52, 211, 153, 0.22), transparent 50%), #021218`,
    cardBg: "rgba(6, 26, 32, 0.8)",
    cardBorder: "rgba(16, 185, 129, 0.32)",
    accentGlow: "rgba(16, 185, 129, 0.42)",
    primaryColor: "#10B981",
    secondaryColor: "#06B6D4",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  scitech: {
    // Technical Sciences: Electric cyan & cobalt with precision engineering lattice
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(6, 182, 212, 0.4), transparent 70%), radial-gradient(800px 500px at 95% 85%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(600px 400px at 10% 50%, rgba(14, 165, 233, 0.25), transparent 50%), #031322`,
    cardBg: "rgba(7, 25, 42, 0.8)",
    cardBorder: "rgba(6, 182, 212, 0.32)",
    accentGlow: "rgba(6, 182, 212, 0.42)",
    primaryColor: "#06B6D4",
    secondaryColor: "#3B82F6",
    badgeStyle: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  },
  info: {
    // Computer Science: High-tech cyber azure & matrix violet
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(59, 130, 246, 0.42), transparent 70%), radial-gradient(800px 500px at 90% 90%, rgba(124, 58, 237, 0.32), transparent 50%), radial-gradient(600px 400px at 5% 50%, rgba(14, 165, 233, 0.26), transparent 50%), #030D24`,
    cardBg: "rgba(8, 22, 54, 0.8)",
    cardBorder: "rgba(59, 130, 246, 0.35)",
    accentGlow: "rgba(59, 130, 246, 0.45)",
    primaryColor: "#3B82F6",
    secondaryColor: "#7C3AED",
    badgeStyle: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  eco: {
    // Economics & Management: Warm amber-gold & prestige navy blue
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(245, 158, 11, 0.38), transparent 70%), radial-gradient(800px 500px at 90% 90%, rgba(249, 115, 22, 0.3), transparent 50%), radial-gradient(600px 400px at 5% 45%, rgba(251, 191, 36, 0.22), transparent 50%), #120F1C`,
    cardBg: "rgba(28, 20, 42, 0.8)",
    cardBorder: "rgba(245, 158, 11, 0.32)",
    accentGlow: "rgba(245, 158, 11, 0.42)",
    primaryColor: "#F59E0B",
    secondaryColor: "#F97316",
    badgeStyle: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  lettres: {
    // Letters & Humanities: Noble rose-magenta & aristocratic dark sapphire
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(236, 72, 153, 0.38), transparent 70%), radial-gradient(800px 500px at 90% 90%, rgba(168, 85, 247, 0.3), transparent 50%), radial-gradient(600px 400px at 5% 45%, rgba(244, 63, 94, 0.24), transparent 50%), #140A1D`,
    cardBg: "rgba(32, 14, 42, 0.8)",
    cardBorder: "rgba(236, 72, 153, 0.32)",
    accentGlow: "rgba(236, 72, 153, 0.42)",
    primaryColor: "#EC4899",
    secondaryColor: "#A855F7",
    badgeStyle: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
  },
  sport: {
    // Sport: Olympic golden bronze & kinetic emerald navy
    backgroundGradient: `radial-gradient(1200px 800px at 50% -5%, rgba(234, 179, 8, 0.4), transparent 70%), radial-gradient(800px 500px at 90% 90%, rgba(16, 185, 129, 0.3), transparent 50%), radial-gradient(600px 400px at 5% 45%, rgba(245, 158, 11, 0.24), transparent 50%), #12141A`,
    cardBg: "rgba(24, 26, 36, 0.8)",
    cardBorder: "rgba(234, 179, 8, 0.32)",
    accentGlow: "rgba(234, 179, 8, 0.42)",
    primaryColor: "#EAB308",
    secondaryColor: "#10B981",
    badgeStyle: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  },
};

// 3. Subject-Specific Ambient Backdrop Themes for Chat Rooms (غرف المحادثة خلفية فخمة ومخصصة بدقة لكل مادة)
export const SUBJECT_ROOM_THEMES: Record<string, ThemeStyleConfig> = {
  math: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(99, 102, 241, 0.45), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(139, 92, 246, 0.22), transparent 50%), #04091C`,
    cardBg: "rgba(10, 18, 48, 0.85)",
    cardBorder: "rgba(99, 102, 241, 0.36)",
    accentGlow: "rgba(99, 102, 241, 0.5)",
    primaryColor: "#6366F1",
    secondaryColor: "#3B82F6",
    badgeStyle: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40",
  },
  physique: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(139, 92, 246, 0.45), transparent 70%), radial-gradient(900px 600px at 0% 100%, rgba(6, 182, 212, 0.3), transparent 50%), radial-gradient(600px 400px at 100% 50%, rgba(99, 102, 241, 0.22), transparent 50%), #07071F`,
    cardBg: "rgba(16, 14, 46, 0.85)",
    cardBorder: "rgba(139, 92, 246, 0.36)",
    accentGlow: "rgba(139, 92, 246, 0.5)",
    primaryColor: "#8B5CF6",
    secondaryColor: "#06B6D4",
    badgeStyle: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
  },
  svt: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(16, 185, 129, 0.45), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(5, 150, 105, 0.32), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(52, 211, 153, 0.22), transparent 50%), #021415`,
    cardBg: "rgba(5, 28, 30, 0.85)",
    cardBorder: "rgba(16, 185, 129, 0.36)",
    accentGlow: "rgba(16, 185, 129, 0.5)",
    primaryColor: "#10B981",
    secondaryColor: "#34D399",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  },
  philosophie: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(168, 85, 247, 0.42), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(236, 72, 153, 0.28), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(244, 63, 94, 0.2), transparent 50%), #0E071A`,
    cardBg: "rgba(24, 12, 42, 0.85)",
    cardBorder: "rgba(168, 85, 247, 0.36)",
    accentGlow: "rgba(168, 85, 247, 0.5)",
    primaryColor: "#A855F7",
    secondaryColor: "#EC4899",
    badgeStyle: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
  },
  technologie: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(6, 182, 212, 0.45), transparent 70%), radial-gradient(900px 600px at 0% 100%, rgba(59, 130, 246, 0.32), transparent 50%), radial-gradient(600px 400px at 100% 50%, rgba(14, 165, 233, 0.24), transparent 50%), #031422`,
    cardBg: "rgba(6, 26, 44, 0.85)",
    cardBorder: "rgba(6, 182, 212, 0.36)",
    accentGlow: "rgba(6, 182, 212, 0.5)",
    primaryColor: "#06B6D4",
    secondaryColor: "#3B82F6",
    badgeStyle: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
  },
  algo: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(59, 130, 246, 0.45), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(14, 165, 233, 0.32), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(99, 102, 241, 0.24), transparent 50%), #030E26`,
    cardBg: "rgba(6, 22, 54, 0.85)",
    cardBorder: "rgba(59, 130, 246, 0.36)",
    accentGlow: "rgba(59, 130, 246, 0.5)",
    primaryColor: "#3B82F6",
    secondaryColor: "#0EA5E9",
    badgeStyle: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  },
  bd: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(20, 184, 166, 0.45), transparent 70%), radial-gradient(900px 600px at 0% 100%, rgba(59, 130, 246, 0.3), transparent 50%), radial-gradient(600px 400px at 100% 50%, rgba(6, 182, 212, 0.24), transparent 50%), #031718`,
    cardBg: "rgba(6, 32, 34, 0.85)",
    cardBorder: "rgba(20, 184, 166, 0.36)",
    accentGlow: "rgba(20, 184, 166, 0.5)",
    primaryColor: "#14B8A6",
    secondaryColor: "#3B82F6",
    badgeStyle: "bg-teal-500/20 text-teal-300 border border-teal-500/40",
  },
  economie: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(249, 115, 22, 0.42), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(245, 158, 11, 0.3), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(234, 179, 8, 0.22), transparent 50%), #150F18`,
    cardBg: "rgba(34, 18, 32, 0.85)",
    cardBorder: "rgba(249, 115, 22, 0.36)",
    accentGlow: "rgba(249, 115, 22, 0.5)",
    primaryColor: "#F97316",
    secondaryColor: "#F59E0B",
    badgeStyle: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  },
  gestion: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(14, 165, 233, 0.45), transparent 70%), radial-gradient(900px 600px at 0% 100%, rgba(99, 102, 241, 0.32), transparent 50%), radial-gradient(600px 400px at 100% 50%, rgba(59, 130, 246, 0.24), transparent 50%), #031222`,
    cardBg: "rgba(6, 24, 46, 0.85)",
    cardBorder: "rgba(14, 165, 233, 0.36)",
    accentGlow: "rgba(14, 165, 233, 0.5)",
    primaryColor: "#0EA5E9",
    secondaryColor: "#6366F1",
    badgeStyle: "bg-sky-500/20 text-sky-300 border border-sky-500/40",
  },
  arabe: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(124, 58, 237, 0.45), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(236, 72, 153, 0.3), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(168, 85, 247, 0.22), transparent 50%), #0D061A`,
    cardBg: "rgba(22, 10, 38, 0.85)",
    cardBorder: "rgba(124, 58, 237, 0.36)",
    accentGlow: "rgba(124, 58, 237, 0.5)",
    primaryColor: "#7C3AED",
    secondaryColor: "#EC4899",
    badgeStyle: "bg-purple-500/20 text-purple-300 border border-purple-500/40",
  },
  francais: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(236, 72, 153, 0.45), transparent 70%), radial-gradient(900px 600px at 0% 100%, rgba(99, 102, 241, 0.32), transparent 50%), radial-gradient(600px 400px at 100% 50%, rgba(244, 63, 94, 0.22), transparent 50%), #14071A`,
    cardBg: "rgba(32, 12, 38, 0.85)",
    cardBorder: "rgba(236, 72, 153, 0.36)",
    accentGlow: "rgba(236, 72, 153, 0.5)",
    primaryColor: "#EC4899",
    secondaryColor: "#6366F1",
    badgeStyle: "bg-pink-500/20 text-pink-300 border border-pink-500/40",
  },
  anglais: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(245, 158, 11, 0.45), transparent 70%), radial-gradient(900px 600px at 100% 100%, rgba(59, 130, 246, 0.32), transparent 50%), radial-gradient(600px 400px at 0% 50%, rgba(249, 115, 22, 0.22), transparent 50%), #120E1C`,
    cardBg: "rgba(28, 18, 42, 0.85)",
    cardBorder: "rgba(245, 158, 11, 0.36)",
    accentGlow: "rgba(245, 158, 11, 0.5)",
    primaryColor: "#F59E0B",
    secondaryColor: "#3B82F6",
    badgeStyle: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  },
  histgeo: {
    backgroundGradient: `radial-gradient(1200px 700px at 50% -10%, rgba(225, 29, 72, 0.45), transparent 70%), radial-gradient(900px 600px at 0% 100%, rgba(245, 158, 11, 0.3), transparent 50%), radial-gradient(600px 400px at 100% 50%, rgba(249, 115, 22, 0.22), transparent 50%), #160712`,
    cardBg: "rgba(36, 12, 26, 0.85)",
    cardBorder: "rgba(225, 29, 72, 0.36)",
    accentGlow: "rgba(225, 29, 72, 0.5)",
    primaryColor: "#E11D48",
    secondaryColor: "#F59E0B",
    badgeStyle: "bg-rose-500/20 text-rose-300 border border-rose-500/40",
  },
};

export function getStreamTheme(branchId?: string | null): ThemeStyleConfig {
  if (!branchId || !STREAM_THEMES[branchId]) {
    return LUXURY_BLUE_BASE;
  }
  return STREAM_THEMES[branchId];
}

export function getSubjectRoomTheme(subjectId?: string | null): ThemeStyleConfig {
  if (!subjectId || !SUBJECT_ROOM_THEMES[subjectId]) {
    return LUXURY_BLUE_BASE;
  }
  return SUBJECT_ROOM_THEMES[subjectId];
}
