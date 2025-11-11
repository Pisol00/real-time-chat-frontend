import { io, Socket } from "socket.io-client";

// URL ของ backend server (เปลี่ยนตาม environment ของคุณ)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const initSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        userId,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
