import React from "react";
import { ALL_25_BACKGROUNDS, BackgroundMeta, getBackgroundMetaById } from "../services/backgroundsCatalog";

interface VisualBackgroundProps {
  bgId?: string;
  meta?: BackgroundMeta;
  className?: string;
  intensity?: "full" | "subtle" | "banner";
  interactive?: boolean;
}

export function VisualBackground({
  bgId,
  meta: explicitMeta,
  className = "",
  intensity = "full",
  interactive = false,
}: VisualBackgroundProps) {
  const meta = explicitMeta || (bgId ? getBackgroundMetaById(bgId) : ALL_25_BACKGROUNDS[0]);
  if (!meta) return null;

  const { palette } = meta;
  const isBanner = intensity === "banner";
  const isSubtle = intensity === "subtle";
  const opacityVal = isSubtle ? 0.35 : 1;

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(1200px 700px at 50% -10%, ${palette.glow}, transparent 70%), radial-gradient(800px 600px at 100% 100%, ${palette.secondary}35, transparent 60%), radial-gradient(800px 500px at 0% 50%, ${palette.accent}20, transparent 60%), ${palette.deepBase}`,
      }}
    >
      {/* Volumetric Dark Vignette to guarantee center chat readibility */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: isBanner
            ? "linear-gradient(to bottom, rgba(4,8,24,0.2) 0%, rgba(4,8,24,0.7) 100%)"
            : "radial-gradient(circle at 50% 50%, rgba(3,7,20, 0.45) 0%, rgba(3,7,20, 0.85) 75%, rgba(3,7,20, 0.95) 100%)",
        }}
      />

      {/* SVG Vector Layer with Academic Edge & Corner Elements */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: opacityVal }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id={`grad-prim-${meta.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id={`grad-glow-${meta.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={palette.primary} stopOpacity="0.0" />
          </linearGradient>

          <filter id={`blur-soft-${meta.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>

        {/* Ambient Corner Lighting Blobs */}
        <circle cx="150" cy="120" r="160" fill={palette.primary} opacity="0.12" filter={`url(#blur-soft-${meta.id})`} />
        <circle cx="1450" cy="150" r="200" fill={palette.accent} opacity="0.10" filter={`url(#blur-soft-${meta.id})`} />
        <circle cx="1400" cy="780" r="180" fill={palette.secondary} opacity="0.14" filter={`url(#blur-soft-${meta.id})`} />
        <circle cx="120" cy="800" r="150" fill={palette.primary} opacity="0.09" filter={`url(#blur-soft-${meta.id})`} />

        {/* Dedicated Background Art for each ID */}
        {renderArtById(meta.id, palette)}
      </svg>

      {/* Subtle Micro-particle Grid */}
      <div
        className="absolute inset-0 z-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${palette.accent} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
    </div>
  );
}

function renderArtById(id: string, pal: BackgroundMeta["palette"]) {
  switch (id) {
    /* ━━━━━━━━━━━━━━━━━━━━ PART 1: 7 SECTION BACKGROUNDS ━━━━━━━━━━━━━━━━━━━━ */

    // 1. SECTION MATHÉMATIQUES
    case "sec_math":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.75">
          {/* Top-Left: Universal Calculus & Hyperplane Mesh */}
          <g transform="translate(60, 60)">
            <ellipse cx="140" cy="140" rx="130" ry="50" transform="rotate(-25 140 140)" strokeDasharray="4 4" opacity="0.5" />
            <ellipse cx="140" cy="140" rx="130" ry="50" transform="rotate(35 140 140)" strokeDasharray="6 3" stroke={pal.accent} opacity="0.6" />
            <circle cx="140" cy="140" r="60" stroke={pal.secondary} strokeWidth="2" />
            <polygon points="140,80 190,170 90,170" stroke={pal.accent} strokeWidth="1.5" />
            <line x1="20" y1="140" x2="260" y2="140" stroke="#818CF8" strokeWidth="1.2" opacity="0.4" />
            <line x1="140" y1="20" x2="140" y2="260" stroke="#818CF8" strokeWidth="1.2" opacity="0.4" />
            <path d="M40 220 C80 180 110 260 150 200 C190 140 220 220 250 180" stroke={pal.accent} strokeWidth="2" />
          </g>

          {/* Top-Right: Physics Wave Packet & Coordinates */}
          <g transform="translate(1250, 40)">
            <path d="M0 120 Q50 40 100 120 T200 120 T300 120" stroke={pal.accent} strokeWidth="2" />
            <path d="M0 140 Q50 60 100 140 T200 140 T300 140" stroke={pal.secondary} strokeWidth="1.2" opacity="0.5" />
            <circle cx="150" cy="120" r="4" fill={pal.accent} />
            <circle cx="250" cy="120" r="3" fill="#A5B4FC" />
            <polygon points="200,60 260,100 240,160 170,150 150,90" stroke={pal.primary} strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* Bottom-Left: Quantum Matrix Node */}
          <g transform="translate(80, 620)">
            <rect x="0" y="0" width="180" height="180" rx="20" stroke={pal.primary} strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="60" x2="180" y2="60" opacity="0.3" />
            <line x1="0" y1="120" x2="180" y2="120" opacity="0.3" />
            <line x1="60" y1="0" x2="60" y2="180" opacity="0.3" />
            <line x1="120" y1="0" x2="120" y2="180" opacity="0.3" />
            <circle cx="60" cy="60" r="5" fill={pal.accent} />
            <circle cx="120" cy="120" r="5" fill={pal.primary} />
            <circle cx="60" cy="120" r="4" fill={pal.secondary} />
          </g>

          {/* Bottom-Right: Golden Ratio Spiral Curve */}
          <g transform="translate(1280, 600)">
            <path d="M220 220 A220 220 0 0 0 0 0 A140 140 0 0 0 80 140 A90 90 0 0 0 170 140" stroke={pal.accent} strokeWidth="2" strokeLinecap="round" />
            <circle cx="170" cy="140" r="4" fill="#38BDF8" />
          </g>
        </g>
      );

    // 2. SECTION SCIENCES EXPÉRIMENTALES
    case "sec_sciexp":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top-Left: DNA Helix & Laboratory Molecules */}
          <g transform="translate(60, 50)">
            <path d="M40 30 C40 90 120 110 120 170 C120 230 40 250 40 310" stroke={pal.primary} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M120 30 C120 90 40 110 40 170 C40 230 120 250 120 310" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="70" x2="105" y2="70" stroke="#6EE7B7" strokeWidth="2" />
            <line x1="42" y1="140" x2="118" y2="140" stroke="#6EE7B7" strokeWidth="2" />
            <line x1="42" y1="200" x2="118" y2="200" stroke="#A7F3D0" strokeWidth="2" />
            <line x1="55" y1="270" x2="105" y2="270" stroke="#6EE7B7" strokeWidth="2" />
            <circle cx="80" cy="170" r="4" fill="#FBBF24" />
          </g>

          {/* Top-Right: Benzene Rings & Chemistry Lattice */}
          <g transform="translate(1300, 50)">
            {/* Hexagon 1 */}
            <polygon points="120,40 160,65 160,115 120,140 80,115 80,65" stroke={pal.accent} strokeWidth="2" />
            <circle cx="120" cy="90" r="28" stroke={pal.secondary} strokeDasharray="4 4" />
            {/* Hexagon 2 attached */}
            <polygon points="160,115 200,140 200,190 160,215 120,190 120,140" stroke={pal.primary} strokeWidth="1.8" />
            <circle cx="200" cy="140" r="4" fill={pal.accent} />
            <circle cx="80" cy="65" r="4" fill="#34D399" />
          </g>

          {/* Bottom-Left: Cellular Membrane & Mitochondria */}
          <g transform="translate(70, 630)">
            <ellipse cx="120" cy="120" rx="100" ry="70" stroke={pal.primary} strokeWidth="2" strokeDasharray="6 3" />
            <ellipse cx="120" cy="120" rx="70" ry="45" stroke={pal.accent} strokeWidth="1.5" />
            <path d="M90 120 Q120 90 150 120 T120 145" stroke="#6EE7B7" strokeWidth="2" />
          </g>

          {/* Bottom-Right: Geology Strata & Environmental Waves */}
          <g transform="translate(1260, 650)">
            <path d="M0 80 C80 50 160 110 240 70" stroke={pal.accent} strokeWidth="2" />
            <path d="M0 120 C80 90 160 150 240 110" stroke={pal.secondary} strokeWidth="1.8" />
            <path d="M0 160 C80 130 160 190 240 150" stroke={pal.primary} strokeWidth="1.5" strokeDasharray="4 4" />
          </g>
        </g>
      );

    // 3. SECTION SCIENCES TECHNIQUES
    case "sec_scitech":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top-Left: Technical Engineering Gear & Kinematics */}
          <g transform="translate(50, 40)">
            <circle cx="130" cy="130" r="90" stroke={pal.primary} strokeWidth="2.5" />
            <circle cx="130" cy="130" r="60" stroke={pal.accent} strokeWidth="1.5" strokeDasharray="6 4" />
            <circle cx="130" cy="130" r="25" fill="#0C4A6E" stroke={pal.accent} strokeWidth="2" />
            {/* Gear teeth */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <line
                key={ang}
                x1={130 + 85 * Math.cos((ang * Math.PI) / 180)}
                y1={130 + 85 * Math.sin((ang * Math.PI) / 180)}
                x2={130 + 105 * Math.cos((ang * Math.PI) / 180)}
                y2={130 + 105 * Math.sin((ang * Math.PI) / 180)}
                stroke={pal.accent}
                strokeWidth="5"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Top-Right: Microelectronic Circuit & PCB Traces */}
          <g transform="translate(1260, 40)">
            <rect x="70" y="50" width="130" height="90" rx="10" fill="#06283D" stroke={pal.accent} strokeWidth="2" />
            <path d="M70 75 H20 V140 H-20" stroke={pal.primary} strokeWidth="2" />
            <path d="M70 115 H40 V180 H-10" stroke={pal.accent} strokeWidth="2" />
            <path d="M200 75 H250 V130 H290" stroke={pal.primary} strokeWidth="2" />
            <path d="M135 140 V200 H90 V240" stroke={pal.accent} strokeWidth="2" />
            <circle cx="-20" cy="140" r="4" fill={pal.accent} />
            <circle cx="290" cy="130" r="4" fill={pal.accent} />
            <circle cx="90" cy="240" r="4" fill={pal.primary} />
          </g>

          {/* Bottom-Left: Isometric Technical Drawing Grid */}
          <g transform="translate(60, 630)">
            <polygon points="120,30 200,75 120,120 40,75" stroke={pal.accent} strokeWidth="2" />
            <polygon points="40,75 120,120 120,190 40,145" stroke={pal.primary} strokeWidth="1.5" />
            <polygon points="120,120 200,75 200,145 120,190" stroke={pal.secondary} strokeWidth="1.5" />
          </g>

          {/* Bottom-Right: Oscilloscope Signal Waveforms */}
          <g transform="translate(1280, 660)">
            <line x1="0" y1="100" x2="240" y2="100" stroke="#38BDF8" strokeWidth="1" opacity="0.4" />
            <path d="M0 100 L30 100 L30 40 L70 40 L70 160 L110 160 L110 100 L150 100 L170 50 L190 150 L210 100 L240 100" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      );

    // 4. SECTION SCIENCES DE L'INFORMATIQUE
    case "sec_info":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top-Left: Distributed Graph & Network Nodes */}
          <g transform="translate(50, 50)">
            <circle cx="80" cy="60" r="8" fill={pal.primary} />
            <circle cx="180" cy="50" r="6" fill={pal.accent} />
            <circle cx="140" cy="140" r="10" fill="#6366F1" />
            <circle cx="60" cy="180" r="7" fill={pal.secondary} />
            <circle cx="220" cy="160" r="8" fill={pal.accent} />
            <line x1="80" y1="60" x2="180" y2="50" stroke={pal.accent} strokeWidth="1.8" />
            <line x1="80" y1="60" x2="140" y2="140" stroke={pal.primary} strokeWidth="1.8" />
            <line x1="180" y1="50" x2="220" y2="160" stroke={pal.accent} strokeWidth="1.8" />
            <line x1="140" y1="140" x2="220" y2="160" stroke="#818CF8" strokeWidth="1.8" />
            <line x1="140" y1="140" x2="60" y2="180" stroke={pal.primary} strokeWidth="1.8" />
          </g>

          {/* Top-Right: Binary Matrix & Algorithmic Tree */}
          <g transform="translate(1280, 50)">
            {/* Binary Tree */}
            <circle cx="150" cy="40" r="9" stroke={pal.accent} strokeWidth="2" />
            <line x1="150" y1="49" x2="90" y2="110" stroke={pal.accent} strokeWidth="1.8" />
            <line x1="150" y1="49" x2="210" y2="110" stroke={pal.accent} strokeWidth="1.8" />
            <circle cx="90" cy="110" r="8" stroke={pal.primary} strokeWidth="2" />
            <circle cx="210" cy="110" r="8" stroke={pal.primary} strokeWidth="2" />
            <line x1="90" y1="118" x2="50" y2="180" stroke={pal.secondary} strokeWidth="1.5" />
            <line x1="90" y1="118" x2="120" y2="180" stroke={pal.secondary} strokeWidth="1.5" />
            <line x1="210" y1="118" x2="180" y2="180" stroke={pal.secondary} strokeWidth="1.5" />
            <line x1="210" y1="118" x2="250" y2="180" stroke={pal.secondary} strokeWidth="1.5" />
            <circle cx="50" cy="180" r="5" fill={pal.accent} />
            <circle cx="120" cy="180" r="5" fill={pal.accent} />
            <circle cx="180" cy="180" r="5" fill={pal.primary} />
            <circle cx="250" cy="180" r="5" fill={pal.primary} />
          </g>

          {/* Bottom-Left: Server Cluster Stack */}
          <g transform="translate(70, 640)">
            <rect x="0" y="0" width="160" height="36" rx="8" stroke={pal.primary} strokeWidth="2" fill="#09143C" />
            <circle cx="20" cy="18" r="3" fill="#10B981" />
            <circle cx="32" cy="18" r="3" fill="#38BDF8" />
            <rect x="0" y="48" width="160" height="36" rx="8" stroke={pal.primary} strokeWidth="2" fill="#09143C" />
            <circle cx="20" cy="66" r="3" fill="#10B981" />
            <circle cx="32" cy="66" r="3" fill="#38BDF8" />
            <rect x="0" y="96" width="160" height="36" rx="8" stroke={pal.accent} strokeWidth="2" fill="#09143C" />
            <circle cx="20" cy="114" r="3" fill="#10B981" />
            <circle cx="32" cy="114" r="3" fill="#EC4899" />
          </g>

          {/* Bottom-Right: Fiber Optic Wave Streams */}
          <g transform="translate(1260, 660)">
            <path d="M0 60 C80 20 160 100 240 60" stroke={pal.accent} strokeWidth="2.5" />
            <path d="M0 90 C80 50 160 130 240 90" stroke={pal.primary} strokeWidth="2" />
            <path d="M0 120 C80 80 160 160 240 120" stroke={pal.secondary} strokeWidth="1.5" />
          </g>
        </g>
      );

    // 5. SECTION ÉCONOMIE & GESTION
    case "sec_eco":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top-Left: Exponential Growth & Global Trade Flows */}
          <g transform="translate(60, 50)">
            <line x1="20" y1="220" x2="240" y2="220" stroke="#FDE68A" strokeWidth="2" />
            <line x1="20" y1="220" x2="20" y2="20" stroke="#FDE68A" strokeWidth="2" />
            <path d="M20 200 Q100 180 160 110 T240 30" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" />
            <circle cx="240" cy="30" r="6" fill="#F59E0B" />
            <path d="M20 210 Q90 195 150 150 T230 90" stroke={pal.secondary} strokeWidth="2" strokeDasharray="4 4" />
          </g>

          {/* Top-Right: Organizational Strategy Matrix */}
          <g transform="translate(1300, 50)">
            <rect x="0" y="0" width="180" height="140" rx="14" stroke={pal.primary} strokeWidth="2" fill="#1C102C" />
            <line x1="0" y1="70" x2="180" y2="70" stroke={pal.secondary} strokeWidth="1.5" />
            <line x1="90" y1="0" x2="90" y2="140" stroke={pal.secondary} strokeWidth="1.5" />
            <circle cx="45" cy="35" r="14" fill="#F59E0B" opacity="0.4" />
            <circle cx="135" cy="105" r="18" fill="#F97316" opacity="0.4" />
          </g>

          {/* Bottom-Left: Financial Ratio Pillar & Balance */}
          <g transform="translate(70, 640)">
            <rect x="20" y="80" width="28" height="80" rx="4" fill="#F59E0B" opacity="0.6" />
            <rect x="60" y="40" width="28" height="120" rx="4" fill="#F97316" opacity="0.6" />
            <rect x="100" y="15" width="28" height="145" rx="4" fill="#FCD34D" opacity="0.8" />
            <rect x="140" y="60" width="28" height="100" rx="4" fill="#F59E0B" opacity="0.5" />
          </g>

          {/* Bottom-Right: Currency & Equilibrium Nodes */}
          <g transform="translate(1280, 640)">
            <circle cx="100" cy="100" r="70" stroke={pal.accent} strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="100" cy="100" r="40" stroke={pal.primary} strokeWidth="1.5" />
            <path d="M70 100 L130 100 M100 70 L100 130" stroke="#FDE68A" strokeWidth="1.5" />
          </g>
        </g>
      );

    // 6. SECTION LETTRES
    case "sec_lettres":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top-Left: Classical Pillar & Philosophy Arc */}
          <g transform="translate(60, 50)">
            <path d="M40 220 H180 M50 205 H170 M60 50 V205 M160 50 V205 M50 50 H170 M40 35 H180" stroke={pal.accent} strokeWidth="2" />
            <path d="M110 20 C130 20 140 35 140 50" stroke="#F472B6" strokeWidth="1.5" />
            <circle cx="110" cy="90" r="25" stroke={pal.secondary} strokeDasharray="3 3" />
          </g>

          {/* Top-Right: Open Illuminated Manuscript & Feather */}
          <g transform="translate(1280, 40)">
            <path d="M20 140 C60 120 100 125 120 145 C140 125 180 120 220 140 V40 C180 20 140 25 120 45 C100 25 60 20 20 40 Z" stroke={pal.accent} strokeWidth="2" fill="#2E0B38" />
            <line x1="120" y1="45" x2="120" y2="145" stroke="#FBCFE8" strokeWidth="2" />
            {/* Feather */}
            <path d="M170 30 C180 70 160 120 130 150" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Bottom-Left: Cartographic Compass Rose */}
          <g transform="translate(70, 640)">
            <circle cx="90" cy="90" r="65" stroke={pal.primary} strokeWidth="2" />
            <polygon points="90,30 102,80 90,75 78,80" fill="#EC4899" />
            <polygon points="90,150 102,100 90,105 78,100" fill="#F472B6" />
            <polygon points="150,90 100,102 105,90 100,78" fill="#D946EF" />
            <polygon points="30,90 80,102 75,90 80,78" fill="#F472B6" />
          </g>

          {/* Bottom-Right: Calligraphic Abstract Flourish */}
          <g transform="translate(1260, 660)">
            <path d="M20 120 C80 60 140 160 200 80 C230 40 240 100 260 60" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="200" cy="80" r="4" fill="#F472B6" />
          </g>
        </g>
      );

    // 7. SECTION SPORT
    case "sec_sport":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          {/* Top-Left: Athletic Running Track Lanes */}
          <g transform="translate(40, 40)">
            <path d="M20 240 C20 120 120 20 240 20" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" />
            <path d="M45 240 C45 140 140 45 240 45" stroke={pal.primary} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M70 240 C70 160 160 70 240 70" stroke={pal.secondary} strokeWidth="2" strokeLinecap="round" />
            <path d="M95 240 C95 180 180 95 240 95" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="4 4" />
          </g>

          {/* Top-Right: Kinematic Parabolic Trajectory */}
          <g transform="translate(1260, 40)">
            <path d="M0 160 Q120 20 240 160" stroke={pal.accent} strokeWidth="2.5" strokeDasharray="6 3" />
            <circle cx="120" cy="90" r="16" stroke={pal.primary} strokeWidth="2" />
            <circle cx="120" cy="90" r="4" fill="#EAB308" />
            <circle cx="240" cy="160" r="6" fill="#10B981" />
          </g>

          {/* Bottom-Left: Cardiac Biometric Pulse & Energy */}
          <g transform="translate(60, 680)">
            <path d="M0 60 L60 60 L75 20 L95 110 L115 40 L130 80 L145 60 L220 60" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Bottom-Right: Olympic Laurels Arc */}
          <g transform="translate(1280, 640)">
            <path d="M40 140 C80 60 140 40 200 80" stroke={pal.primary} strokeWidth="2.5" />
            <ellipse cx="90" cy="90" rx="14" ry="7" transform="rotate(-30 90 90)" fill="#EAB308" opacity="0.5" />
            <ellipse cx="140" cy="65" rx="14" ry="7" transform="rotate(10 140 65)" fill="#FDE047" opacity="0.6" />
            <ellipse cx="185" cy="75" rx="14" ry="7" transform="rotate(45 185 75)" fill="#EAB308" opacity="0.5" />
          </g>
        </g>
      );

    /* ━━━━━━━━━━━━━━━━━━━━ PART 2: 18 SUBJECT BACKGROUNDS ━━━━━━━━━━━━━━━━━━━━ */

    // 8. MATHÉMATIQUES (SUBJECT)
    case "subj_math":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <path d="M40 200 C30 140 80 120 70 60 C60 20 40 40 40 40" stroke={pal.accent} strokeWidth="3" strokeLinecap="round" />
            <circle cx="120" cy="100" r="50" stroke={pal.primary} strokeWidth="2" />
            <line x1="70" y1="100" x2="170" y2="100" stroke={pal.secondary} strokeWidth="1.5" />
            <line x1="120" y1="50" x2="120" y2="150" stroke={pal.secondary} strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 60)">
            <polygon points="120,40 180,140 60,140" stroke={pal.accent} strokeWidth="2" />
            <circle cx="120" cy="106" r="34" stroke={pal.primary} strokeWidth="1.5" strokeDasharray="3 3" />
          </g>
          <g transform="translate(1260, 660)">
            <path d="M0 100 Q60 20 120 100 T240 100" stroke={pal.accent} strokeWidth="2" />
          </g>
        </g>
      );

    // 9. SCIENCES PHYSIQUES
    case "subj_physique":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.85">
          <g transform="translate(70, 60)">
            <ellipse cx="120" cy="120" rx="100" ry="36" transform="rotate(30 120 120)" stroke={pal.accent} strokeWidth="2" />
            <ellipse cx="120" cy="120" rx="100" ry="36" transform="rotate(-30 120 120)" stroke={pal.primary} strokeWidth="2" />
            <circle cx="120" cy="120" r="18" fill={pal.secondary} />
            <circle cx="60" cy="70" r="5" fill={pal.accent} />
            <circle cx="170" cy="160" r="5" fill="#C084FC" />
          </g>
          <g transform="translate(1280, 60)">
            <path d="M0 80 Q40 20 80 80 T160 80 T240 80" stroke={pal.accent} strokeWidth="2.5" />
            <path d="M0 110 Q40 50 80 110 T160 110 T240 110" stroke={pal.primary} strokeWidth="1.5" opacity="0.5" />
          </g>
        </g>
      );

    // 10. SVT
    case "subj_svt":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 50)">
            <path d="M60 20 C60 80 120 100 120 160 C120 220 60 240 60 300" stroke={pal.accent} strokeWidth="3" />
            <path d="M120 20 C120 80 60 100 60 160 C60 220 120 240 120 300" stroke={pal.primary} strokeWidth="3" />
            <line x1="70" y1="60" x2="110" y2="60" stroke="#A7F3D0" strokeWidth="2" />
            <line x1="62" y1="130" x2="118" y2="130" stroke="#A7F3D0" strokeWidth="2" />
            <line x1="62" y1="190" x2="118" y2="190" stroke="#A7F3D0" strokeWidth="2" />
          </g>
          <g transform="translate(1300, 60)">
            <ellipse cx="100" cy="100" rx="80" ry="50" stroke={pal.accent} strokeWidth="2" />
            <circle cx="80" cy="90" r="15" fill={pal.secondary} opacity="0.5" />
          </g>
        </g>
      );

    // 11. TECHNIQUE
    case "subj_technique":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 50)">
            <circle cx="100" cy="100" r="70" stroke={pal.accent} strokeWidth="2" />
            <circle cx="100" cy="100" r="40" stroke={pal.primary} strokeWidth="1.5" />
            <circle cx="100" cy="100" r="15" fill="#0E7490" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <rect
                key={deg}
                x="94"
                y="18"
                width="12"
                height="18"
                rx="2"
                transform={`rotate(${deg} 100 100)`}
                fill={pal.accent}
              />
            ))}
          </g>
          <g transform="translate(1280, 60)">
            <polygon points="100,20 180,65 180,155 100,200 20,155 20,65" stroke={pal.primary} strokeWidth="2" />
          </g>
        </g>
      );

    // 12. ÉLECTRIQUE
    case "subj_electrique":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <rect x="20" y="30" width="120" height="80" rx="8" stroke={pal.accent} strokeWidth="2" fill="#0C2D48" />
            <line x1="20" y1="50" x2="-20" y2="50" stroke={pal.primary} strokeWidth="2" />
            <line x1="20" y1="90" x2="-20" y2="90" stroke={pal.primary} strokeWidth="2" />
            <line x1="140" y1="70" x2="180" y2="70" stroke={pal.accent} strokeWidth="2" />
            <circle cx="180" cy="70" r="4" fill={pal.accent} />
          </g>
          <g transform="translate(1280, 660)">
            <path d="M0 80 L30 80 L30 20 L70 20 L70 140 L110 140 L110 80 L160 80" stroke={pal.accent} strokeWidth="2.5" />
          </g>
        </g>
      );

    // 13. INFORMATIQUE
    case "subj_informatique":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <circle cx="60" cy="60" r="8" fill={pal.accent} />
            <circle cx="160" cy="40" r="8" fill={pal.primary} />
            <circle cx="120" cy="140" r="10" fill={pal.secondary} />
            <line x1="60" y1="60" x2="160" y2="40" stroke={pal.accent} strokeWidth="2" />
            <line x1="60" y1="60" x2="120" y2="140" stroke={pal.primary} strokeWidth="2" />
            <line x1="160" y1="40" x2="120" y2="140" stroke={pal.accent} strokeWidth="2" />
          </g>
          <g transform="translate(1300, 60)">
            <rect x="20" y="30" width="140" height="90" rx="10" stroke={pal.accent} strokeWidth="2" fill="#042F2E" />
            <line x1="20" y1="60" x2="160" y2="60" stroke={pal.primary} strokeWidth="1.5" />
          </g>
        </g>
      );

    // 14. ALGORITHMIQUE & PROGRAMMATION
    case "subj_algo":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            {/* Logic Tree Nodes */}
            <circle cx="100" cy="30" r="8" fill={pal.accent} />
            <line x1="100" y1="38" x2="50" y2="90" stroke={pal.accent} strokeWidth="2" />
            <line x1="100" y1="38" x2="150" y2="90" stroke={pal.accent} strokeWidth="2" />
            <circle cx="50" cy="90" r="7" fill={pal.primary} />
            <circle cx="150" cy="90" r="7" fill={pal.primary} />
            <line x1="50" y1="97" x2="20" y2="150" stroke={pal.secondary} strokeWidth="1.5" />
            <line x1="50" y1="97" x2="80" y2="150" stroke={pal.secondary} strokeWidth="1.5" />
            <circle cx="20" cy="150" r="5" fill={pal.accent} />
            <circle cx="80" cy="150" r="5" fill={pal.accent} />
          </g>
          <g transform="translate(1300, 60)">
            <polygon points="100,20 160,70 100,120 40,70" stroke={pal.accent} strokeWidth="2" />
            <line x1="100" y1="120" x2="100" y2="170" stroke={pal.primary} strokeWidth="2" />
          </g>
        </g>
      );

    // 15. ÉCONOMIE
    case "subj_economie":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <line x1="20" y1="180" x2="200" y2="180" stroke="#FDBA74" strokeWidth="2" />
            <line x1="20" y1="180" x2="20" y2="20" stroke="#FDBA74" strokeWidth="2" />
            <path d="M30 160 L180 40" stroke={pal.accent} strokeWidth="2.5" />
            <path d="M30 40 L180 160" stroke={pal.primary} strokeWidth="2.5" />
            <circle cx="105" cy="100" r="6" fill="#F59E0B" />
          </g>
          <g transform="translate(1300, 60)">
            <path d="M0 140 Q60 120 100 60 T200 20" stroke={pal.accent} strokeWidth="3" />
          </g>
        </g>
      );

    // 16. GESTION
    case "subj_gestion":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <rect x="20" y="20" width="140" height="180" rx="10" stroke={pal.accent} strokeWidth="2" fill="#0C4A6E" />
            <rect x="35" y="40" width="110" height="24" rx="4" fill="#0284C7" />
            <line x1="35" y1="90" x2="145" y2="90" stroke={pal.primary} strokeWidth="1.5" />
            <line x1="35" y1="120" x2="145" y2="120" stroke={pal.primary} strokeWidth="1.5" />
            <line x1="35" y1="150" x2="145" y2="150" stroke={pal.primary} strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 640)">
            <rect x="20" y="40" width="30" height="100" rx="4" fill="#0284C7" />
            <rect x="65" y="10" width="30" height="130" rx="4" fill="#38BDF8" />
            <rect x="110" y="60" width="30" height="80" rx="4" fill="#0369A1" />
          </g>
        </g>
      );

    // 17. ARABE
    case "subj_arabe":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 50)">
            <path d="M140 40 C140 40 130 110 80 150 C50 175 30 210 30 240 C50 240 80 210 100 175 C130 120 160 40 160 40" stroke={pal.accent} strokeWidth="2.5" />
            <circle cx="65" cy="110" r="3.5" fill="#FDE047" />
            <circle cx="90" cy="90" r="3.5" fill="#FDE047" />
          </g>
          <g transform="translate(1280, 50)">
            <polygon points="100,20 160,80 100,140 40,80" stroke={pal.accent} strokeWidth="2" />
            <circle cx="100" cy="80" r="30" stroke={pal.primary} strokeWidth="1.5" strokeDasharray="4 4" />
          </g>
        </g>
      );

    // 18. FRANÇAIS
    case "subj_francais":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <path d="M20 120 C50 105 80 110 95 125 C110 110 140 105 170 120 V40 C140 25 110 30 95 45 C80 30 50 25 20 40 Z" stroke={pal.accent} strokeWidth="2" fill="#831843" />
            <line x1="95" y1="45" x2="95" y2="125" stroke="#FBCFE8" strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 60)">
            <path d="M120 30 C130 80 110 130 80 170" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      );

    // 19. ANGLAIS
    case "subj_anglais":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <circle cx="100" cy="100" r="70" stroke={pal.accent} strokeWidth="2" />
            <ellipse cx="100" cy="100" rx="30" ry="70" stroke={pal.primary} strokeWidth="1.5" />
            <line x1="30" y1="100" x2="170" y2="100" stroke={pal.secondary} strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 60)">
            <rect x="20" y="30" width="140" height="90" rx="16" stroke={pal.accent} strokeWidth="2" fill="#78350F" />
            <polygon points="40,120 30,150 70,120" fill="#78350F" stroke={pal.accent} strokeWidth="2" />
          </g>
        </g>
      );

    // 20. PHILOSOPHIE
    case "subj_philosophie":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 50)">
            <path d="M40 180 H140 M50 165 H130 M60 40 V165 M120 40 V165 M50 40 H130 M40 25 H140" stroke={pal.accent} strokeWidth="2" />
            <circle cx="90" cy="90" r="20" stroke={pal.secondary} strokeDasharray="3 3" />
          </g>
          <g transform="translate(1300, 60)">
            <path d="M40 60 C80 20 140 40 140 100 C140 140 100 160 100 180" stroke={pal.accent} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="210" r="4" fill={pal.accent} />
          </g>
        </g>
      );

    // 21. HISTOIRE
    case "subj_histoire":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <line x1="20" y1="20" x2="20" y2="180" stroke={pal.accent} strokeWidth="2.5" />
            <circle cx="20" cy="50" r="6" fill="#E11D48" />
            <line x1="20" y1="50" x2="80" y2="50" stroke={pal.primary} strokeWidth="1.5" />
            <circle cx="20" cy="110" r="6" fill="#FDA4AF" />
            <line x1="20" y1="110" x2="100" y2="110" stroke={pal.primary} strokeWidth="1.5" />
            <circle cx="20" cy="160" r="6" fill="#E11D48" />
            <line x1="20" y1="160" x2="70" y2="160" stroke={pal.primary} strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 60)">
            <circle cx="90" cy="90" r="60" stroke={pal.accent} strokeWidth="2" />
            <circle cx="90" cy="90" r="40" stroke={pal.primary} strokeWidth="1.5" strokeDasharray="4 4" />
          </g>
        </g>
      );

    // 22. GÉOGRAPHIE
    case "subj_geographie":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <path d="M0 60 C50 40 100 80 150 50 C200 20 240 60 280 40" stroke={pal.accent} strokeWidth="2" />
            <path d="M0 100 C50 80 100 120 150 90 C200 60 240 100 280 80" stroke={pal.primary} strokeWidth="2" />
            <path d="M0 140 C50 120 100 160 150 130 C200 100 240 140 280 120" stroke={pal.secondary} strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 60)">
            <circle cx="80" cy="80" r="60" stroke={pal.accent} strokeWidth="2" />
            <polygon points="80,30 90,75 80,70 70,75" fill="#059669" />
            <polygon points="80,130 90,85 80,90 70,85" fill="#34D399" />
          </g>
        </g>
      );

    // 23. SPORT BIO
    case "subj_sport_bio":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <rect x="20" y="30" width="140" height="50" rx="6" stroke={pal.accent} strokeWidth="2" fill="#042F2E" />
            <line x1="50" y1="30" x2="50" y2="80" stroke={pal.primary} strokeWidth="2" />
            <line x1="80" y1="30" x2="80" y2="80" stroke={pal.primary} strokeWidth="2" />
            <line x1="110" y1="30" x2="110" y2="80" stroke={pal.primary} strokeWidth="2" />
            <line x1="140" y1="30" x2="140" y2="80" stroke={pal.primary} strokeWidth="2" />
          </g>
          <g transform="translate(1300, 60)">
            <circle cx="80" cy="80" r="60" stroke={pal.accent} strokeWidth="2" />
            <path d="M50 80 Q80 40 110 80" stroke="#5EEAD4" strokeWidth="2" />
          </g>
        </g>
      );

    // 24. SPORT EP
    case "subj_sport_ep":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 60)">
            <path d="M20 180 C20 90 90 20 180 20" stroke={pal.accent} strokeWidth="3" />
            <path d="M45 180 C45 110 110 45 180 45" stroke={pal.primary} strokeWidth="2.5" />
            <path d="M70 180 C70 130 130 70 180 70" stroke={pal.secondary} strokeWidth="2" />
          </g>
          <g transform="translate(1300, 60)">
            <ellipse cx="80" cy="80" rx="60" ry="35" stroke={pal.accent} strokeWidth="2" />
            <line x1="20" y1="80" x2="140" y2="80" stroke={pal.primary} strokeWidth="1.5" />
          </g>
        </g>
      );

    // 25. PENSÉE ISLAMIQUE
    case "subj_islamique":
      return (
        <g stroke={pal.primary} strokeWidth="1.5" fill="none" opacity="0.8">
          <g transform="translate(60, 50)">
            {/* Eight-pointed Islamic Star / Octagram */}
            <rect x="40" y="40" width="80" height="80" stroke={pal.accent} strokeWidth="2" />
            <rect x="40" y="40" width="80" height="80" transform="rotate(45 80 80)" stroke={pal.primary} strokeWidth="2" />
            <circle cx="80" cy="80" r="25" stroke="#FCD34D" strokeWidth="1.5" />
          </g>
          <g transform="translate(1300, 50)">
            {/* Andalusian Horseshoe Arch */}
            <path d="M40 180 V100 C40 50 140 50 140 100 V180" stroke={pal.accent} strokeWidth="2.5" />
            <path d="M55 180 V110 C55 70 125 70 125 110 V180" stroke={pal.primary} strokeWidth="1.5" />
          </g>
        </g>
      );

    default:
      return null;
  }
}
