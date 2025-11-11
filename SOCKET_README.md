# Socket.io Integration Guide

## Overview
โปรเจคนี้ใช้ Socket.io สำหรับ real-time messaging features

## Features Implemented
- ✅ Real-time message sending/receiving
- ✅ Typing indicator
- ✅ Online/offline status tracking
- ✅ Message delivery status (sent, delivered, read)
- ✅ Auto reconnection

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
สร้างไฟล์ `.env.local` และเพิ่ม:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Run Development Server
```bash
npm run dev
```

## Backend Events ที่ต้อง Implement

### Server Events (Backend ต้องรับ)
1. **message:send** - รับข้อความจาก client
   ```typescript
   socket.on("message:send", (message) => {
     // Save to database
     // Emit to receiver
     io.to(receiverId).emit("message:received", message);
   });
   ```

2. **typing** - รับสถานะการพิมพ์
   ```typescript
   socket.on("typing", ({ conversationId, isTyping }) => {
     // Broadcast to other users in conversation
     socket.to(conversationId).emit("user:typing", {
       userId: socket.userId,
       conversationId,
       isTyping,
     });
   });
   ```

3. **connection** - เมื่อ user เชื่อมต่อ
   ```typescript
   io.on("connection", (socket) => {
     const userId = socket.handshake.auth.userId;

     // Mark user as online
     socket.join(userId);
     socket.broadcast.emit("user:online", userId);

     // Send list of online users
     const onlineUsers = getOnlineUsers();
     socket.emit("users:online", onlineUsers);
   });
   ```

4. **disconnect** - เมื่อ user ตัดการเชื่อมต่อ
   ```typescript
   socket.on("disconnect", () => {
     socket.broadcast.emit("user:offline", socket.userId);
   });
   ```

### Client Events (Frontend รับ)
1. **message:received** - รับข้อความใหม่
2. **message:delivered** - ข้อความส่งถึงผู้รับแล้ว
3. **message:read** - ข้อความถูกอ่านแล้ว
4. **user:typing** - มีคนกำลังพิมพ์
5. **user:online** - มี user ออนไลน์
6. **user:offline** - มี user ออฟไลน์
7. **users:online** - รายชื่อ users ที่ออนไลน์ทั้งหมด

## Message Object Structure

```typescript
interface Message {
  id: string;              // Unique message ID
  text: string;            // Message content
  senderId: string;        // Sender user ID
  receiverId: string;      // Receiver user ID
  conversationId: string;  // Conversation ID
  timestamp: Date;         // Message timestamp
  sent: boolean;           // Message sent status
  delivered?: boolean;     // Message delivered status
  read?: boolean;          // Message read status
}
```

## Usage in Components

### Using Socket Context
```typescript
import { useSocket } from "@/contexts/SocketContext";

function MyComponent() {
  const {
    socket,
    isConnected,
    sendMessage,
    sendTyping,
    messages,
    typingUsers,
    onlineUsers,
  } = useSocket();

  // Send a message
  const handleSend = () => {
    sendMessage({
      text: "Hello!",
      senderId: "me",
      receiverId: "user1",
      conversationId: "conv1",
      sent: true,
    });
  };

  // Send typing indicator
  const handleTyping = () => {
    sendTyping("conv1", true);
  };

  return <div>...</div>;
}
```

## Backend Example (Node.js + Socket.io)

```javascript
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  console.log("User connected:", userId);

  // Store user
  onlineUsers.set(userId, socket.id);
  socket.userId = userId;

  // Join user's room
  socket.join(userId);

  // Broadcast online status
  socket.broadcast.emit("user:online", userId);

  // Send online users list
  socket.emit("users:online", Array.from(onlineUsers.keys()));

  // Handle message sending
  socket.on("message:send", async (message) => {
    console.log("Message received:", message);

    // Save to database here
    // const savedMessage = await saveMessage(message);

    // Send to receiver
    const receiverSocketId = onlineUsers.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message:received", message);

      // Send delivery confirmation
      socket.emit("message:delivered", message.id);
    }
  });

  // Handle typing indicator
  socket.on("typing", ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit("user:typing", {
      userId,
      conversationId,
      isTyping,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    onlineUsers.delete(userId);
    socket.broadcast.emit("user:offline", userId);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
```

## Testing

1. เปิด frontend: `http://localhost:3000`
2. เปิด backend Socket.io server: port 3001
3. ทดสอบส่งข้อความ
4. เปิดหลายๆ tab เพื่อทดสอบ real-time features

## Troubleshooting

### Connection Failed
- ตรวจสอบว่า backend server ทำงานอยู่
- ตรวจสอบ CORS settings ใน backend
- ตรวจสอบ NEXT_PUBLIC_SOCKET_URL ใน .env.local

### Messages Not Receiving
- ตรวจสอบว่า emit events ตรงกับที่ frontend รอรับ
- ตรวจสอบ console.log ใน browser และ backend

### Typing Indicator Not Working
- ตรวจสอบว่า conversationId ตรงกัน
- ตรวจสอบว่า socket.to(conversationId) ทำงานถูกต้อง

## Next Steps
- [ ] Implement authentication และเชื่อม userId จริง
- [ ] เพิ่ม database integration
- [ ] เพิ่ม file upload feature
- [ ] เพิ่ม voice/video call
- [ ] เพิ่ม notification system
