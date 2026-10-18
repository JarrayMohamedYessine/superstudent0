import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Real image viewer (full screen): zoom (buttons, wheel, double click), drag to pan, rotate,
 * previous/next for albums, download, open in a new tab, Esc / backdrop click to close.
 *
 * Why it exists: images are stored as data URLs or Catbox links, and browsers refuse to
 * navigate a new tab to a data: URL, so a plain <a href target="_blank"> showed nothing.
 * Here the image is rendered inside the app, and "open in a new tab" goes through a Blob URL.
 */
interface ImageLightboxProps {
  images: string[];
  startIndex?: number;
  title?: string;
  lang?: string;
  onClose: () => void;
}

const LABELS: Record<string, Record<string, string>> = {
  ar: { close: "إغلاق", zoomIn: "تكبير", zoomOut: "تصغير", rotate: "تدوير", download: "تحميل", open: "فتح في تبويب", prev: "السابقة", next: "التالية", failed: "تعذّر تحميل الصورة" },
  fr: { close: "Fermer", zoomIn: "Agrandir", zoomOut: "Réduire", rotate: "Pivoter", download: "Télécharger", open: "Ouvrir dans un onglet", prev: "Précédente", next: "Suivante", failed: "Image impossible à charger" },
  en: { close: "Close", zoomIn: "Zoom in", zoomOut: "Zoom out", rotate: "Rotate", download: "Download", open: "Open in a tab", prev: "Previous", next: "Next", failed: "Could not load the image" },
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;

function extensionFor(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

export function ImageLightbox({ images, startIndex = 0, title, lang = "ar", onClose }: ImageLightboxProps) {
  const t = LABELS[lang] || LABELS.en;
  const isRTL = lang === "ar";
  const safeStart = Math.min(Math.max(startIndex, 0), Math.max(images.length - 1, 0));
  const [index, setIndex] = useState(safeStart);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const src = images[index];

  const reset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setFailed(false);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      setIndex((i) => (i + delta + images.length) % images.length);
      reset();
    },
    [images.length, reset],
  );

  const zoomBy = useCallback(
    (delta: number) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((scale + delta) * 100) / 100));
      setScale(next);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
    },
    [scale],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(isRTL ? -1 : 1);
      else if (e.key === "ArrowLeft") go(isRTL ? 1 : -1);
      else if (e.key === "+" || e.key === "=") zoomBy(0.25);
      else if (e.key === "-") zoomBy(-0.25);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, isRTL, onClose, zoomBy]);

  async function toBlobUrl(): Promise<{ url: string; type: string }> {
    const res = await fetch(src);
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), type: blob.type };
  }

  async function handleDownload() {
    try {
      const { url, type } = await toBlobUrl();
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${Date.now()}.${extensionFor(type)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer"); // cross-origin without CORS: let the browser handle it
    }
  }

  async function handleOpenInTab() {
    if (!src.startsWith("data:")) {
      window.open(src, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const { url } = await toBlobUrl(); // browsers block top-level navigation to data: URLs
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      /* nothing else to try */
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (scale <= MIN_SCALE) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  const btn =
    "p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      dir={isRTL ? "rtl" : "ltr"}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/40" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-bold text-white truncate min-w-0">
          {title || ""}
          {images.length > 1 && <span className="text-slate-400 font-mono mx-2">{index + 1}/{images.length}</span>}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" className={btn} onClick={() => zoomBy(-0.25)} disabled={scale <= MIN_SCALE} title={t.zoomOut} aria-label={t.zoomOut}><ZoomOut size={16} /></button>
          <span className="text-xs text-slate-300 font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
          <button type="button" className={btn} onClick={() => zoomBy(0.25)} disabled={scale >= MAX_SCALE} title={t.zoomIn} aria-label={t.zoomIn}><ZoomIn size={16} /></button>
          <button type="button" className={btn} onClick={() => setRotation((r) => (r + 90) % 360)} title={t.rotate} aria-label={t.rotate}><RotateCw size={16} /></button>
          <button type="button" className={btn} onClick={handleDownload} title={t.download} aria-label={t.download}><Download size={16} /></button>
          <button type="button" className={btn} onClick={handleOpenInTab} title={t.open} aria-label={t.open}><ExternalLink size={16} /></button>
          <button type="button" className={btn} onClick={onClose} title={t.close} aria-label={t.close}><X size={16} /></button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden flex items-center justify-center select-none"
        style={{ touchAction: "none", cursor: scale > MIN_SCALE ? "grab" : "zoom-in" }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => zoomBy(e.deltaY < 0 ? 0.25 : -0.25)}
        onDoubleClick={() => (scale > MIN_SCALE ? reset() : zoomBy(1))}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {failed ? (
          <p className="text-slate-300 text-sm">{t.failed}</p>
        ) : (
          <img
            src={src}
            alt={title || "image"}
            draggable={false}
            onError={() => setFailed(true)}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`, transition: drag.current ? "none" : "transform 0.15s ease-out" }}
          />
        )}

        {images.length > 1 && (
          <>
            <button type="button" className={`${btn} absolute top-1/2 -translate-y-1/2 start-3`} onClick={() => go(-1)} title={t.prev} aria-label={t.prev}>
              {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button type="button" className={`${btn} absolute top-1/2 -translate-y-1/2 end-3`} onClick={() => go(1)} title={t.next} aria-label={t.next}>
              {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
