/**
 * ggggyyr4364 — Super-Admin verifier Worker for SuperStudent.
 *
 * التثبيت على Cloudflare Workers:
 *   1. أنشئ Worker جديدًا باسم ggggyyr4364 (لوحة Cloudflare → Workers → Create).
 *   2. أضف متغيرًا باسم `x` (Settings → Variables and Secrets) وضع فيه بريد
 *      المشرف الأعلى (الإدارة). مثال: x = your-email@gmail.com
 *   3. انشر هذا الملف (لصق الكود في المحرر أو `npx wrangler deploy ggggyyr4364.js`).
 *   4. ضع رابط الـ Worker النهائي في متغير البيئة VITE_ADMIN_CHECK_URL
 *      في إعداد الموقع، مثال:
 *      https://ggggyyr4364.<your-subdomain>.workers.dev
 *
 * لماذا هذا يستهلك أقل عدد من الطلبات؟
 *   - التحقق من البريد هنا مقارنة مباشرة (O(1)) مع المتغير `x` — لا يوجد أي بحث.
 *   - الواجهة تستدعي هذا الـ Worker مرة واحدة فقط لكل بريد في الجلسة
 *     (عند تسجيل الدخول/إنشاء الحساب) والنتيجة تُحفظ في الذاكرة فقط،
 *     فلا تتكرر الطلبات عند التنقل بين الصفحات أو تكرار أي إجراء إداري.
 *
 * الواجهة البرمجية:
 *   POST /  { "email": "..." }  →  { "admin": true | false }
 *   GET  /?email=...           →  { "admin": true | false }
 */

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request: Request, env: { x?: string }): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    let email: string | null = null;
    try {
      const url = new URL(request.url);
      email = url.searchParams.get("email");
      if (!email && request.method === "POST") {
        const body = (await request.json().catch(() => null)) as { email?: string } | null;
        email = body?.email ?? null;
      }
    } catch {
      email = null;
    }

    const adminEmail = String(env?.x || "").trim().toLowerCase();
    const isAdmin =
      Boolean(adminEmail) &&
      Boolean(email && email.trim().toLowerCase() === adminEmail);

    return new Response(JSON.stringify({ admin: isAdmin }), {
      status: 200,
      headers: jsonHeaders,
    });
  },
};
