/**
 * Cloudflare Worker — Zero-Cost Archive Platform (FINAL)
 * Cloudflare Cache (3 مدد) + Telegram (أسرار ونسخ احتياطية) + Catbox (ملفات دائمة)
 * - الروابط (file-links): كاش يوم ← تحديث تلقائي بعد انتهائه
 * - النصوص: كاش أسبوع ← تُقرأ دائماً من ملفات الموقع
 * - الأسرار: Telegram فقط + كاش يوم (لا يُحفظ أي سر في الملفات أو الكود)
 */

import { generateId, isValidId, normalizeForSearch, tokenizeText, getCharShardPath, getShardFromId } from "./services/archiveEngine";

export interface Env {
  ASSETS?: { fetch(request: Request): Promise<Response> };
  DOCUMENTS_KV?: any;
  ADMIN_JWT_SECRET?: string;
  ADMIN_PASSWORD?: string;
  TELEGRAM_BOT_TOKEN?: string;   // wrangler secret put — تيلغرام فقط
  CATBOX_USERHASH?: string;      // wrangler secret put — رفع Catbox الدائم
  SECRETS_FILE_ID?: string;      // [vars] file_id لملف secrets.json في القناة
  BACKUP_FILE_ID?: string;       // [vars] file_id لنسخة texts.json الاحتياطية
}

// ===== سياسة الكاش الواحدة — لا تعديل عليها دون قصد =====
const TTL = {
  LINKS:   86400,   // روابط catbox: يوم
  TEXTS:   604800,  // نصوص: أسبوع
  SECRETS: 86400,   // أسرار: يوم
  DOCS:    300,     // قائمة الوثائق المشتركة
} as const;

let globalDocumentsCache: any[] = [];

const jsonResponse = (data: any, status = 200, cacheControl = "no-store", extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...extraHeaders,
    },
  });

function handleCorsPreflight(): Response {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "public, max-age=86400",
  }});
}

/** تخزين في كاش الحافة بمدة محددة + stale-while-revalidate (تحديث تلقائي بعد انتهاء المدة) */
async function edgeCachePut(
  ctx: { waitUntil(p: Promise<any>): void } | undefined,
  cache: Cache,
  key: Request,
  res: Response,
  ttl: number
): Promise<Response> {
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", `public, max-age=${Math.min(ttl, 3600)}, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);
  headers.set("Access-Control-Allow-Origin", "*");
  const cached = new Response(res.body, { status: res.status, headers });
  if (ctx?.waitUntil) {
    ctx.waitUntil(cache.put(key, cached.clone()));
  } else {
    await cache.put(key, cached.clone());
  }
  return cached;
}

/** جلب ملف JSON من تيلغرام عبر file_id (دقيق — لا بحث ولا تخمين) */
async function fetchTelegramJsonFile(env: Env, fileId: string): Promise<any> {
  const token = env.TELEGRAM_BOT_TOKEN!;
  const metaRes = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  const meta = (await metaRes.json()) as any;
  if (!meta.ok) throw new Error("Telegram getFile failed: " + JSON.stringify(meta));
  const raw = await fetch(`https://api.telegram.org/file/bot${token}/${meta.result.file_path}`);
  if (!raw.ok) throw new Error("Telegram file download failed");
  return raw.json();
}

// ====== الرفع الدائم إلى Catbox (روابط لا تنتهي) ======
export async function handleStorageUpload(request: Request, env: Env): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") || "";
    let fileBlob: Blob | null = null;
    let fileName = `document_${Date.now()}.pdf`;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const fileEntry = formData.get("file") || formData.get("fileToUpload");
      if (fileEntry && typeof fileEntry !== "string") {
        fileBlob = fileEntry;
        fileName = (formData.get("fileName") as string) || fileEntry.name || fileName;
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json() as any;
      if (body.dataUrl) {
        const parts = body.dataUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "application/pdf";
        const bstr = atob(parts[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
        fileBlob = new Blob([u8arr], { type: mime });
        fileName = body.fileName || fileName;
      }
    }

    if (!fileBlob) return jsonResponse({ error: "No file provided for upload" }, 400);

    // Catbox دائم (userhash) — الروابط لا تنتهي أبداً
    const catForm = new FormData();
    catForm.append("reqtype", "fileupload");
    if (env.CATBOX_USERHASH) catForm.append("userhash", env.CATBOX_USERHASH);
    catForm.append("fileToUpload", fileBlob, fileName);

    const catRes = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: catForm });
    if (catRes.ok) {
      const publicUrl = (await catRes.text()).trim();
      if (publicUrl.startsWith("http")) {
        // الرابط يُحفظ بعدها في ملف الموقع data/file-links.json (عبر نشر الأدمن)
        return jsonResponse({
          success: true,
          url: publicUrl,
          proxy_url: publicUrl,
          provider: "catbox",
          permanent: true,
          fileName,
          sizeBytes: fileBlob.size,
        });
      }
    }
    return jsonResponse({ error: "Upstream storage provider did not return valid URL" }, 502);
  } catch (err: any) {
    return jsonResponse({ error: "Storage upload failed", details: err.message }, 500);
  }
}

// ====== الأسرار: تيلغرام فقط + كاش يوم ======
async function handleSecrets(
  request: Request,
  env: Env,
  ctx?: { waitUntil(p: Promise<any>): void }
): Promise<Response> {
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.split("/")[3] || "");
  if (!key || !/^[a-zA-Z0-9_-]+$/.test(key)) {
    return jsonResponse({ error: "Invalid secret key" }, 400);
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.SECRETS_FILE_ID) {
    return jsonResponse({ error: "Secrets origin not configured" }, 500);
  }

  const cache = (caches as any).default as Cache;
  const cacheKey = new Request(new URL("/.internal/secrets.json", url.origin).toString(), request);

  // 1) كاش الحافة (مدة يوم)
  const hit = await cache.match(cacheKey);
  if (hit) {
    const data = await hit.json();
    if (!(key in data)) return jsonResponse({ error: "Not found" }, 404);
    return jsonResponse({ [key]: data[key] }, 200, "no-store");
  }

  // 2) جلب من تيلغرام عبر file_id الدقيق وتخزينه في الكاش يوماً
  try {
    const data = await fetchTelegramJsonFile(env, env.SECRETS_FILE_ID);
    const toCache = new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
    await edgeCachePut(ctx, cache, cacheKey, toCache, TTL.SECRETS);
    if (!(key in data)) return jsonResponse({ error: "Not found" }, 404);
    return jsonResponse({ [key]: data[key] }, 200, "no-store");
  } catch (err: any) {
    return jsonResponse({ error: "Secrets fetch failed", details: err.message }, 502);
  }
}

export async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") return handleCorsPreflight();

  if (path === "/api/admin/health" && request.method === "GET") {
    return jsonResponse({
      status: "ok",
      platform: "Zero-Cost Document Archive Platform",
      architecture: "Cloudflare Cache (links:1d, texts:1w, secrets:1d) + Telegram Origin + Catbox Mirror",
      cachedDocumentsCount: globalDocumentsCache.length,
      timestamp: Date.now(),
    });
  }

  if (path === "/api/admin/verify-mirror" && request.method === "POST") {
    try {
      const body = await request.json() as { url: string; expectedSize?: number };
      if (!body.url) return jsonResponse({ error: "Invalid mirror URL" }, 400);
      const headRes = await fetch(body.url, { method: "HEAD" });
      const contentLength = Number(headRes.headers.get("content-length")) || 0;
      return jsonResponse({ verified: headRes.ok, url: body.url, contentLength });
    } catch (err: any) {
      return jsonResponse({ verified: false, error: err.message }, 500);
    }
  }

  return jsonResponse({ error: "Admin endpoint not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx?: { waitUntil(p: Promise<any>): void }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return handleCorsPreflight();

    // 1) الرفع (Catbox دائم)
    if ((path === "/api/storage/upload" || path === "/api/telegram/upload") && request.method === "POST") {
      return handleStorageUpload(request, env);
    }

    // 2) الأسرار — تيلغرام فقط، كاش يوم
    if (path.startsWith("/api/secrets/") && request.method === "GET") {
      return handleSecrets(request, env, ctx);
    }

    // 3) قائمة الوثائق المشتركة
    if (path === "/api/documents") {
      if (request.method === "GET") {
        return jsonResponse(
          globalDocumentsCache,
          200,
          `public, max-age=${TTL.DOCS}, s-maxage=${TTL.DOCS}, stale-while-revalidate=600`
        );
      }
      if (request.method === "POST") {
        try {
          const newDoc = await request.json() as any;
          if (newDoc && newDoc.id) {
            globalDocumentsCache = [newDoc, ...globalDocumentsCache.filter((d) => d.id !== newDoc.id)].slice(0, 500);
            return jsonResponse({ success: true, count: globalDocumentsCache.length });
          }
          return jsonResponse({ error: "Invalid document payload" }, 400);
        } catch (err: any) {
          return jsonResponse({ error: err.message }, 500);
        }
      }
    }

    // 4) الأدمن (بدون تغيير)
    if (path.startsWith("/api/admin/")) return handleAdmin(request, env);

    // 5) ملفات البيانات — القراءة دائماً من ملفات الموقع، بثلاث طبقات كاش
    if (path.startsWith("/data/")) {
      const cache = (caches as any).default as Cache;
      const cacheKey = new Request(url.toString(), request);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      if (env.ASSETS) {
        let res = await env.ASSETS.fetch(request);
        // احتياطي تيلغرام: إذا النص مفقود من الموقع، جلب نسخته من القناة
        if (!res.ok && path === "/data/texts.json" && env.TELEGRAM_BOT_TOKEN && env.BACKUP_FILE_ID) {
          try {
            const data = await fetchTelegramJsonFile(env, env.BACKUP_FILE_ID);
            res = new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json; charset=utf-8" },
            });
          } catch {
            /* يبقى الـ 404 الأصلي */
          }
        }
        if (res.ok) {
          const ttl = path.startsWith("/data/file-links")
            ? TTL.LINKS                                // روابط: يوم ← تحديث تلقائي بعد انتهائه
            : path.endsWith(".json")
            ? TTL.TEXTS                                // نصوص: أسبوع
            : 3600;
          return edgeCachePut(ctx, cache, cacheKey, res, ttl);
        }
      }
      return res;
    }

    // 6) الأرشيف الساكن (بدون تغيير)
    if (path.startsWith("/api/archive/")) {
      const cache = (caches as any).default as Cache;
      const cacheKey = new Request(url.toString(), request);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      try {
        if (env.ASSETS) {
          const assetRes = await env.ASSETS.fetch(request);
          if (assetRes.ok) {
            const resToCache = new Response(assetRes.body, {
              status: assetRes.status,
              headers: {
                ...Object.fromEntries(assetRes.headers),
                "Cache-Control": "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=60",
                "Access-Control-Allow-Origin": "*",
              },
            });
            if (ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, resToCache.clone()));
            return resToCache;
          }
        }
      } catch (err: any) {
        return jsonResponse({ error: "Archive retrieval failed", details: err.message }, 502);
      }
    }

    // 7) الأصول الساكنة الافتراضية (لا تغيير)
    if (env.ASSETS) return env.ASSETS.fetch(request);

    return new Response("Not Found", { status: 404, headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Content-Type": "text/plain; charset=utf-8",
    }});
  },
};
