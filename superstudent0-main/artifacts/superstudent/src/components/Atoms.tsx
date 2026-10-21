import React, { useEffect, useRef, ReactNode, CSSProperties } from "react";
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
  Zap,
  Sparkles,
  Bell,
  Cpu,
  Star,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Account, LangKey } from "../types";
import { COLORS, GRAD, colorFor, BRANCHES, T } from "../constants";

export function Spinner({ size = 18, color = COLORS.chalk }: { size?: number; color?: string }) {
  return <Loader2 size={size} color={color} className="animate-spin" />;
}

/**
 * Modern Sleek & Laser-Engraved SuperStudent Brand Name
 */
export function SuperStudentBrandName({
  size = "md",
  showTag = true,
  className = "",
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTag?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    xs: "text-xs tracking-wider",
    sm: "text-sm tracking-wide",
    md: "text-base tracking-normal",
    lg: "text-lg sm:text-xl tracking-tight",
    xl: "text-xl sm:text-2xl tracking-tight",
  }[size];

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-1.5 leading-none">
        {/* SUPER (Laser-Engraved Titanium White) */}
        <span
          className={`font-black ${sizeClasses} text-white tracking-tight`}
          style={{
            textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 12px rgba(255,255,255,0.2)",
            letterSpacing: "-0.02em",
          }}
        >
          SUPER
        </span>

        {/* STUDENT (Sleek Iridescent Cyan-Violet Hologram) */}
        <span
          className={`font-black ${sizeClasses} text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400`}
          style={{
            filter: "drop-shadow(0 1px 8px rgba(99, 102, 241, 0.5))",
            letterSpacing: "-0.02em",
          }}
        >
          STUDENT
        </span>
      </div>

      {showTag && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>منصة المراجعة التفاعلية</span>
            <span>🇹🇳</span>
          </span>
          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            مجاني 100%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Platform Community Badge
 */
export function PlatformBadge({
  size = "md",
  showSub = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  showSub?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-indigo-500/40 shadow-lg backdrop-blur-md relative overflow-hidden group ${className}`}
      style={{
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 4px 15px -3px rgba(99,102,241,0.25)",
      }}
    >
      <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-sm shrink-0 border border-indigo-300/30">
        <Sparkles size={12} className="text-indigo-100 animate-pulse" />
      </div>

      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1">
          <span
            className="font-black text-xs text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-white uppercase tracking-wider"
          >
            SuperStudent
          </span>
          <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded-md border border-emerald-500/40 font-mono">
            TN 🇹🇳
          </span>
        </div>
        {showSub && (
          <span className="text-[8px] font-bold text-slate-400 flex items-center gap-0.5">
            <span>المنصة الرسمية للبكالوريا</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function Logo({ size = 64, showText = false, textClassName = "" }: { size?: number; showText?: boolean; textClassName?: string }) {
  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className="bac-float flex items-center justify-center relative group cursor-pointer transition-transform duration-300 hover:scale-105"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          background: "linear-gradient(135deg, #4338CA 0%, #3B82F6 45%, #6366F1 80%, #9333EA 100%)",
          boxShadow: `0 0 0 1.5px rgba(165, 180, 252, 0.45), 0 0 ${Math.round(size * 0.5)}px rgba(99, 102, 241, 0.6), 0 ${Math.round(size * 0.25)}px ${Math.round(size * 0.5)}px rgba(2, 6, 23, 0.8), inset 0 2px 2px rgba(255, 255, 255, 0.4)`,
          flexShrink: 0,
        }}
      >
        {/* Inner Glass Prism Effect */}
        <div
          style={{
            position: "absolute",
            inset: 1,
            borderRadius: Math.round(size * 0.3),
            border: "1px solid rgba(255, 255, 255, 0.35)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(147,51,234,0.2) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Master Emblem SVG */}
        <svg
          width={Math.round(size * 0.64)}
          height={Math.round(size * 0.64)}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <linearGradient id="capG" x1="6" y1="8" x2="42" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.65" stopColor="#E0E7FF" />
              <stop offset="1" stopColor="#C7D2FE" />
            </linearGradient>
            <linearGradient id="boltG" x1="18" y1="12" x2="30" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#EA580C" />
            </linearGradient>
          </defs>

          {/* Graduation Cap Mortarboard */}
          <path
            d="M24 6L44 15.5L24 25L4 15.5L24 6Z"
            fill="url(#capG)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Skullcap / Base arch */}
          <path
            d="M12 19.5V29C12 34 17.5 37.5 24 37.5C30.5 37.5 36 34 36 29V19.5"
            stroke="url(#capG)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Dynamic Super Bolt (Energy, High Performance & Intelligence) */}
          <path
            d="M26 14L16 28H23L20 42L33 25H25.5L28.5 14H26Z"
            fill="url(#boltG)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]"
          />

          {/* Academic Laurel / Star Nodes */}
          <circle cx="41" cy="10" r="2.5" fill="#38BDF8" />
          <path d="M41 5V15M36 10H46" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <SuperStudentBrandName size="md" className={textClassName} />
      )}
    </div>
  );
}

export function FieldShell({ icon, children, style }: { icon?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="flex items-center gap-2 w-full rounded-xl px-3"
      style={{ background: COLORS.inputBg, border: `1.5px solid ${COLORS.line}`, minHeight: 46, ...style }}
    >
      {icon}
      {children}
    </div>
  );
}

export function TextField({
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  maxLength,
  dir,
}: {
  icon?: ReactNode;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  dir?: string;
}) {
  return (
    <FieldShell icon={icon}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        dir={dir}
        className="flex-1 py-2.5 text-sm bg-transparent outline-none text-slate-100"
        style={{ color: COLORS.text, minWidth: 0, caretColor: COLORS.accent }}
      />
    </FieldShell>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  busy,
  style,
  className = "",
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  style?: CSSProperties;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={`modern-btn-base btn-shimmer w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 px-5 text-sm font-black text-white cursor-pointer transition-all duration-200 border border-white/20 shadow-xl ${
        disabled
          ? "bg-white/10 text-slate-400 border-white/5 cursor-not-allowed"
          : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25 active:scale-[0.98]"
      } ${className}`}
      style={{
        boxShadow: disabled
          ? "none"
          : "inset 0 1px 1px rgba(255,255,255,0.35), 0 8px 24px -4px rgba(99,102,241,0.45)",
        ...style,
      }}
    >
      {busy ? (
        <Spinner size={18} />
      ) : icon ? (
        <span className="btn-graphic-box p-1 rounded-lg bg-white/20 text-white shadow-sm">
          {icon}
        </span>
      ) : null}
      <span className="tracking-tight">{children}</span>
    </button>
  );
}

/**
 * Modern High-Fidelity Button with Variants & Laser-Cut Visual Enclosures
 */
export function ModernButton({
  children,
  onClick,
  disabled,
  busy,
  variant = "primary",
  size = "md",
  icon,
  rightIcon,
  className = "",
  title,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "emerald" | "cyan" | "amber" | "rose" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
}) {
  const sizeClasses = {
    xs: "px-2.5 py-1 text-[11px] rounded-lg gap-1.5",
    sm: "px-3.5 py-1.5 text-xs rounded-xl gap-2",
    md: "px-4.5 py-2.5 text-xs sm:text-sm rounded-2xl gap-2.5",
    lg: "px-6 py-3.5 text-sm sm:text-base rounded-2xl gap-3",
  }[size];

  const variantStyles = {
    primary: {
      btn: "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-white/25 shadow-indigo-500/30",
      iconBox: "bg-white/20 text-white border-white/30",
    },
    emerald: {
      btn: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-300/30 shadow-emerald-600/30",
      iconBox: "bg-emerald-400/25 text-emerald-100 border-emerald-300/40",
    },
    cyan: {
      btn: "bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-700 hover:from-cyan-500 hover:to-indigo-500 text-white border-cyan-300/30 shadow-cyan-500/30",
      iconBox: "bg-cyan-400/25 text-cyan-100 border-cyan-300/40",
    },
    amber: {
      btn: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black border-amber-200/40 shadow-amber-500/30",
      iconBox: "bg-slate-950/20 text-slate-950 border-slate-950/20",
    },
    rose: {
      btn: "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white border-rose-300/30 shadow-rose-600/30",
      iconBox: "bg-rose-400/25 text-rose-100 border-rose-300/40",
    },
    secondary: {
      btn: "bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80 hover:border-slate-600 shadow-black/40",
      iconBox: "bg-white/10 text-slate-300 border-white/10",
    },
    ghost: {
      btn: "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10 shadow-none",
      iconBox: "bg-transparent text-slate-400 border-transparent",
    },
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      title={title}
      className={`modern-btn-base btn-shimmer border shadow-lg ${sizeClasses} ${variantStyles.btn} ${className}`}
      style={{
        boxShadow: disabled
          ? "none"
          : "inset 0 1px 1px rgba(255,255,255,0.25), 0 6px 20px -2px rgba(0,0,0,0.4)",
      }}
    >
      {busy ? (
        <Spinner size={size === "lg" ? 20 : 16} />
      ) : icon ? (
        <span className={`btn-graphic-box p-1 rounded-lg border shadow-sm ${variantStyles.iconBox}`}>
          {icon}
        </span>
      ) : null}

      <span className="font-bold tracking-tight whitespace-nowrap">{children}</span>

      {rightIcon && (
        <span className="shrink-0 transition-transform group-hover:translate-x-0.5">
          {rightIcon}
        </span>
      )}
    </button>
  );
}

/**
 * Modern Sleek Icon Button with Rim Light & Hover Pop
 */
export function ModernIconButton({
  onClick,
  icon,
  title,
  variant = "ghost",
  size = "md",
  className = "",
  badge,
  disabled,
}: {
  onClick?: () => void;
  icon: ReactNode;
  title?: string;
  variant?: "ghost" | "primary" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  badge?: number | string | null;
  disabled?: boolean;
}) {
  const sizeMap = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl",
    lg: "w-11 h-11 rounded-2xl",
  }[size];

  const variantMap = {
    ghost: "bg-white/[0.07] hover:bg-white/[0.14] text-slate-300 hover:text-white border-white/10 hover:border-white/20",
    primary: "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border-indigo-500/40 shadow-indigo-950/40",
    danger: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border-rose-500/30",
    gold: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 border-amber-500/30",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`modern-btn-base relative flex items-center justify-center border shadow-sm transition-all duration-200 ${sizeMap} ${variantMap} ${className}`}
      style={{
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 3px 10px rgba(0,0,0,0.3)",
      }}
    >
      <span className="transition-transform group-hover:scale-110">{icon}</span>
      {badge ? (
        <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-950 shadow-md animate-pulse">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function ErrorNote({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(244,63,94,.14)", color: "#FDA4AF", border: "1px solid rgba(244,63,94,.3)" }}>
      <AlertCircle size={14} style={{ flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}

export function Avatar({
  src,
  name,
  username,
  displayName,
  colorSeed,
  size = 36,
}: {
  src?: string | null;
  name?: string;
  username?: string;
  displayName?: string;
  colorSeed?: string;
  size?: number;
}) {
  const activeSrc = src || null;
  if (activeSrc) {
    return (
      <img
        src={activeSrc}
        alt=""
        style={{ width: size, height: size, borderRadius: "9999px", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,.25)" }}
      />
    );
  }
  const label = displayName || (username || null) || name || "?";
  const c = colorFor(colorSeed || label);
  return (
    <div
      className="bac-display"
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: `linear-gradient(135deg, ${c}, ${c}99)`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontWeight: 700,
        fontSize: size * 0.4,
        border: "2px solid rgba(255,255,255,.25)",
      }}
    >
      {label.trim().charAt(0).toUpperCase()}
    </div>
  );
}

export function Chip({
  children,
  color,
  bg,
  style,
  onClick,
  title,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
  style?: CSSProperties;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="bac-btn text-xs rounded-full px-2.5 py-0.5 font-semibold"
      style={{ background: bg || "rgba(255,255,255,.1)", color: color || COLORS.textSoft, ...style }}
    >
      {children}
    </button>
  );
}

export function Blobs({ isRTL }: { isRTL: boolean }) {
  const side = isRTL ? "right" : "left";
  const opp = side === "right" ? "left" : "right";
  const stars = Array.from({ length: 16 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(800px 600px at 20% 0%, rgba(99,102,241,.24), transparent 60%), radial-gradient(700px 500px at 100% 30%, rgba(139,92,246,.18), transparent 60%), radial-gradient(600px 400px at 0% 85%, rgba(236,72,153,.15), transparent 60%)" }} />
      <div className="bac-float" style={{ position: "absolute", width: 320, height: 320, borderRadius: "9999px", background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,.5), transparent 65%)", top: -90, [side]: -90, filter: "blur(26px)" }} />
      <div className="bac-float" style={{ position: "absolute", width: 260, height: 260, borderRadius: "9999px", background: "radial-gradient(circle at 60% 40%, rgba(139,92,246,.42), transparent 65%)", bottom: -70, [opp]: -70, filter: "blur(30px)", animationDelay: "1.2s" }} />
      <div className="bac-float" style={{ position: "absolute", width: 210, height: 210, borderRadius: "9999px", background: "radial-gradient(circle at 50% 50%, rgba(236,72,153,.34), transparent 65%)", top: "36%", [side]: "12%", filter: "blur(28px)", animationDelay: "2s" }} />
      <div className="bac-float" style={{ position: "absolute", width: 120, height: 120, borderRadius: "9999px", background: "radial-gradient(circle at 50% 50%, rgba(251,191,36,.3), transparent 65%)", bottom: "16%", [opp]: "14%", filter: "blur(20px)", animationDelay: ".6s" }} />
      {stars.map((i) => (
        <div key={i} className="bac-float" style={{ position: "absolute", width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: "9999px", background: "rgba(255,255,255,.4)", top: `${(i * 7) % 96}%`, [i % 2 ? "left" : "right"]: `${(i * 13) % 32}%`, filter: "blur(1px)", animationDelay: `${(i * 0.4) % 3}s` }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(circle at 50% 30%, black, transparent 75%)", WebkitMaskImage: "radial-gradient(circle at 50% 30%, black, transparent 75%)" }} />
    </div>
  );
}

export function TopBar({
  lang,
  isRTL,
  title,
  subtitle,
  accent,
  onBack,
  user,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onRequireAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: {
  lang: LangKey;
  isRTL: boolean;
  title: string;
  subtitle?: string;
  accent?: string;
  onBack?: () => void;
  user?: Account | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  onRequireAuth?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}) {
  const t = T[lang];
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const isSpecialRole = user?.role === "superadmin" || user?.role === "moderator" || user?.role === "elite_student";

  return (
    <div className="sticky top-0 z-30 w-full bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 max-w-5xl mx-auto w-full">
        {onBack ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <ModernIconButton
              onClick={onBack}
              icon={<BackIcon size={18} className="text-slate-100" />}
              size="sm"
              title={lang === "ar" ? "رجوع" : "Retour"}
            />
            <div className="min-w-0">
              <p className="bac-display text-sm font-bold truncate text-white tracking-tight">{title}</p>
              {subtitle && <p className="text-xs truncate text-slate-400 font-medium">{subtitle}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <Logo size={32} />
            <SuperStudentBrandName size="sm" showTag={false} />
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenSettings && (
            <ModernIconButton
              onClick={onOpenSettings}
              icon={<SettingsIcon size={16} className="text-slate-300" />}
              size="sm"
              variant="ghost"
              title={t.settingsTitle || "Settings"}
            />
          )}

          {user ? (
            <>
              {user.role === "superadmin" && onOpenAdmin && (
                <ModernIconButton
                  onClick={onOpenAdmin}
                  icon={<ShieldCheck size={16} className="text-amber-300" />}
                  size="sm"
                  variant="gold"
                  title={t.admin}
                />
              )}
            </>
          ) : onRequireAuth ? (
            <ModernButton
              onClick={onRequireAuth}
              size="sm"
              variant="primary"
              icon={<LogIn size={13} />}
            >
              {lang === "ar" ? "دخول" : lang === "fr" ? "Connexion" : "Sign In"}
            </ModernButton>
          ) : null}
        </div>
      </div>

      {/* Aesthetic Accent Rim Line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: accent || "linear-gradient(90deg, #6366F1, #A855F7, #EC4899)",
          boxShadow: "0 0 10px rgba(99,102,241,0.5)",
        }}
      />

      {/* User Info Bar if Logged in on Home */}
      {user && !onBack && (
        <div className="bg-slate-950/70 border-t border-white/[0.06] px-4 py-1.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto bac-scroll">
            <Avatar src={user.avatar} name={user.displayName} colorSeed={user.username} size={22} />
            <span className="text-xs text-slate-200 font-bold whitespace-nowrap">{user.displayName}</span>

            {(() => {
              const isOwner = user.role === "superadmin" || user.email === "learningmyj20@gmail.com";
              const isTeacher = user.role === "teacher";
              if (isOwner) {
                return (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap">
                    👑 {lang === "ar" ? "مشرف" : "SuperAdmin"}
                  </span>
                );
              }
              if (isTeacher) {
                return (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                    👨‍🏫 {lang === "ar" ? "أستاذ(ة)" : "Enseignant(e)"}
                  </span>
                );
              }
              if (user.role === "moderator") {
                return (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 whitespace-nowrap">
                    🛡️ {lang === "ar" ? "مشرف" : "Modérateur"}
                  </span>
                );
              }
              if (user.role === "elite_student") {
                return (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                    ⭐ {lang === "ar" ? "تلميذ مساهم" : "Élève contributeur"}
                  </span>
                );
              }
              const ub = BRANCHES.find((b) => b.id === user.branch);
              return ub ? (
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 whitespace-nowrap shadow-sm"
                  style={{
                    backgroundColor: `${ub.color}20`,
                    borderColor: `${ub.color}50`,
                    color: ub.color,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ub.color }} />
                  {ub.name[lang]}
                </span>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
