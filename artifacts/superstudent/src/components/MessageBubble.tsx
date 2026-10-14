import React, { useState } from "react";
import { X, FileText, MicOff, Download, Eye, Maximize2, Images, Flag, ShieldCheck, CheckCircle2 } from "lucide-react";
import { LangKey, MessageItem } from "../types";
import { COLORS, T } from "../constants";
import { formatTime } from "../services/dataService";
import { Avatar, Spinner } from "./Atoms";

interface MessageBubbleProps {
  key?: React.Key;
  msg: MessageItem;
  isOwn: boolean;
  isRTL: boolean;
  lang: LangKey;
  subjColor: string;
  canDeleteMsg: boolean;
  canModerate: boolean;
  isModerator?: boolean;
  isSuperAdmin?: boolean;
  mutedHere: boolean;
  onDelete: (msg: MessageItem) => void;
  onDeleteImage?: ((msg: MessageItem, idx: number) => void) | null;
  onMuteUser?: ((msg: MessageItem) => void) | null;
  onReportMsg?: ((msg: MessageItem) => void) | null;
  onOpenPdf: (msg: MessageItem) => void;
  onDownloadPdf?: ((msg: MessageItem) => void) | null;
  onOpenImageModal?: (images: string[], initialIdx: number, senderName?: string) => void;
  pdfLoadingId: string | null;
}

export function MessageBubble({
  msg,
  isOwn,
  lang,
  subjColor,
  canDeleteMsg,
  canModerate,
  isModerator,
  isSuperAdmin,
  mutedHere,
  onDelete,
  onDeleteImage,
  onMuteUser,
  onReportMsg,
  onOpenPdf,
  onDownloadPdf,
  onOpenImageModal,
  pdfLoadingId,
}: MessageBubbleProps) {
  const t = T[lang];
  const [confirming, setConfirming] = useState<{ kind: "msg" | "img"; idx?: number } | null>(null);
  const canDelete = canDeleteMsg || canModerate;

  function renderActions() {
    if (confirming) {
      const isImg = confirming.kind === "img";
      return (
        <div className="flex gap-2 mt-1 px-1 items-center">
          <span className="text-xs" style={{ color: COLORS.textSoft }}>
            {isImg ? t.deleteImage : t.deleteMsg}؟
          </span>
          <button
            onClick={() => {
              if (isImg && typeof confirming.idx === "number" && onDeleteImage) {
                onDeleteImage(msg, confirming.idx);
              } else {
                onDelete(msg);
              }
              setConfirming(null);
            }}
            className="text-xs font-bold rounded-md px-2 py-0.5 cursor-pointer"
            style={{ color: "#fff", background: COLORS.danger }}
          >
            {t.confirm}
          </button>
          <button
            onClick={() => setConfirming(null)}
            className="text-xs cursor-pointer"
            style={{ color: COLORS.textSoft }}
          >
            {t.cancel}
          </button>
        </div>
      );
    }
    return (
      <div className="flex gap-2.5 mt-0.5 px-1 items-center">
        {canModerate && !isOwn && onMuteUser && (
          <button
            onClick={() => onMuteUser(msg)}
            className="text-[11px] font-medium flex items-center gap-1 cursor-pointer text-slate-400 hover:text-amber-300 transition-colors"
          >
            <MicOff size={11} /> {t.muteUser}
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setConfirming({ kind: "msg" })}
            className="text-[11px] font-medium cursor-pointer text-rose-300/80 hover:text-rose-300 transition-colors"
          >
            {t.deleteMsgShort}
          </button>
        )}
        {!isOwn && onReportMsg && (
          <button
            onClick={() => onReportMsg(msg)}
            className="text-[11px] font-medium flex items-center gap-1 cursor-pointer text-slate-400 hover:text-rose-400 transition-colors"
            title={lang === "ar" ? "تبليغ عن محتوى غير لائق" : "Signaler ce message"}
          >
            <Flag size={10} />
            <span>{lang === "ar" ? "تبليغ" : "Signaler"}</span>
          </button>
        )}
        {mutedHere && (
          <span
            className="text-xs rounded-full px-1.5 py-0.5"
            style={{ background: "rgba(251,191,36,.18)", color: COLORS.gold }}
          >
            {t.mutedBadge}
          </span>
        )}
      </div>
    );
  }

  // Handle single image download
  function downloadImage(src: string, e: React.MouseEvent) {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = src;
    a.download = `photo-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className={`bac-msg-in flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end gap-2 mb-3`}>
      <Avatar src={msg.avatar} name={msg.displayName} colorSeed={msg.username} size={28} />
      <div className="flex flex-col" style={{ alignItems: isOwn ? "flex-end" : "flex-start", maxWidth: "78%" }}>
        <div className="flex items-center gap-1.5 mb-0.5 px-1 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: COLORS.textSoft }}>
            {msg.displayName}
          </span>
          {isSuperAdmin && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5">
              <ShieldCheck size={10} />
              <span>{lang === "ar" ? "إدارة المنصة" : "Admin"}</span>
            </span>
          )}
          {!isSuperAdmin && isModerator && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-0.5">
              <CheckCircle2 size={10} />
              <span>{lang === "ar" ? "مشرف معتمد" : lang === "fr" ? "Modérateur" : "Moderator"}</span>
            </span>
          )}
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,.35)" }}>
            {formatTime(msg.createdAt, lang)}
          </span>
        </div>

        <div
          className="rounded-2xl px-3.5 py-2.5"
          style={{
            background: isOwn ? `linear-gradient(135deg, ${subjColor}33, ${subjColor}14)` : "rgba(255,255,255,.08)",
            border: `1px solid ${isOwn ? `${subjColor}55` : COLORS.line}`,
            borderStartEndRadius: isOwn ? 4 : undefined,
            borderStartStartRadius: !isOwn ? 4 : undefined,
            backdropFilter: "blur(6px)",
          }}
        >
          {msg.text && (
            <p className="text-sm whitespace-pre-wrap break-words" style={{ color: COLORS.text }}>
              {msg.text}
            </p>
          )}

          {/* Photo Album / Inline Images Gallery */}
          {msg.images && msg.images.length > 0 && (
            <div className={`space-y-1.5 ${msg.text ? "mt-2.5" : ""}`}>
              {msg.images.length > 1 && (
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5 pb-1">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Images size={12} />
                    <span>{lang === "ar" ? `ألبوم صور (${msg.images.length})` : `Album (${msg.images.length})`}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {lang === "ar" ? "اضغط للتكبير والتصفح" : "Agrandir"}
                  </span>
                </div>
              )}

              <div
                className="grid gap-1.5 rounded-xl overflow-hidden"
                style={{
                  gridTemplateColumns:
                    msg.images.length === 1
                      ? "1fr"
                      : msg.images.length === 2
                      ? "1fr 1fr"
                      : msg.images.length === 3
                      ? "1fr 1fr"
                      : "repeat(2, 1fr)",
                }}
              >
                {msg.images.map((src, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenImageModal && onOpenImageModal(msg.images!, idx, msg.displayName)}
                    className="relative group rounded-lg overflow-hidden cursor-pointer bg-slate-950/40 border border-white/10 hover:border-cyan-400/50 transition-all"
                    style={{
                      maxHeight: msg.images!.length === 1 ? 260 : 140,
                      minHeight: msg.images!.length === 1 ? 160 : 90,
                    }}
                  >
                    <img
                      src={src}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Overlay on hover with zoom & download icons */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <div className="p-1.5 rounded-full bg-slate-900/80 text-cyan-300 border border-cyan-500/30">
                        <Maximize2 size={13} />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => downloadImage(src, e)}
                        className="p-1.5 rounded-full bg-slate-900/80 text-white hover:text-emerald-300 border border-white/20 cursor-pointer"
                        title={lang === "ar" ? "تحميل هذه الصورة" : "Télécharger"}
                      >
                        <Download size={13} />
                      </button>
                    </div>

                    {/* Delete button for moderators */}
                    {canModerate && onDeleteImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirming({ kind: "img", idx });
                        }}
                        className="absolute top-1 right-1 rounded-full p-1 cursor-pointer z-10"
                        style={{ background: "rgba(0,0,0,.7)", color: "#fff" }}
                        title={t.deleteImage}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF Attachment Card with View and Direct Download */}
          {msg.pdf && (
            <div
              className={`rounded-xl p-2.5 flex items-center justify-between gap-2.5 ${msg.text ? "mt-2.5" : ""}`}
              style={{ background: "rgba(255,255,255,.06)", width: "100%", border: `1px solid ${COLORS.line}` }}
            >
              <div
                onClick={() => onOpenPdf(msg)}
                className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                  {pdfLoadingId === msg.id ? <Spinner size={16} color="#F43F5E" /> : <FileText size={16} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {msg.pdf.fileName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {msg.pdf.sizeKB} KB • {lang === "ar" ? "مستند PDF" : "Fichier PDF"}
                  </span>
                </div>
              </div>

              {/* Action Buttons: View and Download */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onOpenPdf(msg)}
                  disabled={pdfLoadingId === msg.id}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={lang === "ar" ? "معاينة" : "Aperçu"}
                >
                  <Eye size={13} />
                  <span className="hidden sm:inline text-[11px]">{lang === "ar" ? "معاينة" : "Voir"}</span>
                </button>

                <button
                  onClick={() => onDownloadPdf ? onDownloadPdf(msg) : onOpenPdf(msg)}
                  className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={lang === "ar" ? "تحميل الملف" : "Télécharger"}
                >
                  <Download size={13} />
                  <span className="hidden sm:inline text-[11px]">{lang === "ar" ? "تحميل" : "Télécharger"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
        {renderActions()}
      </div>
    </div>
  );
}
