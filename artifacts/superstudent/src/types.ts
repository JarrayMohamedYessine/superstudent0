export type LangKey = "ar" | "fr" | "en";

export type GradeLevel = "2eme" | "3eme" | "4eme_bac";

export type UserRole = "superadmin" | "teacher" | "moderator" | "elite_student" | "member";

export type DocumentType = "serie" | "resume" | "devoir" | "examen" | "cours" | "correction";
export type TrimestreKey = "all" | "t1" | "t2" | "t3";
export type CorrigeStatus = "all" | "with" | "without";

export interface BacDocumentItem {
  id: string;
  title: string;
  subjectId: string;
  branchIds: string[];
  type: DocumentType;
  trimestre: TrimestreKey;
  hasCorrige: boolean;
  year?: number;
  fileSize: string;
  downloadCount: number;
  pdfUrl?: string;
  pdfDataUrl?: string;
  examFileName?: string;
  corrigePdfUrl?: string;
  corrigePdfDataUrl?: string;
  corrigeFileName?: string;
  corrigeFileSize?: string;
  pageImages?: string[];
  corrigePageImages?: string[];
  totalPages?: number;
  contentSnippet?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorName?: string;
  authorAvatar?: string | null;
  authorRole?: UserRole;
  createdAt: number;
}

export type AnnouncementType = "live_class" | "alert" | "announcement" | "tip";

export interface PdfAttachment {
  id: string;
  name: string;
  size?: string;
  url?: string;
  dataUrl?: string;
}

export interface SuperAnnouncement {
  id: string;
  type: AnnouncementType;
  title?: string;
  content: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatar?: string | null;
  authorRole: UserRole;
  authorEmail?: string;
  // Live Class specific fields (canonical from Document Bank):
  subjectId?: string;
  targetBranches?: string[]; // array of branch IDs or ["all"]
  isAllBranches?: boolean;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  platform?: "Discord" | "Google Meet" | "Zoom" | "YouTube" | "Other" | string;
  customPlatformName?: string;
  joinUrl?: string; // optional at creation, editable later
  // Attached PDF Files (Up to 3 PDFs: summaries, lesson sheets, exercises)
  pdfAttachments?: PdfAttachment[];
  // Legacy single attachment support
  pdfAttachmentUrl?: string;
  pdfAttachmentName?: string;
  pdfAttachmentSize?: string;
  // Correction PDF Files (Up to 3 PDFs: "قسم الإصلاح" added during edit)
  correctionPdfs?: PdfAttachment[];
  // Timestamps
  createdAt: number;
  updatedAt?: number;
}

export interface HomepageAnnouncement {
  id: string;
  title: Record<LangKey, string> | string;
  message: Record<LangKey, string> | string;
  targetRoles: ("all" | UserRole | string)[];
  targetBranches: ("all" | string)[]; // "all" or specific branch ids
  durationHours: number; // 12 to 72 hours
  createdAt: number;
  expiresAt: number;
  badge?: Record<LangKey, string> | string;
  style?: "info" | "urgent" | "gold" | "exam" | "emerald" | "indigo" | "rose" | "cyan";
  authorEmail?: string;
  isActive: boolean;
}

export interface Account {
  id?: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  avatarUrl?: string | null;
  branch: string;
  gradeLevel?: GradeLevel;
  role: UserRole;
  moderatorRooms: string[];
  banned: boolean;
  bannedUntil: number | null;
  mutes?: Record<string, number>;
  createdAt: number;
  oauth?: boolean;
  mfaEnabled?: boolean;
  trackedWeaknesses?: string[];
  canUpload?: boolean; // خاصية إذن رفع الوثائق والفروض للتلاميذ المحددين من المشرف الأعلى
  needsBranchSetup?: boolean;
  accessCode?: string; // كود الدخول السريع المخصص للطالب
}

export type BranchInfo = BranchItem;

export interface RoomMessage {
  id: string;
  roomId: string;
  userId?: string;
  username: string;
  displayName: string;
  text: string;
  createdAt: number;
  avatarUrl?: string | null;
  avatar?: string | null;
  isAi?: boolean;
}


export interface ExamPaper {
  id: string;
  title: string;
  subject: string;
  branch: string;
  year: number;
  session: "principale" | "controle";
  pdfUrl?: string;
  correctionPdfUrl?: string;
  durationHours?: number;
  coefficient?: number;
}


export interface SubjectItem {
  name: Record<LangKey, string>;
  mono: Record<LangKey, string>;
  color: string;
}

export interface RoomItem {
  roomId: string;
  subject: string;
  shared?: boolean;
  branch?: BranchItem;
  isSpecial?: "mods-only" | "admin-mod-channel";
}

export interface BranchItem {
  id: string;
  name: Record<LangKey, string>;
  mono: Record<LangKey, string>;
  color: string;
  rooms: RoomItem[];
}

export interface MessageAttachmentPdf {
  url?: string;
  dataUrl?: string;
  fileName: string;
  sizeKB: number;
}

export interface MessageItem {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  text: string;
  images: string[] | null;
  pdf: MessageAttachmentPdf | null;
  createdAt: number;
  deleted?: boolean;
  deletedBy?: string;
}

export interface BacArchiveItem {
  id: string;
  year: number;
  branchId: string;
  subjectId: string;
  session: "principale" | "controle";
  title: string;
  downloadUrl?: string;
  officialBarèmeSummary: string;
  keyFormulas?: string[];
}

export interface ComplaintReport {
  id: string;
  reporterUsername: string;
  reportedUser?: string;
  messageId?: string;
  roomId?: string;
  reason: string;
  details?: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorEmail: string;
  actorRole: string;
  action: string;
  target?: string;
  details?: string;
}

export interface CMSLessonItem {
  id: string;
  branchId: string;
  subjectId: string;
  gradeLevel: GradeLevel;
  title: Record<LangKey, string>;
  content: string;
  keyPoints: string[];
  author: string;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  title: Record<LangKey, string>;
  body: Record<LangKey, string>;
  timestamp: number;
  read: boolean;
  type: "system" | "admin" | "moderation" | "badge";
}

export interface AIHistoryMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  mode?: string;
  subject?: string;
  provider?: string;
  model?: string;
  fallbackChain?: string[];
}

export interface ChatMediaItem {
  id: string;
  messageId: string;
  roomId: string;
  roomTitle?: string;
  branchName?: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatar?: string | null;
  textSnippet?: string;
  type: "image" | "pdf";
  url?: string;
  dataUrl?: string;
  fileName?: string;
  sizeKB?: number;
  createdAt: number;
}

export interface StudentFeedbackItem {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  branch: string;
  gradeLevel?: GradeLevel;
  rating: number; // 1 to 5
  category: "ai_assistant" | "rooms" | "general" | "suggestion" | "documents";
  comment: string;
  resolved?: boolean;
  createdAt: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  authorEmail?: string;
  authorRole?: string;
  createdAt: number;
}

export interface EliteApplicationItem {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string | null;
  branch: string;
  gradeLevel?: GradeLevel;
  applicantRole: "student" | "professor"; // تلميذ متميز أو أستاذ
  specialty?: string; // اختصاص الأستاذ (مثال: رياضيات، فيزياء، إعلامية، فلسفة...)
  discordUsername?: string; // اسم المستخدم في ديسكورد للتواصل مع المشرفين
  schoolType?: "pilot" | "general"; // معهد نموذجي أو عادي (للتلاميذ)
  averageScore?: number; // المعدل
  reason: string;
  proofImageUrl?: string; // صورة الإثبات (كشف أعداد / شهادة عمل أو حضور)
  status: "pending" | "approved" | "rejected";
  roleRequested?: string;
  statement?: string;
  sampleMaterialsUrl?: string;
  submittedAt?: number;
  reviewedAt?: number;
  reviewedBy?: string;
  uploadedPdfs?: { id: string; title: string; url?: string; uploadedAt: number }[]; // ملفات PDF المرفوعة والمخزنة للمتقدم بعد قبوله
  createdAt: number;
}

export interface SuccessStoryItem {
  id: string;
  studentName: string;
  branchId: string;
  bacYear: number;
  bacScore: number;
  orientationFaculty: string;
  quote: string;
  keyAdvice: string;
  avatarUrl?: string;
  consentConfirmed: boolean;
  status: "approved" | "pending";
  createdAt: number;
}

export interface MonthlyPollOption {
  id: string;
  text: Record<LangKey, string> | string;
  votes: number;
}

export interface MonthlyPollItem {
  id: string;
  monthTitle: Record<LangKey, string> | string;
  question: Record<LangKey, string> | string;
  options: MonthlyPollOption[];
  totalVotes: number;
  isActive: boolean;
  votedUserIds?: string[];
  createdAt: number;
}

export interface ContactTicketItem {
  id: string;
  senderName: string;
  senderEmail: string;
  username?: string;
  subject: string;
  category: "general" | "bug" | "suggestion" | "partnership" | "complaint";
  message: string;
  status: "pending" | "answered" | "archived";
  adminNotes?: string;
  createdAt: number;
}

export interface ChangelogItem {
  id: string;
  version: string;
  releaseDate: string;
  title: Record<LangKey, string> | string;
  badge: string;
  highlights: (Record<LangKey, string> | string)[];
  type: "major" | "feature" | "security" | "improvement";
}

export interface AiMessageReaction {
  messageId: string;
  querySnippet: string;
  rating: "up" | "down";
  comment?: string;
  simplifiedRequested?: boolean;
  timestamp: number;
}

export interface StudentGrades {
  mg?: number;
  ar?: number;
  ph?: number;
  hg?: number;
  f?: number;
  ang?: number;
  m?: number;
  sp?: number;
  svt?: number;
  ec?: number;
  ge?: number;
  te?: number;
  algo?: number;
  sti?: number;
  sb?: number;
  spSport?: number;
  ep?: number;
  esp?: number;
  it?: number;
  all?: number;
  spt?: number;
  isMainSession: boolean;
  fg?: number;
}



