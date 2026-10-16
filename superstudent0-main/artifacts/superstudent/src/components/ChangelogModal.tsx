import React from "react";
import { History, Sparkles, Shield, Cpu, CheckCircle2, X, ArrowUpRight } from "lucide-react";
import { LangKey } from "../types";
import { PUBLIC_CHANGELOG } from "../services/communityFeaturesService";
import { GRAD_GOLD } from "../constants";

interface ChangelogModalProps {
  lang: LangKey;
  onClose: () => void;
}

export function ChangelogModal({ lang, onClose }: ChangelogModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="max-w-2xl w-full rounded-3xl p-6 shadow-2xl border relative overflow-hidden max-h-[85vh] flex flex-col"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(24, 32, 68, 0.95))",
          borderColor: "rgba(99, 102, 241, 0.35)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {lang === "ar" ? "سجل التحديثات والتطوير (Changelog)" : "Journal des Mises à Jour"}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  {lang === "ar" ? "أحدث إصدار v3.2" : "v3.2 Actif"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === "ar" ? "متابعة شفافة لكافة الميزات والتحسينات المضافة للمنصة" : "Historique des nouveautés et améliorations"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto flex-1 space-y-6 pr-1 bac-scroll">
          {PUBLIC_CHANGELOG.map((item) => (
            <div key={item.id} className="relative pl-6 rtl:pr-6 rtl:pl-0 border-l-2 rtl:border-r-2 rtl:border-l-0 border-indigo-500/40 space-y-2.5">
              {/* Dot */}
              <div className="absolute -left-[9px] rtl:-right-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-md" />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {item.version}
                </span>
                <span className="text-[11px] text-slate-400">{item.releaseDate}</span>
              </div>

              <h4 className="text-sm font-bold text-white">{typeof item.title === "object" ? (item.title as any)[lang] || item.title : item.title}</h4>

              <div className="space-y-1.5 pt-1">
                {item.highlights.map((h, i) => (
                  <div key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{typeof h === "object" ? (h as any)[lang] || h : h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>{lang === "ar" ? "تطوير مستمر تحت إشراف المنظومة التربوية" : "Développement continu"}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
          >
            {lang === "ar" ? "إغلاق" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
