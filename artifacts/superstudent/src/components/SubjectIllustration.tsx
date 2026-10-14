import React from "react";

interface SubjectIllustrationProps {
  subjectId: string;
  size?: "sm" | "md" | "lg" | "banner";
  className?: string;
}

export function SubjectIllustration({
  subjectId,
  size = "md",
  className = "",
}: SubjectIllustrationProps) {
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return { w: 40, h: 40, viewBox: "0 0 48 48", iconSize: 22 };
      case "lg":
        return { w: 72, h: 72, viewBox: "0 0 80 80", iconSize: 40 };
      case "banner":
        return { w: "100%", h: 96, viewBox: "0 0 320 96", iconSize: 48 };
      case "md":
      default:
        return { w: 52, h: 52, viewBox: "0 0 60 60", iconSize: 28 };
    }
  };

  const dim = getDimensions();

  // Distinctive art vectors for each subject
  switch (subjectId) {
    case "math":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(99, 102, 241, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <circle cx="30" cy="30" r="26" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
            <path d="M16 42C16 42 20 44 24 38C28 32 32 16 36 22C40 28 44 32 44 32" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M22 18L38 42M38 18L22 42" stroke="#C7D2FE" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
            <text x="14" y="24" fill="#A5B4FC" fontSize="11" fontWeight="bold" fontFamily="sans-serif">∫</text>
            <text x="38" y="24" fill="#38BDF8" fontSize="9" fontWeight="bold" fontFamily="sans-serif">π</text>
            <text x="36" y="44" fill="#F472B6" fontSize="9" fontWeight="bold" fontFamily="sans-serif">∑</text>
            <circle cx="36" cy="22" r="3" fill="#60A5FA" />
          </svg>
        </div>
      );

    case "physique":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #6D28D9 100%)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(139, 92, 246, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <ellipse cx="30" cy="30" rx="24" ry="9" stroke="#C084FC" strokeWidth="1.5" transform="rotate(30 30 30)" opacity="0.7" />
            <ellipse cx="30" cy="30" rx="24" ry="9" stroke="#38BDF8" strokeWidth="1.5" transform="rotate(-30 30 30)" opacity="0.7" />
            <ellipse cx="30" cy="30" rx="24" ry="9" stroke="#F472B6" strokeWidth="1.5" opacity="0.5" />
            <circle cx="30" cy="30" r="5" fill="#E879F9" />
            <circle cx="30" cy="30" r="8" stroke="#F0ABFC" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
            <circle cx="16" cy="22" r="2.5" fill="#38BDF8" />
            <circle cx="44" cy="38" r="2.5" fill="#F472B6" />
          </svg>
        </div>
      );

    case "svt":
    case "sport_bio":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #022C22 0%, #064E3B 50%, #047857 100%)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(16, 185, 129, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <path d="M22 14C22 22 38 24 38 32C38 40 22 42 22 48" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M38 14C38 22 22 24 22 32C22 40 38 42 38 48" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="18" x2="36" y2="18" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="22" y1="26" x2="38" y2="26" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="22" y1="36" x2="38" y2="36" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="44" x2="36" y2="44" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="30" cy="30" r="3" fill="#FBBF24" />
          </svg>
        </div>
      );

    case "algo":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #082F49 0%, #0369A1 50%, #0284C7 100%)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(56, 189, 248, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <rect x="12" y="14" width="36" height="32" rx="6" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.8" />
            <line x1="12" y1="22" x2="48" y2="22" stroke="#0284C7" strokeWidth="1.2" />
            <circle cx="17" cy="18" r="1.5" fill="#EF4444" />
            <circle cx="22" cy="18" r="1.5" fill="#F59E0B" />
            <circle cx="27" cy="18" r="1.5" fill="#10B981" />
            <path d="M18 30L23 34L18 38" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="26" y1="38" x2="34" y2="38" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" />
            <text x="36" y="32" fill="#34D399" fontSize="8" fontFamily="monospace" fontWeight="bold">{"{}"}</text>
          </svg>
        </div>
      );

    case "bd":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #134E4A 0%, #0F766E 50%, #0D9488 100%)",
            border: "1px solid rgba(20, 184, 166, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(20, 184, 166, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Database cylinders */}
            <ellipse cx="30" cy="18" rx="16" ry="5" fill="#14B8A6" stroke="#5EEAD4" strokeWidth="1.5" />
            <path d="M14 18V28C14 30.76 21.16 33 30 33C38.84 33 46 30.76 46 28V18" stroke="#5EEAD4" strokeWidth="1.5" />
            <path d="M14 28V38C14 40.76 21.16 43 30 43C38.84 43 46 40.76 46 38V28" stroke="#2DD4BF" strokeWidth="1.5" />
            <text x="21" y="27" fill="#CCFBF1" fontSize="7" fontFamily="monospace" fontWeight="bold">SQL</text>
            <circle cx="40" cy="27" r="1.5" fill="#FBBF24" />
          </svg>
        </div>
      );

    case "technologie":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #164E63 0%, #0891B2 50%, #06B6D4 100%)",
            border: "1px solid rgba(6, 182, 212, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(6, 182, 212, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Gear + Chip */}
            <circle cx="30" cy="30" r="10" stroke="#67E8F9" strokeWidth="2" />
            <circle cx="30" cy="30" r="4" fill="#A5F3FC" />
            <path d="M30 14V18M30 42V46M14 30H18M42 30H46M18 18L21 21M39 39L42 42M42 18L39 21M18 42L21 39" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="25" y="25" width="10" height="10" rx="2" fill="#0891B2" stroke="#CFFAFE" strokeWidth="1" />
          </svg>
        </div>
      );

    case "economie":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #451A03 0%, #9A3412 50%, #EA580C 100%)",
            border: "1px solid rgba(249, 115, 22, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(249, 115, 22, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <path d="M14 44H46" stroke="#FDBA74" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14 44V16" stroke="#FDBA74" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 36L26 28L34 32L44 18" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="44" cy="18" r="3" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="1" />
            <text x="36" y="40" fill="#FED7AA" fontSize="10" fontWeight="bold">DT</text>
          </svg>
        </div>
      );

    case "gestion":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #0C4A6E 0%, #0284C7 50%, #0EA5E9 100%)",
            border: "1px solid rgba(14, 165, 233, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(14, 165, 233, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <rect x="16" y="14" width="28" height="34" rx="4" fill="#075985" stroke="#7DD3FC" strokeWidth="1.8" />
            <rect x="20" y="18" width="20" height="7" rx="1.5" fill="#38BDF8" opacity="0.8" />
            <circle cx="22" cy="30" r="1.5" fill="#BAE6FD" />
            <circle cx="30" cy="30" r="1.5" fill="#BAE6FD" />
            <circle cx="38" cy="30" r="1.5" fill="#BAE6FD" />
            <circle cx="22" cy="36" r="1.5" fill="#BAE6FD" />
            <circle cx="30" cy="36" r="1.5" fill="#BAE6FD" />
            <circle cx="38" cy="36" r="1.5" fill="#BAE6FD" />
            <circle cx="22" cy="42" r="1.5" fill="#BAE6FD" />
            <rect x="28" y="41" width="12" height="2" rx="1" fill="#38BDF8" />
          </svg>
        </div>
      );

    case "philosophie":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #3B0764 0%, #6B21A8 50%, #9333EA 100%)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(168, 85, 247, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Greek Pillar / Thinker icon */}
            <path d="M20 44H40M22 41H38M24 19V41M36 19V41M22 19H38M20 16H40" stroke="#E9D5FF" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="30" cy="12" r="4" fill="#D8B4FE" />
            <path d="M30 25C33 25 34 22 34 20" stroke="#F0ABFC" strokeWidth="1.2" strokeLinecap="round" />
            <text x="40" y="32" fill="#F5D0FE" fontSize="8" fontWeight="bold">Ψ</text>
          </svg>
        </div>
      );

    case "arabe":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #4A044E 0%, #701A75 50%, #A21CAF 100%)",
            border: "1px solid rgba(217, 70, 239, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(217, 70, 239, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Arabic calligraphy feather & ink */}
            <path d="M38 14C38 14 36 26 26 32C20 36 16 42 16 46C20 46 26 42 30 36C36 26 44 14 44 14" stroke="#F5D0FE" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 44C26 40 34 38 38 32" stroke="#E879F9" strokeWidth="1.5" />
            <circle cx="21" cy="22" r="2" fill="#FBBF24" />
            <circle cx="26" cy="18" r="2" fill="#FBBF24" />
            <text x="14" y="28" fill="#F0ABFC" fontSize="11" fontWeight="bold" fontFamily="serif">ض</text>
          </svg>
        </div>
      );

    case "francais":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #500724 0%, #831843 50%, #BE185D 100%)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(244, 63, 94, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Open book & Eiffel silhouette */}
            <path d="M16 38C22 36 28 37 30 40C32 37 38 36 44 38V18C38 16 32 17 30 20C28 17 22 16 16 18V38Z" fill="#9D174D" stroke="#F472B6" strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="30" y1="20" x2="30" y2="40" stroke="#FBCFE8" strokeWidth="1.5" />
            <path d="M30 14L28 22H32L30 14Z" fill="#FDA4AF" />
          </svg>
        </div>
      );

    case "anglais":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #451A03 0%, #78350F 50%, #B45309 100%)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(245, 158, 11, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Globe / Big Ben crown */}
            <circle cx="30" cy="30" r="16" stroke="#FDE68A" strokeWidth="1.8" />
            <ellipse cx="30" cy="30" rx="7" ry="16" stroke="#FCD34D" strokeWidth="1.2" />
            <line x1="14" y1="30" x2="46" y2="30" stroke="#FCD34D" strokeWidth="1.2" />
            <text x="23" y="24" fill="#FEF3C7" fontSize="8" fontWeight="bold">EN</text>
          </svg>
        </div>
      );

    case "histgeo":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #4C0519 0%, #881337 50%, #BE123C 100%)",
            border: "1px solid rgba(225, 29, 72, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(225, 29, 72, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Compass & Map */}
            <circle cx="30" cy="30" r="16" stroke="#FDA4AF" strokeWidth="1.8" />
            <polygon points="30,16 34,28 30,26 26,28" fill="#F43F5E" />
            <polygon points="30,44 34,32 30,34 26,32" fill="#E2E8F0" />
            <circle cx="30" cy="30" r="2.5" fill="#FFE4E6" />
          </svg>
        </div>
      );

    case "sport_ep":
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-105 ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #713F12 0%, #A16207 50%, #CA8A04 100%)",
            border: "1px solid rgba(234, 179, 8, 0.4)",
            boxShadow: "0 8px 24px -4px rgba(234, 179, 8, 0.45)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            {/* Olympic laurel flame & sprint icon */}
            <circle cx="30" cy="18" r="3.5" fill="#FEF08A" />
            <path d="M22 42L28 34L25 25L32 22L36 28L42 27" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28 34L34 44" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="42" cy="18" r="2" fill="#F59E0B" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-lg ${className}`}
          style={{
            width: dim.w,
            height: dim.h,
            background: "linear-gradient(135deg, #1E1B4B, #312E81)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
          }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full p-2" fill="none">
            <circle cx="30" cy="30" r="16" stroke="#818CF8" strokeWidth="2" strokeDasharray="3 3" />
            <text x="24" y="35" fill="#C7D2FE" fontSize="14" fontWeight="bold">+</text>
          </svg>
        </div>
      );
  }
}
