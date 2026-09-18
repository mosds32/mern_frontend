"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

// ── API response shapes ───────────────────────────────────────────────
interface SpecialityApiResponse {
  speciality_type: string;
}

interface DoctorApiResponse {
  doctors_id: number;
  doctors_full_name: string;
  doctors_intials: string;
  speciality?: SpecialityApiResponse;
}

interface MessageApiResponse {
  message_id: number;
  message_text: string;
  message_sender_type: string; // "user" | "doctor" | "frontdesk"
  message_is_read: number;
  message_createdat: string;
}

interface ConversationApiResponse {
  conversation_id: number;
  conversation_type: string;
  doctors_doctors_id: number | null;
  doctors: DoctorApiResponse | null;
  lastMessage: MessageApiResponse | null;
  unreadCount: number;
}

// ── UI shapes ─────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  doctorId: number | null;
  name: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatarInitials: string;
}

interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  initials: string;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function mapConversation(c: ConversationApiResponse): Conversation {
  const isFrontDesk = c.conversation_type === "frontdesk" || !c.doctors;
  return {
    id: String(c.conversation_id),
    doctorId: c.doctors_doctors_id,
    name: isFrontDesk ? "Front Desk" : c.doctors!.doctors_full_name,
    role: isFrontDesk
      ? "MediCare Support"
      : c.doctors?.speciality?.speciality_type || "Doctor",
    lastMessage: c.lastMessage?.message_text || "No messages yet",
    time: c.lastMessage ? formatTime(c.lastMessage.message_createdat) : "",
    unread: c.unreadCount,
    avatarInitials: isFrontDesk ? "FD" : c.doctors!.doctors_intials,
  };
}

function mapMessage(m: MessageApiResponse): ChatMessage {
  return {
    id: String(m.message_id),
    fromMe: m.message_sender_type === "user",
    text: m.message_text,
    time: formatTime(m.message_createdat),
  };
}

function mapDoctor(d: DoctorApiResponse): Doctor {
  return {
    id: d.doctors_id,
    name: d.doctors_full_name,
    specialty: d.speciality?.speciality_type || "Doctor",
    initials: d.doctors_intials,
  };
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: "🏠", active: false, href: "/views/dashboard/patient" },
  { label: "Appointments", icon: "📅", active: false, href: "/views/dashboard/appointments" },
  { label: "Doctors", icon: "🩺", active: false, href: "/views/dashboard/doctors" },
  { label: "Messages", icon: "💬", active: true, href: "/views/dashboard/messages" },
  { label: "Profile", icon: "👤", active: false, href: "/views/dashboard/profile" },
];

// ── New Message Modal ────────────────────────────────────────────────
function NewMessageModal({
  onClose,
  onSelectDoctor,
  existingDoctorIds,
}: {
  onClose: () => void;
  onSelectDoctor: (doctor: Doctor) => void;
  existingDoctorIds: number[];
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDoctors() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<DoctorApiResponse[]>("/doctors/get-doctors");
        if (isMounted) {
          setDoctors(res.data.map(mapDoctor));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load doctors"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.specialty.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">New Message</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors..."
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f7ff0]/40 focus:border-[#2f7ff0]"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Loading doctors...
            </p>
          )}

          {!loading && error && (
            <p className="px-6 py-10 text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && filteredDoctors.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              No doctors found.
            </p>
          )}

          {!loading &&
            !error &&
            filteredDoctors.map((doc) => {
              const alreadyChatting = existingDoctorIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoctor(doc)}
                  className="w-full flex items-center gap-3 px-6 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#2f7ff0] to-[#0a2a63] text-white flex items-center justify-center text-xs font-bold">
                    {doc.initials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-400">{doc.specialty}</p>
                  </div>
                  {alreadyChatting && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      Chatting
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  // ── Fetch conversation list on mount ─────────────────────────────────
  async function fetchConversations(selectFirst = true) {
    try {
      setLoadingConvos(true);
      setError(null);
      const res = await api.get<ConversationApiResponse[]>(
        "/messages/get-conversations"
      );
      const mapped = res.message.map(mapConversation);
      setConversations(mapped);
      if (selectFirst && mapped.length > 0 && !selectedId) {
        setSelectedId(mapped[0].id);
      }
      return mapped;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load conversations"
      );
      return [];
    } finally {
      setLoadingConvos(false);
    }
  }

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch messages whenever selected conversation changes ───────────
  useEffect(() => {
    if (!selectedId) return;
    if (selectedId.startsWith("new-")) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    let isMounted = true;

    async function fetchMessages() {
      try {
        setLoadingMessages(true);
        setMessageError(null);
        const res = await api.get<{ messages: MessageApiResponse[] }>(
          `/messages/get-messages/${selectedId}`
        );
        if (isMounted) {
          setMessages(res.message.messages.map(mapMessage));
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedId ? { ...c, unread: 0 } : c))
          );
        }
      } catch (err) {
        if (isMounted) {
          setMessages([]);
          setMessageError(
            err instanceof ApiError ? err.message : "Failed to load messages"
          );
        }
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  const selectedConvo = conversations.find((c) => c.id === selectedId);

  // ── Naya doctor select karne par ──────────────────────────────────────
  async function handleSelectDoctor(doctor: Doctor) {
    setShowNewMessageModal(false);

    // ── Pehle se conversation hai to seedha open karo ──────────────────
    const existing = conversations.find((c) => c.doctorId === doctor.id);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }

    // ── Naya, khali conversation UI mein turant dikhao (backend mein tab banega jab pehla message bheja jayega) ──
    const tempId = `new-${doctor.id}`;
    const newConvo: Conversation = {
      id: tempId,
      doctorId: doctor.id,
      name: doctor.name,
      role: doctor.specialty,
      lastMessage: "No messages yet",
      time: "",
      unread: 0,
      avatarInitials: doctor.initials,
    };
    setConversations((prev) => [newConvo, ...prev]);
    setSelectedId(tempId);
    setMessages([]);
  }

  async function handleSend() {
    if (draft.trim() === "" || !selectedId || sending || !selectedConvo) return;

    const text = draft.trim();
    setDraft("");
    setSending(true);

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      fromMe: true,
      text,
      time: "Now",
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const isNewConversation = selectedId.startsWith("new-");

      const payload = isNewConversation
        ? { doctors_doctors_id: selectedConvo.doctorId, message_text: text }
        : { conversation_id: Number(selectedId), message_text: text };

      const res = await api.post<{
        conversation: { conversation_id: number };
        message: MessageApiResponse;
      }>("/messages/send-message", payload);

      if (isNewConversation) {
        // ── Temp conversation ko real ID se replace karo ──────────────
        const realId = String(res.message.conversation.conversation_id);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId ? { ...c, id: realId } : c
          )
        );
        setSelectedId(realId);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? mapMessage(res.message.message) : m
        )
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.id === (isNewConversation ? String(res.message.conversation.conversation_id) : selectedId)
            ? { ...c, lastMessage: text, time: "Now" }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-gradient-to-b from-[#0a2a63] via-[#123a80] to-[#1c56c9] text-white px-6 py-8">
        <div className="flex items-center gap-2 mb-10">
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg">
            ➕
          </span>
          <span className="text-lg font-extrabold tracking-wide">
            MediCare
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? "bg-white/15 text-white"
                  : "text-blue-100/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <a
            href="/views/authentication/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base">🚪</span>
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-400 mt-1">
              Chat with your doctors and the front desk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#12326b] text-white text-sm font-bold hover:bg-[#0d2652] transition-colors"
          >
            + New Message
          </button>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex min-h-[520px]">
          {/* Conversation list */}
          <div className="w-full max-w-xs border-r border-slate-100 overflow-y-auto">
            {loadingConvos && (
              <div className="px-6 py-10 text-center text-sm text-slate-400">
                Loading conversations...
              </div>
            )}

            {!loadingConvos && error && (
              <div className="px-6 py-10 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            {!loadingConvos && !error && conversations.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-slate-400">
                No conversations yet. Click &quot;+ New Message&quot; to start.
              </div>
            )}

            {!loadingConvos &&
              !error &&
              conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedId(convo.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left border-b border-slate-100 transition-colors ${
                    selectedId === convo.id ? "bg-slate-50" : "hover:bg-slate-50/60"
                  }`}
                >
                  <span className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#2f7ff0] to-[#0a2a63] text-white flex items-center justify-center text-xs font-bold">
                    {convo.avatarInitials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {convo.name}
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {convo.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {convo.lastMessage}
                    </p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#12326b] text-white text-[10px] font-bold flex items-center justify-center">
                      {convo.unread}
                    </span>
                  )}
                </button>
              ))}
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col">
            {!selectedConvo ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                Select a conversation or start a new one.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                  <span className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#2f7ff0] to-[#0a2a63] text-white flex items-center justify-center text-xs font-bold">
                    {selectedConvo.avatarInitials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedConvo.name}
                    </p>
                    <p className="text-xs text-slate-400">{selectedConvo.role}</p>
                  </div>
                </div>

                <div className="flex-1 px-6 py-5 space-y-3 overflow-y-auto">
                  {messageError && (
                    <p className="text-center text-sm text-red-500">
                      {messageError}
                    </p>
                  )}

                  {loadingMessages && (
                    <p className="text-center text-sm text-slate-400">
                      Loading messages...
                    </p>
                  )}

                  {!loadingMessages && messages.length === 0 && (
                    <p className="text-center text-sm text-slate-400 mt-10">
                      No messages yet. Say hi!
                    </p>
                  )}

                  {!loadingMessages &&
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                            m.fromMe
                              ? "bg-[#12326b] text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-700 rounded-bl-sm"
                          }`}
                        >
                          <p>{m.text}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              m.fromMe ? "text-blue-100/70" : "text-slate-400"
                            }`}
                          >
                            {m.time}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message"
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f7ff0]/40 focus:border-[#2f7ff0] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending}
                    className="px-5 py-3 rounded-xl bg-[#12326b] text-white text-sm font-bold hover:bg-[#0d2652] transition-colors disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {showNewMessageModal && (
        <NewMessageModal
          onClose={() => setShowNewMessageModal(false)}
          onSelectDoctor={handleSelectDoctor}
          existingDoctorIds={conversations
            .map((c) => c.doctorId)
            .filter((id): id is number => id !== null)}
        />
      )}
    </div>
  );
}