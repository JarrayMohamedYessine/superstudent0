import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Video,
  Link as LinkIcon,
  BookOpen,
  GraduationCap,
  Layers,
  AlertTriangle,
  Megaphone,
  Lightbulb,
  Check,
  Globe,
  Radio,
  ExternalLink,
  Send,
  Upload,
  FileText,
  Trash2,
  FileCheck,
} from "lucide-react";
import { Account, AnnouncementType, LangKey, PdfAttachment, SuperAnnouncement } from "../types";
import { SUBJECTS, BRANCHES, GRAD, GRAD_GOLD } from "../constants";
import {
  canUserCreateAnnouncementType,
  getAvailableAnnouncementTypesForUser,
  publishSuperAnnouncement,
  updateSuperAnnouncement,
  CreateSuperAnnouncementInput,
} from "../services/announcementService";
import { Avatar, Spinner } from "./Atoms";

interface SuperAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Account | null;
  lang: LangKey;
  isRTL: boolean;
  editAnnouncement?: SuperAnnouncement | null;
  onSuccess: (announcement: SuperAnnouncement) => void;
}

const TYPE_CONFIG: Record<
  AnnouncementType,
  {
    emoji: string;
    label: { ar: string; fr: string; en: string };
    desc: { ar: string; fr: string; en: string };
    accentColor: string;
    borderClass: string;
    bgClass: string;
    icon: React.ReactNode;
  }
> = {
  live_class: {
    emoji: "🎓",
    label: { ar: "حصة مباشرة", fr: "Classe en direct", en: "Live Class" },
    desc: {
      ar: "تنظيم حصة تفاعلية مباشرة مع تحديد المادة، الشعب، والمنصة",
      fr: "Organiser une session interactive en direct",
      en: "Host an interactive live class with subject and stream details",
    },
    accentColor: "#10B981",
    borderClass: "border-emerald-500/40 hover:border-emerald-400",
    bgClass: "bg-emerald-500/10",
    icon: <Radio className="w-5 h-5 text-emerald-400" />,
  },
  alert: {
    emoji: "⚠️",
    label: { ar: "تنبيه هام", fr: "Alerte urgente", en: "Important Alert" },
    desc: {
      ar: "نشر تنبيه أو إشعار فوري لجميع التلاميذ أو الشعب",
      fr: "Publier une alerte ou notification urgente",
      en: "Broadcast an urgent alert or important notification",
    },
    accentColor: "#F43F5E",
    borderClass: "border-rose-500/40 hover:border-rose-400",
    bgClass: "bg-rose-500/10",
    icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
  },
  announcement: {
    emoji: "📢",
    label: { ar: "إعلان عام", fr: "Annonce générale", en: "Announcement" },
    desc: {
      ar: "مشاركة مستجدات أو فعاليات أو تحديثات دراسية جديدة",
      fr: "Partager des actualités, événements ou mises à jour",
      en: "Share general news, updates, or educational events",
    },
    accentColor: "#6366F1",
    borderClass: "border-indigo-500/40 hover:border-indigo-400",
    bgClass: "bg-indigo-500/10",
    icon: <Megaphone className="w-5 h-5 text-indigo-400" />,
  },
  tip: {
    emoji: "💡",
    label: { ar: "نصيحة وتوجيه", fr: "Conseil & Astuce", en: "Study Tip" },
    desc: {
      ar: "مشاركة نصيحة ذهبية لتنظيم الوقت أو منهجية المراجعة",
      fr: "Partager une méthode ou astuce de révision",
      en: "Share a proven study tip, method, or exam guidance",
    },
    accentColor: "#F59E0B",
    borderClass: "border-amber-500/40 hover:border-amber-400",
    bgClass: "bg-amber-500/10",
    icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
  },
};

const PLATFORMS = ["Discord", "Google Meet", "Zoom", "YouTube", "Other"] as const;

export function SuperAnnouncementModal({
  isOpen,
  onClose,
  user,
  lang,
  isRTL,
  editAnnouncement,
  onSuccess,
}: SuperAnnouncementModalProps) {
  const isEditing = !!editAnnouncement;
  const availableTypes = getAvailableAnnouncementTypesForUser(user);

  // Form State
  const [selectedType, setSelectedType] = useState<AnnouncementType>("live_class");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState<string>("math");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isAllBranches, setIsAllBranches] = useState<boolean>(true);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [platform, setPlatform] = useState<string>("Discord");
  const [customPlatformName, setCustomPlatformName] = useState<string>("");
  const [joinUrl, setJoinUrl] = useState<string>("");
  
  // PDF attachments (up to 3 lesson/exercise PDFs & up to 3 correction PDFs)
  const [pdfAttachments, setPdfAttachments] = useState<PdfAttachment[]>([]);
  const [correctionPdfs, setCorrectionPdfs] = useState<PdfAttachment[]>([]);
  const [uploadingTarget, setUploadingTarget] = useState<"attachment" | "correction" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or preload values on open
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsSubmitting(false);

    if (editAnnouncement) {
      setSelectedType(editAnnouncement.type);
      setTitle(editAnnouncement.title || "");
      setContent(editAnnouncement.content || "");
      setSubjectId(editAnnouncement.subjectId || "math");
      setSelectedBranches(editAnnouncement.targetBranches?.filter((b) => b !== "all") || []);
      setIsAllBranches(
        editAnnouncement.isAllBranches ||
          !editAnnouncement.targetBranches ||
          editAnnouncement.targetBranches.includes("all")
      );
      setDate(editAnnouncement.date || "");
      setStartTime(editAnnouncement.startTime || "");
      setEndTime(editAnnouncement.endTime || "");

      // Multi-PDF attachments preload
      const initialAttachments: PdfAttachment[] =
        editAnnouncement.pdfAttachments && editAnnouncement.pdfAttachments.length > 0
          ? editAnnouncement.pdfAttachments
          : editAnnouncement.pdfAttachmentUrl
          ? [
              {
                id: "pdf-legacy-1",
                name: editAnnouncement.pdfAttachmentName || "وثيقة_مرفقة.pdf",
                size: editAnnouncement.pdfAttachmentSize || "",
                url: editAnnouncement.pdfAttachmentUrl,
                dataUrl: editAnnouncement.pdfAttachmentUrl,
              },
            ]
          : [];
      setPdfAttachments(initialAttachments);

      // Correction PDFs preload
      setCorrectionPdfs(editAnnouncement.correctionPdfs || []);

      if (PLATFORMS.includes(editAnnouncement.platform as any)) {
        setPlatform(editAnnouncement.platform || "Discord");
        setCustomPlatformName("");
      } else if (editAnnouncement.platform) {
        setPlatform("Other");
        setCustomPlatformName(editAnnouncement.platform);
      } else {
        setPlatform("Discord");
        setCustomPlatformName("");
      }
      setJoinUrl(editAnnouncement.joinUrl || "");
    } else {
      // Pick initial available type
      const defaultType = availableTypes.includes("live_class")
        ? "live_class"
        : availableTypes[0] || "tip";
      setSelectedType(defaultType);
      setTitle("");
      setContent("");
      setSubjectId("math");
      setSelectedBranches([]);
      setIsAllBranches(true);
      
      // Default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);
      setStartTime("20:00");
      setEndTime("21:30");
      setPlatform("Discord");
      setCustomPlatformName("");
      setJoinUrl("");
      setPdfAttachments([]);
      setCorrectionPdfs([]);
    }
  }, [isOpen, editAnnouncement]);

  if (!isOpen || !user) return null;

  const toggleBranch = (branchId: string) => {
    if (isAllBranches) {
      setIsAllBranches(false);
      setSelectedBranches([branchId]);
      return;
    }
    if (selectedBranches.includes(branchId)) {
      const next = selectedBranches.filter((b) => b !== branchId);
      if (next.length === 0) {
        setIsAllBranches(true);
      } else {
        setSelectedBranches(next);
      }
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  const handleSelectAllBranches = () => {
    setIsAllBranches(true);
    setSelectedBranches([]);
  };

  function isPdfFile(file: File): boolean {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetList: "attachment" | "correction"
  ) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Filter valid PDFs under 25MB
    const invalidFile = rawFiles.find((f) => !isPdfFile(f));
    if (invalidFile) {
      setError(lang === "ar" ? "عذراً، يُسمح برفع ملفات PDF فقط (.pdf)" : "Seuls les fichiers PDF sont autorisés (.pdf)");
      e.target.value = "";
      return;
    }

    const oversizedFile = rawFiles.find((f) => f.size > 25 * 1024 * 1024);
    if (oversizedFile) {
      setError(
        lang === "ar"
          ? `حجم الملف الواحد (${oversizedFile.name}) يتجاوز 25 ميغابايت. الحد الأقصى هو 25 ميغابايت لكل ملف على حدة.`
          : `Le fichier (${oversizedFile.name}) dépasse 25 Mo. La limite est de 25 Mo par fichier.`
      );
      e.target.value = "";
      return;
    }

    setError(null);
    setUploadingTarget(targetList);
    setUploadProgress(15);

    let loadedCount = 0;
    const loadedAttachments: PdfAttachment[] = [];

    rawFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultDataUrl = (reader.result as string) || "";
        const szMB = (file.size / (1024 * 1024)).toFixed(1);
        const displaySize = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${szMB} MB`;

        loadedAttachments.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: displaySize,
          url: resultDataUrl,
          dataUrl: resultDataUrl,
        });

        loadedCount++;
        if (loadedCount === rawFiles.length) {
          const totalBytes = rawFiles.reduce((acc, f) => acc + f.size, 0);
          const totalDurationMs = Math.min(6000, Math.max(1500, Math.round((totalBytes / (1024 * 1024)) * 350)));
          const intervalMs = 80;
          const stepIncrement = 100 / (totalDurationMs / intervalMs);
          let currentProg = 15;

          const timer = setInterval(() => {
            currentProg += stepIncrement + (Math.random() * 2);
            if (currentProg >= 100) {
              clearInterval(timer);
              setUploadProgress(100);
              setUploadingTarget(null);

              if (targetList === "attachment") {
                setPdfAttachments((prev) => {
                  const combined = [...prev, ...loadedAttachments];
                  return combined.slice(0, 3);
                });
              } else {
                setCorrectionPdfs((prev) => {
                  const combined = [...prev, ...loadedAttachments];
                  return combined.slice(0, 3);
                });
              }
            } else {
              setUploadProgress(Math.min(99, Math.round(currentProg)));
            }
          }, intervalMs);
        }
      };

      reader.onerror = () => {
        setUploadingTarget(null);
        setUploadProgress(0);
        setError(lang === "ar" ? "حدث خطأ أثناء قراءة الملف." : "Erreur de lecture du fichier.");
      };

      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!content.trim()) {
      setError(lang === "ar" ? "يُرجى كتابة نص الإعلان أو المحتوى." : "Veuillez saisir le contenu.");
      return;
    }

    if (selectedType === "live_class") {
      if (!title.trim()) {
        setError(lang === "ar" ? "يُرجى كتابة عنوان الحصة المباشرة." : "Veuillez saisir le titre de la classe.");
        return;
      }
      if (!subjectId) {
        setError(lang === "ar" ? "يُرجى اختيار المادة." : "Veuillez choisir la matière.");
        return;
      }
      if (!isAllBranches && selectedBranches.length === 0) {
        setError(lang === "ar" ? "يُرجى تحديد شعبة واحدة على الأقل أو اختيار كل الشعب." : "Veuillez sélectionner au moins une filière.");
        return;
      }
      if (!date) {
        setError(lang === "ar" ? "يُرجى تحديد التاريخ." : "Veuillez sélectionner la date.");
        return;
      }
      if (!startTime) {
        setError(lang === "ar" ? "يُرجى تحديد وقت البداية." : "Veuillez sélectionner l'heure de début.");
        return;
      }
      if (platform === "Other" && !customPlatformName.trim()) {
        setError(lang === "ar" ? "يُرجى كتابة اسم المنصة." : "Veuillez indiquer le nom de la plateforme.");
        return;
      }
      if (joinUrl.trim() && !joinUrl.startsWith("http://") && !joinUrl.startsWith("https://")) {
        setError(lang === "ar" ? "يجب أن يبدأ رابط الحصة بـ https:// أو http://" : "Le lien doit commencer par https://");
        return;
      }
    }

    setIsSubmitting(true);

    const payload: CreateSuperAnnouncementInput = {
      type: selectedType,
      title: title.trim() || undefined,
      content: content.trim(),
      subjectId: selectedType === "live_class" ? subjectId : undefined,
      targetBranches: selectedType === "live_class" ? (isAllBranches ? ["all"] : selectedBranches) : undefined,
      isAllBranches: selectedType === "live_class" ? isAllBranches : undefined,
      date: selectedType === "live_class" ? date : undefined,
      startTime: selectedType === "live_class" ? startTime : undefined,
      endTime: selectedType === "live_class" ? endTime || undefined : undefined,
      platform: selectedType === "live_class" ? (platform === "Other" ? customPlatformName.trim() : platform) : undefined,
      customPlatformName: selectedType === "live_class" && platform === "Other" ? customPlatformName.trim() : undefined,
      joinUrl: selectedType === "live_class" ? joinUrl.trim() || undefined : undefined,
      pdfAttachments: pdfAttachments,
      pdfAttachmentUrl: pdfAttachments[0]?.dataUrl || pdfAttachments[0]?.url || undefined,
      pdfAttachmentName: pdfAttachments[0]?.name || undefined,
      pdfAttachmentSize: pdfAttachments[0]?.size || undefined,
      correctionPdfs: correctionPdfs,
    };

    try {
      if (isEditing && editAnnouncement) {
        const res = await updateSuperAnnouncement(editAnnouncement.id, payload, user);
        if (res.success && res.announcement) {
          onSuccess(res.announcement);
          onClose();
        } else {
          setError(res.error || (lang === "ar" ? "تعذر تعديل الإعلان." : "Échec de modification."));
        }
      } else {
        const res = await publishSuperAnnouncement(payload, user);
        if (res.success && res.announcement) {
          onSuccess(res.announcement);
          onClose();
        } else {
          setError(res.error || (lang === "ar" ? "تعذر نشر الإعلان." : "Échec de publication."));
        }
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ غير متوقع." : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              {TYPE_CONFIG[selectedType].emoji}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                {isEditing
                  ? lang === "ar"
                    ? "تعديل الإعلان"
                    : lang === "fr"
                    ? "Modifier l'annonce"
                    : "Edit Announcement"
                  : lang === "ar"
                  ? "نشر إعلان / حصة جديدة"
                  : lang === "fr"
                  ? "Publier une annonce / classe"
                  : "Publish Announcement / Class"}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === "ar"
                  ? "يتم النشر مباشرة في الصفحة بدون أي فترة انتظار"
                  : lang === "fr"
                  ? "Publication directe sans attente de modération"
                  : "Direct immediate publication without delays"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto bac-scroll">
          {/* Section 1: Type Selection Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              <span>{lang === "ar" ? "1. اختر نوع الإعلان" : lang === "fr" ? "1. Type d'annonce" : "1. Select Type"}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(["live_class", "alert", "announcement", "tip"] as AnnouncementType[]).map((type) => {
                const config = TYPE_CONFIG[type];
                const isAllowed = canUserCreateAnnouncementType(user, type);
                const isSelected = selectedType === type;

                if (!isAllowed) {
                  return null; // Role-aware hiding
                }

                return (
                  <button
                    key={type}
                    type="button"
                    disabled={isEditing} // Cannot switch type while editing
                    onClick={() => setSelectedType(type)}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? `${config.bgClass} ${config.borderClass} ring-2 ring-indigo-500/50 shadow-lg`
                        : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                    } ${isEditing ? "opacity-90 cursor-default" : ""}`}
                  >
                    <div className="text-2xl pt-0.5">{config.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {config.label[lang] || config.label.ar}
                        </span>
                        {isSelected && <Check size={16} className="text-emerald-400 font-black" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {config.desc[lang] || config.desc.ar}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Dynamic Form Fields based on Type */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {/* Live Class Specific Fields */}
            {selectedType === "live_class" && (
              <div className="space-y-4 bg-emerald-500/5 border border-emerald-500/20 p-4 sm:p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Radio size={14} className="animate-pulse" />
                  <span>{lang === "ar" ? "تفاصيل الحصة المباشرة" : "Détails de la classe en direct"}</span>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {lang === "ar" ? "عنوان الحصة *" : "Titre de la classe *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      lang === "ar"
                        ? "مثال: مراجعة شاملة في الأعداد المركبة والهندسة الفضائية"
                        : "Ex: Séance de révision en Nombres Complexes"
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Subject Selector (Sleek Compact Horizontal Scrollable Bar) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <BookOpen size={13} className="text-emerald-400" />
                      <span>{lang === "ar" ? "المادة الدراسية *" : "Matière *"}</span>
                    </label>
                    {subjectId && SUBJECTS[subjectId] && (
                      <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: SUBJECTS[subjectId].color }}
                        />
                        <span>{SUBJECTS[subjectId].name[lang] || SUBJECTS[subjectId].name.ar}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 bac-scroll touch-pan-x">
                    {Object.entries(SUBJECTS).map(([key, subj]) => {
                      const isSelected = subjectId === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSubjectId(key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                            isSelected
                              ? "text-white shadow-md border-emerald-400/90 font-black"
                              : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                          style={{
                            backgroundColor: isSelected ? `${subj.color}35` : undefined,
                            borderColor: isSelected ? subj.color : undefined,
                            boxShadow: isSelected ? `0 4px 12px ${subj.color}35` : undefined,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="whitespace-nowrap">{subj.name[lang] || subj.name.ar}</span>
                          {isSelected && <Check size={11} className="text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Streams (From Document Bank Canonical BRANCHES) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-emerald-400" />
                      <span>{lang === "ar" ? "الشعب المستهدفة *" : "Filières cibles *"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllBranches}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        isAllBranches
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                    >
                      {lang === "ar" ? "✓ كل الشعب" : "Toutes les filières"}
                    </button>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {BRANCHES.map((b) => {
                      const isSelected = isAllBranches || selectedBranches.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBranch(b.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected && !isAllBranches
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm"
                              : isAllBranches
                              ? "bg-slate-800/60 border-slate-700 text-slate-300"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: b.color }}
                          />
                          <span>{b.name[lang] || b.name.ar}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Calendar size={12} className="text-emerald-400" />
                      <span>{lang === "ar" ? "التاريخ *" : "Date *"}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Clock size={12} className="text-emerald-400" />
                      <span>{lang === "ar" ? "وقت البداية *" : "Début *"}</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>{lang === "ar" ? "وقت النهاية (اختياري)" : "Fin (Optionnel)"}</span>
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>

                {/* Platform Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Video size={13} className="text-emerald-400" />
                    <span>{lang === "ar" ? "منصة البث المباشر *" : "Plateforme *"}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          platform === p
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black"
                            : "bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        {p === "Other" ? (lang === "ar" ? "منصة أخرى" : "Autre") : p}
                      </button>
                    ))}
                  </div>

                  {platform === "Other" && (
                    <input
                      type="text"
                      required
                      value={customPlatformName}
                      onChange={(e) => setCustomPlatformName(e.target.value)}
                      placeholder={lang === "ar" ? "اكتب اسم المنصة..." : "Nom de la plateforme..."}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  )}
                </div>

                {/* Join Link (Optional at initial publish, editable later) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <LinkIcon size={13} className="text-emerald-400" />
                      <span>{lang === "ar" ? "رابط الانضمام للحصة (اختياري)" : "Lien de participation (Optionnel)"}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {lang === "ar" ? "يمكنك إضافته لاحقاً عبر التعديل" : "Peut être ajouté plus tard"}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={joinUrl}
                    onChange={(e) => setJoinUrl(e.target.value)}
                    placeholder="https://discord.gg/... أو https://meet.google.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-400 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* General Title for non-live-class */}
            {selectedType !== "live_class" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {lang === "ar" ? "عنوان الموضوع (اختياري)" : "Titre (Optionnel)"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    selectedType === "alert"
                      ? lang === "ar"
                        ? "مثال: تنبيه بخصوص موعد إيداع بطاقات الاختيار"
                        : "Ex: Alerte calendrier"
                      : selectedType === "tip"
                      ? lang === "ar"
                        ? "مثال: نصيحة ذهبية لتنظيم مراجعة مادة الفيزياء"
                        : "Ex: Conseil révision Physique"
                      : lang === "ar"
                      ? "مثال: تحديثات هامة في روزنامة الامتحانات"
                      : "Ex: Mise à jour"
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                {selectedType === "live_class"
                  ? lang === "ar"
                    ? "وصف ومحاور الحصة المباشرة *"
                    : "Description de la séance *"
                  : lang === "ar"
                  ? "نص الإعلان أو المحتوى الكامل *"
                  : "Contenu de l'annonce *"}
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  selectedType === "tip"
                    ? lang === "ar"
                      ? "اكتب نصيحتك وتجربتك بالتفصيل لزملائك التلاميذ..."
                      : "Partagez votre astuce avec vos camarades..."
                    : selectedType === "alert"
                    ? lang === "ar"
                      ? "اكتب تفاصيل التنبيه الموجه للتلاميذ..."
                      : "Détails de l'alerte..."
                    : lang === "ar"
                    ? "اكتب تفاصيل الإعلان هنا..."
                    : "Détails de l'annonce..."
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none transition-all placeholder:text-slate-500 resize-y leading-relaxed"
              />
            </div>

            {/* 1. Attached PDF Documents Section (Up to 3 PDFs) - OPTIONAL */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {lang === "ar"
                      ? "إرفاق وثائق وملخصات للحصة (PDF)"
                      : "Joindre des documents (PDF)"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {lang === "ar" ? "اختياري" : "Optionnel"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {pdfAttachments.length} / 3
                </span>
              </div>

              {/* List of uploaded PDF attachments */}
              {pdfAttachments.length > 0 && (
                <div className="space-y-1.5">
                  {pdfAttachments.map((file, idx) => (
                    <div
                      key={file.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs"
                    >
                      <div className="flex items-center gap-2 text-indigo-300 font-bold truncate">
                        <FileText size={15} className="shrink-0 text-indigo-400" />
                        <span className="truncate">{file.name}</span>
                        {file.size && <span className="text-[10px] opacity-75">({file.size})</span>}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-black">
                          ✓ جاهز
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPdfAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-400 hover:text-rose-300 font-bold cursor-pointer rounded-lg hover:bg-rose-500/10 transition-colors"
                        title={lang === "ar" ? "إزالة الملف" : "Supprimer"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Dropzone for Documents (PDF) if < 3 */}
              {pdfAttachments.length < 3 && (
                <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-[#0A0F1D] ${
                  uploadingTarget === "attachment"
                    ? "border-indigo-500 bg-indigo-950/20"
                    : "border-slate-800 hover:border-indigo-500/60 cursor-pointer"
                }`}>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    disabled={uploadingTarget === "attachment"}
                    onChange={(e) => handleFileUpload(e, "attachment")}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed z-10"
                  />

                  {uploadingTarget === "attachment" ? (
                    <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-spin">
                        <Spinner size={18} />
                      </div>
                      <div className="w-full space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-indigo-300">{lang === "ar" ? "جارٍ معالجة ورفع الوثائق..." : "Téléversement…"}</span>
                          <span className="text-indigo-400 font-mono">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">{lang === "ar" ? "يرجى الانتظار لاكتمال النقل" : "Veuillez patienter"}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                        <Upload size={18} />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        {lang === "ar"
                          ? "اضغط لاختيار ملفات PDF أو اسحبها هنا (اختياري)"
                          : "Sélectionnez des fichiers PDF (Optionnel)"}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {lang === "ar"
                          ? "PDF فقط (حتى 25 ميغابايت لكل ملف) • حتى 3 ملفات"
                          : "PDF uniquement (Max 25 Mo / fichier) • Max 3 fichiers"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Dedicated Correction / Solution PDFs Section ("قسم الإصلاح") - Shown ONLY when editing */}
            {isEditing && (
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                        <span>{lang === "ar" ? "ملفات الإصلاح النموذجي (PDF)" : "Section Corrigés (PDF)"}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold">
                          {lang === "ar" ? "خاص بالتعديل" : "Mode Édition"}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {lang === "ar"
                          ? "يمكنك إضافة حتى 3 ملفات PDF لإصلاح التمارين والفرض بعد انتهاء الحصة (اختياري)"
                          : "Ajouter les corrigés en PDF (Optionnel, Max 3)"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {correctionPdfs.length} / 3
                  </span>
                </div>

                {/* List of uploaded Correction PDFs */}
                {correctionPdfs.length > 0 && (
                  <div className="space-y-1.5">
                    {correctionPdfs.map((file, idx) => (
                      <div
                        key={file.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs"
                      >
                        <div className="flex items-center gap-2 text-emerald-300 font-bold truncate">
                          <FileCheck size={15} className="shrink-0 text-emerald-400" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">
                            {lang === "ar" ? "إصلاح ✓" : "Corrigé"}
                          </span>
                          {file.size && <span className="text-[10px] opacity-75">({file.size})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCorrectionPdfs((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-400 hover:text-rose-300 font-bold cursor-pointer rounded-lg hover:bg-rose-500/10 transition-colors"
                          title={lang === "ar" ? "إزالة ملف الإصلاح" : "Supprimer"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Dropzone for Correction PDFs if < 3 */}
                {correctionPdfs.length < 3 && (
                  <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all bg-[#0A141A] ${
                    uploadingTarget === "correction"
                      ? "border-emerald-500 bg-emerald-950/30"
                      : "border-emerald-500/30 hover:border-emerald-400/60 cursor-pointer"
                  }`}>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      disabled={uploadingTarget === "correction"}
                      onChange={(e) => handleFileUpload(e, "correction")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed z-10"
                    />

                    {uploadingTarget === "correction" ? (
                      <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-spin">
                          <Spinner size={18} />
                        </div>
                        <div className="w-full space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-emerald-300">{lang === "ar" ? "جارٍ معالجة ورفع الإصلاح..." : "Téléversement corrigé…"}</span>
                            <span className="text-emerald-400 font-mono">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{lang === "ar" ? "يرجى الانتظار لاكتمال النقل" : "Veuillez patienter"}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                          <FileCheck size={18} />
                        </div>
                        <p className="text-xs font-bold text-emerald-200">
                          {lang === "ar"
                            ? "اضغط لاختيار ملفات إصلاح PDF (اختياري)"
                            : "Ajouter des corrigés PDF (Optionnel)"}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {lang === "ar"
                            ? "PDF فقط (حتى 25 ميغابايت لكل ملف) • حتى 3 ملفات"
                            : "PDF uniquement (Max 25 Mo / fichier) • Max 3 fichiers"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Automatic Author Identity (Read-only security block) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatar || user.avatarUrl}
                username={user.username}
                displayName={user.displayName}
                size={38}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{user.displayName || user.username}</span>
                  {user.role === "elite_student" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ⭐ تلميذ متميز
                    </span>
                  )}
                  {user.role === "teacher" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      👨‍🏫 أستاذ معتمد
                    </span>
                  )}
                  {user.role === "superadmin" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      👑 المشرف الأعلى
                    </span>
                  )}
                  {(!user.role || user.role === "member") && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                      🎓 تلميذ مسجل
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {lang === "ar" ? "تُوثق بيانات الناشر تلقائيًا من الحساب" : "Identité d'auteur vérifiée"}
                </p>
              </div>
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Check size={14} />
              <span>{lang === "ar" ? "موثق" : "Vérifié"}</span>
            </div>
          </div>

          {/* Error Feedback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {(() => {
            const isLiveClass = selectedType === "live_class";
            const isLiveClassValid = !isLiveClass || (!!title.trim() && !!subjectId && (isAllBranches || selectedBranches.length > 0) && !!date && !!startTime && (platform !== "Other" || !!customPlatformName.trim()));
            const isContentValid = !!content.trim();
            const isUploadFinished = uploadingTarget === null;
            const isFormValid = isContentValid && isLiveClassValid && isUploadFinished && !isSubmitting;

            return (
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 bg-slate-900/95 backdrop-blur-md py-2">
                <div className="text-xs">
                  {!isFormValid && (
                    <div className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>
                        {!isContentValid
                          ? (lang === "ar" ? "يرجى كتابة نص المحتوى أو التوجيه" : "Contenu requis")
                          : !isLiveClassValid
                          ? (lang === "ar" ? "يرجى إكمال عنوان وتاريخ وتوقيت الحصة المباشرة" : "Détails de la séance requis")
                          : !isUploadFinished
                          ? (lang === "ar" ? `انتظر اكتمال رفع الملفات (${uploadProgress}%)` : `Téléversement (${uploadProgress}%)`)
                          : ""}
                      </span>
                    </div>
                  )}
                  {isFormValid && (
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check size={13} />
                      <span>{lang === "ar" ? "كافة الخصائص مكتملة وجاهزة للنشر" : "Tous les champs sont prêts"}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {lang === "ar" ? "إلغاء" : "Annuler"}
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black text-slate-950 flex items-center gap-2 transition-transform shadow-lg shadow-amber-500/20 ${
                      isFormValid && !isSubmitting
                        ? "cursor-pointer active:scale-95 hover:opacity-95"
                        : "opacity-40 cursor-not-allowed grayscale"
                    }`}
                    style={{ background: GRAD_GOLD }}
                  >
                    {isSubmitting ? (
                      <span>{lang === "ar" ? "جاري الحفظ..." : "Enregistrement..."}</span>
                    ) : (
                      <>
                        <Send size={14} className="text-slate-950" />
                        <span>
                          {uploadingTarget !== null
                            ? (lang === "ar" ? "جارٍ رفع الملفات..." : "Téléversement…")
                            : isEditing
                            ? (lang === "ar" ? "حفظ التعديلات" : "Enregistrer")
                            : (lang === "ar" ? "نشر" : "Publier")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}
        </form>
      </div>
    </div>
  );
}
