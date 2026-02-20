import { useEffect, useState, useRef, type FormEvent } from "react";
import { useUI } from "../../context/UIContext";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { useMapContext } from "../../context/MapContext";
import { useNotification } from "../../context/NotificationContext";
import { uploadPhoto } from "../../services/mediaService";
import { playSound } from "../../utils/sounds";

interface ChatMessage {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  text?: string;
  imageUrl?: string;
  mediaId?: string;
  type?: "text" | "image" | "checkpoint" | "member" | "voice" | "system";
  audioData?: string;
  location?: { lat: number; lng: number };
  createdAt: number;
  isCheckpointNotification?: boolean;
  checkpointId?: string;
  isDeleted?: boolean;
}

const addAndPersist = (
  prev: ChatMessage[],
  msg: ChatMessage,
  roomId: string
): ChatMessage[] => {
  // Deduplicate by id
  if (prev.some(m => m.id === msg.id)) return prev;
  const updated = [...prev, msg].slice(-100);
  window.localStorage.setItem(`go2gether_chat_${roomId}`, JSON.stringify(updated));
  return updated;
};

export const RightChatPanel = () => {
  const { isChatOpen, toggleChat, setUnreadCount } = useUI();
  const { socket } = useSocket();
  const { room } = useRoom();
  const { user } = useAuth();
  const { setFocusLocation, memberPositions } = useMapContext();
  const { showNotification } = useNotification();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPlayedId = useRef<string | null>(null);
  const lastCountedId = useRef<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Hydrate messages from localStorage
  useEffect(() => {
    if (!room?._id) return;
    const stored = window.localStorage.getItem(`go2gether_chat_${room._id}`);
    if (stored) {
      try { setMessages(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [room?._id]);

  // ── Socket Listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !room?._id) return;
    const rid = room._id;

    const onMessage = (payload: any) => {
      // Ignore echoes of own locally-added messages
      const msg: ChatMessage = {
        ...payload,
        id: payload.id || `${Date.now()}-${Math.random()}`,
        createdAt: payload.createdAt || Date.now()
      };
      setMessages(prev => addAndPersist(prev, msg, rid));
      if (msg.userId !== user?.id) playSound("message");
    };

    const onUserJoined = (payload: { user?: { id: string; name: string; avatarUrl?: string }; userId?: string }) => {
      const name = payload.user?.name || "Someone";
      const systemMsg: ChatMessage = {
        id: `sys-join-${Date.now()}`,
        userId: "system",
        type: "system",
        text: `👋 ${name} joined the room`,
        createdAt: Date.now()
      };
      setMessages(prev => addAndPersist(prev, systemMsg, rid));
      showNotification(`${name} joined the room`, "info");
    };

    const onUserLeft = (payload: { userId: string }) => {
      const memberName = room.members?.find(m => m.id === payload.userId)?.name || "Someone";
      const systemMsg: ChatMessage = {
        id: `sys-left-${Date.now()}`,
        userId: "system",
        type: "system",
        text: `👋 ${memberName} left the room`,
        createdAt: Date.now()
      };
      setMessages(prev => addAndPersist(prev, systemMsg, rid));
    };

    const onDeleted = (payload: { id: string }) => {
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== payload.id);
        window.localStorage.setItem(`go2gether_chat_${rid}`, JSON.stringify(updated));
        return updated;
      });
    };

    const onEdited = (payload: { id: string; text: string }) => {
      setMessages(prev => {
        const updated = prev.map(m => m.id === payload.id ? { ...m, text: payload.text } : m);
        window.localStorage.setItem(`go2gether_chat_${rid}`, JSON.stringify(updated));
        return updated;
      });
    };

    socket.on("chat:message", onMessage);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("chat:deleted", onDeleted);
    socket.on("chat:edited", onEdited);

    return () => {
      socket.off("chat:message", onMessage);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("chat:deleted", onDeleted);
      socket.off("chat:edited", onEdited);
    };
  }, [socket, room?._id, room?.members, user?.id, showNotification]);

  // ── Auto-play voice & unread count ───────────────────────────────────────
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];

    // Auto-play incoming voice
    if (last.type === "voice" && last.audioData && last.userId !== user?.id && last.id !== lastPlayedId.current) {
      lastPlayedId.current = last.id;
      new Audio(last.audioData).play().catch(console.error);
    }

    // Unread count
    if (!isChatOpen && last.userId !== user?.id && last.id !== lastCountedId.current) {
      lastCountedId.current = last.id;
      setUnreadCount(prev => prev + 1);
    }
    if (isChatOpen) setUnreadCount(0);
  }, [messages, isChatOpen, user?.id, setUnreadCount]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatOpen]);

  // Reset unread when opening chat
  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen, setUnreadCount]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const addLocalMsg = (overrides: Partial<ChatMessage>) => {
    if (!user || !room?._id) return;
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      createdAt: Date.now(),
      type: "text",
      ...overrides,
    };
    setMessages(prev => addAndPersist(prev, msg, room._id));
  };

  const sendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!socket || !room?._id || !user || !input.trim()) return;
    const text = input.trim();
    const id = `msg-${Date.now()}-${user.id}`;

    // 1. Show locally immediately
    addLocalMsg({ id, text, type: "text" });

    // 2. Emit to server (server broadcasts to others, NOT back to sender)
    socket.emit("chat:message", {
      id,
      roomId: room._id,
      text,
      type: "text",
      userName: user.name,
      userAvatar: user.avatarUrl,
    });
    setInput("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (!socket || !user || !room?._id) return;
          const id = `voice-${Date.now()}-${user.id}`;
          addLocalMsg({ id, type: "voice", audioData: base64, text: "🎤 Voice Message" });
          socket.emit("chat:message", {
            id,
            roomId: room._id,
            type: "voice",
            audioData: base64,
            text: "🎤 Voice Message",
            userName: user.name,
            userAvatar: user.avatarUrl,
          });
        };
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      playSound("system");
    } catch {
      showNotification("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room?._id || !user) return;
    setUploading(true);
    try {
      const tripId = room.activeTrip || room._id;
      const result = await uploadPhoto(tripId, file);
      const media = result.media;
      const id = `img-${Date.now()}-${user.id}`;
      addLocalMsg({ id, imageUrl: media.url, mediaId: media._id, text: "Shared a photo", type: "image" });
      socket?.emit("chat:message", {
        id,
        roomId: room._id,
        imageUrl: media.url,
        mediaId: media._id,
        text: "Shared a photo",
        type: "image",
        userName: user.name,
        userAvatar: user.avatarUrl,
      });
      showNotification("Photo shared!", "success");
    } catch {
      showNotification("Failed to upload photo", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.click();
  };

  const deleteMsg = (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== id);
      if (room?._id) window.localStorage.setItem(`go2gether_chat_${room._id}`, JSON.stringify(updated));
      return updated;
    });
    socket?.emit("chat:delete", { roomId: room?._id, id });
  };

  const startEdit = (msg: ChatMessage) => { setEditingId(msg.id); setEditInput(msg.text || ""); };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !editInput.trim()) return;
    setMessages(prev => {
      const updated = prev.map(m => m.id === editingId ? { ...m, text: editInput.trim() } : m);
      if (room?._id) window.localStorage.setItem(`go2gether_chat_${room._id}`, JSON.stringify(updated));
      return updated;
    });
    socket?.emit("chat:edit", { roomId: room?._id, id: editingId, text: editInput.trim() });
    setEditingId(null);
  };

  const handleMsgClick = (msg: ChatMessage) => {
    if (msg.location) setFocusLocation(msg.location);
    else if (msg.userId && memberPositions[msg.userId]) setFocusLocation(memberPositions[msg.userId]);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-3xl transition-all duration-500 md:absolute md:inset-auto md:right-4 md:top-24 md:h-[70vh] md:w-96 md:rounded-[40px] md:border md:border-white/10 md:shadow-2xl
      ${isChatOpen ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0 translate-x-8"}`}>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 pt-safe shrink-0">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Go2Gether</p>
          <h3 className="text-base font-black text-white">Group Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Member avatars row */}
          {room?.members && room.members.length > 0 && (
            <div className="flex -space-x-2">
              {[room.leader, ...(room.members.filter(m => m.id !== room.leader?.id) || [])].slice(0, 4).map((m, i) => m && (
                <div key={m.id} className="h-7 w-7 overflow-hidden rounded-full border-2 border-black bg-indigo-500 flex items-center justify-center" style={{ zIndex: 10 - i }}>
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[9px] font-black text-white">{m.name.substring(0, 1)}</span>
                  )}
                </div>
              ))}
              {(room.members.length) > 4 && (
                <div className="h-7 w-7 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[9px] font-black text-white">+{room.members.length - 4}</div>
              )}
            </div>
          )}
          <button onClick={toggleChat} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center py-12">
            <div className="text-3xl mb-3">💬</div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest">No messages yet</p>
            <p className="text-[10px] text-neutral-600 mt-1">Say hello to your group!</p>
          </div>
        )}

        {messages.map((m) => {
          const isSelf = m.userId === user?.id;
          const isSystem = m.type === "system" || m.userId === "system";
          const time = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          // System / join messages
          if (isSystem) {
            return (
              <div key={m.id} className="flex justify-center">
                <div className="rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-[10px] font-bold text-white/40">
                  {m.text}
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
              {!isSelf && (
                <span className="mb-1 ml-3 text-[10px] font-bold text-neutral-500">{m.userName || "Member"}</span>
              )}
              <div className="group flex max-w-[82%] items-end gap-2">
                <div
                  className={`relative rounded-3xl px-4 py-3 text-sm shadow-lg transition-all
                    ${isSelf
                      ? "bg-white text-black rounded-br-lg"
                      : "bg-white/8 border border-white/8 text-white rounded-bl-lg"
                    }`}
                >
                  {/* Image */}
                  {m.imageUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl">
                      <img src={m.imageUrl} alt="" className="max-h-52 w-full object-cover cursor-pointer" onClick={() => handleDownload(m.imageUrl!, "shared.jpg")} />
                      <p className="mt-1 text-[9px] opacity-40 text-center">Tap to download</p>
                    </div>
                  )}

                  {/* Voice */}
                  {m.type === "voice" ? (
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => m.audioData && new Audio(m.audioData).play().catch(console.error)}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isSelf ? "bg-black/10" : "bg-white/10"}`}>🔊</div>
                      <div>
                        <p className="font-black text-[11px] uppercase tracking-widest">Voice Note</p>
                        <p className="text-[9px] opacity-50">Tap to replay</p>
                      </div>
                    </div>
                  ) : (
                    /* Text with optional edit form */
                    editingId === m.id ? (
                      <form onSubmit={saveEdit} className="flex flex-col gap-2 min-w-[130px]">
                        <input autoFocus value={editInput} onChange={e => setEditInput(e.target.value)}
                          className="bg-black/10 rounded-lg px-2 py-1 text-sm outline-none font-medium" />
                        <div className="flex gap-2">
                          <button type="submit" className="text-[9px] font-black uppercase text-indigo-500">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-[9px] font-black uppercase text-neutral-400">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <p className="leading-relaxed cursor-pointer" onClick={() => handleMsgClick(m)}>{m.text}</p>
                    )
                  )}

                  <div className="mt-1 text-right text-[9px] opacity-30">{time}</div>

                  {/* Click to locate hint */}
                  {(m.location || (!isSelf && memberPositions[m.userId])) && (
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                      <span className="animate-pulse">●</span> Click to locate
                    </div>
                  )}
                </div>

                {/* Hover actions */}
                {isSelf && !editingId && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.type === "text" && !m.imageUrl && (
                      <button onClick={() => startEdit(m)} className="rounded-full p-1.5 text-neutral-500 hover:text-white transition-colors">✎</button>
                    )}
                    <button onClick={() => deleteMsg(m.id)} className="rounded-full p-1.5 text-red-500/50 hover:text-red-500 transition-colors">✕</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="relative shrink-0 border-t border-white/5 bg-black/40 px-4 py-4">
        {isRecording && (
          <div className="absolute -top-14 left-4 right-4 flex items-center justify-between rounded-full bg-red-500 px-5 py-2.5 text-white shadow-2xl animate-bounce">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse block" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Voice Broadcast</span>
            </div>
            <span className="text-[9px] opacity-70">Release to send</span>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex items-center gap-2">
          {/* Mic */}
          <button type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={e => { e.preventDefault(); startRecording(); }}
            onTouchEnd={e => { e.preventDefault(); stopRecording(); }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all ${isRecording ? "bg-red-500 scale-110" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
          >
            <span className="text-lg">🎤</span>
          </button>

          {/* Photo */}
          <button type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
          >
            {uploading ? <span className="text-xs animate-spin">⌛</span> : "📷"}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />

          {/* Text */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isRecording}
            placeholder={isRecording ? "Listening…" : "Message…"}
            className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:bg-white/8 focus:border-white/20 transition-all placeholder:text-neutral-600"
          />

          {/* Send */}
          <button type="submit" disabled={!input.trim() || isRecording}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-black font-black transition-all hover:bg-neutral-200 active:scale-90 disabled:opacity-30">
            →
          </button>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
        .pt-safe { padding-top: env(safe-area-inset-top, 1rem); }
      `}</style>
    </div>
  );
};
