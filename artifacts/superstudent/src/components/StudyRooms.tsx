import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  MessageSquare,
  Send,
  Sparkles,
  Paperclip,
  Share2,
  Shield,
  HelpCircle,
  Hash,
  Crown,
} from "lucide-react";
import { LangKey, Account, RoomMessage } from "../types";
import { BRANCHES } from "../constants";
import { getJSON, setJSON } from "../services/dataService";

interface StudyRoomsProps {
  lang: LangKey;
  isRTL?: boolean;
  currentUser: Account | null;
  userBranch?: string;
  onOpenAuth: () => void;
}

const DEFAULT_ROOMS = [
  { id: "general_bac", name: "نقاشات الباكالوريا العامة", branch: "all", desc: "نصائح، منهجية وتنظيم الوقت" },
  { id: "math_elite", name: "نادي عباقرة الرياضيات", branch: "math", desc: "مسائل، متتاليات ودوال مركبة" },
  { id: "physics_lab", name: "مخبر الفيزياء والكيمياء", branch: "science", desc: "كهرباء، ميكانيك وتفاعلات كيميائية" },
  { id: "tech_engineers", name: "نادي مهندسي التقنية", branch: "tech", desc: "أنظمة آلية وهندسة كهربائية وميكانيكية" },
  { id: "coders_hub", name: "ركن مبرمجي الإعلامية", branch: "info", desc: "Python، SQL، خوارزميات و TIC" },
  { id: "eco_managers", name: "صالون رواد الإقتصاد والتصرف", branch: "eco", desc: "دراسة حالات، ميزانية واقتصاد كلي" },
  { id: "lettres_philos", name: "منتدى الأدب والفلسفة", branch: "lettres", desc: "تحليل مقالات فلسفية ونصوص عربية" },
];

export function StudyRooms({
  lang,
  isRTL = true,
  currentUser,
  userBranch = "math",
  onOpenAuth,
}: StudyRoomsProps) {
  const [activeRoomId, setActiveRoomId] = useState<string>("general_bac");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = DEFAULT_ROOMS.find((r) => r.id === activeRoomId) || DEFAULT_ROOMS[0];

  useEffect(() => {
    loadRoomMessages(activeRoomId);
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRoomMessages = async (roomId: string) => {
    const stored = (await getJSON<RoomMessage[]>(`room_msgs_${roomId}`, true)) || [
      {
        id: "msg_1",
        roomId,
        username: "BacAdmisBot",
        displayName: "المشرف الأكاديمي",
        text: `مرحباً بكم في قاعة "${activeRoom.name}"! شاركوا استفساراتكم وتمارينكم بكل احترام وفق ميثاق المنصة.`,
        createdAt: Date.now() - 3600000,
      },
    ];
    setMessages(stored);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const newMsg: RoomMessage = {
      id: `msg_${Date.now()}`,
      roomId: activeRoomId,
      userId: currentUser.id || currentUser.username,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl || currentUser.avatar,
      text: inputText.trim(),
      createdAt: Date.now(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText("");
    await setJSON(`room_msgs_${activeRoomId}`, updated, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-4 h-[750px]">
        {/* Rooms Sidebar */}
        <div className="p-4 border-b lg:border-b-0 lg:border-l border-slate-800 bg-slate-950/60 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 px-2">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">قاعات المذاكرة التفاعلية</h2>
                <p className="text-[11px] text-slate-400">تواصل وتعاون مع زملائك</p>
              </div>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[550px]">
              {DEFAULT_ROOMS.map((room) => {
                const isActive = activeRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full text-right p-3 rounded-2xl transition-all border ${
                      isActive
                        ? "bg-indigo-600/20 border-indigo-500/60 text-white shadow-md"
                        : "bg-slate-900/40 border-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{room.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{room.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>قاعات مراقبة ومحمية بنظام أمان مدرسي</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-900/40">
          {/* Room Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                #
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{activeRoom.name}</h3>
                <p className="text-xs text-slate-400">{activeRoom.desc}</p>
              </div>
            </div>

            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                تسجيل الدخول للمشاركة
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {messages.map((msg) => {
              const isMe = currentUser && msg.userId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
                    {msg.displayName ? msg.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={`space-y-1 max-w-lg ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{msg.displayName}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tl-none shadow-md shadow-indigo-600/20"
                          : "bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tr-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  currentUser
                    ? "اكتب رسالتك أو استفسارك هنا..."
                    : "قم بتسجيل الدخول للكتابة والمشاركة..."
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
