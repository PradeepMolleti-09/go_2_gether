import { useEffect, useState, useRef, type FormEvent } from "react";
import { useUI } from "../../context/UIContext";
import { useSocket } from "../../context/SocketContext";
import { useRoom } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { useMapContext } from "../../context/MapContext";
import { useNotification } from "../../context/NotificationContext";
import { uploadPhoto, deleteMedia } from "../../services/mediaService";
import { playSound } from "../../utils/sounds";

interface ChatMessage {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  text?: string;
  imageUrl?: string;
  mediaId?: string;
  type?: "text" | "image" | "checkpoint" | "member";
  location?: { lat: number; lng: number };
  createdAt: number;
  isCheckpointNotification?: boolean;
  checkpointId?: string;
  isDeleted?: boolean;
}

export const RightChatPanel = () => {
  const { isChatOpen, toggleChat, unreadCount, setUnreadCount } = useUI();
  const { socket } = useSocket();
  const { room } = useRoom();
  const { user } = useAuth();
  const { setFocusLocation, memberPositions } = useMapContext();
  const { showNotification } = useNotification();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate messages from localStorage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(`go2gether_chat_${room?._id}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as ChatMessage[];
      setMessages(parsed);
    } catch {
      window.localStorage.removeItem(`go2gether_chat_${room?._id}`);
    }
  }, [room?._id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: any) => {
      const newMessage: ChatMessage = {
        id: payload.id || `${Date.now()}-${Math.random()}`,
        userId: payload.userId,
        userName: payload.userName,
        userAvatar: payload.userAvatar,
        text: payload.text,
        imageUrl: payload.imageUrl,
        mediaId: payload.mediaId,
        location: payload.location,
        isCheckpointNotification: payload.isCheckpointNotification,
        checkpointId: payload.checkpointId,
        isDeleted: payload.isDeleted,
        createdAt: payload.createdAt ?? Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        if (room?._id) {
          window.localStorage.setItem(
            `go2gether_chat_${room._id}`,
            JSON.stringify(updated.slice(-100)) // Keep last 100
          );
        }

        // Play sound if not from self
        if (newMessage.userId !== user?.id) {
          playSound("message");
        }

        return updated;
      });
    };

    socket.on("chat:message", handler);

    socket.on("checkpoint:deleted", (payload: { checkpointId: string }) => {
      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.checkpointId === payload.checkpointId) {
            return {
              ...msg,
              text: msg.text?.includes("(REMOVED)") ? msg.text : `${msg.text} (REMOVED)`,
              isDeleted: true
            };
          }
          return msg;
        });
        if (room?._id) {
          window.localStorage.setItem(
            `go2gether_chat_${room._id}`,
            JSON.stringify(updated)
          );
        }
        return updated;
      });
    });

    const localHandler = (e: any) => {
      handler(e.detail);
    };
    window.addEventListener("local-chat-message", localHandler as EventListener);

    return () => {
      socket.off("chat:message", handler);
      socket.off("checkpoint:deleted");
      window.removeEventListener("local-chat-message", localHandler as EventListener);
    };
  }, [socket, room?._id, user?.id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !room?._id || !user || !input.trim()) return;
    const text = input.trim();
    const payload = {
      roomId: room._id,
      text,
      userName: user.name,
      userAvatar: user.avatarUrl,
    };

    socket.emit("chat:message", payload);

    // Dispatch local event for immediate feedback
    const localPayload = {
      ...payload,
      userId: user.id,
      createdAt: Date.now(),
      id: `${Date.now()}-self`,
    };
    window.dispatchEvent(new CustomEvent("local-chat-message", { detail: localPayload }));

    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room?._id || !user) return;

    setUploading(true);
    try {
      const tripId = room.activeTrip || room._id;
      const result = await uploadPhoto(tripId, file);
      const media = result.media;

      const payload = {
        roomId: room._id,
        imageUrl: media.url,
        mediaId: media._id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        text: "Shared a photo",
      };

      if (!socket) return;
      socket.emit("chat:message", payload);

      const localPayload = {
        ...payload,
        userId: user.id,
        createdAt: Date.now(),
        id: `${Date.now()}-self`,
      };
      window.dispatchEvent(new CustomEvent("local-chat-message", { detail: localPayload }));

      showNotification("Photo shared!", "success");
    } catch (err) {
      console.error("Upload failed", err);
      showNotification("Failed to upload photo", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!msg.mediaId || !user) return;
    if (msg.userId !== user.id) return;

    if (!window.confirm("Delete this photo?")) return;

    try {
      await deleteMedia(msg.mediaId);
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== msg.id);
        if (room?._id) {
          window.localStorage.setItem(`go2gether_chat_${room._id}`, JSON.stringify(updated));
        }
        return updated;
      });
      showNotification("Photo deleted", "success");
    } catch (err) {
      console.error("Delete failed", err);
      showNotification("Failed to delete photo", "error");
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
      console.error("Download failed:", error);
      // Fallback to opening in new tab if direct download fails
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMessageClick = (msg: ChatMessage) => {
    if (msg.isDeleted) {
      showNotification("This checkpoint has been removed", "warning");
      return;
    }
    if (msg.location) {
      setFocusLocation(msg.location);
      showNotification(`Focusing on checkpoint location`, "info");
    } else if (msg.userId) {
      const pos = memberPositions[msg.userId];
      if (pos) {
        setFocusLocation(pos);
        showNotification(`Focusing on ${msg.userName || "member"}'s location`, "info");
      } else {
        showNotification("Member's location not available", "warning");
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle unread count
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen, setUnreadCount]);

  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== user?.id) {
        setUnreadCount((prev: number) => prev + 1);
      }
    }
  }, [messages, isChatOpen, user?.id, setUnreadCount]);

  return (
    <div className={`pointer-events-none fixed md:absolute transition-all duration-500 ease-in-out
      ${isChatOpen
        ? "inset-0 z-[100] md:z-20 md:inset-auto md:right-4 md:top-24 md:h-[70vh] md:w-80 lg:w-96 flex-col overflow-hidden"
        : "right-4 top-24 w-0 h-0 opacity-0 pointer-events-none z-20"
      }`}>
      <div
        className={`pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-none md:rounded-3xl border border-white/10 bg-black/80 text-neutral-100 shadow-2xl backdrop-blur-3xl transition-all duration-500
          ${isChatOpen ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"}`}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Group Chat</span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount} New
              </span>
            )}
            <button
              onClick={() => toggleChat()}
              className="relative md:hidden text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scroll-smooth custom-scrollbar"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="mb-2 text-2xl">💬</div>
              <p className="text-[12px] text-neutral-500">
                No messages yet. Send a message or share a photo with your group!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isSelf = m.userId === user?.id;
              const sender = !isSelf
                ? room?.members?.find(mem => mem.id === m.userId) ||
                (room?.leader?.id === m.userId ? room.leader : null)
                : null;

              const displayName = m.userName || sender?.name || "Member";
              const avatar = m.userAvatar || sender?.avatarUrl;
              const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className="h-7 w-7 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-white/20"
                      onClick={() => handleMessageClick(m)}
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            // Hide image on error to show initials
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement?.classList.add('bg-white/10');
                            const initial = document.createElement('div');
                            initial.className = "flex h-full w-full items-center justify-center text-[10px]";
                            initial.innerText = displayName.substring(0, 1).toUpperCase();
                            (e.target as HTMLImageElement).parentElement?.appendChild(initial);
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/10 text-[10px]">
                          {displayName.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      {!isSelf && (
                        <span className="ml-1 text-[10px] text-neutral-500">{displayName} • {time}</span>
                      )}

                      <div
                        className={`group relative overflow-hidden rounded-2xl px-3 py-2 text-[12px] transition-all ${isSelf ? "bg-white text-black" : "bg-white/10 text-white"
                          } ${m.isCheckpointNotification ? (m.isDeleted ? "border border-red-500/30 bg-red-500/5 opacity-60" : "border border-indigo-500/50 bg-indigo-500/10") : ""} cursor-pointer hover:ring-1 hover:ring-white/30`}
                        onClick={() => handleMessageClick(m)}
                      >
                        {m.imageUrl && (
                          <div className="mb-2 overflow-hidden rounded-lg border border-white/10 shadow-lg">
                            <img src={m.imageUrl} alt="Shared" className="max-h-60 w-full object-cover" />
                            <div className="flex gap-1 p-1 bg-black/40">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownload(m.imageUrl!, `shared-${m.id}.jpg`); }}
                                className="flex-1 rounded py-1 text-[9px] hover:bg-white/20"
                              >
                                Download
                              </button>
                              {isSelf && m.mediaId && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteMessage(m); }}
                                  className="rounded p-1 text-[9px] text-red-400 hover:bg-red-500/20"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        <p className={`whitespace-pre-wrap ${m.isDeleted ? "line-through text-neutral-500" : ""}`}>{m.text}</p>
                        {isSelf && <div className="mt-1 text-right text-[9px] opacity-40">{time}</div>}

                        {m.isDeleted ? (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-red-500 font-bold uppercase tracking-wider">
                            <span>✕</span> Removed
                          </div>
                        ) : (
                          (m.location || (!isSelf && memberPositions[m.userId])) && (
                            <div className="mt-1 flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                              <span className="animate-pulse">●</span> Click to locate
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="relative border-t border-white/5 bg-black/30 p-3">
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <button
              type="button"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Share photo"
            >
              {uploading ? "..." : "📷"}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <input
              className="flex-1 rounded-full bg-white/10 px-4 py-2 text-[12px] text-white placeholder:text-neutral-500 outline-none focus:bg-white/15 focus:ring-1 focus:ring-white/20 transition-all"
              placeholder="Message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
              disabled={!input.trim()}
            >
              →
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

