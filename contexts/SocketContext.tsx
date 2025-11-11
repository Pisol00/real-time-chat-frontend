"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  timestamp: Date;
  sent: boolean;
  delivered?: boolean;
  read?: boolean;
  sender?: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

interface TypingUser {
  userId: string;
  conversationId: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  messages: Message[];
  typingUsers: TypingUser[];
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  userId,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    const socketInstance = initSocket(userId);
    setSocket(socketInstance);

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to socket server");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from socket server");
    });

    // Message events
    socketInstance.on("message:received", (message: Message) => {
      console.log("Message received:", message);
      setMessages((prev) => [...prev, { ...message, sent: false }]);
    });

    socketInstance.on("message:delivered", (messageId: string) => {
      console.log("Message delivered:", messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, delivered: true } : msg
        )
      );
    });

    socketInstance.on("message:read", (messageId: string) => {
      console.log("Message read:", messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    });

    // Handle multiple messages read at once
    socketInstance.on("messages:read", (data: { conversationId: string; messageIds: string[]; readBy: string }) => {
      console.log("Messages read:", data);
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      );
    });

    // Typing events
    socketInstance.on(
      "user:typing",
      (data: { userId: string; conversationId: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingUsers((prev) => [
            ...prev.filter((u) => u.userId !== data.userId),
            { userId: data.userId, conversationId: data.conversationId },
          ]);
        } else {
          setTypingUsers((prev) =>
            prev.filter((u) => u.userId !== data.userId)
          );
        }
      }
    );

    // Online status events
    socketInstance.on("users:online", (users: string[]) => {
      console.log("Online users:", users);
      setOnlineUsers(users);
    });

    socketInstance.on("user:online", (userId: string) => {
      console.log("User online:", userId);
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    socketInstance.on("user:offline", (userId: string) => {
      console.log("User offline:", userId);
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [userId]);

  const sendMessage = (message: Omit<Message, "id" | "timestamp">) => {
    if (!socket || !isConnected) {
      console.error("Socket not connected");
      return;
    }

    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    // Add to local messages immediately
    setMessages((prev) => [...prev, newMessage]);

    // Send to server
    socket.emit("message:send", newMessage);
  };

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (!socket || !isConnected) return;

    socket.emit("typing", { conversationId, isTyping });
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    sendTyping,
    messages,
    typingUsers,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
