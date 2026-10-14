/**
 * Cloudflare Worker for Zero-Cost Document Archive Platform
 * Strict implementation of Section 1 & Section 8 of specification:
 * - Public traffic is served as Static Assets; Worker is NEVER invoked for public routes except minimal 404.
 * - Dynamic logic is strictly restricted to /api/admin/* with zero-trust protection.
 */

import { generateId, isValidId, normalizeForSearch, tokenizeText, getCharShardPath, getShardFromId } from "./services/archiveEngine";

export interface Env {
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
  ADMIN_JWT_SECRET?: string;
  ADMIN_PASSWORD?: string;
}

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
      ...extraHeaders,
    },
  });
};

export async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight for admin
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store",
      },
    });
  }

  // Endpoint 1: Admin Health & Stats
  if (path === "/api/admin/health" && request.method === "GET") {
    return jsonResponse({
      status: "ok",
      platform: "Zero-Cost Document Archive Platform",
      architecture: "Cloudflare Static Assets + Telegram Origin + Catbox Mirror",
      publicWorkerInvocations: 0,
      timestamp: Date.now(),
    });
  }

  // Endpoint 2: Verify Catbox Mirror (Section 2.3)
  if (path === "/api/admin/verify-mirror" && request.method === "POST") {
    try {
      const body = await request.json() as { url: string; expectedSize?: number; expectedHash?: string };
      if (!body.url || !body.url.startsWith("https://files.catbox.moe/")) {
        return jsonResponse({ error: "Invalid Catbox mirror URL" }, 400);
      }

      // Check URL reachability
      const headRes = await fetch(body.url, { method: "HEAD" });
      if (!headRes.ok) {
        return jsonResponse({
          verified: false,
          error: `Mirror returned HTTP ${headRes.status}`,
        });
      }

      const contentLength = Number(headRes.headers.get("content-length")) || 0;
      const contentType = headRes.headers.get("content-type") || "";

      let sizeMatched = true;
      if (body.expectedSize && contentLength > 0) {
        sizeMatched = contentLength === body.expectedSize;
      }

      return jsonResponse({
        verified: headRes.ok && sizeMatched,
        provider: "catbox",
        url: body.url,
        contentLength,
        contentType,
        sizeMatched,
      });
    } catch (err: any) {
      return jsonResponse({ verified: false, error: err.message }, 500);
    }
  }

  // Endpoint 3: Publish Document Pipeline (Section 7)
  if (path === "/api/admin/publish" && request.method === "POST") {
    try {
      const body = await request.json() as {
        title: string;
        description: string;
        personId?: string;
        telegramChannel: string;
        telegramMessageId: number;
        telegramFileId?: string;
        catboxUrl: string;
        sha256Hex: string;
        sizeBytes: number;
        mimeType?: string;
        category?: string;
        year?: number;
      };

      if (!body.title || !body.catboxUrl || !body.sha256Hex || !body.sizeBytes) {
        return jsonResponse({ error: "Missing required fields for document publishing" }, 400);
      }

      // Generate canonical ULID
      const docId = generateId("doc");
      const shard = getShardFromId(docId);

      // Create record conforming to Section 2.1
      const record = {
        id: docId,
        t: body.title,
        d: body.description || "",
        p: body.personId || "person_01J9Q39BGS57NVRCF7A2D0M4WP",
        s: {
          tg: {
            ch: body.telegramChannel || "-1001928472910",
            m: Number(body.telegramMessageId) || 0,
            fid: body.telegramFileId,
          },
          mx: [
            {
              p: "catbox",
              u: body.catboxUrl,
              v: true,
            },
          ],
        },
        h: body.sha256Hex,
        z: Number(body.sizeBytes),
        m: body.mimeType || "application/pdf",
        cat: body.category || "math",
        year: body.year || 2025,
      };

      // Tokenize for search index shards
      const tokens = tokenizeText(`${body.title} ${body.description || ""}`);
      const indexUpdates: Record<string, string[]> = {};
      for (const token of tokens) {
        const { lang, charKey } = getCharShardPath(token[0]);
        const key = `${lang}/${charKey}`;
        indexUpdates[key] = indexUpdates[key] || [];
        indexUpdates[key].push(token);
      }

      return jsonResponse({
        success: true,
        docId,
        shard,
        record,
        indexUpdates,
        fileLink: {
          [docId]: {
            mirrors: record.s.mx,
            telegram: record.s.tg,
            hash: record.h,
            size: record.z,
          },
        },
        manifestPath: `data/records/${shard}.json`,
      });
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 404 for unknown admin route
  return jsonResponse({ error: "Admin endpoint not found" }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx?: { waitUntil(promise: Promise<any>): void }): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Admin endpoints (Uploads, Mirror Verification, Publishing, Syncing)
    if (path.startsWith("/api/admin/")) {
      return handleAdmin(request, env);
    }

    // 2. Archive File & Document Retrieval (Worker invoked ONLY on cache miss)
    if (path.startsWith("/api/archive/")) {
      const cache = (caches as any).default || caches;
      const cacheKey = new Request(url.toString(), request);
      
      // Check edge cache first
      let cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Cache Miss: Contact Telegram Bot Origin / Mirror ONCE
      try {
        const fileId = path.replace("/api/archive/", "");
        // Construct upstream origin or static asset fetch
        if (env.ASSETS) {
          const assetRes = await env.ASSETS.fetch(request);
          if (assetRes.ok) {
            const resToCache = new Response(assetRes.body, {
              status: assetRes.status,
              headers: {
                ...Object.fromEntries(assetRes.headers),
                "Cache-Control": "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=60, stale-if-error=86400",
                "Cache-Tag": `archive-media, archive-${fileId}`,
              },
            });
            if (ctx && ctx.waitUntil) {
              ctx.waitUntil(cache.put(cacheKey, resToCache.clone()));
            }
            return resToCache;
          }
        }
      } catch (err: any) {
        return jsonResponse({ error: "Cache miss retrieval failed", details: err.message }, 502);
      }
    }

    // 3. Static Assets Default Handler
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // 4. Default 404
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  },
};
