import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Check, Copy, Code, Award, AlertTriangle, Lightbulb, BookOpen, CheckCircle } from "lucide-react";
import { sanitizeAiResponseText } from "../services/aiSafetyGuardrails";

interface MessageRendererProps {
  content: string;
  isUser?: boolean;
  theme?: "dark" | "light" | "system";
  lang?: "ar" | "fr" | "en";
}

interface ErrorBoundaryProps {
  fallbackText: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MathErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Educational renderer caught a formatting issue:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 my-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
          <p className="font-semibold mb-1">صيغة رياضية مبسطة (نسخة احتياطية):</p>
          <pre className="whitespace-pre-wrap font-mono text-[11px] overflow-x-auto">
            {this.props.fallbackText}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function preprocessEducationalContent(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Normalize display math delimiters: \[ ... \] -> \n\n$$\n...\n$$\n\n
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => {
    const trimmed = equation.trim();
    return `\n\n$$\n${trimmed}\n$$\n\n`;
  });

  // 2. Normalize inline math delimiters: \( ... \) -> $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => {
    const trimmed = equation.trim();
    return `$${trimmed}$`;
  });

  // 3. Fix unescaped double-dollar blocks missing line breaks
  text = text.replace(/([^\n])\$\$([^\n])/g, "$1\n\n$$\n$2");
  text = text.replace(/([^\n])\$\$([^\n])/g, "$1\n$$\n\n$2");

  // 4. Remove any corrupted artifacts if present (e.g. repeated hashes or dollars)
  text = text.replace(/#{4,}\${3,}/g, "");
  text = text.replace(/!+؛:؛!+#+¥+¢+/g, "");

  // 5. Apply universal AI output sanitizer to eliminate ##@##&-##62# and similar glitches
  text = sanitizeAiResponseText(text);

  return text;
}

function detectTextDirection(text: string): "rtl" | "ltr" {
  const sample = text.slice(0, 140);
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(sample) ? "rtl" : "ltr";
}

function EducationalCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-lg text-start" dir="ltr">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Code size={14} className="text-indigo-400" />
          <span className="uppercase font-semibold tracking-wider text-[11px] text-indigo-300">
            {language || "CODE"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">تم النسخ</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>نسخ</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto font-mono text-xs text-emerald-300 leading-relaxed">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

export function MessageRenderer({
  content,
  isUser = false,
  theme = "dark",
  lang = "ar",
}: MessageRendererProps) {
  if (isUser) {
    return (
      <div className="whitespace-pre-wrap font-sans break-words text-start">
        {content}
      </div>
    );
  }

  const processedContent = preprocessEducationalContent(content);
  const textDirection = detectTextDirection(content);
  const isLight = theme === "light";

  return (
    <MathErrorBoundary fallbackText={content}>
      <div
        className={`educational-markdown ${
          isLight ? "text-slate-800" : "text-slate-100"
        }`}
        dir={textDirection}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[
            [
              rehypeKatex,
              {
                throwOnError: false,
                errorColor: "#f43f5e",
                strict: false,
              },
            ],
          ]}
          components={{
            h1: ({ children }) => (
              <h1 className={`text-lg sm:text-xl font-extrabold mt-5 mb-2.5 pb-1 border-b flex items-center gap-2 ${
                isLight ? "text-indigo-700 border-indigo-200" : "text-indigo-300 border-indigo-500/20"
              }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${isLight ? "bg-indigo-600" : "bg-indigo-500"}`} />
                <span>{children}</span>
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className={`text-base sm:text-lg font-bold mt-4 mb-2 flex items-center gap-2 ${
                isLight ? "text-indigo-800" : "text-violet-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLight ? "bg-indigo-600" : "bg-violet-400"}`} />
                <span>{children}</span>
              </h2>
            ),
            h3: ({ children }) => {
              const textContent = String(children).toLowerCase();
              const isFinalAnswer =
                textContent.includes("résultat final") ||
                textContent.includes("النتيجة النهائية") ||
                textContent.includes("final answer") ||
                textContent.includes("conclusion finale") ||
                textContent.includes("خلاصة") ||
                textContent.includes("حل نهائي");

              if (isFinalAnswer) {
                return (
                  <div className={`my-4 p-3.5 rounded-2xl border shadow-sm ${
                    isLight
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-gradient-to-r from-emerald-950/50 via-teal-950/30 to-emerald-950/50 border-emerald-500/40 text-emerald-300"
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <Award size={18} className={`shrink-0 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
                      <span>{children}</span>
                    </div>
                  </div>
                );
              }

              return (
                <h3 className={`text-sm sm:text-base font-bold mt-3.5 mb-1.5 flex items-center gap-2 ${
                  isLight ? "text-indigo-900" : "text-indigo-200"
                }`}>
                  <span>{children}</span>
                </h3>
              );
            },
            p: ({ children }) => (
              <p className={`mb-3 text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-800" : "text-slate-200"}`}>{children}</p>
            ),
            strong: ({ children }) => (
              <strong className={`font-extrabold ${isLight ? "text-slate-900 font-bold" : "text-indigo-200"}`}>{children}</strong>
            ),
            em: ({ children }) => (
              <em className={`italic font-serif ${isLight ? "text-slate-700" : "text-slate-300"}`}>{children}</em>
            ),
            ul: ({ children }) => (
              <ul className={`my-2.5 space-y-1.5 list-disc ps-5 text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className={`my-2.5 space-y-1.5 list-decimal ps-5 text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className={`leading-relaxed ${isLight ? "marker:text-indigo-600" : "marker:text-indigo-400"}`}>{children}</li>
            ),
            blockquote: ({ children }) => {
              const text = String(children);
              const isWarning = text.includes("تنبيه") || text.includes("تحذير") || text.includes("Attention");
              const isTip = text.includes("ملاحظة منهجية") || text.includes("نصيحة") || text.includes("Remarque");
              const isDefinition = text.includes("تعريف") || text.includes("Définition");

              let borderClass = isLight ? "border-indigo-600 bg-indigo-50/80 text-indigo-950" : "border-indigo-500 bg-indigo-950/30 text-indigo-200";
              let icon = <BookOpen size={16} className="text-indigo-400 shrink-0 mt-0.5" />;

              if (isWarning) {
                borderClass = isLight ? "border-rose-500 bg-rose-50 text-rose-950" : "border-rose-500 bg-rose-950/30 text-rose-200";
                icon = <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />;
              } else if (isTip) {
                borderClass = isLight ? "border-amber-500 bg-amber-50 text-amber-950" : "border-amber-500 bg-amber-950/30 text-amber-200";
                icon = <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />;
              } else if (isDefinition) {
                borderClass = isLight ? "border-emerald-500 bg-emerald-50 text-emerald-950" : "border-emerald-500 bg-emerald-950/30 text-emerald-200";
                icon = <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />;
              }

              return (
                <blockquote className={`my-3 p-3.5 rounded-2xl border-s-4 text-xs sm:text-sm shadow-sm flex items-start gap-2.5 ${borderClass}`}>
                  {icon}
                  <div className="flex-1 leading-relaxed">{children}</div>
                </blockquote>
              );
            },
            table: ({ children }) => (
              <div className={`my-4 overflow-x-auto rounded-2xl border shadow-sm ${
                isLight ? "border-slate-200 bg-white" : "border-slate-700/80 bg-slate-900/60"
              }`}>
                <table className="w-full text-xs text-start border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className={`border-b ${
                isLight ? "bg-slate-100 text-slate-900 border-slate-200" : "bg-indigo-950/60 text-indigo-200 border-slate-700"
              }`}>
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className={`divide-y ${
                isLight ? "divide-slate-200 bg-white" : "divide-slate-800/60 bg-slate-900/40"
              }`}>{children}</tbody>
            ),
            tr: ({ children }) => (
              <tr className={`transition-colors ${
                isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/40"
              }`}>{children}</tr>
            ),
            th: ({ children }) => (
              <th className={`p-2.5 font-bold text-start border-e last:border-e-0 ${
                isLight ? "border-slate-200" : "border-slate-700/50"
              }`}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className={`p-2.5 text-start border-e last:border-e-0 ${
                isLight ? "border-slate-200 text-slate-800" : "border-slate-800/50 text-slate-300"
              }`}>
                {children}
              </td>
            ),
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match && !String(children).includes("\n");
              const language = match ? match[1] : "";
              const codeString = String(children).replace(/\n$/, "");

              if (
                language === "latex" ||
                language === "math" ||
                language === "tex" ||
                (!language && (codeString.includes("\\frac") || codeString.includes("u_{n+1}")))
              ) {
                return (
                  <div className={`my-2 p-2 rounded-xl font-mono text-xs overflow-x-auto text-center ${
                    isLight ? "bg-slate-100 text-indigo-900" : "bg-indigo-950/20 text-indigo-300"
                  }`} dir="ltr">
                    {codeString}
                  </div>
                );
              }

              if (isInline) {
                return (
                  <code
                    className={`px-1.5 py-0.5 rounded-lg border font-mono text-[11px] sm:text-xs mx-0.5 ${
                      isLight
                        ? "bg-slate-100 border-slate-300 text-indigo-700"
                        : "bg-indigo-950/50 border-indigo-500/30 text-indigo-300"
                    }`}
                    dir="ltr"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <EducationalCodeBlock
                  language={language}
                  code={codeString}
                />
              );
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </MathErrorBoundary>
  );
}
