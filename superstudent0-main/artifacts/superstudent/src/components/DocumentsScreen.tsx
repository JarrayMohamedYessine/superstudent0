import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  AlertTriangle,
  PlusCircle,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  GraduationCap,
  Award,
  Trash2,
  Share2,
  Printer,
  Copy,
  CheckCircle2,
  FileCheck,
  Upload,
  ExternalLink,
} from "lucide-react";
import {
  Account,
  BacDocumentItem,
  DocumentType,
  LangKey,
  TrimestreKey,
  CorrigeStatus,
} from "../types";
import {
  BRANCHES,
  COLORS,
  GRAD,
  GRAD_GOLD,
  GRAD_EMERALD,
  SUBJECTS,
  T,
  canUserPublishDocuments,
} from "../constants";
import {
  getAllBacDocuments,
  publishBacDocument,
  deleteBacDocument,
  incrementDocDownload,
  getBookmarkedDocIds,
  toggleDocBookmark,
  downloadDocumentFile,
  downloadCorrigeFile,
  downloadBothDocumentFiles,
  openBacDocumentNativePdf,
} from "../services/documentsService";
import { TopBar, Avatar, Chip, FieldShell, PrimaryButton, Spinner } from "./Atoms";

interface DocumentsScreenProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  onRequireAuth: () => void;
  onOpenContribute?: () => void;
  onSelectForAi?: (docTitle: string, docSnippet: string) => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

const DOCUMENT_TYPES: { id: DocumentType; label: Record<LangKey, string>; color: string; bg: string }[] = [
  { id: "serie", label: { ar: "سلسلة تمارين", fr: "Série", en: "Exercise Sheet" }, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
  { id: "resume", label: { ar: "تلخيص / ملخص", fr: "Résumé", en: "Summary" }, color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
  { id: "devoir", label: { ar: "فرض مراقبة / تأليفي", fr: "Devoir", en: "Exam Paper" }, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)" },
  { id: "examen", label: { ar: "امتحان وطني", fr: "Examen", en: "National Exam" }, color: "#EC4899", bg: "rgba(236, 72, 153, 0.15)" },
  { id: "cours", label: { ar: "درس كامل", fr: "Cours", en: "Course" }, color: "#06B6D4", bg: "rgba(6, 182, 212, 0.15)" },
  { id: "correction", label: { ar: "إصلاح", fr: "Correction", en: "Solution" }, color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" },
];

const TRIMESTRES: { id: TrimestreKey; label: Record<LangKey, string> }[] = [
  { id: "all", label: { ar: "كامل السنة", fr: "Toute l'année", en: "Full Year" } },
  { id: "t1", label: { ar: "الثلاثي الأول", fr: "1er Trimestre", en: "1st Term" } },
  { id: "t2", label: { ar: "الثلاثي الثاني", fr: "2ème Trimestre", en: "2nd Term" } },
  { id: "t3", label: { ar: "الثلاثي الثالث", fr: "3ème Trimestre", en: "3rd Term" } },
];

export function DocumentsScreen({
  lang,
  isRTL,
  user,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onRequireAuth,
  onOpenContribute,
  onSelectForAi,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: DocumentsScreenProps) {
  const t = T[lang];
  const [documents, setDocuments] = useState<BacDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "alpha" | "oldest">("recent");

  // Filters State
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);
  const [selectedCorrige, setSelectedCorrige] = useState<CorrigeStatus>("all");
  const [selectedTrimestre, setSelectedTrimestre] = useState<TrimestreKey>("all");
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  // Accordion Expand / Collapse (Default closed as requested)
  const [expandedSections, setExpandedSections] = useState({
    section: false,
    matiere: false,
    type: false,
    corrige: false,
    trimestre: false,
  });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [readerDoc, setReaderDoc] = useState<BacDocumentItem | null>(null);
  const [readerTab, setReaderTab] = useState<"exam" | "corrige">("exam");

  // Document In-App Delete Confirmation & Toast State
  const [docToDelete, setDocToDelete] = useState<BacDocumentItem | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [deleteToast, setDeleteToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add Document Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("physique");
  const [newBranches, setNewBranches] = useState<string[]>(["sciexp", "math"]);
  const [newType, setNewType] = useState<DocumentType>("resume");
  const [newTrimestre, setNewTrimestre] = useState<TrimestreKey>("t1");
  const [newHasCorrige, setNewHasCorrige] = useState(true);
  const [newSnippet, setNewSnippet] = useState("");
  const [newPdfFile, setNewPdfFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [newCorrigePdfFile, setNewCorrigePdfFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [isUploadingCorrige, setIsUploadingCorrige] = useState(false);
  const [corrigeUploadProgress, setCorrigeUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const canPublish = canUserPublishDocuments(user);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const docs = await getAllBacDocuments();
      const bookmarks = await getBookmarkedDocIds();
      setDocuments(docs);
      setBookmarkedIds(bookmarks);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered & Sorted documents
  const filteredDocs = useMemo(() => {
    let result = documents.filter((doc) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchSnippet = doc.contentSnippet?.toLowerCase().includes(q);
        const matchSubj = doc.subjectId.toLowerCase().includes(q);
        const subjName = SUBJECTS[doc.subjectId]?.name[lang]?.toLowerCase() || "";
        const matchSubjName = subjName.includes(q);
        if (!matchTitle && !matchSnippet && !matchSubj && !matchSubjName) return false;
      }

      // Branch filter
      if (selectedBranches.length > 0) {
        const hasBranch = doc.branchIds.some((b) => selectedBranches.includes(b));
        if (!hasBranch) return false;
      }

      // Subject filter
      if (selectedSubjects.length > 0) {
        if (!selectedSubjects.includes(doc.subjectId)) return false;
      }

      // Type filter
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(doc.type)) return false;
      }

      // Corrige filter
      if (selectedCorrige === "with" && !doc.hasCorrige) return false;
      if (selectedCorrige === "without" && doc.hasCorrige) return false;

      // Trimestre filter
      if (selectedTrimestre !== "all" && doc.trimestre !== "all" && doc.trimestre !== selectedTrimestre) {
        return false;
      }

      // Bookmarks filter
      if (onlyBookmarks && !bookmarkedIds.includes(doc.id)) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === "recent") {
      result.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortBy === "alpha") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => a.createdAt - b.createdAt);
    }

    return result;
  }, [
    documents,
    searchQuery,
    selectedBranches,
    selectedSubjects,
    selectedTypes,
    selectedCorrige,
    selectedTrimestre,
    onlyBookmarks,
    bookmarkedIds,
    sortBy,
    lang,
  ]);

  const activeFiltersCount =
    selectedBranches.length +
    selectedSubjects.length +
    selectedTypes.length +
    (selectedCorrige !== "all" ? 1 : 0) +
    (selectedTrimestre !== "all" ? 1 : 0) +
    (onlyBookmarks ? 1 : 0);

  function clearAllFilters() {
    setSelectedBranches([]);
    setSelectedSubjects([]);
    setSelectedTypes([]);
    setSelectedCorrige("all");
    setSelectedTrimestre("all");
    setOnlyBookmarks(false);
    setSearchQuery("");
  }

  async function handleBookmarkClick(docId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = await toggleDocBookmark(docId);
    setBookmarkedIds(updated);
  }

  async function handleDownloadClick(doc: BacDocumentItem, e: React.MouseEvent) {
    e.stopPropagation();
    await incrementDocDownload(doc.id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d))
    );
    downloadDocumentFile(doc);
  }

  function getPdfViewerUrl(docId: string, tab: "exam" | "corrige" = "exam") {
    return `/?pdf_doc=${encodeURIComponent(docId)}&pdf_tab=${tab}`;
  }

  function handleDirectView(doc: BacDocumentItem, isCorrige = false, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    openBacDocumentNativePdf(doc, isCorrige, e);
  }

  async function handleDownloadCorrigeClick(doc: BacDocumentItem, e: React.MouseEvent) {
    e.stopPropagation();
    await incrementDocDownload(doc.id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d))
    );
    downloadCorrigeFile(doc);
  }

  async function handleDownloadBothClick(doc: BacDocumentItem, e: React.MouseEvent) {
    e.stopPropagation();
    await incrementDocDownload(doc.id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 2 } : d))
    );
    downloadBothDocumentFiles(doc);
  }

  useEffect(() => {
    if (!deleteToast) return;
    const timer = setTimeout(() => setDeleteToast(null), 4000);
    return () => clearTimeout(timer);
  }, [deleteToast]);

  function handleDeleteClick(doc: BacDocumentItem, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setDocToDelete(doc);
  }

  async function handleConfirmDelete() {
    if (!docToDelete) return;
    setIsDeletingDoc(true);
    try {
      const res = await deleteBacDocument(docToDelete.id, user || undefined);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
        setDeleteToast({
          message:
            lang === "ar"
              ? `تم حذف وثيقة «${docToDelete.title}» بنجاح من الأرشيف.`
              : lang === "fr"
              ? `Document « ${docToDelete.title} » supprimé de l’archive.`
              : `Document "${docToDelete.title}" deleted from archive.`,
          type: "success",
        });
        setDocToDelete(null);
      } else {
        setDeleteToast({
          message:
            res.error ||
            (lang === "ar"
              ? "تعذر حذف الوثيقة من الأرشيف."
              : lang === "fr"
              ? "Impossible de supprimer le document."
              : "Could not delete the document."),
          type: "error",
        });
      }
    } catch {
      setDeleteToast({
        message:
          lang === "ar"
            ? "حدث خطأ أثناء محاولة حذف الوثيقة."
            : "Error occurred while deleting document.",
        type: "error",
      });
    } finally {
      setIsDeletingDoc(false);
    }
  }

  function isPdfFile(file: File): boolean {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      alert(lang === "ar" ? "عذراً، يُسمح برفع ملفات PDF فقط (.pdf)" : lang === "fr" ? "Seuls les fichiers PDF sont autorisés (.pdf)" : "Only PDF files are allowed (.pdf)");
      e.target.value = "";
      return;
    }
    // 25 MB max limit
    if (file.size > 25 * 1024 * 1024) {
      alert(lang === "ar" ? "حجم ملف الاختبار يتجاوز 25 ميغابايت." : lang === "fr" ? "Le fichier dépasse 25 Mo." : "The exam file exceeds 25 MB.");
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadProgress(8);
    setNewPdfFile(null);

    const reader = new FileReader();
    reader.onload = () => {
      const resultDataUrl = reader.result as string;
      const szMB = (file.size / (1024 * 1024)).toFixed(1);
      const displaySize = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${szMB} MB`;

      // Realistic duration proportional to file size: e.g. 12 MB takes ~5.5s
      const totalDurationMs = Math.min(8000, Math.max(3000, Math.round((file.size / (1024 * 1024)) * 450)));
      const intervalMs = 100;
      const stepIncrement = 100 / (totalDurationMs / intervalMs);
      let currentProgress = 8;

      const timer = setInterval(() => {
        currentProgress += stepIncrement + (Math.random() * 1.5);
        if (currentProgress >= 100) {
          clearInterval(timer);
          setPdfUploadProgress(100);
          setIsUploadingPdf(false);
          setNewPdfFile({
            name: file.name,
            size: displaySize,
            dataUrl: resultDataUrl,
          });
          if (!newTitle) {
            setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
          }
        } else {
          setPdfUploadProgress(Math.min(99, Math.round(currentProgress)));
        }
      }, intervalMs);
    };
    reader.readAsDataURL(file);
  }

  function handleCorrigeFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      alert(lang === "ar" ? "عذراً، يُسمح برفع ملفات PDF فقط (.pdf)" : lang === "fr" ? "Seuls les fichiers PDF sont autorisés (.pdf)" : "Only PDF files are allowed (.pdf)");
      e.target.value = "";
      return;
    }
    // 25 MB max limit
    if (file.size > 25 * 1024 * 1024) {
      alert(lang === "ar" ? "حجم ملف الإصلاح يتجاوز 25 ميغابايت." : lang === "fr" ? "Le corrigé dépasse 25 Mo." : "The solution file exceeds 25 MB.");
      return;
    }

    setIsUploadingCorrige(true);
    setCorrigeUploadProgress(8);
    setNewCorrigePdfFile(null);

    const reader = new FileReader();
    reader.onload = () => {
      const resultDataUrl = reader.result as string;
      const szMB = (file.size / (1024 * 1024)).toFixed(1);
      const displaySize = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${szMB} MB`;

      // Realistic duration proportional to file size
      const totalDurationMs = Math.min(8000, Math.max(3000, Math.round((file.size / (1024 * 1024)) * 450)));
      const intervalMs = 100;
      const stepIncrement = 100 / (totalDurationMs / intervalMs);
      let currentProgress = 8;

      const timer = setInterval(() => {
        currentProgress += stepIncrement + (Math.random() * 1.5);
        if (currentProgress >= 100) {
          clearInterval(timer);
          setCorrigeUploadProgress(100);
          setIsUploadingCorrige(false);
          setNewCorrigePdfFile({
            name: file.name,
            size: displaySize,
            dataUrl: resultDataUrl,
          });
          setNewHasCorrige(true);
        } else {
          setCorrigeUploadProgress(Math.min(99, Math.round(currentProgress)));
        }
      }, intervalMs);
    };
    reader.readAsDataURL(file);
  }

  async function handleAddDocumentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!newTitle.trim()) {
      setFormError(lang === "ar" ? "يرجى كتابة عنوان الوثيقة." : lang === "fr" ? "Saisissez le titre du document." : "Enter a document title.");
      return;
    }
    if (newBranches.length === 0) {
      setFormError(lang === "ar" ? "يرجى اختيار شعبة واحدة على الأقل." : lang === "fr" ? "Sélectionnez au moins une filière." : "Select at least one study track.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    // Memory-only publish: the PDF stays as a data URL in the in-memory vault,
    // no remote storage service of any kind is used.
    const isSummaryOrCourse = newType === "resume" || newType === "cours" || newType === "correction";
    const finalHasCorrige = isSummaryOrCourse ? false : (newHasCorrige && !!newCorrigePdfFile);
    const finalCorrigePdfDataUrl = (!isSummaryOrCourse && newHasCorrige) ? newCorrigePdfFile?.dataUrl : undefined;
    const finalCorrigeFileName = (!isSummaryOrCourse && newHasCorrige) ? newCorrigePdfFile?.name : undefined;
    const finalCorrigeFileSize = (!isSummaryOrCourse && newHasCorrige) ? newCorrigePdfFile?.size : undefined;

    const res = await publishBacDocument(
      {
        title: newTitle.trim(),
        subjectId: newSubject,
        branchIds: newBranches,
        type: newType,
        trimestre: newTrimestre,
        hasCorrige: finalHasCorrige,
        fileSize: newPdfFile?.size || "75 KB",
        pdfUrl: newPdfFile?.dataUrl,
        pdfDataUrl: newPdfFile?.dataUrl,
        examFileName: newPdfFile?.name,
        corrigePdfUrl: finalCorrigePdfDataUrl,
        corrigePdfDataUrl: finalCorrigePdfDataUrl,
        corrigeFileName: finalCorrigeFileName,
        corrigeFileSize: finalCorrigeFileSize,
        contentSnippet: newSnippet.trim() || undefined,
        year: 2026,
      },
      user
    );

    setSubmitting(false);

    if (res.success && res.document) {
      setDocuments((prev) => [res.document!, ...prev]);
      setShowAddModal(false);
      // Reset form
      setNewTitle("");
      setNewSnippet("");
      setNewPdfFile(null);
      setNewCorrigePdfFile(null);
    } else {
      setFormError(res.error || "Erreur lors de la publication");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }

  return (
    <div className="w-full flex flex-col min-h-screen bac-in pb-16">
      {/* Top Bar Header */}
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={lang === "ar" ? "بنك الوثائق والامتحانات" : lang === "fr" ? "Documents et sujets" : "Documents and exam papers"}
        subtitle={lang === "ar" ? "فروض وامتحانات وملخصات حسب المواد والشعب" : lang === "fr" ? "Devoirs, sujets et fiches classés par matière" : "Assignments, exam papers, and notes by subject"}
        accent="linear-gradient(90deg, #10B981 0%, #06B6D4 50%, #6366F1 100%)"
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenSettings={onOpenSettings}
        onRequireAuth={onRequireAuth}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-5 space-y-6">
        {/* Hero Section (Matching Screenshot) */}
        <div
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-white/10"
          style={{
            background: "linear-gradient(135deg, #0A1128 0%, #151D3B 50%, #0F172A 100%)",
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
                <Sparkles size={13} className="text-emerald-400" />
                {lang === "ar" ? "وثائق للمراجعة" : lang === "fr" ? "Documents de révision" : "Study documents"}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {lang === "ar" ? "بنك الوثائق والامتحانات" : lang === "fr" ? "Documents et sujets" : "Documents and exam papers"}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {lang === "ar"
                  ? "تصفح الوثائق والملخصات والامتحانات والتمارين المتاحة لمواد شعب الباكالوريا التونسية."
                  : lang === "fr" ? "Consultez les documents, fiches, sujets et exercices disponibles pour les filières du baccalauréat tunisien."
                  : "Browse available documents, notes, exam papers, and exercises for Tunisian Baccalaureate study tracks."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {canPublish ? (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  style={{ background: GRAD_GOLD }}
                >
                  <PlusCircle size={18} className="text-slate-950 font-black" />
                  <span>{lang === "ar" ? "نشر وثيقة جديدة" : lang === "fr" ? "Ajouter un document" : "Add a document"}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onOpenContribute) {
                      onOpenContribute();
                    } else if (!user) {
                      onRequireAuth();
                    } else {
                      alert(
                        lang === "ar"
                          ? "يمكن للمشرفين والمساهمين المعتمدين نشر الوثائق. تواصل مع الإدارة لمعرفة كيفية المساهمة."
                          : lang === "fr" ? "La publication est réservée aux modérateurs et contributeurs autorisés. Contactez l’administration pour en savoir plus."
                          : "Document publishing is limited to moderators and approved contributors. Contact the team to learn how to contribute."
                      );
                    }
                  }}
                  className="px-4 py-2.5 rounded-2xl font-semibold text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all hover:bg-amber-500/20 cursor-pointer"
                >
                  <Award size={16} />
                  <span>{lang === "ar" ? "طلب المساهمة في المنصة" : lang === "fr" ? "Proposer sa contribution" : "Apply to contribute"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Legal & Copyright Warning Notice for all Students & Professors - Only shown to users who can publish */}
        {canUserPublishDocuments(user) && (
          <div
            className="p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 backdrop-blur-md shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.85))",
              borderColor: "rgba(239, 68, 68, 0.4)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black text-red-300 flex items-center gap-2">
                <span>{lang === "ar" ? "ملاحظة للمساهمين في بنك الوثائق:" : lang === "fr" ? "Information aux contributeurs :" : "Note for document contributors:"}</span>
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {lang === "ar"
                  ? "لا ترفع ملفات لا تملك حق مشاركتها. تُراجع الوثائق المنشورة وفق قواعد المنصة."
                  : lang === "fr" ? "Ne publiez pas de fichiers que vous n’êtes pas autorisé à partager. Les documents sont soumis aux règles de la plateforme."
                  : "Do not upload files you are not allowed to share. Published documents are subject to the platform rules."}
              </p>
            </div>
          </div>
        )}

        {/* Search, Layout Switcher & Sort Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0F172A]/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-md">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "ar" ? "ابحث عن وثيقة، درس أو فرض..." : lang === "fr" ? "Rechercher un document, un cours ou un devoir…" : "Search documents, lessons, or assignments…"}
              className="w-full bg-[#1E293B] text-white placeholder-slate-400 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Controls Right */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
            {/* Toggle Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showFilters
                  ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                  : "bg-[#1E293B] text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <Filter size={15} />
              <span>
                {showFilters
                  ? lang === "ar"
                    ? "إخفاء الفلاتر"
                    : lang === "fr" ? "Masquer les filtres" : "Hide filters"
                  : lang === "ar"
                  ? "إظهار الفلاتر"
                  : lang === "fr" ? "Afficher les filtres" : "Show filters"}
              </span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#1E293B] text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer pr-7"
              >
                <option value="recent">{lang === "ar" ? "الأحدث نشرًا" : lang === "fr" ? "Plus récents" : "Newest"}</option>
                <option value="popular">{lang === "ar" ? "الأكثر تحميلاً" : lang === "fr" ? "Plus téléchargés" : "Most downloaded"}</option>
                <option value="alpha">{lang === "ar" ? "الاسم (أ - ي)" : lang === "fr" ? "Nom (A-Z)" : "Name (A–Z)"}</option>
                <option value="oldest">{lang === "ar" ? "الأقدم" : lang === "fr" ? "Plus anciens" : "Oldest"}</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#1E293B] p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode("grid")}
                title={lang === "ar" ? "عرض البطاقات" : lang === "fr" ? "Vue en grille" : "Grid view"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title={lang === "ar" ? "عرض القائمة" : lang === "fr" ? "Vue en liste" : "List view"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Row */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400">
              {lang === "ar" ? "الفلاتر النشطة:" : lang === "fr" ? "Filtres actifs :" : "Active filters:"}
            </span>

            {selectedBranches.map((bId) => {
              const b = BRANCHES.find((item) => item.id === bId);
              return (
                <span
                  key={bId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  {b?.name[lang] || bId}
                  <button
                    onClick={() => setSelectedBranches(selectedBranches.filter((id) => id !== bId))}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            {selectedSubjects.map((sId) => {
              const s = SUBJECTS[sId];
              return (
                <span
                  key={sId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"
                >
                  {s?.name[lang] || sId}
                  <button
                    onClick={() => setSelectedSubjects(selectedSubjects.filter((id) => id !== sId))}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            {selectedTypes.map((tId) => {
              const tItem = DOCUMENT_TYPES.find((item) => item.id === tId);
              return (
                <span
                  key={tId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  {tItem?.label[lang] || tId}
                  <button
                    onClick={() => setSelectedTypes(selectedTypes.filter((id) => id !== tId))}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            {selectedCorrige !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedCorrige === "with" ? (lang === "ar" ? "مع الإصلاح" : lang === "fr" ? "Avec corrigé" : "With solution") : (lang === "ar" ? "بدون إصلاح" : lang === "fr" ? "Sans corrigé" : "Without solution")}
                <button onClick={() => setSelectedCorrige("all")} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedTrimestre !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {TRIMESTRES.find((tr) => tr.id === selectedTrimestre)?.label[lang]}
                <button onClick={() => setSelectedTrimestre("all")} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}

            {onlyBookmarks && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                {lang === "ar" ? "المفضلة فقط" : lang === "fr" ? "Favoris uniquement" : "Favorites only"}
                <button onClick={() => setOnlyBookmarks(false)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
            >
              {lang === "ar" ? "مسح الكل" : lang === "fr" ? "Tout effacer" : "Clear all"}
            </button>
          </div>
        )}

        {/* Main Content Layout: Filters Sidebar + Documents Grid/List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Filters Accordion Sidebar (Static In-Flow) */}
          {showFilters && (
            <div className="lg:col-span-1 bg-[#0F172A] p-4 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Filter size={17} className="text-indigo-400" />
                  <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                    {lang === "ar" ? "تصفية الوثائق" : lang === "fr" ? "FILTRES" : "FILTERS"}
                  </span>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                  >
                    {lang === "ar" ? "إعادة ضبط" : lang === "fr" ? "Réinitialiser" : "Reset"}
                  </button>
                )}
              </div>

              {/* SECTION Accordion */}
              <div className="border-b border-slate-800 pb-3">
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, section: !prev.section }))
                  }
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white py-1 cursor-pointer"
                >
                  <span className="uppercase tracking-wider">
                    {lang === "ar" ? "الشعبة" : lang === "fr" ? "FILIÈRE" : "STUDY TRACK"}
                  </span>
                  {expandedSections.section ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {expandedSections.section && (
                  <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto pr-1 bac-scroll">
                    {BRANCHES.map((branch) => {
                      const checked = selectedBranches.includes(branch.id);
                      return (
                        <label
                          key={branch.id}
                          className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer py-0.5 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) setSelectedBranches(selectedBranches.filter((id) => id !== branch.id));
                              else setSelectedBranches([...selectedBranches, branch.id]);
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                          />
                          <span>{branch.name[lang]}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MATIÈRE Accordion */}
              <div className="border-b border-slate-800 pb-3">
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, matiere: !prev.matiere }))
                  }
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white py-1 cursor-pointer"
                >
                  <span className="uppercase tracking-wider">
                    {lang === "ar" ? "المادة" : lang === "fr" ? "MATIÈRE" : "SUBJECT"}
                  </span>
                  {expandedSections.matiere ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {expandedSections.matiere && (
                  <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto pr-1 bac-scroll">
                    {Object.entries(SUBJECTS).map(([sKey, sObj]) => {
                      const checked = selectedSubjects.includes(sKey);
                      return (
                        <label
                          key={sKey}
                          className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer py-0.5 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) setSelectedSubjects(selectedSubjects.filter((id) => id !== sKey));
                              else setSelectedSubjects([...selectedSubjects, sKey]);
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                          />
                          <span>{sObj.name[lang]}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TYPE Accordion */}
              <div className="border-b border-slate-800 pb-3">
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, type: !prev.type }))
                  }
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white py-1 cursor-pointer"
                >
                  <span className="uppercase tracking-wider">
                    {lang === "ar" ? "نوع الوثيقة" : lang === "fr" ? "TYPE" : "DOCUMENT TYPE"}
                  </span>
                  {expandedSections.type ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {expandedSections.type && (
                  <div className="mt-2 space-y-1.5">
                    {DOCUMENT_TYPES.map((typeObj) => {
                      const checked = selectedTypes.includes(typeObj.id);
                      return (
                        <label
                          key={typeObj.id}
                          className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer py-0.5 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) setSelectedTypes(selectedTypes.filter((id) => id !== typeObj.id));
                              else setSelectedTypes([...selectedTypes, typeObj.id]);
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                          />
                          <span style={{ color: typeObj.color }} className="font-semibold">
                            {typeObj.label[lang]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CORRIGÉ Accordion */}
              <div className="border-b border-slate-800 pb-3">
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, corrige: !prev.corrige }))
                  }
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white py-1 cursor-pointer"
                >
                  <span className="uppercase tracking-wider">
                    {lang === "ar" ? "الإصلاح" : lang === "fr" ? "CORRIGÉ" : "SOLUTION"}
                  </span>
                  {expandedSections.corrige ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {expandedSections.corrige && (
                  <div className="mt-2 space-y-2">
                    {[
                      { id: "all", label: { ar: "الكل", fr: "Tous", en: "All" } },
                      { id: "with", label: { ar: "مع الإصلاح", fr: "Avec corrigé", en: "With solution" } },
                      { id: "without", label: { ar: "بدون إصلاح", fr: "Sans corrigé", en: "Without solution" } },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none"
                      >
                        <input
                          type="radio"
                          name="corrige"
                          checked={selectedCorrige === opt.id}
                          onChange={() => setSelectedCorrige(opt.id as CorrigeStatus)}
                          className="border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                        />
                        <span>{opt.label[lang]}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* TRIMESTRE Accordion */}
              <div>
                <button
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, trimestre: !prev.trimestre }))
                  }
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white py-1 cursor-pointer"
                >
                  <span className="uppercase tracking-wider">
                    {lang === "ar" ? "الثلاثي" : lang === "fr" ? "TRIMESTRE" : "TERM"}
                  </span>
                  {expandedSections.trimestre ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {expandedSections.trimestre && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TRIMESTRES.map((tr) => {
                      const active = selectedTrimestre === tr.id;
                      return (
                        <button
                          key={tr.id}
                          onClick={() => setSelectedTrimestre(tr.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? "bg-indigo-600 text-white shadow-sm font-bold"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {tr.label[lang]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Results Section */}
          <div className={showFilters ? "lg:col-span-3 space-y-4" : "col-span-full space-y-4"}>
            {/* Results Count & Quick Filter */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span>
                {filteredDocs.length}{" "}
                {lang === "ar" ? "وثيقة متوفرة" : lang === "fr" ? "documents" : "documents"}
              </span>

              <button
                onClick={() => setOnlyBookmarks(!onlyBookmarks)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  onlyBookmarks
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                    : "text-slate-400 hover:text-yellow-300"
                }`}
              >
                <Star size={14} className={onlyBookmarks ? "fill-yellow-400 text-yellow-400" : ""} />
                <span>{lang === "ar" ? "المحفوظات / المفضلة" : lang === "fr" ? "Favoris" : "Saved documents"}</span>
              </button>
            </div>

            {/* Loading / Empty State */}
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-2xl border border-slate-800">
                <Spinner size={32} />
                <span className="text-xs text-slate-400 font-semibold">
                  {lang === "ar" ? "جارٍ تحميل الوثائق..." : lang === "fr" ? "Chargement des documents…" : "Loading documents…"}
                </span>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-4 bg-[#0F172A] rounded-2xl border border-slate-800 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <FileText size={32} />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="font-bold text-white text-base">
                    {lang === "ar" ? "بنك الوثائق فارغ حاليًا" : lang === "fr" ? "La banque de documents est vide." : "The document library is empty."}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === "ar"
                      ? "لم يتم نشر أي امتحانات أو تلاخيص حتى الآن. عندما يقوم المشرفون أو التلاميذ المتميزون بنشر وثائق حقيقية ستظهر هنا مباشرة."
                      : "Aucun sujet, examen ou résumé n'a encore été publié. Les documents ajoutés par les modérateurs et élèves élites apparaîtront ici."}
                  </p>
                </div>
                {canPublish && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <PlusCircle size={16} />
                    <span>{lang === "ar" ? "أضف أول وثيقة" : lang === "fr" ? "Ajouter le premier document" : "Add the first document"}</span>
                  </button>
                )}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-4 bg-[#0F172A] rounded-2xl border border-slate-800">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <FileText size={32} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="font-bold text-white text-base">
                    {lang === "ar" ? "لم يتم العثور على وثائق تطابق هذه الفلاتر." : lang === "fr" ? "Aucun document ne correspond à ces filtres." : "No documents match these filters."}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === "ar"
                      ? "جرّب تغيير كلمات البحث أو مسح بعض الفلاتر لعرض الوثائق المنشورة."
                      : "Essayez de modifier vos critères de recherche ou réinitialisez les filtres."}
                  </p>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {lang === "ar" ? "مسح الفلاتر" : lang === "fr" ? "Effacer les filtres" : "Clear filters"}
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View (Faithful to Screenshot Card Design) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const typeObj = DOCUMENT_TYPES.find((t) => t.id === doc.type) || DOCUMENT_TYPES[0];
                  const subjObj = SUBJECTS[doc.subjectId];
                  const isBookmarked = bookmarkedIds.includes(doc.id);
                  const isAuthor = Boolean(
                    (user?.username && doc.authorUsername?.toLowerCase() === user.username.toLowerCase()) ||
                    (user?.displayName && doc.authorName?.toLowerCase() === user.displayName.toLowerCase())
                  );
                  const canDelete = Boolean(
                    !user ||
                    user.role === "superadmin" ||
                    user.role === "moderator" ||
                    user.role === "teacher" ||
                    user.role === "elite_student" ||
                    isAuthor
                  );

                  return (
                    <div
                      key={doc.id}
                      onClick={(e) => handleDirectView(doc, false, e)}
                      className="group bg-[#0F172A] hover:bg-[#131C35] p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/40 shadow-lg flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer relative"
                    >
                      {/* Top Row: Type Badge + Downloads Count + Bookmark */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider"
                            style={{ background: typeObj.bg, color: typeObj.color }}
                          >
                            {typeObj.label[lang]}
                          </span>
                          {doc.hasCorrige && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {lang === "ar" ? "مع الإصلاح" : lang === "fr" ? "Avec corrigé" : "With solution"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                            <Download size={13} className="text-slate-400" />
                            <span>{doc.downloadCount || 0}</span>
                          </div>
                          <button
                            onClick={(e) => handleBookmarkClick(doc.id, e)}
                            className="text-slate-400 hover:text-yellow-400 transition-colors p-1"
                            title={isBookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            <Star
                              size={16}
                              className={isBookmarked ? "fill-yellow-400 text-yellow-400" : ""}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Main Center: Red PDF Icon & Title & Subject */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-400 shadow-sm">
                          <FileText size={22} />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                            {doc.title}
                          </h4>
                          <p className="text-xs font-semibold text-slate-400">
                            {subjObj?.name[lang] || doc.subjectId}
                          </p>
                        </div>
                      </div>

                      {/* Meta Tags: Section, Trimestre, and Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-semibold">
                          {doc.branchIds.map((bId) => BRANCHES.find((b) => b.id === bId)?.mono[lang] || bId).join(", ")}
                        </span>
                        <span>•</span>
                        <span>
                          {TRIMESTRES.find((tr) => tr.id === doc.trimestre)?.label[lang]}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{doc.fileSize}</span>
                      </div>

                      {/* Publisher Identity Bar (Avatar + Name + Role Badge) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/40 text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={doc.authorAvatar}
                            username={doc.authorUsername}
                            displayName={doc.authorName}
                            size={24}
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs">
                              {doc.authorName || doc.authorUsername || (lang === "ar" ? "ناشر معتمد" : "Contributeur")}
                            </span>
                            {doc.authorRole === "teacher" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                👨‍🏫 {lang === "ar" ? "أستاذ" : "Enseignant"}
                              </span>
                            )}
                            {doc.authorRole === "elite_student" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ⭐ {lang === "ar" ? "تلميذ متميز" : "Élève Élite"}
                              </span>
                            )}
                            {doc.authorRole === "superadmin" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                👑 {lang === "ar" ? "المشرف الأعلى" : "Admin"}
                              </span>
                            )}
                            {(!doc.authorRole || doc.authorRole === "member") && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400">
                                🎓 {lang === "ar" ? "مساهم" : "Contributeur"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(doc.createdAt).toLocaleDateString(lang === "ar" ? "ar-TN" : "fr-FR")}
                        </span>
                      </div>

                      {/* Card Action Buttons: View in Reader Modal + Direct Download */}
                      <div className="flex flex-col gap-2 pt-1">
                        {/* File 1: Sujet / Exam Buttons */}
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={(e) => handleDirectView(doc, false, e)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 hover:from-indigo-500/35 hover:to-violet-500/35 text-indigo-200 border border-indigo-500/40 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                            title={lang === "ar" ? "مشاهدة وقراءة الوثيقة تفاعلياً" : "Voir le sujet"}
                          >
                            <Eye size={14} className="text-indigo-300" />
                            <span>{lang === "ar" ? "مشاهدة" : lang === "fr" ? "Voir" : "View"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadClick(doc, e)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_15px_-2px_rgba(99,102,241,0.4)] transition-all active:scale-95 cursor-pointer"
                            title={lang === "ar" ? "تحميل ملف الوثيقة PDF" : lang === "fr" ? "Télécharger le sujet" : "Download exam paper"}
                          >
                            <Download size={14} />
                            <span>{lang === "ar" ? "تحميل" : lang === "fr" ? "Télécharger" : "Download"}</span>
                          </button>
                        </div>

                        {/* File 2: Corrigé Buttons if available */}
                        {doc.hasCorrige && (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              type="button"
                              onClick={(e) => handleDirectView(doc, true, e)}
                              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-200 border border-emerald-500/40 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title={lang === "ar" ? "مشاهدة الإصلاح النموذجي" : "Voir le corrigé"}
                            >
                              <Eye size={14} className="text-emerald-300" />
                              <span>{lang === "ar" ? "مشاهدة الإصلاح" : lang === "fr" ? "Voir corrigé" : "View solution"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDownloadCorrigeClick(doc, e)}
                              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_15px_-2px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer"
                              title={lang === "ar" ? "تحميل ملف الإصلاح PDF" : lang === "fr" ? "Télécharger le corrigé" : "Download solution"}
                            >
                              <FileCheck size={14} />
                              <span>{lang === "ar" ? "تحميل الإصلاح" : lang === "fr" ? "Télécharger" : "Download"}</span>
                            </button>
                          </div>
                        )}

                        {canDelete && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClick(doc, e)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title={lang === "ar" ? "حذف الوثيقة" : lang === "fr" ? "Supprimer le document" : "Delete document"}
                            >
                              <Trash2 size={13} />
                              <span>{lang === "ar" ? "حذف" : lang === "fr" ? "Supprimer" : "Delete"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="bg-[#0F172A] rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
                {filteredDocs.map((doc) => {
                  const typeObj = DOCUMENT_TYPES.find((t) => t.id === doc.type) || DOCUMENT_TYPES[0];
                  const subjObj = SUBJECTS[doc.subjectId];
                  const isBookmarked = bookmarkedIds.includes(doc.id);
                  const isAuthor = Boolean(
                    (user?.username && doc.authorUsername?.toLowerCase() === user.username.toLowerCase()) ||
                    (user?.displayName && doc.authorName?.toLowerCase() === user.displayName.toLowerCase())
                  );
                  const canDelete = Boolean(
                    !user ||
                    user.role === "superadmin" ||
                    user.role === "moderator" ||
                    user.role === "teacher" ||
                    user.role === "elite_student" ||
                    isAuthor
                  );

                  return (
                    <div
                      key={doc.id}
                      onClick={(e) => handleDirectView(doc, false, e)}
                      className="p-4 hover:bg-[#131C35] flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-400 shadow-sm mt-0.5">
                          <FileText size={20} />
                        </div>
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                              style={{ background: typeObj.bg, color: typeObj.color }}
                            >
                              {typeObj.label[lang]}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                              {doc.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                            <span>{subjObj?.name[lang] || doc.subjectId}</span>
                            <span>•</span>
                            <span className="font-mono">{doc.fileSize}</span>
                            <span>•</span>
                            <span>
                              {doc.downloadCount || 0} {lang === "ar" ? "تحميل" : "téléchargements"}
                            </span>
                          </div>

                          {/* Publisher Info Row in List View */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40 text-xs">
                            <Avatar
                              src={doc.authorAvatar}
                              username={doc.authorUsername}
                              displayName={doc.authorName}
                              size={22}
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-200 text-xs">
                                {doc.authorName || doc.authorUsername || (lang === "ar" ? "ناشر معتمد" : "Contributeur")}
                              </span>
                              {doc.authorRole === "teacher" && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  👨‍🏫 {lang === "ar" ? "أستاذ معتمد" : "Enseignant"}
                                </span>
                              )}
                              {doc.authorRole === "elite_student" && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⭐ {lang === "ar" ? "تلميذ متميز" : "Élève Élite"}
                                </span>
                              )}
                              {doc.authorRole === "superadmin" && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  👑 {lang === "ar" ? "المشرف الأعلى" : "Admin"}
                                </span>
                              )}
                              {(!doc.authorRole || doc.authorRole === "member") && (
                                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400">
                                  🎓 {lang === "ar" ? "تلميذ مسجل" : "Membre"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end lg:self-center flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleBookmarkClick(doc.id, e)}
                          className="p-2 rounded-xl text-slate-400 hover:text-yellow-400 transition-colors"
                        >
                          <Star size={16} className={isBookmarked ? "fill-yellow-400 text-yellow-400" : ""} />
                        </button>

                        {/* File 1: Sujet (Preview + Download) */}
                        <button
                          type="button"
                          onClick={(e) => handleDirectView(doc, false, e)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 hover:from-indigo-500/35 hover:to-violet-500/35 text-indigo-200 border border-indigo-500/40 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                          title={lang === "ar" ? "مشاهدة وقراءة الوثيقة تفاعلياً" : "Voir le sujet"}
                        >
                          <Eye size={13} className="text-indigo-300" />
                          <span>{lang === "ar" ? "مشاهدة" : lang === "fr" ? "Voir" : "View"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadClick(doc, e)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_4px_15px_-2px_rgba(99,102,241,0.4)] transition-all active:scale-95 cursor-pointer"
                          title={lang === "ar" ? "تحميل الموضوع PDF" : lang === "fr" ? "Télécharger le sujet" : "Download paper"}
                        >
                          <Download size={13} />
                          <span>{lang === "ar" ? "تحميل" : lang === "fr" ? "Télécharger" : "Download"}</span>
                        </button>

                        {/* File 2: Corrigé (Preview + Download) if available */}
                        {doc.hasCorrige && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleDirectView(doc, true, e)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-200 border border-emerald-500/40 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title={lang === "ar" ? "مشاهدة الإصلاح النموذجي" : "Voir le corrigé"}
                            >
                              <Eye size={13} className="text-emerald-300" />
                              <span>{lang === "ar" ? "مشاهدة الإصلاح" : lang === "fr" ? "Voir corrigé" : "View solution"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadCorrigeClick(doc, e)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_4px_15px_-2px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer"
                              title={lang === "ar" ? "تحميل الإصلاح PDF" : lang === "fr" ? "Télécharger le corrigé" : "Download solution"}
                            >
                              <FileCheck size={13} />
                              <span>{lang === "ar" ? "تحميل الإصلاح" : lang === "fr" ? "Télécharger" : "Download"}</span>
                            </button>
                          </>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(doc, e)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                            title={lang === "ar" ? "حذف" : lang === "fr" ? "Supprimer" : "Delete"}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Document Modal (Accessible only to SuperAdmin, Moderator, and Elite Student) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-start sm:items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden my-auto max-h-[92vh] bac-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-[#131D38] shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <PlusCircle size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {lang === "ar" ? "إضافة وثيقة جديدة إلى بنك الوثائق" : lang === "fr" ? "Ajouter un document" : "Add a document"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === "ar"
                      ? `أنت تنشر بصفتك: ${user?.role === "superadmin" ? "المشرف الأعلى" : user?.role === "moderator" ? "مشرف" : "تلميذ مساهم"}`
                      : lang === "fr"
                        ? `Publication par : ${user?.role === "superadmin" ? "Super administrateur" : user?.role === "moderator" ? "Modérateur" : "Élève contributeur"}`
                        : `Publishing as: ${user?.role === "superadmin" ? "Super administrator" : user?.role === "moderator" ? "Moderator" : "Student contributor"}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddDocumentSubmit} className="p-5 sm:p-6 space-y-4 text-sm text-slate-200 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {lang === "ar" ? "عنوان الوثيقة *" : lang === "fr" ? "Titre du document *" : "Document title *"}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: فرض تأليفي في الفيزياء مع الإصلاح" : lang === "fr" ? "Ex. : Devoir de synthèse de physique avec corrigé" : "e.g. Physics exam paper with solutions"}
                  className="w-full bg-[#1E293B] text-white text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subject & Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {lang === "ar" ? "المادة *" : lang === "fr" ? "Matière *" : "Subject *"}
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-[#1E293B] text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(SUBJECTS).map(([sKey, sObj]) => (
                      <option key={sKey} value={sKey}>
                        {sObj.name[lang]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {lang === "ar" ? "نوع الوثيقة *" : lang === "fr" ? "Type de document *" : "Document type *"}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const nextType = e.target.value as DocumentType;
                      setNewType(nextType);
                      if (nextType === "resume" || nextType === "cours" || nextType === "correction") {
                        setNewHasCorrige(false);
                        setNewCorrigePdfFile(null);
                      }
                    }}
                    className="w-full bg-[#1E293B] text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trimestre & Conditional Corrige */}
              <div className={`grid ${newType === "resume" || newType === "cours" || newType === "correction" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-4`}>
                {/* Trimestre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {lang === "ar" ? "الثلاثي *" : lang === "fr" ? "Trimestre *" : "Term *"}
                  </label>
                  <select
                    value={newTrimestre}
                    onChange={(e) => setNewTrimestre(e.target.value as TrimestreKey)}
                    className="w-full bg-[#1E293B] text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {TRIMESTRES.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.label[lang]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Has Corrige Question (Hidden for resume, cours, and correction) */}
                {!(newType === "resume" || newType === "cours" || newType === "correction") && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      {lang === "ar" ? "هل يتضمن إصلاحًا؟" : lang === "fr" ? "Le document inclut-il un corrigé ?" : "Does the document include a solution?"}
                    </label>
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="newCorrige"
                          checked={newHasCorrige}
                          onChange={() => setNewHasCorrige(true)}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span>{lang === "ar" ? "نعم، مع الإصلاح" : lang === "fr" ? "Oui, avec corrigé" : "Yes, with solution"}</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="newCorrige"
                          checked={!newHasCorrige}
                          onChange={() => {
                            setNewHasCorrige(false);
                            setNewCorrigePdfFile(null);
                          }}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <span>{lang === "ar" ? "بدون إصلاح" : lang === "fr" ? "Sans corrigé" : "No solution"}</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Sections (Multi-select branches) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {lang === "ar" ? "الشعب المعنية بهذه الوثيقة *" : lang === "fr" ? "Filières concernées *" : "Study tracks *"}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {BRANCHES.map((b) => {
                    const active = newBranches.includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => {
                          if (active) setNewBranches(newBranches.filter((id) => id !== b.id));
                          else setNewBranches([...newBranches, b.id]);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          active
                            ? "bg-indigo-600/30 text-indigo-200 border-indigo-500 font-bold"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {b.name[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Uploads (1. الوثائق + 2. ملف الإصلاح فقط عند توفره) */}
              {(() => {
                const isNoCorrigeType = newType === "resume" || newType === "cours" || newType === "correction";
                const showCorrigeUpload = !isNoCorrigeType && newHasCorrige;
                const isMainDocReady = !!newPdfFile && !isUploadingPdf && pdfUploadProgress === 100;
                const isCorrigeDocReady = !showCorrigeUpload || (!!newCorrigePdfFile && !isUploadingCorrige && corrigeUploadProgress === 100);
                const isFormReady = !!newTitle.trim() && newBranches.length > 0 && isMainDocReady && isCorrigeDocReady && !submitting && !isUploadingPdf && !isUploadingCorrige;

                return (
                  <div className={`grid ${showCorrigeUpload ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
                    {/* 1. الوثائق */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText size={14} className="text-rose-400" />
                          <span>
                            {lang === "ar"
                              ? "1. ملف الوثيقة (PDF) *"
                              : lang === "fr"
                              ? "1. Document (PDF) *"
                              : "1. Document (PDF) *"}
                          </span>
                        </div>
                        {newPdfFile && !isUploadingPdf && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setNewPdfFile(null);
                              setPdfUploadProgress(0);
                            }}
                            className="text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer relative z-30 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30 transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>{lang === "ar" ? "حذف الملف" : "Supprimer"}</span>
                          </button>
                        )}
                      </label>
                      <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all relative bg-[#0D1426] group ${
                        isUploadingPdf
                          ? "border-indigo-500 bg-indigo-950/20"
                          : newPdfFile
                          ? "border-emerald-500/60 bg-emerald-950/20"
                          : "border-slate-700 hover:border-indigo-500/60 cursor-pointer"
                      }`}>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={isUploadingPdf}
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                            isUploadingPdf
                              ? "bg-indigo-500/20 text-indigo-400 animate-spin"
                              : newPdfFile
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-indigo-500/20 text-indigo-400 group-hover:scale-105"
                          }`}>
                            {isUploadingPdf ? <Spinner size={20} /> : newPdfFile ? <Check size={20} /> : <Upload size={18} />}
                          </div>

                          {isUploadingPdf ? (
                            <div className="w-full max-w-[240px] space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-indigo-300">{lang === "ar" ? "جارٍ معالجة ورفع الملف..." : "Téléversement…"}</span>
                                <span className="text-indigo-400 font-mono">{pdfUploadProgress}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150 rounded-full"
                                  style={{ width: `${pdfUploadProgress}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{lang === "ar" ? "يرجى الانتظار لاكتمال النقل" : "Veuillez patienter"}</p>
                            </div>
                          ) : newPdfFile ? (
                            <div className="text-center space-y-1.5">
                              <p className="text-xs font-bold text-emerald-300 truncate max-w-[240px]">
                                {newPdfFile.name}
                              </p>
                              <div className="flex items-center justify-center gap-2 text-[10px]">
                                <span className="text-slate-400 font-mono">({newPdfFile.size})</span>
                                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">✓ {lang === "ar" ? "مكتمل وجاهز" : "Prêt"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setNewPdfFile(null);
                                  setPdfUploadProgress(0);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-all relative z-30 active:scale-95 shadow-sm"
                              >
                                <Trash2 size={12} />
                                <span>{lang === "ar" ? "إزالة وحذف الملف" : "Supprimer le fichier"}</span>
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-bold text-slate-300">
                                {lang === "ar" ? "اسحب ملف الـ PDF هنا أو انقر للاختيار" : "Glissez le fichier PDF ou cliquez"}
                              </p>
                              <span className="text-[10px] text-slate-500">PDF فقط (Max 25 MB)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. ملف الإصلاح - Only shown if !isNoCorrigeType and newHasCorrige */}
                    {showCorrigeUpload && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <FileCheck size={14} className="text-emerald-400" />
                            <span>{lang === "ar" ? "2. ملف الإصلاح (PDF) *" : "2. Corrigé (PDF) *"}</span>
                          </div>
                          {newCorrigePdfFile && !isUploadingCorrige && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setNewCorrigePdfFile(null);
                                setCorrigeUploadProgress(0);
                              }}
                              className="text-rose-400 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer relative z-30 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30 transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>{lang === "ar" ? "حذف الملف" : "Supprimer"}</span>
                            </button>
                          )}
                        </label>
                        <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all relative bg-[#0D1426] group ${
                          isUploadingCorrige
                            ? "border-emerald-500 bg-emerald-950/20"
                            : newCorrigePdfFile
                            ? "border-emerald-500/60 bg-emerald-950/20"
                            : "border-slate-700 hover:border-emerald-500/60 cursor-pointer"
                        }`}>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            disabled={isUploadingCorrige}
                            onChange={handleCorrigeFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                          />
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                              isUploadingCorrige
                                ? "bg-emerald-500/20 text-emerald-400 animate-spin"
                                : newCorrigePdfFile
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-emerald-500/20 text-emerald-400 group-hover:scale-105"
                            }`}>
                              {isUploadingCorrige ? <Spinner size={20} /> : newCorrigePdfFile ? <Check size={20} /> : <Upload size={18} />}
                            </div>

                            {isUploadingCorrige ? (
                              <div className="w-full max-w-[240px] space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-emerald-300">{lang === "ar" ? "جارٍ معالجة ورفع الإصلاح..." : "Téléversement corrigé…"}</span>
                                  <span className="text-emerald-400 font-mono">{corrigeUploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150 rounded-full"
                                    style={{ width: `${corrigeUploadProgress}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">{lang === "ar" ? "يرجى الانتظار لاكتمال النقل" : "Veuillez patienter"}</p>
                              </div>
                            ) : newCorrigePdfFile ? (
                              <div className="text-center space-y-1.5">
                                <p className="text-xs font-bold text-emerald-300 truncate max-w-[240px]">
                                  {newCorrigePdfFile.name}
                                </p>
                                <div className="flex items-center justify-center gap-2 text-[10px]">
                                  <span className="text-slate-400 font-mono">({newCorrigePdfFile.size})</span>
                                  <span className="text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">✓ {lang === "ar" ? "مكتمل وجاهز" : "Prêt"}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setNewCorrigePdfFile(null);
                                    setCorrigeUploadProgress(0);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-all relative z-30 active:scale-95 shadow-sm"
                                >
                                  <Trash2 size={12} />
                                  <span>{lang === "ar" ? "إزالة وحذف ملف الإصلاح" : "Supprimer le corrigé"}</span>
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-bold text-slate-300">
                                  {lang === "ar" ? "ملف الإصلاح النموذجي (PDF)" : "Fichier du corrigé"}
                                </p>
                                <span className="text-[10px] text-slate-500">PDF فقط (Max 25 MB)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Content Snippet / Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {lang === "ar" ? "نص الملخص أو محتوى التمارين (اختياري)" : lang === "fr" ? "Contenu ou éléments clés" : "Summary or exercise text (optional)"}
                </label>
                <textarea
                  rows={4}
                  value={newSnippet}
                  onChange={(e) => setNewSnippet(e.target.value)}
                  placeholder={lang === "ar" ? "اكتب أهم القوانين أو نص التمرين أو عناصر الإجابة..." : lang === "fr" ? "Saisissez les formules, énoncés ou éléments de réponse…" : "Add key formulas, exercise text, or answer points…"}
                  className="w-full bg-[#1E293B] text-white text-xs rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Modal Submit Actions - With Strict Validation and Guidance */}
              {(() => {
                const isNoCorrigeType = newType === "resume" || newType === "cours" || newType === "correction";
                const showCorrigeUpload = !isNoCorrigeType && newHasCorrige;
                const isMainDocReady = !!newPdfFile && !isUploadingPdf && pdfUploadProgress === 100;
                const isCorrigeDocReady = !showCorrigeUpload || (!!newCorrigePdfFile && !isUploadingCorrige && corrigeUploadProgress === 100);
                const isFormReady = !!newTitle.trim() && newBranches.length > 0 && isMainDocReady && isCorrigeDocReady && !submitting && !isUploadingPdf && !isUploadingCorrige;

                return (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 bg-[#0F172A]/95 backdrop-blur-md pb-1 z-10">
                    <div className="text-xs">
                      {!isFormReady && (
                        <div className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>
                            {!newTitle.trim()
                              ? (lang === "ar" ? "يرجى كتابة عنوان الوثيقة" : "Titre requis")
                              : newBranches.length === 0
                              ? (lang === "ar" ? "يرجى تحديد الشعبة المعنية" : "Filière requise")
                              : !isMainDocReady
                              ? (isUploadingPdf ? (lang === "ar" ? `انتظر اكتمال رفع الملف (${pdfUploadProgress}%)` : `Chargement (${pdfUploadProgress}%)`) : (lang === "ar" ? "يرجى إرفاق ملف الوثيقة (PDF)" : "Fichier PDF requis"))
                              : !isCorrigeDocReady
                              ? (isUploadingCorrige ? (lang === "ar" ? `انتظر اكتمال رفع الإصلاح (${corrigeUploadProgress}%)` : `Chargement corrigé (${corrigeUploadProgress}%)`) : (lang === "ar" ? "يرجى إرفاق ملف الإصلاح أو اختيار بدون إصلاح" : "Corrigé requis"))
                              : ""}
                          </span>
                        </div>
                      )}
                      {isFormReady && (
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check size={13} />
                          <span>{lang === "ar" ? "كافة الحقول والملفات مكتملة وجاهزة للنشر" : "Tous les champs sont prêts"}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        disabled={!isFormReady || submitting}
                        className={`px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-2 shadow-lg transition-all ${
                          isFormReady && !submitting
                            ? "cursor-pointer hover:opacity-95 transform active:scale-95"
                            : "opacity-40 cursor-not-allowed grayscale"
                        }`}
                        style={{ background: GRAD_GOLD }}
                      >
                        {submitting ? <Spinner size={16} /> : <Check size={16} />}
                        <span>
                          {isUploadingPdf || isUploadingCorrige
                            ? (lang === "ar" ? "جارٍ رفع الملفات..." : "Téléversement en cours…")
                            : (lang === "ar" ? "تأكيد النشر" : lang === "fr" ? "Publier le document" : "Publish document")}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* In-App Document Deletion Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl shadow-rose-950/50 flex flex-col gap-5 relative animate-in zoom-in-95 duration-150"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <button
              onClick={() => {
                if (!isDeletingDoc) setDocToDelete(null);
              }}
              className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {lang === "ar" ? "تأكيد حذف الوثيقة من الأرشيف" : lang === "fr" ? "Confirmer la suppression" : "Confirm Document Deletion"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === "ar" ? "إجراء نهائي لإزالة الوثيقة من السجلات" : "Action irréversible"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                {lang === "ar"
                  ? "هل أنت متأكد من رغبتك في حذف الوثيقة التالية نهائياً؟"
                  : "Êtes-vous sûr de vouloir supprimer définitivement le document suivant ?"}
              </p>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 font-bold break-words">
                📄 {docToDelete.title}
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {lang === "ar" ? "إلغاء التراجع" : lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingDoc ? (
                  <>
                    <Spinner size={14} />
                    <span>{lang === "ar" ? "جارٍ الحذف..." : "Suppression..."}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{lang === "ar" ? "نعم، حذف نهائياً" : lang === "fr" ? "Supprimer définitivement" : "Delete Permanently"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Toast Notification */}
      {deleteToast && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom-5 border bg-slate-900/95"
          style={{
            borderColor: deleteToast.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
          }}
        >
          {deleteToast.type === "success" ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-rose-400 shrink-0" size={20} />
          )}
          <span className="text-xs font-bold text-white flex-1">{deleteToast.message}</span>
          <button
            onClick={() => setDeleteToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
