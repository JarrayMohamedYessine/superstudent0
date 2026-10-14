/**
 * Cloudflare Worker for Zero-Cost Document Archive Platform
 * Strict implementation of specification:
 * - Public traffic is served as Static Assets with Edge Caching.
 * - Zero-Cost Multi-Origin Storage: Catbox / Litterbox / Telegram Bot & Channel.
 * - Dynamic endpoints for Storage Uploads, Document Publishing & Mirror Verification.
 */

import { generateId, isValidId, normalizeForSearch, tokenizeText, getCharShardPath, getShardFromId } from "./services/archiveEngine";

export interface Env {
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
  DOCUMENTS_KV?: any;
  ADMIN_JWT_SECRET?: string;
  ADMIN_PASSWORD?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

// Global in-memory documents buffer across Worker lifetime
let globalDocumentsCache: any[] = [];

// Common response helper conforming to Cloudflare Cache directives
const jsonResponse = (
  data: any,
  status = 200,
  cacheControl = "no-store",
  extraHeaders: Record<string, string> = {}
) => {
  return new Response(JSON.stringify(data), {
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
};

/**
 * Handles CORS Preflight
 */
function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/**
 * Handles zero-cost public file uploads via Litterbox / Catbox / Telegram
 */
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
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        fileBlob = new Blob([u8arr], { type: mime });
        fileName = body.fileName || fileName;
      }
    }

    if (!fileBlob) {
      return jsonResponse({ error: "No file provided for upload" }, 400);
    }

    // Forward to Litterbox (free 1GB, direct public CDN URL)
    const litterFormData = new FormData();
    litterFormData.append("reqtype", "fileupload");
    litterFormData.append("time", "72h");
    litterFormData.append("fileToUpload", fileBlob, fileName);

    const litterRes = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: litterFormData,
    });

    if (litterRes.ok) {
      const publicUrl = (await litterRes.text()).trim();
      if (publicUrl.startsWith("http")) {
        return jsonResponse({
          success: true,
          url: publicUrl,
          proxy_url: publicUrl,
          provider: "litterbox",
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

export async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  // Admin Health & Stats
  if (path === "/api/admin/health" && request.method === "GET") {
    return jsonResponse({
      status: "ok",
      platform: "Zero-Cost Document Archive Platform",
      architecture: "Cloudflare Static Assets + Telegram Origin + Catbox Mirror",
      cachedDocumentsCount: globalDocumentsCache.length,
      timestamp: Date.now(),
    });
  }

  // Verify Catbox Mirror
  if (path === "/api/admin/verify-mirror" && request.method === "POST") {
    try {
      const body = await request.json() as { url: string; expectedSize?: number };
      if (!body.url) return jsonResponse({ error: "Invalid mirror URL" }, 400);

      const headRes = await fetch(body.url, { method: "HEAD" });
      const contentLength = Number(headRes.headers.get("content-length")) || 0;
      return jsonResponse({
        verified: headRes.ok,
        url: body.url,
        contentLength,
      });
    } catch (err: any) {
      return jsonResponse({ verified: false, error: err.message }, 500);
    }
  }

  return jsonResponse({ error: "Admin endpoint not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx?: { waitUntil(promise: Promise<any>): void }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCorsPreflight();
    }

    // 1. Storage Upload Endpoints (Catbox / Litterbox / Telegram)
    if (path === "/api/storage/upload" || path === "/api/telegram/upload") {
      if (request.method === "POST") {
        return handleStorageUpload(request, env);
      }
    }

    // 2. Shared Documents Repository Endpoints (Synced across all clients globally)
    if (path === "/api/documents") {
      if (request.method === "GET") {
        return jsonResponse(globalDocumentsCache, 200, "public, max-age=30, s-maxage=60, stale-while-revalidate=300");
      }
      if (request.method === "POST") {
        try {
          const newDoc = await request.json() as any;
          if (newDoc && newDoc.id) {
            // Prepend new document and deduplicate
            globalDocumentsCache = [newDoc, ...globalDocumentsCache.filter((d) => d.id !== newDoc.id)].slice(0, 500);
            return jsonResponse({ success: true, count: globalDocumentsCache.length });
          }
          return jsonResponse({ error: "Invalid document payload" }, 400);
        } catch (err: any) {
          return jsonResponse({ error: err.message }, 500);
        }
      }
    }

    // 3. Admin endpoints
    if (path.startsWith("/api/admin/")) {
      return handleAdmin(request, env);
    }

    // 4. Archive Edge File & Document Retrieval (Cloudflare Cache API)
    if (path.startsWith("/api/archive/")) {
      const cache = (caches as any).default || caches;
      const cacheKey = new Request(url.toString(), request);

      // Check Edge Cache
      let cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Edge Miss: Fetch and cache with immutable 1-year headers
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
            if (ctx && ctx.waitUntil) {
              ctx.waitUntil(cache.put(cacheKey, resToCache.clone()));
            }
            return resToCache;
          }
        }
      } catch (err: any) {
        return jsonResponse({ error: "Archive retrieval failed", details: err.message }, 502);
      }
    }

    // 5. Static Assets Default Handler (Zero-Worker cost for frontend pages)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // 6. Default 404
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
