import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Palette,
  Eye,
  Check,
  X,
  Compass,
  Sliders,
  Shield,
  Zap,
  Info,
} from "lucide-react";
import { LangKey } from "../types";
import {
  ALL_25_BACKGROUNDS,
  SECTION_BACKGROUNDS,
  SUBJECT_BACKGROUNDS,
  BackgroundMeta,
  getBackgroundMetaById,
} from "../services/backgroundsCatalog";
import { VisualBackground } from "./VisualBackground";

interface BackgroundGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LangKey;
  onSelectBackground?: (bgId: string) => void;
  activeBgId?: string;
}

export function BackgroundGalleryModal({
  isOpen,
  onClose,
  lang,
  onSelectBackground,
  activeBgId,
}: BackgroundGalleryModalProps) {
  const [filter, setFilter] = useState<"all" | "section" | "subject">("all");
  const [selectedBg, setSelectedBg] = useState<BackgroundMeta>(ALL_25_BACKGROUNDS[0]);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [showSimulatedChat, setShowSimulatedChat] = useState(true);

  if (!isOpen) return null;

  const filteredItems = ALL_25_BACKGROUNDS.filter((item) => {
    if (filter === "all") return true;
    return item.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-950/95 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <Palette size={22} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                <span>{lang === "ar" ? "نظام الخلفيات البصرية الأكاديمية (25 خلفية)" : "Système de Fonds Visuels (25 Fonds)"}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                  25/25 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "ar"
                  ? "7 خلفيات رئيسية للشعب + 18 خلفية تخصصية لغرف المواد (تصميم 16:9 بمنطقة محادثة نقية)"
                  : "7 fonds pour les sections + 18 fonds pour les salons de matières"}
              </p>
            </div>
          </div>

          {/* Filter Toggles & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filter === "all" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                {lang === "ar" ? "الكل" : "Tous"} ({ALL_25_BACKGROUNDS.length})
              </button>
              <button
                onClick={() => setFilter("section")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filter === "section" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                {lang === "ar" ? "الشعب (7)" : "Sections (7)"}
              </button>
              <button
                onClick={() => setFilter("subject")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filter === "subject" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
                }`}
              >
                {lang === "ar" ? "المواد (18)" : "Matières (18)"}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top List (Scrollable Cards) */}
          <div className="w-full md:w-5/12 lg:w-4/12 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-3 space-y-2.5 bac-scroll">
            <div className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
              <span>{filter === "all" ? (lang === "ar" ? "جميع الخلفيات" : "Tous les fonds") : filter === "section" ? (lang === "ar" ? "خلفيات الشعب" : "Fonds de Sections") : (lang === "ar" ? "خلفيات غرف المواد" : "Fonds de Matières")}</span>
              <span>{filteredItems.length} خلفية</span>
            </div>

            {filteredItems.map((item) => {
              const isSelected = selectedBg.id === item.id;
              const isApplied = activeBgId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedBg(item)}
                  className={`w-full text-start p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden group ${
                    isSelected
                      ? "bg-indigo-600/25 border-indigo-500 shadow-lg scale-[1.01]"
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {/* Color Glow Dot */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${item.palette.primary}, ${item.palette.secondary})`,
                      border: `1px solid ${item.palette.accent}60`,
                    }}
                  >
                    #{item.number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {item.title[lang] || item.title.fr}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/10 text-slate-300 shrink-0">
                        {item.category === "section" ? (lang === "ar" ? "شعبة" : "Section") : (lang === "ar" ? "مادة" : "Matière")}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.palette.name}
                    </p>
                  </div>

                  {isApplied && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right / Center Preview Area */}
          <div className="flex-1 flex flex-col overflow-y-auto bac-scroll p-4 md:p-6 bg-black/40">
            {/* Live Visual Canvas Preview (16:9 Aspect Ratio) */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between">
              {/* The Actual Rendered Background */}
              <VisualBackground meta={selectedBg} intensity="full" className="absolute inset-0 z-0" />

              {/* Top Bar of Canvas */}
              <div className="relative z-20 p-4 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20 shadow">
                    #{selectedBg.number} · {selectedBg.title[lang] || selectedBg.title.fr}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40">
                    {selectedBg.category === "section" ? (lang === "ar" ? "خلفية شعبة" : "Couverture de Section") : (lang === "ar" ? "خلفية غرفة مادة" : "Arrière-plan Salon")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSimulatedChat(!showSimulatedChat)}
                    className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>{showSimulatedChat ? (lang === "ar" ? "إخفاء المحادثة" : "Masquer Chat") : (lang === "ar" ? "معاينة المحادثة" : "Simuler Chat")}</span>
                  </button>
                </div>
              </div>

              {/* Center Protected Zone with Simulated Chat (Demonstrating Contrast & Zero Clutter) */}
              {showSimulatedChat ? (
                <div className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 max-w-lg mx-auto w-full gap-2.5 animate-fade-in pointer-events-none">
                  {/* Simulated Incoming Teacher/Student Message */}
                  <div className="w-full bg-slate-900/90 border border-white/15 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-black flex items-center justify-center shrink-0">
                      S
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">SuperStudent Community</span>
                        <span className="text-[10px] text-slate-400">10:42</span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                        {lang === "ar"
                          ? "مرحبًا بكم في فضاء الباكالوريا! نلاحظ وضوح النصوص التام بفضل المنطقة الوسطى النقية والخالية من التشويش."
                          : "Zone centrale sombre et épurée garantissant une lisibilité parfaite des messages et équations."}
                      </p>
                    </div>
                  </div>

                  {/* Simulated Gemini AI response */}
                  <div className="w-full bg-indigo-950/80 border border-indigo-500/40 backdrop-blur-md p-3 rounded-2xl shadow-xl flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-black flex items-center justify-center shrink-0">
                      AI
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300">Gemini Academic Tutor</span>
                        <span className="text-[10px] text-indigo-400 font-mono">10:43</span>
                      </div>
                      <p className="text-xs text-indigo-100 mt-0.5 leading-relaxed">
                        {lang === "ar"
                          ? "تم الحفاظ على الزخارف الأكاديمية في الأركان والحواف لإعطاء طابع الفخامة والأناقة دون التأثير على التركيز."
                          : "Les éléments décoratifs sont situés aux angles et bordures pour une immersion académique haut de gamme."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-20 flex-1 flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md text-xs font-mono text-slate-300 border border-white/10">
                    {lang === "ar" ? "المنطقة الوسطى: هادئة ومنخفضة التفاصيل للتركيز الكامل" : "Zone Centrale : Faible détail & Contraste maximal"}
                  </span>
                </div>
              )}

              {/* Bottom Canvas Footer */}
              <div className="relative z-20 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: selectedBg.palette.primary }} />
                  <span className="font-bold text-white">{selectedBg.palette.name}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">16:9 UHD Vector Canvas</span>
              </div>
            </div>

            {/* Background Specification & Design Breakdown Card */}
            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info size={16} className="text-indigo-400" />
                    <span>{selectedBg.title[lang] || selectedBg.title.fr}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedBg.subtitle[lang] || selectedBg.subtitle.fr}
                  </p>
                </div>

                {onSelectBackground && (
                  <button
                    onClick={() => {
                      onSelectBackground(selectedBg.id);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md self-start sm:self-auto"
                  >
                    <Check size={14} />
                    <span>{lang === "ar" ? "تطبيق هذه الخلفية كخلفية افتراضية" : "Appliquer comme fond"}</span>
                  </button>
                )}
              </div>

              {/* Academic Motifs Tags */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  {lang === "ar" ? "العناصر والزخارف الأكاديمية المدمجة في الحواف والأركان:" : "Motifs académiques intégrés :"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBg.motifs.map((motif, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 text-xs font-medium border border-white/10"
                    >
                      {motif}
                    </span>
                  ))}
                </div>
              </div>

              {/* Design Intent note */}
              <div className="text-xs text-slate-300 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed">
                <span className="font-bold text-indigo-300 ml-1">
                  {lang === "ar" ? "الرؤية التصميمية:" : "Intention graphique :"}
                </span>
                {lang === "ar"
                  ? selectedBg.designIntent.ar
                  : lang === "fr"
                    ? selectedBg.designIntent.fr
                    : "A visual concept developed for this background."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
