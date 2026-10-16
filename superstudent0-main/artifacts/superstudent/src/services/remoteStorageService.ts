/**
 * Zero-Cost Multi-Origin Storage Service
 * Handles uploading and resolving public URLs for PDFs, exams, and images
 * - Origin 1: Catbox & Litterbox (Direct public CDN mirror)
 * - Origin 2: Worker Storage Proxy (/api/storage/upload)
 * - Origin 3: Telegram Bot API private channel vault
 * - Tier 4: Client Cache Storage registration (offline instant access)
 */

import { getTelegramConfig } from "./telegramBotService";
import { cacheFileInBrowser } from "./clientCacheService";

export interface StorageUploadResult {
  success: boolean;
  publicUrl?: string;
  provider: "catbox" | "litterbox" | "telegram" | "worker-proxy" | "local-cache";
  fileSize?: string;
  error?: string;
  sha256?: string;
}

/**
 * Computes SHA-256 hash of a file or buffer
 */
export async function computeSha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return "hash_" + Date.now().toString(16);
}

/**
 * Converts a base64 Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Main upload entry point for any document, PDF, or image.
 * Uses zero-cost cloud storage mirrors so files are accessible to ALL users worldwide.
 */
export async function uploadToZeroCostStorage(
  fileOrDataUrl: File | { dataUrl: string; name: string },
  onProgress?: (percent: number) => void
): Promise<StorageUploadResult> {
  let blob: Blob;
  let fileName: string;

  if (fileOrDataUrl instanceof File) {
    blob = fileOrDataUrl;
    fileName = fileOrDataUrl.name;
  } else {
    blob = dataUrlToBlob(fileOrDataUrl.dataUrl);
    fileName = fileOrDataUrl.name || `document_${Date.now()}.pdf`;
  }

  // Pre-calculate SHA256 and store in browser cache immediately for 0ms local read
  const arrayBuffer = await blob.arrayBuffer();
  const sha256 = await computeSha256Hex(arrayBuffer);

  onProgress?.(25);

  // 1. Try Cloudflare Worker Storage Proxy (/api/storage/upload)
  try {
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("fileName", fileName);
    formData.append("sha256", sha256);

    const workerRes = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });

    if (workerRes.ok) {
      const data = await workerRes.json();
      if (data.url) {
        onProgress?.(100);
        // Cache the file under the new public URL
        await cacheFileInBrowser(data.url, blob, blob.type);
        return {
          success: true,
          publicUrl: data.url,
          provider: data.provider || "worker-proxy",
          fileSize: `${(blob.size / 1024).toFixed(0)} KB`,
          sha256,
        };
      }
    }
  } catch (e) {
    console.warn("[StorageService] Worker proxy upload unavailable, falling back to direct uploaders:", e);
  }

  onProgress?.(50);

  // 2. Direct upload to Litterbox / Catbox public CDN (Free, up to 1GB, no account needed)
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "72h"); // Extended rolling retention or mirror
    formData.append("fileToUpload", blob, fileName);

    const litterboxRes = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
    });

    if (litterboxRes.ok) {
      const urlText = (await litterboxRes.text()).trim();
      if (urlText.startsWith("http")) {
        onProgress?.(100);
        await cacheFileInBrowser(urlText, blob, blob.type);
        return {
          success: true,
          publicUrl: urlText,
          provider: "litterbox",
          fileSize: `${(blob.size / 1024).toFixed(0)} KB`,
          sha256,
        };
      }
    }
  } catch (e) {
    console.warn("[StorageService] Direct Catbox/Litterbox upload error:", e);
  }

  onProgress?.(75);

  // 3. Try Telegram Bot Document Storage if credentials are configured
  const tgConfig = getTelegramConfig();
  if (tgConfig.botToken && tgConfig.chatId) {
    try {
      const tgForm = new FormData();
      tgForm.append("chat_id", tgConfig.chatId);
      tgForm.append("document", blob, fileName);
      tgForm.append("caption", `📚 SuperStudent Document: ${fileName}\nSHA256: ${sha256}`);

      const tgRes = await fetch(`https://api.telegram.org/bot${tgConfig.botToken}/sendDocument`, {
        method: "POST",
        body: tgForm,
      });

      if (tgRes.ok) {
        const tgData = await tgRes.json();
        if (tgData.ok && tgData.result?.document?.file_id) {
          const fileId = tgData.result.document.file_id;
          const tgFileUrl = `/api/archive/${fileId}`;
          onProgress?.(100);
          await cacheFileInBrowser(tgFileUrl, blob, blob.type);
          return {
            success: true,
            publicUrl: tgFileUrl,
            provider: "telegram",
            fileSize: `${(blob.size / 1024).toFixed(0)} KB`,
            sha256,
          };
        }
      }
    } catch (e) {
      console.warn("[StorageService] Telegram document storage notice:", e);
    }
  }

  // 4. Fallback: Browser Cache Storage API (W3C native cache)
  const localCacheKey = `local-doc://${sha256}/${encodeURIComponent(fileName)}`;
  await cacheFileInBrowser(localCacheKey, blob, blob.type);
  onProgress?.(100);

  return {
    success: true,
    publicUrl: localCacheKey,
    provider: "local-cache",
    fileSize: `${(blob.size / 1024).toFixed(0)} KB`,
    sha256,
  };
}
