/**
 * External file storage removed (Catbox / Telegram / upload proxy): no file ever leaves the device.
 * Kept as a stub so the upload UI compiles unchanged — the upload button reports "disabled"
 * and nothing is sent anywhere.
 */

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
 * Main upload entry point. Disabled: returns a failure without any network activity.
 */
export async function uploadToZeroCostStorage(
  fileOrDataUrl: File | { dataUrl: string; name: string },
  onProgress?: (percent: number) => void
): Promise<StorageUploadResult> {
  void fileOrDataUrl;
  void onProgress;
  return {
    success: false,
    provider: "local-cache",
    error: "التخزين الخارجي معطّل في هذا الإصدار: لا يتم رفع الملفات إلى أي خدمة.",
  };
}
