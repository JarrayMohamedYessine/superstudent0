import { Account, LangKey, UserRole } from "../types";
import { getJSON, setJSON } from "./dataService";

export interface AppNotification {
  id: string;
  recipientRole?: UserRole | "staff" | "all"; // staff = superadmin | moderator | elite_student
  targetEmail?: string; // for direct notification to specific account
  targetUsername?: string;
  title: Record<LangKey, string>;
  message: Record<LangKey, string>;
  type: "doc_approved" | "doc_pinned" | "elite_upgrade" | "moderation_ban" | "admin_broadcast" | "report_alert" | "system";
  iconType?: "bell" | "shield" | "file-check" | "star" | "alert" | "message" | "check";
  badgeLabel?: Record<LangKey, string>;
  actionUrl?: string; // screen to navigate to
  createdAt: number;
  readBy: string[]; // emails or usernames that marked it read
  pinned?: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = "superstudent_app_notifications_v1";

// Initial seed notifications - start clean with real notifications only
const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const ONBOARDING_GUIDE_NOTIFICATION_ID = "notif-student-onboarding-guide-v1";

export function getOnboardingGuideNotification(user: Account): AppNotification {
  const guideMessageAr = `مرحباً بك في منصة SuperStudent الرسمية لمراجعة الباكالوريا وسنوات الثانوي في تونس 🇹🇳. إليك دليلك الشامل لتحقيق أعلى المراتب والتميز:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 1. غرف المذاكرة التفاعلية لكل مادة:
• ادخل إلى قسم "شعب الباكالوريا" واختر مادتك لمناقشة التمارين مع زملائك من كامل أنحاء الجمهورية.
• يمكنك إرسال التمارين المعقدة والنقاش المنهجي مع المشرفين والتلاميذ المتميزين (Elite Students).
• المحادثات مراقبة آلياً لضمان بيئة تربوية هادئة ونقية من أي تشويش.

📍 2. تبادل الصور والمستندات وPDF:
• تظهر الصور مباشرة داخل المحادثة بشكل مصغر وأنيق (ألبوم صور متناسق).
• عند النقر على أي صورة، تُفتح في وضع ملء الشاشة الفوري مع إمكانية التحميل عالي الدقة أو التصفح بين الصور.
• يمكنك إرفاق حتى ملفين PDF في كل رسالة أو تمرين (مثل إرفاق الامتحان مع بطاقة الإصلاح النموذجي).

📍 3. بنك الامتحانات والأرشيف الوطني:
• يحتوي الأرشيف على جميع امتحانات الباكالوريا الرسمية التونسية (الدورة الرئيسية ودورة المراقبة).
• يمكن لجميع التلاميذ المسجلين تصفح وتحميل الفروض، التلاخيص، وسلالم التقييم (Barèmes) مجاناً.

📍 4. أداة التوجيه الجامعي 2026:
• حساب السكور ومطابقة الشعب والجامعات التونسية وفق دليل التوجيه الرسمي.

📍 5. ميثاق الشرف الأخلاقي وحماية الحساب:
• يُمنع نشر أي محتوى خارج عن النطاق التربوي أو استخدام ألفاظ غير لائقة.
• الإدارة تطبق نظام الحظر التلقائي والفوري على أي حساب يخالف ميثاق الاحترام المتبادل.

نتمنى لك رحلة مراجعة ممتعة، مليئة بالجد والمثابرة، وتتويجاً بالنجاح الباهر ومعدل استثنائي في الباكالوريا! 🌟`;

  const guideMessageFr = `Bienvenue sur la plateforme officielle SuperStudent pour le Baccalauréat tunisien 🇹🇳. Voici votre guide complet pour réussir avec excellence :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 1. Salles de Révision par Matière :
• Accédez aux salons dédiés de votre section pour échanger avec vos camarades partout en Tunisie.
• Posez vos questions et débattez des méthodes avec les Modérateurs et Élèves Élite.

📍 2. Partage d'Images et Documents PDF :
• Les images s'affichent en album interactif avec zoom plein écran et téléchargement instantané.
• Possibilité d'attacher jusqu'à 2 fichiers PDF par message (par exemple une épreuve et son corrigé).

📍 3. Banque d'Épreuves Officielles :
• Téléchargement libre et illimité de toutes les sessions du Bac tunisien avec barèmes officiels.

📍 4. Guide d'Orientation Universitaire 2026 :
• Calcul de score FG et recherche des filières universitaires officielles.

📍 5. Charte de Respect :
• Tout propos inapproprié entraîne une sanction immédiate.

Excellente réussite dans votre préparation du Baccalauréat ! 🌟`;

  return {
    id: `${ONBOARDING_GUIDE_NOTIFICATION_ID}-${(user.email || user.username || "").toLowerCase()}`,
    targetEmail: (user.email || "").toLowerCase(),
    targetUsername: user.username,
    title: {
      ar: "📘 دليل الاستعمال الشامل والتوجيهات الذهبية للنجاح في الباكالوريا 🇹🇳",
      fr: "📘 Guide d'Utilisation Complet & Conseils Clés pour le Bac 🇹🇳",
      en: "📘 Comprehensive User Guide & Golden Keys to Baccalaureate Success 🇹🇳",
    },
    message: {
      ar: guideMessageAr,
      fr: guideMessageFr,
      en: guideMessageAr,
    },
    type: "system",
    iconType: "star",
    badgeLabel: {
      ar: "دليل الاستعمال الرسمي",
      fr: "Guide Officiel",
      en: "Official Guide",
    },
    actionUrl: "home",
    createdAt: Date.now(),
    readBy: [],
    pinned: true,
  };
}

export async function getAllNotifications(): Promise<AppNotification[]> {
  try {
    const stored = await getJSON<AppNotification[]>(NOTIFICATIONS_STORAGE_KEY, true);
    if (!stored || stored.length === 0) {
      await setJSON(NOTIFICATIONS_STORAGE_KEY, INITIAL_NOTIFICATIONS, true);
      return INITIAL_NOTIFICATIONS;
    }
    return stored.sort((a: AppNotification, b: AppNotification) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error loading notifications:", err);
    return INITIAL_NOTIFICATIONS;
  }
}

export async function getUserNotifications(user: Account | null): Promise<AppNotification[]> {
  if (!user) return [];
  const all = await getAllNotifications();
  const userIdentifier = (user.email || user.username || "").toLowerCase();

  const userItems = all.filter((n) => {
    // 1. Direct recipient match
    if (n.targetEmail && n.targetEmail.toLowerCase() === userIdentifier) return true;
    if (n.targetUsername && n.targetUsername.toLowerCase() === user.username.toLowerCase()) return true;

    // 2. Role matching
    if (n.recipientRole === "all") return true;
    if (n.recipientRole === user.role) return true;
    if (n.recipientRole === "staff" && (user.role === "superadmin" || user.role === "moderator" || user.role === "elite_student")) {
      return true;
    }

    return false;
  });

  // Ensure onboarding guide is always present for the user
  const hasOnboardingGuide = userItems.some(
    (n) => n.id.startsWith(ONBOARDING_GUIDE_NOTIFICATION_ID)
  );

  if (!hasOnboardingGuide) {
    const guideNotif = getOnboardingGuideNotification(user);
    // Add to user notifications at the top
    userItems.unshift(guideNotif);
    // Save in background
    createNotification(guideNotif).catch(() => {});
  }

  return userItems;
}

export function isNotificationUnread(notif: AppNotification, user: Account | null): boolean {
  if (!user) return false;
  const userIdentifier = (user.email || user.username || "").toLowerCase();
  return !notif.readBy.some((id) => id.toLowerCase() === userIdentifier);
}

export async function markNotificationAsRead(notifId: string, user: Account): Promise<void> {
  try {
    const all = await getAllNotifications();
    const userIdentifier = (user.email || user.username || "").toLowerCase();
    const updated = all.map((n) => {
      if (n.id === notifId) {
        if (!n.readBy.some((id) => id.toLowerCase() === userIdentifier)) {
          return { ...n, readBy: [...n.readBy, userIdentifier] };
        }
      }
      return n;
    });
    await setJSON(NOTIFICATIONS_STORAGE_KEY, updated, true);
  } catch (err) {
    console.error("Error marking notification read:", err);
  }
}

export async function markAllNotificationsAsRead(user: Account): Promise<void> {
  try {
    const all = await getAllNotifications();
    const userIdentifier = (user.email || user.username || "").toLowerCase();
    const updated = all.map((n) => {
      if (!n.readBy.some((id) => id.toLowerCase() === userIdentifier)) {
        return { ...n, readBy: [...n.readBy, userIdentifier] };
      }
      return n;
    });
    await setJSON(NOTIFICATIONS_STORAGE_KEY, updated, true);
  } catch (err) {
    console.error("Error marking all notifications read:", err);
  }
}

export async function createNotification(
  notif: Omit<AppNotification, "id" | "createdAt" | "readBy">
): Promise<AppNotification> {
  try {
    const all = await getAllNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      readBy: [],
    };
    const updated = [newNotif, ...all].slice(0, 100); // keep last 100
    await setJSON(NOTIFICATIONS_STORAGE_KEY, updated, true);
    return newNotif;
  } catch (err) {
    console.error("Error creating notification:", err);
    throw err;
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await setJSON(NOTIFICATIONS_STORAGE_KEY, [], true);
  } catch (err) {
    console.error("Error clearing notifications:", err);
  }
}
