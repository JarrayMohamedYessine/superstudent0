import React, { useState, useEffect } from "react";
import { BarChart3, CheckCircle2, Send, Sparkles } from "lucide-react";
import { LangKey, Account, MonthlyPollItem } from "../types";
import { getMonthlyPoll, voteMonthlyPoll } from "../services/communityFeaturesService";
import { GRAD_GOLD } from "../constants";

interface MonthlyPollWidgetProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  onRequireAuth?: () => void;
}

export function MonthlyPollWidget({
  lang,
  isRTL,
  user,
  onRequireAuth,
}: MonthlyPollWidgetProps) {
  const [poll, setPoll] = useState<MonthlyPollItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  // Anonymous voter id is kept in memory only: nothing is stored on the device.
  const [anonVoterId] = useState(() => "anon_" + Math.random().toString(36).slice(2, 8));
  const userId = user ? user.username : anonVoterId;

  useEffect(() => {
    async function load() {
      const data = await getMonthlyPoll();
      setPoll(data);
      if (data.votedUserIds && data.votedUserIds.includes(userId)) {
        setHasVoted(true);
      }
    }
    load();
  }, [userId]);

  async function handleVote() {
    if (!selectedOption || !poll) return;
    setVoting(true);
    try {
      const updated = await voteMonthlyPoll(selectedOption, userId);
      setPoll(updated);
      setHasVoted(true);
    } catch (err) {
      console.error("Failed to vote:", err);
    } finally {
      setVoting(false);
    }
  }

  if (!poll) return null;

  const monthTitle = typeof poll.monthTitle === "object" ? (poll.monthTitle as any)[lang] || poll.monthTitle.ar : poll.monthTitle;
  const question = typeof poll.question === "object" ? (poll.question as any)[lang] || poll.question.ar : poll.question;

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden space-y-4"
      style={{
        background: "linear-gradient(135deg, rgba(15, 23, 48, 0.95), rgba(30, 27, 75, 0.9))",
        borderColor: "rgba(99, 102, 241, 0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <BarChart3 size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white">{monthTitle}</h4>
            <span className="text-[10px] text-slate-400">
              {lang === "ar" ? `إجمالي أصوات التلاميذ: ${poll.totalVotes}` : `${poll.totalVotes} votes enregistrés`}
            </span>
          </div>
        </div>

        {hasVoted && (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>{lang === "ar" ? "تم تسجيل صوتك" : "A voté"}</span>
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed">
        {question}
      </p>

      {/* Options list */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const optText = typeof opt.text === "object" ? (opt.text as any)[lang] || opt.text.ar : opt.text;
          const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          if (hasVoted) {
            return (
              <div key={opt.id} className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-3">
                <div
                  className="absolute inset-y-0 start-0 bg-indigo-600/30 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative flex items-center justify-between text-xs text-white font-semibold">
                  <span>{optText}</span>
                  <span className="font-mono text-indigo-300 font-bold">{percentage}% ({opt.votes})</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedOption(opt.id)}
              className={`w-full p-3 rounded-xl border text-xs font-semibold text-start flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? "bg-indigo-600/30 border-indigo-500 text-white shadow-md"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>{optText}</span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-indigo-400 bg-indigo-500" : "border-slate-500"}`}>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Submit Vote */}
      {!hasVoted && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            disabled={!selectedOption || voting}
            onClick={handleVote}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-40 transition-all"
            style={{ background: GRAD_GOLD }}
          >
            <Send size={13} className={isRTL ? "rotate-180" : ""} />
            <span>{voting ? (lang === "ar" ? "جارِ التصويت..." : "Enregistrement...") : (lang === "ar" ? "تأكيد تصويتي" : "Voter")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
