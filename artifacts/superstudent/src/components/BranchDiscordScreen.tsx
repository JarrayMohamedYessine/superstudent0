import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Monitor,
  Users,
  BookOpen,
  Headphones,
} from "lucide-react";
import { Account, LangKey } from "../types";
import { TopBar } from "./Atoms";

interface BranchDiscordScreenProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onBack: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  onRequireAuth?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

const INVITE_URL = "https://discord.gg/tunisian-bac";
const DOWNLOADS = [
  {
    key: "android",
    href: "https://play.google.com/store/apps/details?id=com.discord",
    icon: Smartphone,
  },
  {
    key: "ios",
    href: "https://apps.apple.com/app/discord-chat-talk-hangout/id985746746",
    icon: Smartphone,
  },
  { key: "desktop", href: "https://discord.com/download", icon: Monitor },
];

const COPY = {
  ar: {
    subtitle: "مجتمع التلاميذ على Discord",
    eyebrow: "مجتمع الدراسة",
    title: "مساحة مشتركة للمراجعة والتعاون",
    intro:
      "يضمّ السيرفر غرف دردشة تفاعلية ومنتديات وغرفًا للدراسة الجماعية، حيث يمكن للتلاميذ تبادل الأسئلة وتنظيم المراجعة معًا.",
    join: "فتح رابط الدعوة",
    copy: "نسخ رابط الدعوة",
    copied: "تم نسخ الرابط",
    inviteLabel: "رابط الدعوة الرسمي",
    downloadsTitle: "تنزيل Discord",
    downloadsIntro: "اختر النسخة المناسبة لجهازك من الروابط الرسمية.",
    android: "Android",
    ios: "iOS",
    desktop: "الحاسوب",
    rooms: "غرف دردشة تفاعلية",
    forums: "منتديات للنقاش حسب المواضيع",
    study: "غرف للدراسة الجماعية",
    back: "العودة إلى الرئيسية",
  },
  fr: {
    subtitle: "La communauté étudiante sur Discord",
    eyebrow: "Communauté d’étude",
    title: "Un espace commun pour réviser et échanger",
    intro:
      "Le serveur propose des salons de discussion interactifs, des forums et des salles d’étude en groupe pour poser des questions et organiser les révisions entre élèves.",
    join: "Ouvrir le lien d’invitation",
    copy: "Copier le lien d’invitation",
    copied: "Lien copié",
    inviteLabel: "Lien officiel d’invitation",
    downloadsTitle: "Télécharger Discord",
    downloadsIntro: "Choisissez la version adaptée à votre appareil via les liens officiels.",
    android: "Android",
    ios: "iOS",
    desktop: "Ordinateur",
    rooms: "Salons de discussion interactifs",
    forums: "Forums organisés par sujets",
    study: "Salles d’étude en groupe",
    back: "Retour à l’accueil",
  },
  en: {
    subtitle: "The student community on Discord",
    eyebrow: "Study community",
    title: "A shared place to study and exchange",
    intro:
      "The server offers interactive chat rooms, forums, and group study rooms where students can ask questions and plan study sessions together.",
    join: "Open invite link",
    copy: "Copy invite link",
    copied: "Link copied",
    inviteLabel: "Official invite link",
    downloadsTitle: "Download Discord",
    downloadsIntro: "Choose the version for your device using the official links.",
    android: "Android",
    ios: "iOS",
    desktop: "Desktop",
    rooms: "Interactive chat rooms",
    forums: "Topic-based forums",
    study: "Group study rooms",
    back: "Back to home",
  },
};

export function BranchDiscordScreen({
  lang,
  isRTL,
  user,
  onBack,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onRequireAuth,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: BranchDiscordScreenProps) {
  const copy = COPY[lang];
  const [copied, setCopied] = useState(false);
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(INVITE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title="Discord"
        subtitle={copy.subtitle}
        accent="#5865F2"
        onBack={onBack}
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenSettings={onOpenSettings}
        onRequireAuth={onRequireAuth}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-6">
        <section className="relative overflow-hidden rounded-3xl border border-indigo-400/25 bg-slate-950/60 p-6 shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              {copy.eyebrow}
            </span>
            <h1 className="bac-display mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              {copy.intro}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row">
              <a
                href={INVITE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4752C4]"
                data-testid="link-discord-invite"
              >
                <MessageSquare size={17} />
                {copy.join}
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3" aria-label={copy.eyebrow}>
          {[
            { icon: MessageSquare, label: copy.rooms },
            { icon: BookOpen, label: copy.forums },
            { icon: Headphones, label: copy.study },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
                <Icon size={19} />
              </span>
              <p className="text-sm font-semibold leading-5 text-slate-200">{label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 sm:p-7">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-white">{copy.downloadsTitle}</h2>
            <p className="text-sm text-slate-400">{copy.downloadsIntro}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {DOWNLOADS.map(({ key, href, icon: Icon }) => {
              const label = copy[key as "android" | "ios" | "desktop"];
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-indigo-400/35 hover:bg-indigo-400/[0.08]"
                  data-testid={`link-discord-download-${key}`}
                >
                  <span className="flex items-center gap-3"><Icon size={18} className="text-indigo-300" />{label}</span>
                  <ExternalLink size={14} className="text-slate-500" />
                </a>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          data-testid="button-discord-back"
        >
          <ArrowIcon size={16} />
          {copy.back}
        </button>
      </div>
    </div>
  );
}