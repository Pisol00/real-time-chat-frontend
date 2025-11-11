"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Settings,
  LogOut,
  Users,
  Wifi,
  WifiOff,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NewChatModal from "@/components/NewChatModal";
import {
  getConversations,
  getMessages,
  markConversationAsRead,
  createMessage,
  type Conversation,
  type Message as ApiMessage,
} from "@/lib/api/conversations";

function ChatContent() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedSocketMessagesRef = useRef<Set<string>>(new Set());

  const { user, logout } = useAuth();
  const currentUserId = user?.id || "";
  const currentConversation = conversations.find(
    (c) => c._id === selectedConversationId
  ) || null;

  // ใช้ Socket context
  const {
    socket,
    isConnected,
    sendMessage: socketSendMessage,
    sendTyping,
    messages: socketMessages,
    typingUsers,
    onlineUsers,
  } = useSocket();

  // Load conversations on mount
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      if (response.success) {
        setConversations(response.data.conversations);
        // Select first conversation if available
        if (response.data.conversations.length > 0) {
          setSelectedConversationId(response.data.conversations[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Listen for read receipts
  useEffect(() => {
    if (!socket) return;

    const handleMessagesRead = (data: {
      conversationId: string;
      messageIds: string[];
      readBy: string;
    }) => {
      console.log("Messages marked as read:", data);
      // Update messages in current conversation
      if (data.conversationId === selectedConversationId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (data.messageIds.includes(msg._id)) {
              // Add readBy entry if not exists
              const readBy = msg.readBy || [];
              const alreadyRead = readBy.some((r) => r.user === data.readBy);
              if (!alreadyRead) {
                return {
                  ...msg,
                  readBy: [
                    ...readBy,
                    { user: data.readBy, readAt: new Date().toISOString() },
                  ],
                };
              }
            }
            return msg;
          })
        );
      }
    };

    socket.on("messages:read", handleMessagesRead);

    return () => {
      socket.off("messages:read", handleMessagesRead);
    };
  }, [socket, selectedConversationId]);

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        const response = await getMessages(selectedConversationId);
        if (response.success) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  // Mark conversation as read when selected or when new messages arrive
  useEffect(() => {
    const markAsRead = async () => {
      if (!selectedConversationId) return;

      // Find current conversation
      const conv = conversations.find((c) => c._id === selectedConversationId);
      if (!conv || !conv.unreadCount) return;

      try {
        await markConversationAsRead(selectedConversationId);
        // Update local state
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConversationId
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    };

    markAsRead();
  }, [selectedConversationId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, socketMessages]);

  // Listen for new messages from Socket.io and update conversations
  useEffect(() => {
    // Process only new socket messages
    socketMessages.forEach((socketMsg) => {
      const messageId = socketMsg.id || "";
      if (!messageId || processedSocketMessagesRef.current.has(messageId)) {
        return;
      }

      // Mark as processed
      processedSocketMessagesRef.current.add(messageId);

      // Update conversations list
      setConversations((prev) => {
        const convIndex = prev.findIndex(
          (c) => c._id === socketMsg.conversationId
        );
        if (convIndex === -1) return prev;

        const updatedConversations = [...prev];
        const conversation = { ...updatedConversations[convIndex] };

        // Update last message
        conversation.lastMessage = {
          _id: socketMsg.id || "",
          text: socketMsg.text,
          sender: socketMsg.senderId,
          createdAt: new Date(socketMsg.timestamp).toISOString(),
        };
        conversation.lastMessageAt = new Date(socketMsg.timestamp).toISOString();

        // Increment unread count if not viewing this conversation or not sender
        if (
          socketMsg.senderId !== currentUserId &&
          socketMsg.conversationId !== selectedConversationId
        ) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        // Remove from current position
        updatedConversations.splice(convIndex, 1);
        // Add to top
        updatedConversations.unshift(conversation);

        return updatedConversations;
      });

      // Add message to current conversation if viewing it
      if (socketMsg.conversationId === selectedConversationId) {
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m._id === socketMsg.id);
          if (exists) return prev;

          // Convert socket message to API message format
          const apiMsg: ApiMessage = {
            _id: socketMsg.id || "",
            conversationId: socketMsg.conversationId,
            sender: {
              _id: socketMsg.senderId,
              username: socketMsg.sender?.username || "",
              displayName: socketMsg.sender?.displayName || "",
              avatar: socketMsg.sender?.avatar,
            },
            type: "text",
            text: socketMsg.text,
            createdAt: new Date(socketMsg.timestamp).toISOString(),
            updatedAt: new Date(socketMsg.timestamp).toISOString(),
          };
          return [...prev, apiMsg];
        });

        // Mark as read immediately if message is from other user
        if (socketMsg.senderId !== currentUserId) {
          markConversationAsRead(selectedConversationId).catch((err) =>
            console.error("Failed to mark as read:", err)
          );
        }
      }
    });
  }, [socketMessages, selectedConversationId, currentUserId]);

  const getOtherParticipant = (conv: Conversation) => {
    if (conv.type === "group") return null;
    return conv.participants.find((p) => p._id !== currentUserId);
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "group") {
      return conv.name || "กลุ่ม";
    }
    const other = getOtherParticipant(conv);
    return other?.displayName || other?.username || "ไม่มีชื่อ";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === "group") {
      return conv.avatar || conv.name?.[0] || "G";
    }
    const other = getOtherParticipant(conv);
    return (
      other?.avatar ||
      other?.displayName?.[0] ||
      other?.username?.[0] ||
      "?"
    );
  };

  const isConversationOnline = (conv: Conversation) => {
    if (conv.type === "group") return false;
    const other = getOtherParticipant(conv);
    return other ? onlineUsers.includes(other._id) : false;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "เมื่อวาน";
    } else if (diffDays < 7) {
      return `${diffDays} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const formatReadTime = (timestamp: string) => {
    const now = new Date();
    const readTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - readTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "อ่านเมื่อสักครู่";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `อ่านเมื่อ ${minutes} นาทีที่แล้ว`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `อ่านเมื่อ ${hours} ชั่วโมงที่แล้ว`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `อ่านเมื่อ ${days} วันที่แล้ว`;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentConversation || sendingMessage) return;

    const textToSend = message;
    setMessage(""); // Clear input immediately for better UX
    setSendingMessage(true);

    if (isTyping) {
      sendTyping(currentConversation._id, false);
      setIsTyping(false);
    }

    try {
      // Send message via API (backend will emit via Socket.IO)
      const response = await createMessage({
        conversationId: currentConversation._id,
        text: textToSend,
      });

      if (response.success) {
        // Add message immediately for instant feedback
        const newMessage = response.data.message;
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setMessage(textToSend);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!currentConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(currentConversation._id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(currentConversation._id, false);
    }, 2000);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleConversationCreated = async () => {
    // Reload conversations when a new one is created
    await loadConversations();
  };

  // Check if user is typing in current conversation
  const isUserTypingInConversation = currentConversation
    ? typingUsers.some(
        (tu) =>
          tu.conversationId === currentConversation._id &&
          tu.userId !== currentUserId
      )
    : false;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 bg-blue-600 rounded-lg transform rotate-6"></div>
                <div className="relative bg-blue-600 rounded-lg p-1.5 shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
              </div>
              <span className="text-lg font-bold text-slate-900">
                RealTime Chat
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="เริ่มการสนทนาใหม่"
              >
                <Plus className="w-5 h-5 text-slate-600" />
              </button>
              <Link
                href="/profile"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาการสนทนา..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 mb-2">ยังไม่มีการสนทนา</p>
              <p className="text-xs text-slate-400">
                คลิกปุ่ม + เพื่อเริ่มแชทใหม่
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isOnline = isConversationOnline(conv);
              const isSelected = conv._id === selectedConversationId;

              return (
                <div
                  key={conv._id}
                  onClick={() => setSelectedConversationId(conv._id)}
                  className={`flex items-center gap-3 p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50 hover:bg-blue-50" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-base font-semibold text-blue-600 overflow-hidden">
                      {getConversationAvatar(conv).startsWith("http") ? (
                        <img
                          src={getConversationAvatar(conv)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getConversationAvatar(conv)
                      )}
                    </div>
                    {conv.type === "group" ? (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-slate-200">
                        <Users className="w-3 h-3 text-slate-600" />
                      </div>
                    ) : isOnline ? (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {getConversationName(conv)}
                      </h3>
                      <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600 truncate">
                        {conv.lastMessage?.text || "ยังไม่มีข้อความ"}
                      </p>
                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-full flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {!currentConversation ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              เลือกการสนทนา
            </h3>
            <p className="text-sm text-slate-500">
              เลือกการสนทนาจากรายการด้านซ้าย
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-base font-semibold text-blue-600 overflow-hidden">
                  {getConversationAvatar(currentConversation).startsWith(
                    "http"
                  ) ? (
                    <img
                      src={getConversationAvatar(currentConversation)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getConversationAvatar(currentConversation)
                  )}
                </div>
                {currentConversation.type !== "group" &&
                  isConversationOnline(currentConversation) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {getConversationName(currentConversation)}
                </h2>
                <p className="text-sm text-slate-500">
                  {currentConversation.type === "group"
                    ? `${currentConversation.participants.length} สมาชิก`
                    : isConversationOnline(currentConversation)
                    ? "ออนไลน์"
                    : "ออฟไลน์"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <Phone className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <Video className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-yellow-800">
                <WifiOff className="w-3.5 h-3.5" />
                <span>กำลังเชื่อมต่อใหม่...</span>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">ยังไม่มีข้อความ</p>
                  <p className="text-xs text-slate-400 mt-1">
                    เริ่มสนทนาด้วยการส่งข้อความแรก
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isMine = msg.sender._id === currentUserId;
                  // Check if this is the last message overall AND from current user
                  const isLastMyMessage = isMine && index === messages.length - 1;

                  // Check if previous message is from same sender
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isFirstInGroup = !prevMsg || prevMsg.sender._id !== msg.sender._id;

                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-2 ${
                        isMine ? "flex-row-reverse" : "flex-row"
                      } ${!isFirstInGroup ? "mt-0.5" : "mt-3"} ${
                        !isMine && !isFirstInGroup ? "ml-12" : ""
                      }`}
                    >
                      {/* Profile Picture - only show for first message in group */}
                      {!isMine && isFirstInGroup && (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 overflow-hidden shrink-0">
                          {msg.sender.avatar ? (
                            <img
                              src={msg.sender.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (msg.sender.displayName || msg.sender.username)
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-md ${
                            isMine
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-900"
                          } rounded-2xl px-4 py-2.5 shadow-sm`}
                        >
                          {!isMine && currentConversation.type === "group" && (
                            <p className="text-sm font-semibold mb-1 text-blue-600">
                              {msg.sender.displayName || msg.sender.username}
                            </p>
                          )}
                          <p className="text-base break-words">{msg.text}</p>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatTime(msg.createdAt)}
                        </div>
                        {isLastMyMessage && isMine && msg.readBy && msg.readBy.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            อ่านแล้ว · {formatReadTime(msg.readBy[0].readAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isUserTypingInConversation && (
                  <div className="flex justify-start">
                    <div className="bg-white text-slate-900 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Paperclip className="w-5 h-5 text-slate-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Smile className="w-5 h-5 text-slate-600" />
              </button>
              <input
                type="text"
                value={message}
                onChange={handleTyping}
                disabled={sendingMessage}
                placeholder="พิมพ์ข้อความ..."
                className="flex-1 px-4 py-2.5 text-base rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={sendingMessage || !message.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {sendingMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}

// Wrap with SocketProvider and ProtectedRoute
export default function ChatPage() {
  const { user } = useAuth();
  const userId = user?.id || "me";

  return (
    <ProtectedRoute>
      <SocketProvider userId={userId}>
        <ChatContent />
      </SocketProvider>
    </ProtectedRoute>
  );
}
