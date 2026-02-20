import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
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
  isDeleted?: boolean;
  seenBy?: string[]; // IDs of users who have seen this message
}

interface ContextMenu {
  msgId: string;
  x: number;
  y: number;
  canEdit: boolean;
}

const persist = (msgs: ChatMessage[], roomId: string) => {
  window.localStorage.setItem(`go2gether_chat_${roomId}`, JSON.stringify(msgs));
};

const addAndDedup = (prev: ChatMessage[], msg: ChatMessage): ChatMessage[] => {
  if (prev.some(m => m.id === msg.id)) return prev;
  return [...prev, msg].slice(-100);
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
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPlayedId = useRef<string | null>(null);
  const lastCountedId = useRef<string | null>(null);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStarted = useRef(false); // prevents double-fire on mobile

  // Long-press detection
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Local state updater helpers ───────────────────────────────────────────
  const addLocal = useCallback((msg: ChatMessage) => {
    if (!room?._id) return;
    setMessages(prev => {
      const next = addAndDedup(prev, msg);
      if (next !== prev) persist(next, room._id);
      return next;
    });
  }, [room?._id]);

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    if (!room?._id) return;
    const stored = window.localStorage.getItem(`go2gether_chat_${room._id}`);
    if (stored) {
      try { setMessages(JSON.parse(stored)); } catch { /* noop */ }
    }
  }, [room?._id]);

  // ── Socket Listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !room?._id) return;
    const rid = room._id;

    const onMessage = (payload: any) => {
      // Server uses socket.to() so the SENDER never receives this.
      // Recipients add the message; sender has already added it locally.
      const msg: ChatMessage = {
        id: payload.id || `${Date.now()}-${Math.random()}`,
        createdAt: payload.createdAt || Date.now(),
        ...payload,
      };
      setMessages(prev => {
        const next = addAndDedup(prev, msg);
        if (next !== prev) {
          persist(next, rid);
          if (msg.userId !== user?.id) playSound("message");
        }
        return next;
      });
    };

    const onUserJoined = (payload: { user?: { id: string; name: string; avatarUrl?: string } }) => {
      const name = payload.user?.name || "Someone";
      const sys: ChatMessage = { id: `sys-join-${Date.now()}`, userId: "system", type: "system", text: `👋 ${name} joined`, createdAt: Date.now() };
      setMessages(prev => { const n = addAndDedup(prev, sys); if (n !== prev) persist(n, rid); return n; });
      showNotification(`${name} joined the room`, "info");
    };

    const onUserLeft = (payload: { userId: string }) => {
      const name = room.members?.find(m => m.id === payload.userId)?.name || "Someone";
      const sys: ChatMessage = { id: `sys-left-${Date.now()}`, userId: "system", type: "system", text: `👋 ${name} left`, createdAt: Date.now() };
      setMessages(prev => { const n = addAndDedup(prev, sys); if (n !== prev) persist(n, rid); return n; });
    };

    const onDeleted = (payload: { id: string }) => {
      setMessages(prev => { const n = prev.filter(m => m.id !== payload.id); persist(n, rid); return n; });
    };

    const onEdited = (payload: { id: string; text: string }) => {
      setMessages(prev => {
        const n = prev.map(m => m.id === payload.id ? { ...m, text: payload.text } : m);
        persist(n, rid); return n;
      });
    };

    const onSeen = (payload: { msgId: string; userId: string }) => {
      setMessages(prev => {
        let changed = false;
        const n = prev.map(m => {
          if (m.id === payload.msgId) {
            const seen = m.seenBy || [];
            if (!seen.includes(payload.userId)) {
              changed = true;
              return { ...m, seenBy: [...seen, payload.userId] };
            }
          }
          return m;
        });
        if (changed) persist(n, rid);
        return n;
      });
    };

    socket.on("chat:message", onMessage);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("chat:deleted", onDeleted);
    socket.on("chat:edited", onEdited);
    socket.on("chat:seen", onSeen);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("chat:deleted", onDeleted);
      socket.off("chat:edited", onEdited);
      socket.off("chat:seen", onSeen);
    };
  }, [socket, room?._id, room?.members, user?.id, showNotification]);

  // ── Auto-play voice (incoming only) + unread ──────────────────────────────
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.type === "voice" && last.audioData && last.userId !== user?.id && last.id !== lastPlayedId.current) {
      lastPlayedId.current = last.id;
      new Audio(last.audioData).play().catch(console.error);
    }
    // Only increment unread if chat is closed and it's a new message we haven't counted
    if (!isChatOpen && last.userId !== user?.id && last.id !== lastCountedId.current) {
      lastCountedId.current = last.id;
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isChatOpen, user?.id, setUnreadCount]);

  useEffect(() => {
    if (isChatOpen && messages.length > 0 && socket) {
      setUnreadCount(0);
      messages.forEach(m => {
        if (m.userId !== user?.id && (!m.seenBy || !m.seenBy.includes(user?.id || ""))) {
          socket.emit("chat:seen", { roomId: room?._id, msgId: m.id, userId: user?.id });
        }
      });
    }
  }, [isChatOpen, messages, setUnreadCount, room?._id, user?.id, socket]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatOpen]);

  // ── Close context menu on outside click ───────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [contextMenu]);

  // ── Send text ─────────────────────────────────────────────────────────────
  const sendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!socket || !room?._id || !user || !input.trim()) return;
    const text = input.trim();
    const id = `msg-${Date.now()}-${user.id}`;
    addLocal({ id, userId: user.id, userName: user.name, userAvatar: user.avatarUrl, text, type: "text", createdAt: Date.now() });
    socket.emit("chat:message", { id, roomId: room._id, text, type: "text", userName: user.name, userAvatar: user.avatarUrl, userId: user.id });
    setInput("");
  };

  // ── Voice recording (mobile-safe: use flag to prevent double trigger) ─────
  const startRecording = useCallback(async () => {
    if (recordingStarted.current || isRecording) return;
    recordingStarted.current = true;
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
          // Add locally (self sees it once)
          addLocal({ id, userId: user.id, userName: user.name, userAvatar: user.avatarUrl, type: "voice", audioData: base64, text: "🎤 Voice Message", createdAt: Date.now() });
          // Broadcast to room members (they add it via onMessage)
          socket.emit("chat:message", { id, roomId: room._id, type: "voice", audioData: base64, text: "🎤 Voice Message", userName: user.name, userAvatar: user.avatarUrl, userId: user.id });
        };
        stream.getTracks().forEach(t => t.stop());
        recordingStarted.current = false;
      };
      recorder.start();
      setIsRecording(true);
      playSound("system");
    } catch {
      recordingStarted.current = false;
      showNotification("Microphone access denied", "error");
    }
  }, [isRecording, socket, user, room?._id, addLocal, showNotification]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room?._id || !user) return;
    setUploading(true);
    try {
      const result = await uploadPhoto(room.activeTrip || room._id, file);
      const { media } = result;
      const id = `img-${Date.now()}-${user.id}`;
      addLocal({ id, userId: user.id, userName: user.name, userAvatar: user.avatarUrl, imageUrl: media.url, mediaId: media._id, text: "Shared a photo", type: "image", createdAt: Date.now() });
      socket?.emit("chat:message", { id, roomId: room._id, imageUrl: media.url, mediaId: media._id, text: "Shared a photo", type: "image", userName: user.name, userAvatar: user.avatarUrl, userId: user.id });
      showNotification("Photo shared!", "success");
    } catch {
      showNotification("Failed to upload photo", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Delete / Edit ─────────────────────────────────────────────────────────
  const deleteMsg = (id: string) => {
    setContextMenu(null);
    setMessages(prev => { const n = prev.filter(m => m.id !== id); if (room?._id) persist(n, room._id); return n; });
    socket?.emit("chat:delete", { roomId: room?._id, id });
  };

  const beginEdit = (msg: ChatMessage) => {
    setContextMenu(null);
    setEditingId(msg.id);
    setEditInput(msg.text || "");
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !editInput.trim()) return;
    const text = editInput.trim();
    setMessages(prev => { const n = prev.map(m => m.id === editingId ? { ...m, text } : m); if (room?._id) persist(n, room._id); return n; });
    socket?.emit("chat:edit", { roomId: room?._id, id: editingId, text });
    setEditingId(null);
    setEditInput("");
  };

  // ── Long-press / right-click context menu ─────────────────────────────────
  const openContextMenu = (e: React.MouseEvent | React.TouchEvent, msg: ChatMessage) => {
    if (msg.userId !== user?.id) return; // only own messages
    if (msg.type === "system") return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = "touches" in e ? (e as React.TouchEvent).touches[0]?.clientX ?? rect.left : (e as React.MouseEvent).clientX;
    const y = "touches" in e ? (e as React.TouchEvent).touches[0]?.clientY ?? rect.top : (e as React.MouseEvent).clientY;
    setContextMenu({ msgId: msg.id, x, y, canEdit: msg.type === "text" && !msg.imageUrl });
  };

  const startLongPress = (msg: ChatMessage) => {
    if (msg.userId !== user?.id || msg.type === "system") return;
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(40);
      setContextMenu({ msgId: msg.id, x: window.innerWidth / 2, y: window.innerHeight / 2 - 60, canEdit: msg.type === "text" && !msg.imageUrl });
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <>
      {/* ── Chat Panel ── */}
      <div
        className={`fixed inset-x-0 bottom-0 top-0 z-[90] flex flex-col bg-[#0a0a0a]/95 backdrop-blur-3xl transition-all duration-500
          md:absolute md:inset-auto md:right-4 md:top-20 md:bottom-auto md:h-[72vh] md:w-[22rem] md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_40px_80px_rgba(0,0,0,0.8)]
          ${isChatOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full md:translate-y-0 md:translate-x-4 opacity-0 pointer-events-none"}
        `}
        style={{ isolation: "isolate" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Go2Gether</p>
            <h3 className="text-sm font-black text-white">Group Chat</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Member avatars */}
            {room?.members && room.members.length > 0 && (
              <div className="flex -space-x-1.5">
                {[room.leader, ...(room.members.filter(m => m.id !== room.leader?.id))].slice(0, 4).map((m, i) => m && (
                  <div key={m.id} className="h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-black bg-indigo-500 flex items-center justify-center" style={{ zIndex: 10 - i }}>
                    {m.avatarUrl
                      ? <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      : <span className="text-[9px] font-black text-white">{m.name[0]}</span>}
                  </div>
                ))}
                {room.members.length > 4 && (
                  <div className="h-7 w-7 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[9px] font-black text-white">
                    +{room.members.length - 4}
                  </div>
                )}
              </div>
            )}
            <button onClick={toggleChat} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-all">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 px-3 py-3 chat-scroll">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center flex-col gap-2 text-center py-16">
              <span className="text-3xl">💬</span>
              <p className="text-[11px] text-neutral-600 uppercase tracking-widest">No messages yet</p>
              <p className="text-[10px] text-neutral-700">Say hello to your group!</p>
            </div>
          )}

          {messages.map((m) => {
            const isSelf = m.userId === user?.id;
            const isSystem = m.type === "system" || m.userId === "system";
            const time = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const isEditing = editingId === m.id;

            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <span className="rounded-full border border-white/5 bg-white/5 px-4 py-1 text-[10px] font-bold text-white/35">{m.text}</span>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex flex-col select-none ${isSelf ? "items-end" : "items-start"}`}>
                {!isSelf && (
                  <span className="mb-0.5 ml-2 text-[10px] font-bold text-neutral-500">{m.userName || "Member"}</span>
                )}

                <div
                  className={`relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md cursor-pointer active:scale-95 transition-transform
                    ${isSelf
                      ? "bg-white text-black rounded-br-sm"
                      : "bg-white/10 border border-white/8 text-white rounded-bl-sm"
                    }
                    ${contextMenu?.msgId === m.id ? "ring-2 ring-white/30" : ""}
                  `}
                  onContextMenu={e => openContextMenu(e, m)}
                  onTouchStart={() => startLongPress(m)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onClick={() => {
                    if (m.location) setFocusLocation(m.location);
                    else if (!isSelf && memberPositions[m.userId]) setFocusLocation(memberPositions[m.userId]);
                    if (m.type === "voice" && m.audioData) new Audio(m.audioData).play().catch(console.error);
                  }}
                >
                  {/* Image */}
                  {m.imageUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl -mx-1">
                      <img src={m.imageUrl} alt="" className="max-h-52 w-full object-cover" />
                    </div>
                  )}

                  {/* Voice */}
                  {m.type === "voice" && (
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSelf ? "bg-black/10" : "bg-white/10"}`}>
                        🔊
                      </div>
                      <div>
                        <p className="font-black text-[11px] uppercase tracking-widest">Voice Note</p>
                        <p className="text-[9px] opacity-50">Tap to replay</p>
                      </div>
                    </div>
                  )}

                  {/* Text — with inline edit form */}
                  {m.type !== "voice" && !m.imageUrl && (
                    isEditing ? (
                      <form onSubmit={saveEdit} onClick={e => e.stopPropagation()} className="flex flex-col gap-2 min-w-[140px]">
                        <input
                          autoFocus
                          value={editInput}
                          onChange={e => setEditInput(e.target.value)}
                          className="rounded-lg bg-black/10 px-2 py-1 text-sm outline-none placeholder:text-neutral-400"
                          onKeyDown={e => e.key === "Escape" && setEditingId(null)}
                        />
                        <div className="flex gap-3">
                          <button type="submit" className="text-[10px] font-black uppercase text-indigo-500">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-[10px] font-black uppercase text-neutral-400">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <p className="leading-relaxed">{m.text}</p>
                    )
                  )}

                  {/* Timestamp */}
                  <div className={`mt-1 text-[9px] ${isSelf ? "text-black/30" : "text-white/25"} text-right`}>{time}</div>
                </div>

                {/* Seen Indicators - Instagram Style (below own message) */}
                {isSelf && m.seenBy && m.seenBy.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 pr-1">
                    <div className="flex -space-x-1.5">
                      {m.seenBy.slice(0, 3).map(uid => {
                        const mem = [room?.leader, ...(room?.members || [])].find(rm => rm?.id === uid);
                        if (!mem) return null;
                        return (
                          <div key={uid} className="h-4 w-4 rounded-full border border-black bg-indigo-500 overflow-hidden shadow-sm" title={mem.name}>
                            {mem.avatarUrl ? (
                              <img src={mem.avatarUrl} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[7px] font-black text-white">
                                {mem.name[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {m.seenBy.length > 0 && (
                      <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter">
                        Seen
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input bar */}
        <div className="relative shrink-0 border-t border-white/5 px-3 py-3 bg-black/50">
          {isRecording && (
            <div className="absolute -top-12 left-3 right-3 flex items-center justify-between rounded-full bg-red-500 px-4 py-2 text-white shadow-xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse block" />
                <span className="text-[10px] font-black uppercase tracking-wider">Recording…</span>
              </div>
              <span className="text-[9px] opacity-70">Release to send</span>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-center gap-2">
            {/* Mic — hold to record, guard against double-fire */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={e => { e.preventDefault(); startRecording(); }}
              onTouchEnd={e => { e.preventDefault(); stopRecording(); }}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all select-none
                ${isRecording ? "bg-red-500 scale-110" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
            >
              🎤
            </button>

            {/* Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-all"
            >
              {uploading ? "⏳" : "📷"}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />

            {/* Text input */}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isRecording}
              placeholder={isRecording ? "Listening…" : "Message…"}
              className="min-w-0 flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:bg-white/8 focus:border-white/20 transition-all placeholder:text-neutral-600"
            />

            {/* Send */}
            <button
              type="submit"
              disabled={!input.trim() || isRecording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black font-black transition-all hover:bg-neutral-200 active:scale-90 disabled:opacity-25 text-lg"
            >
              →
            </button>
          </form>
        </div>
      </div>

      {/* ── Instagram-style Context Menu ── */}
      {contextMenu && (() => {
        const msg = messages.find(m => m.id === contextMenu.msgId);
        if (!msg) return null;
        // Position: ensure it stays within viewport
        const menuW = 160;
        const menuH = contextMenu.canEdit ? 100 : 60;
        const x = Math.min(contextMenu.x, window.innerWidth - menuW - 8);
        const y = Math.min(contextMenu.y, window.innerHeight - menuH - 8);

        return (
          <div
            className="fixed z-[200] overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl"
            style={{ left: x, top: y, minWidth: menuW }}
            onPointerDown={e => e.stopPropagation()}
          >
            {contextMenu.canEdit && (
              <button
                onClick={() => beginEdit(msg)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors border-b border-white/5"
              >
                <span className="text-base">✏️</span>
                Edit Message
              </button>
            )}
            <button
              onClick={() => deleteMsg(contextMenu.msgId)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <span className="text-base">🗑️</span>
              Delete Message
            </button>
          </div>
        );
      })()}

      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 20px; }
      `}</style>
    </>
  );
};
