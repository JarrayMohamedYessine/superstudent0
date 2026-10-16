import React, { useState, useMemo } from "react";
import { Calculator, Award, CheckCircle, RotateCcw, Info, Sparkles, TrendingUp } from "lucide-react";
import { LangKey } from "../types";
import { BRANCHES } from "../constants";

interface BacScoreCalculatorProps {
  lang: LangKey;
  isRTL?: boolean;
  userBranch?: string;
}

export function BacScoreCalculator({
  lang,
  isRTL = true,
  userBranch = "math",
}: BacScoreCalculatorProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>(userBranch);

  // Subject Grades
  const [grades, setGrades] = useState<Record<string, number>>({
    math: 15,
    physics: 14,
    svt: 13,
    tech: 14,
    algo: 15,
    tic: 16,
    eco: 14,
    gestion: 14,
    histoire_geo: 13,
    arabic: 12,
    french: 13,
    english: 14,
    philo: 11,
    sport: 16,
    option: 15,
  });

  const handleGradeChange = (key: string, val: number) => {
    setGrades((prev) => ({ ...prev, [key]: Math.min(20, Math.max(0, val)) }));
  };

  // Branch subject coefficients
  const branchConfig = useMemo(() => {
    switch (selectedBranch) {
      case "math":
        return {
          subjects: [
            { key: "math", name: "الرياضيات", coeff: 4 },
            { key: "physics", name: "العلوم الفيزيائية", coeff: 4 },
            { key: "french", name: "الفرنسية", coeff: 2 },
            { key: "english", name: "الإنقليزية", coeff: 2 },
            { key: "arabic", name: "العربية", coeff: 1 },
            { key: "philo", name: "الفلسفة", coeff: 1 },
            { key: "svt", name: "علوم الحياة والأرض", coeff: 1 },
            { key: "sport", name: "التربية البدنية", coeff: 1 },
          ],
          totalCoeff: 16,
        };
      case "science":
        return {
          subjects: [
            { key: "svt", name: "علوم الحياة والأرض", coeff: 4 },
            { key: "physics", name: "العلوم الفيزيائية", coeff: 4 },
            { key: "math", name: "الرياضيات", coeff: 3 },
            { key: "french", name: "الفرنسية", coeff: 2 },
            { key: "english", name: "الإنقليزية", coeff: 2 },
            { key: "arabic", name: "العربية", coeff: 1 },
            { key: "philo", name: "الفلسفة", coeff: 1 },
            { key: "sport", name: "التربية البدنية", coeff: 1 },
          ],
          totalCoeff: 18,
        };
      case "tech":
        return {
          subjects: [
            { key: "tech", name: "التكنولوجيا (الهندسة)", coeff: 4 },
            { key: "physics", name: "العلوم الفيزيائية", coeff: 4 },
            { key: "math", name: "الرياضيات", coeff: 3 },
            { key: "french", name: "الفرنسية", coeff: 2 },
            { key: "english", name: "الإنقليزية", coeff: 2 },
            { key: "arabic", name: "العربية", coeff: 1 },
            { key: "philo", name: "الفلسفة", coeff: 1 },
            { key: "sport", name: "التربية البدنية", coeff: 1 },
          ],
          totalCoeff: 18,
        };
      case "info":
        return {
          subjects: [
            { key: "algo", name: "الخوارزميات والبرمجة", coeff: 3 },
            { key: "math", name: "الرياضيات", coeff: 3 },
            { key: "tic", name: "قواعد البيانات و TIC", coeff: 2 },
            { key: "physics", name: "العلوم الفيزيائية", coeff: 2 },
            { key: "french", name: "الفرنسية", coeff: 2 },
            { key: "english", name: "الإنقليزية", coeff: 2 },
            { key: "arabic", name: "العربية", coeff: 1 },
            { key: "philo", name: "الفلسفة", coeff: 1 },
            { key: "sport", name: "التربية البدنية", coeff: 1 },
          ],
          totalCoeff: 17,
        };
      case "eco":
        return {
          subjects: [
            { key: "eco", name: "الإقتصاد", coeff: 3 },
            { key: "gestion", name: "التصرف المحاسبي والمالي", coeff: 3 },
            { key: "math", name: "الرياضيات", coeff: 2 },
            { key: "histoire_geo", name: "التاريخ والجغرافيا", coeff: 2 },
            { key: "french", name: "الفرنسية", coeff: 2 },
            { key: "english", name: "الإنقليزية", coeff: 2 },
            { key: "arabic", name: "العربية", coeff: 1 },
            { key: "philo", name: "الفلسفة", coeff: 1 },
            { key: "sport", name: "التربية البدنية", coeff: 1 },
          ],
          totalCoeff: 17,
        };
      case "lettres":
        return {
          subjects: [
            { key: "arabic", name: "اللغة والآداب العربية", coeff: 4 },
            { key: "philo", name: "الفلسفة", coeff: 4 },
            { key: "histoire_geo", name: "التاريخ والجغرافيا", coeff: 3 },
            { key: "french", name: "الفرنسية", coeff: 3 },
            { key: "english", name: "الإنقليزية", coeff: 3 },
            { key: "sport", name: "التربية البدنية", coeff: 1 },
          ],
          totalCoeff: 18,
        };
      case "sport":
        return {
          subjects: [
            { key: "sport", name: "التربية البدنية والرياضة", coeff: 4 },
            { key: "svt", name: "العلوم البيولوجية", coeff: 3 },
            { key: "physics", name: "العلوم الفيزيائية", coeff: 2 },
            { key: "french", name: "الفرنسية", coeff: 2 },
            { key: "english", name: "الإنقليزية", coeff: 2 },
            { key: "arabic", name: "العربية", coeff: 1 },
            { key: "philo", name: "الفلسفة", coeff: 1 },
          ],
          totalCoeff: 15,
        };
      default:
        return { subjects: [], totalCoeff: 1 };
    }
  }, [selectedBranch]);

  // Compute Bac average
  const calculatedAverage = useMemo(() => {
    let totalScore = 0;
    for (const sub of branchConfig.subjects) {
      const g = grades[sub.key] || 10;
      totalScore += g * sub.coeff;
    }
    return Math.round((totalScore / branchConfig.totalCoeff) * 100) / 100;
  }, [branchConfig, grades]);

  // Compute Base FG Score
  const calculatedFG = useMemo(() => {
    const moy = calculatedAverage;
    const m = grades.math || 10;
    const sp = grades.physics || 10;
    const svt = grades.svt || 10;
    const tec = grades.tech || 10;
    const inf = grades.algo || 10;
    const eco = grades.eco || 10;
    const ges = grades.gestion || 10;
    const ar = grades.arabic || 10;
    const fr = grades.french || 10;
    const ang = grades.english || 10;
    const phi = grades.philo || 10;

    switch (selectedBranch) {
      case "math":
        return 4 * moy + 1.5 * m + 1.5 * sp + 0.5 * fr + 0.5 * ang;
      case "science":
        return 4 * moy + 1 * m + 1.5 * sp + 1.5 * svt + 0.5 * fr + 0.5 * ang;
      case "tech":
        return 4 * moy + 1.5 * tec + 1.5 * sp + 1 * m + 0.5 * fr + 0.5 * ang;
      case "info":
        return 4 * moy + 1.5 * m + 1.5 * inf + 0.5 * sp + 0.5 * fr + 0.5 * ang;
      case "eco":
        return 4 * moy + 1.5 * eco + 1.5 * ges + 1 * m + 0.5 * fr + 0.5 * ang;
      case "lettres":
        return 4 * moy + 1.5 * ar + 1.5 * phi + 1 * fr + 1 * ang;
      default:
        return 4 * moy + m + sp + fr + ang;
    }
  }, [selectedBranch, calculatedAverage, grades]);

  const mention = useMemo(() => {
    if (calculatedAverage >= 16) return { text: "ممتاز (Très Bien)", color: "text-emerald-400" };
    if (calculatedAverage >= 14) return { text: "حسن جداً (Bien)", color: "text-indigo-400" };
    if (calculatedAverage >= 12) return { text: "حسن (Assez Bien)", color: "text-cyan-400" };
    if (calculatedAverage >= 10) return { text: "متوسط (Passable)", color: "text-amber-400" };
    return { text: "مؤجل أو دورة مراقبة", color: "text-rose-400" };
  }, [calculatedAverage]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white">
                {lang === "ar"
                  ? "حاسبة معدل الباكالوريا وسكور التوجيه الجامعي"
                  : "Calculateur de Moyenne et Score FG"}
              </h1>
              <p className="text-xs text-slate-400">
                {lang === "ar"
                  ? "حساب دقيق وفق المعاملات والصيغ الرسمية لوزارة التربية التونسية"
                  : "Calcul officiel selon les coefficients du Ministère de l'Éducation"}
              </p>
            </div>
          </div>
        </div>

        {/* Section Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-6">
          {Object.entries(BRANCHES).map(([bKey, bInfo]) => {
            const isSelected = selectedBranch === bKey;
            return (
              <button
                key={bKey}
                onClick={() => setSelectedBranch(bKey)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                }`}
              >
                {bInfo.name[lang] || bInfo.name.ar}
              </button>
            );
          })}
        </div>

        {/* Grades Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6">
          {branchConfig.subjects.map((sub) => (
            <div
              key={sub.key}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs font-bold text-slate-200">{sub.name}</div>
                <div className="text-[10px] text-slate-400">معامل: {sub.coeff}</div>
              </div>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                value={grades[sub.key] ?? 10}
                onChange={(e) => handleGradeChange(sub.key, parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-center font-bold text-white text-base focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Results Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800 mt-6">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-xs text-indigo-300 font-semibold mb-1">المعدل العام التقريبي</div>
            <div className="text-3xl font-black text-white">{calculatedAverage.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">من 20 نقطة</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-xs text-slate-300 font-semibold mb-1">الملاحظة والتقدير</div>
            <div className={`text-xl font-bold ${mention.color}`}>{mention.text}</div>
            <div className="text-xs text-slate-400 mt-1">
              {calculatedAverage >= 10 ? "ناجح في الدورة الرئيسية" : "مؤهل للمراقبة"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-950/80 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-xs text-cyan-300 font-semibold mb-1">السكور الإجمالي (FG)</div>
            <div className="text-3xl font-black text-cyan-400">{calculatedFG.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">سكور التوجيه الجامعي</div>
          </div>
        </div>

      </div>
    </div>
  );
}
