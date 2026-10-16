import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  Calendar,
  Filter,
  Search,
  BookOpen,
  Award,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  Upload,
} from "lucide-react";
import { LangKey, ExamPaper, BacDocumentItem } from "../types";
import { BRANCHES, SUBJECTS } from "../constants";
import { getAllBacDocuments, openBacDocumentNativePdf, downloadDocumentFile, downloadCorrigeFile } from "../services/documentsService";

interface ExamsBankProps {
  lang: LangKey;
  isRTL?: boolean;
  userBranch?: string;
  onNavigateToDocuments?: () => void;
}

const DEFAULT_OFFICIAL_INDEX: ExamPaper[] = [
  // Math Branch
  {
    id: "m2025p",
    title: "امتحان الرياضيات - الدورة الرئيسية 2025",
    subject: "math",
    branch: "math",
    year: 2025,
    session: "principale",
    durationHours: 4,
    coefficient: 4,
  },
  {
    id: "m2025c",
    title: "امتحان الرياضيات - دورة المراقبة 2025",
    subject: "math",
    branch: "math",
    year: 2025,
    session: "controle",
    durationHours: 4,
    coefficient: 4,
  },
  {
    id: "p2025p",
    title: "امتحان العلوم الفيزيائية - الدورة الرئيسية 2025",
    subject: "physics",
    branch: "math",
    year: 2025,
    session: "principale",
    durationHours: 4,
    coefficient: 4,
  },
  {
    id: "m2024p",
    title: "امتحان الرياضيات - الدورة الرئيسية 2024",
    subject: "math",
    branch: "math",
    year: 2024,
    session: "principale",
    durationHours: 4,
    coefficient: 4,
  },

  // Sciences Branch
  {
    id: "svt2025p",
    title: "امتحان علوم الحياة والأرض - الدورة الرئيسية 2025",
    subject: "svt",
    branch: "science",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 4,
  },
  {
    id: "sc_phys2025p",
    title: "امتحان العلوم الفيزيائية - الدورة الرئيسية 2025",
    subject: "physics",
    branch: "science",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 4,
  },

  // Tech Branch
  {
    id: "tech2025p",
    title: "امتحان الهندسة الميكانيكية والكهربائية - الدورة الرئيسية 2025",
    subject: "tech",
    branch: "tech",
    year: 2025,
    session: "principale",
    durationHours: 4,
    coefficient: 4,
  },

  // Info Branch
  {
    id: "algo2025p",
    title: "امتحان الخوارزميات والبرمجة - الدورة الرئيسية 2025",
    subject: "algo",
    branch: "info",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 3,
  },
  {
    id: "tic2025p",
    title: "امتحان تكنولوجيات المعلومات والاتصال (TIC) 2025",
    subject: "tic",
    branch: "info",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 2,
  },

  // Eco Branch
  {
    id: "eco2025p",
    title: "امتحان الإقتصاد - الدورة الرئيسية 2025",
    subject: "eco",
    branch: "eco",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 3,
  },
  {
    id: "ges2025p",
    title: "امتحان التصرف - الدورة الرئيسية 2025",
    subject: "gestion",
    branch: "eco",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 3,
  },

  // Lettres Branch
  {
    id: "ar2025p",
    title: "امتحان العربية - الدورة الرئيسية 2025",
    subject: "arabic",
    branch: "lettres",
    year: 2025,
    session: "principale",
    durationHours: 3,
    coefficient: 4,
  },
  {
    id: "phi2025p",
    title: "امتحان الفلسفة - الدورة الرئيسية 2025",
    subject: "philo",
    branch: "lettres",
    year: 2025,
    session: "principale",
    durationHours: 4,
    coefficient: 4,
  },
];

export function ExamsBank({
  lang,
  isRTL = true,
  userBranch = "math",
  onNavigateToDocuments,
}: ExamsBankProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>(userBranch);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [realUploadedDocs, setRealUploadedDocs] = useState<BacDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerDoc, setReaderDoc] = useState<BacDocumentItem | null>(null);
  const [readerTab, setReaderTab] = useState<"exam" | "corrige">("exam");

  function handleDirectView(exam: any, isCorrige = false, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetDoc: BacDocumentItem = exam.rawDoc || {
      id: exam.id || `exam_${Date.now()}`,
      title: exam.title,
      subjectId: exam.subject || "math",
      branchIds: exam.branch && exam.branch !== "all" ? [exam.branch] : ["math"],
      type: "examen",
      trimestre: "all",
      hasCorrige: !!(exam.corrigePdfDataUrl || exam.correctionPdfUrl),
      fileSize: "1.8 MB",
      pdfUrl: exam.pdfUrl,
      pdfDataUrl: exam.pdfDataUrl,
      corrigePdfUrl: exam.correctionPdfUrl,
      corrigePdfDataUrl: exam.corrigePdfDataUrl,
      authorName: lang === "ar" ? "وزارة التربية التونسية" : "Ministère de l'Éducation",
      authorRole: "superadmin",
      createdAt: Date.now(),
      downloadCount: 150,
      year: exam.year || 2025,
      contentSnippet: `امتحان البكالوريا الرسمي - جمهورية تونس وزارة التربية
المادة: ${exam.subject?.toUpperCase() || "الرياضيات"}
الدورة: ${exam.session === "principale" ? "الرئيسية" : "المراقبة"} ${exam.year || 2025}
المعامل: ${exam.coefficient || 4} | المدة: ${exam.durationHours || 3} ساعات`,
    };

    openBacDocumentNativePdf(targetDoc, isCorrige, e);
  }

  useEffect(() => {
    let mounted = true;
    getAllBacDocuments()
      .then((docs) => {
        if (mounted) {
          setRealUploadedDocs(docs || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Merge uploaded documents that are exams with the official index
  const allExams = useMemo(() => {
    const list: (ExamPaper & {
      rawDoc?: BacDocumentItem;
      pdfDataUrl?: string;
      corrigePdfDataUrl?: string;
    })[] = [];

    // 1. First add real uploaded documents from the database
    realUploadedDocs.forEach((d) => {
      list.push({
        id: d.id,
        title: d.title,
        subject: d.subjectId,
        branch: (d.branchIds && d.branchIds[0]) || "math",
        year: d.year || 2025,
        session: d.trimestre === "t3" ? "controle" : "principale",
        pdfUrl: d.pdfUrl,
        pdfDataUrl: d.pdfDataUrl,
        correctionPdfUrl: d.corrigePdfUrl,
        corrigePdfDataUrl: d.corrigePdfDataUrl,
        durationHours: 3,
        coefficient: 4,
        rawDoc: d,
      });
    });

    // 2. Add catalog index items if not already present
    DEFAULT_OFFICIAL_INDEX.forEach((item) => {
      const alreadyHas = list.some(
        (e) =>
          e.subject === item.subject &&
          e.branch === item.branch &&
          e.year === item.year &&
          e.session === item.session
      );
      if (!alreadyHas) {
        list.push(item);
      }
    });

    return list;
  }, [realUploadedDocs]);

  const filteredExams = useMemo(() => {
    return allExams.filter((exam) => {
      if (selectedBranch !== "all" && exam.branch !== selectedBranch) return false;
      if (selectedSubject !== "all" && exam.subject !== selectedSubject) return false;
      if (selectedYear !== "all" && exam.year.toString() !== selectedYear) return false;
      if (selectedSession !== "all" && exam.session !== selectedSession) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return exam.title.toLowerCase().includes(q) || exam.subject.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allExams, selectedBranch, selectedSubject, selectedYear, selectedSession, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {lang === "ar"
                  ? "الأرشيف الرسمي لامتحانات الباكالوريا التونسية"
                  : "Annales Officielles du Baccalauréat Tunisien"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {lang === "ar"
                ? "بنك الامتحانات والإصلاحات النموذجية 2015 - 2025"
                : "Banque des Épreuves & Corrections Modèles"}
            </h1>
            <p className="text-sm text-slate-300">
              {lang === "ar"
                ? "امتحانات وطنية مصحوبة بسلم التقييم والتوجيهات المنهجية لجميع الشعب والمواد."
                : "Sujets d'examen officiels avec barèmes et corrections pour toutes les sections."}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-indigo-400">10+</div>
              <div className="text-xs text-slate-400">سنوات أرشيف</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-2xl font-black text-emerald-400">7</div>
              <div className="text-xs text-slate-400">شعب كاملة</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-2xl font-black text-amber-400">100%</div>
              <div className="text-xs text-slate-400">رسمي ومجاني</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Branch tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBranch("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              selectedBranch === "all"
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            {lang === "ar" ? "جميع الشعب" : "Toutes les sections"}
          </button>
          {Object.entries(BRANCHES).map(([bKey, bInfo]) => (
            <button
              key={bKey}
              onClick={() => setSelectedBranch(bKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                selectedBranch === bKey
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              {bInfo.name[lang] || bInfo.name.ar}
            </button>
          ))}
        </div>

        {/* Search & Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute top-3 left-3 text-slate-500" />
            <input
              type="text"
              placeholder={lang === "ar" ? "بحث عن امتحان..." : "Rechercher une épreuve..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-9 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{lang === "ar" ? "كل السنوات" : "Toutes les années"}</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
          </select>

          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{lang === "ar" ? "كل الدورات" : "Toutes les sessions"}</option>
            <option value="principale">
              {lang === "ar" ? "الدورة الرئيسية" : "Session Principale"}
            </option>
            <option value="controle">
              {lang === "ar" ? "دورة المراقبة" : "Session de Contrôle"}
            </option>
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">{lang === "ar" ? "كل المواد" : "Toutes les matières"}</option>
            {Object.entries(SUBJECTS).map(([sKey, sItem]) => (
              <option key={sKey} value={sKey}>
                {sItem.name[lang] || sItem.name.ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    exam.session === "principale"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {exam.session === "principale" ? "دورة رئيسية" : "دورة مراقبة"} - {exam.year}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  معامل {exam.coefficient} | {exam.durationHours} ساعات
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-snug">{exam.title}</h3>
              <p className="text-xs text-slate-400">
                الشعبة: {BRANCHES.find((branch) => branch.id === exam.branch)?.name[lang] || exam.branch}
              </p>

              {/* Publisher / Certification Source Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">
                    🏛️
                  </div>
                  <span className="font-bold text-slate-300">
                    {lang === "ar" ? "وزارة التربية التونسية" : "Ministère de l'Éducation"}
                  </span>
                </div>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ {lang === "ar" ? "رسمي معتمد" : "Certifié"}
                </span>
              </div>
            </div>

            {/* Actions: Direct View & Direct Download */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              {(() => {
                const targetDoc: BacDocumentItem = exam.rawDoc || {
                  id: exam.id || `exam_${Date.now()}`,
                  title: exam.title,
                  subjectId: exam.subject || "math",
                  branchIds: exam.branch && exam.branch !== "all" ? [exam.branch] : ["math"],
                  type: "examen",
                  trimestre: "all",
                  hasCorrige: Boolean(exam.corrigePdfDataUrl || exam.correctionPdfUrl),
                  fileSize: "1.8 MB",
                  pdfUrl: exam.pdfUrl,
                  pdfDataUrl: exam.pdfDataUrl,
                  corrigePdfUrl: exam.correctionPdfUrl,
                  corrigePdfDataUrl: exam.corrigePdfDataUrl,
                  authorName: lang === "ar" ? "وزارة التربية التونسية" : "Ministère de l'Éducation",
                  authorRole: "superadmin",
                  createdAt: Date.now(),
                  downloadCount: 150,
                  year: exam.year || 2025,
                  contentSnippet: `امتحان البكالوريا الرسمي - جمهورية تونس وزارة التربية
المادة: ${exam.subject?.toUpperCase() || "الرياضيات"}
الدورة: ${exam.session === "principale" ? "الرئيسية" : "المراقبة"} ${exam.year || 2025}
المعامل: ${exam.coefficient || 4} | المدة: ${exam.durationHours || 3} ساعات`,
                };

                return (
                  <>
                    {/* File 1: Sujet (Direct View + Direct Download) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDirectView(exam, false, e)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/40 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                        title={lang === "ar" ? "مشاهدة وقراءة نص الامتحان" : "Voir le sujet"}
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{lang === "ar" ? "مشاهدة الامتحان" : "Voir Sujet"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDocumentFile(targetDoc);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow active:scale-95 cursor-pointer"
                        title={lang === "ar" ? "تحميل نص الامتحان مباشرة PDF" : "Télécharger le sujet"}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{lang === "ar" ? "تحميل الامتحان" : "Télécharger"}</span>
                      </button>
                    </div>

                    {/* File 2: Corrigé (Direct View + Direct Download) if available */}
                    {(exam.corrigePdfDataUrl || exam.correctionPdfUrl || targetDoc.hasCorrige) && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDirectView(exam, true, e)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-200 text-xs font-bold rounded-xl transition-all border border-emerald-500/40 shadow-sm active:scale-95 cursor-pointer"
                          title={lang === "ar" ? "مشاهدة وقراءة الإصلاح" : "Voir le corrigé"}
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{lang === "ar" ? "مشاهدة الإصلاح" : "Voir Corrigé"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadCorrigeFile(targetDoc);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl transition-all shadow active:scale-95 cursor-pointer"
                          title={lang === "ar" ? "تحميل الإصلاح النموذجي مباشرة PDF" : "Télécharger le corrigé"}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{lang === "ar" ? "تحميل الإصلاح" : "Télécharger"}</span>
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
