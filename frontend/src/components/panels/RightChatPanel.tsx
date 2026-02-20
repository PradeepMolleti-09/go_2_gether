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
  type?: "text" | "image" | "checkpoint" | "member" | "voice";
  audioData?: string;
  location?: { lat: number; lng: number };
  createdAt: number;
  isCheckpointNotification?: boolean;
  checkpointId?: string;
  isDeleted?: boolean;
}

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
  const lastProcessedMessageId = useRef<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Hydrate messages from localStorage
  useEffect(() => {
    if (!room?._id) return;
    const stored = window.localStorage.getItem(`go2gether_chat_${room._id}`);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch (e) {
        console.error("Local storage corruption", e);
      }
    }
  }, [room?._id]);

  // Socket Listeners
  useEffect(() => {
    if (!socket || !room?._id) return;

    const handleNewMessage = (payload: any) => {
      const msg: ChatMessage = {
        ...payload,
        id: payload.id || `${Date.now()}-${Math.random()}`,
        createdAt: payload.createdAt || Date.now()
      };

      setMessages((prev) => {
        const updated = [...prev, msg].slice(-100);
        window.localStorage.setItem(`go2gether_chat_${room._id}`, JSON.stringify(updated));

        // Effects for new messages
        if (msg.userId !== user?.id) {
          playSound("message");
        }
        return updated;
      });
    };

    const handleDelete = (payload: { id: string }) => {
      setMessages((prev) => {
        const updated = prev.filter(m => m.id !== payload.id);
        window.localStorage.setItem(`go2gether_chat_${room._id}`, JSON.stringify(updated));
        return updated;
      });
    };

    const handleEdit = (payload: { id: string, text: string }) => {
      setMessages((prev) => {
        const updated = prev.map(m => m.id === payload.id ? { ...m, text: payload.text } : m);
        window.localStorage.setItem(`go2gether_chat_${room._id}`, JSON.stringify(updated));
        return updated;
      });
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:deleted", handleDelete);
    socket.on("chat:edited", handleEdit);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:deleted", handleDelete);
      socket.off("chat:edited", handleEdit);
    };
  }, [socket, room?._id, user?.id]);

  // Auto-playback & Unread logic
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg.id !== lastProcessedMessageId.current) {
      // Auto-play voice messages from others
      if (lastMsg.type === "voice" && lastMsg.audioData && lastMsg.userId !== user?.id) {
        const audio = new Audio(lastMsg.audioData);
        audio.play().catch(console.error);
      }

      // Handle unread counts
      if (!isChatOpen && lastMsg.userId !== user?.id) {
        setUnreadCount((prev: number) => prev + 1);
      }
      lastProcessedMessageId.current = lastMsg.id;
    }

    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [messages, isChatOpen, user?.id, setUnreadCount]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  // Actions
  const sendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!socket || !room?._id || !user || !input.trim()) return;

    const payload = {
      roomId: room._id,
      text: input.trim(),
      userName: user.name,
      userAvatar: user.avatarUrl,
      userId: user.id,
      createdAt: Date.now(),
      type: "text"
    };

    socket.emit("chat:message", payload);
    setInput("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (!socket || !user || !room?._id) return;
          socket.emit("chat:message", {
            roomId: room._id,
            type: "voice",
            audioData: base64,
            text: "🎤 Voice Announcement",
            userName: user.name,
            userAvatar: user.avatarUrl,
            userId: user.id
          });
        };
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      playSound("system");
    } catch (err) {
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

      if (!socket) return;
      socket.emit("chat:message", {
        roomId: room._id,
        imageUrl: media.url,
        mediaId: media._id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        userId: user.id,
        text: "Shared a photo",
        type: "image"
      });
      showNotification("Photo shared!", "success");
    } catch (err) {
      showNotification("Failed to upload photo", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "photo.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.click();
    }
  };

  const deleteMsg = (id: string) => {
    if (window.confirm("Delete this message?")) {
      socket?.emit("chat:delete", { roomId: room?._id, id });
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditInput(msg.text || "");
  };

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !editInput.trim()) return;
    socket?.emit("chat:edit", { roomId: room?._id, id: editingId, text: editInput.trim() });
    setEditingId(null);
  };

  const handleMessageClick = (msg: ChatMessage) => {
    if (msg.location) setFocusLocation(msg.location);
    else if (msg.userId && memberPositions[msg.userId]) {
      setFocusLocation(memberPositions[msg.userId]);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-3xl transition-all duration-500 md:absolute md:inset-auto md:right-4 md:top-24 md:h-[70vh] md:w-96 md:rounded-[40px] md:border md:border-white/10 md:shadow-2xl ${isChatOpen ? "opacity-100" : "pointer-events-none opacity-0 translate-x-12"}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Secure Room</span>
          <h3 className="text-lg font-black text-white">Group Chat</h3>
        </div>
        <button onClick={toggleChat} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/60 transition-all hover:bg-white/10 active:scale-90">✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 p-6 scroll-smooth custom-scrollbar">
        {messages.map((m) => {
          const isSelf = m.userId === user?.id;
          const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={m.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
              {!isSelf && <span className="mb-2 ml-2 text-[10px] font-bold text-neutral-500">{m.userName || "Member"}</span>}
              <div className="group relative flex max-w-[85%] items-end gap-2">
                <div
                  className={`rounded-3xl px-4 py-3 text-sm shadow-xl transition-all ${isSelf ? "bg-white text-black rounded-br-lg" : "bg-white/10 text-white rounded-bl-lg border border-white/10"}`}
                >
                  {m.type === "voice" ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10">🔊</div>
                      <div className="flex flex-col">
                        <span className="font-black uppercase tracking-widest text-[10px]">Voice Note</span>
                        <span className="text-[9px] opacity-60">Auto-played to room</span>
                      </div>
                    </div>
                  ) : m.imageUrl ? (
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <img src={m.imageUrl} alt="" className="rounded-xl max-h-48 object-cover cursor-pointer" onClick={() => handleDownload(m.imageUrl!, "shared.jpg")} />
                      <span className="text-[10px] opacity-40 italic">Click to download</span>
                    </div>
                  ) : (
                    editingId === m.id ? (
                      <form onSubmit={saveEdit} className="flex flex-col gap-2 min-w-[120px]">
                        <input autoFocus className="bg-black/10 rounded px-2 py-1 outline-none font-bold" value={editInput} onChange={e => setEditInput(e.target.value)} />
                        <div className="flex gap-2">
                          <button type="submit" className="text-[9px] font-black uppercase text-indigo-500">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-[9px] font-black uppercase text-neutral-500">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <p className="leading-relaxed cursor-pointer" onClick={() => handleMessageClick(m)}>{m.text}</p>
                    )
                  )}
                  <div className="mt-1 flex items-center justify-end gap-2 opacity-30 text-[9px] font-bold">
                    <span>{time}</span>
                  </div>
                </div>

                {/* Quick Actions (Hover) */}
                {isSelf && !editingId && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.type === "text" && (
                      <button onClick={() => startEdit(m)} className="rounded-full bg-white/5 p-1.5 text-neutral-500 hover:text-white transition-colors">✎</button>
                    )}
                    <button onClick={() => deleteMsg(m.id)} className="rounded-full bg-red-500/10 p-1.5 text-red-500/50 hover:text-red-500 transition-colors">✕</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="relative border-t border-white/5 bg-black/40 p-6">
        {isRecording && (
          <div className="absolute -top-14 left-6 right-6 flex items-center justify-between rounded-full bg-red-500 px-6 py-3 text-white shadow-2xl animate-bounce">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Announcing Live...</span>
            </div>
            <span className="text-[10px] font-bold opacity-70">Release to broadcast</span>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all shadow-xl active:scale-150 ${isRecording ? "bg-red-500 scale-110" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
          >
            <span className="text-xl">🎤</span>
          </button>

          <button
            type="button"
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-90"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "..." : "📷"}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

          <div className="relative flex-1">
            <input
              placeholder={isRecording ? "Listening..." : "Message group..."}
              className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 pl-5 pr-12 text-sm text-white outline-none focus:bg-white/10 focus:border-white/20 transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isRecording}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black shadow-lg transition-all hover:bg-neutral-200 active:scale-90">
              →
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
};
