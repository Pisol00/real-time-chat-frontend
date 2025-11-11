import api from "../api";

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  participants: Array<{
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    status?: string;
  }>;
  name?: string;
  description?: string;
  avatar?: string;
  admins?: Array<{
    _id: string;
    username: string;
    displayName: string;
  }>;
  createdBy: string;
  lastMessage?: {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  type: "text" | "image" | "file" | "video" | "audio";
  text?: string;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  deliveredTo?: Array<{
    user: string;
    deliveredAt: string;
  }>;
  readBy?: Array<{
    user: string;
    readAt: string;
  }>;
  deleted?: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Get all conversations
export const getConversations = async (page = 1, limit = 20) => {
  const response = await api.get("/conversations", {
    params: { page, limit },
  });
  return response.data;
};

// Get single conversation
export const getConversation = async (conversationId: string) => {
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data;
};

// Create direct conversation
export const createDirectConversation = async (userId: string) => {
  const response = await api.post("/conversations/direct", { userId });
  return response.data;
};

// Create group conversation
export const createGroupConversation = async (data: {
  name: string;
  participantIds: string[];
  description?: string;
}) => {
  const response = await api.post("/conversations/group", data);
  return response.data;
};

// Update conversation
export const updateConversation = async (
  conversationId: string,
  data: {
    name?: string;
    description?: string;
    avatar?: string;
  }
) => {
  const response = await api.put(`/conversations/${conversationId}`, data);
  return response.data;
};

// Delete conversation
export const deleteConversation = async (conversationId: string) => {
  const response = await api.delete(`/conversations/${conversationId}`);
  return response.data;
};

// Add member to group
export const addMember = async (conversationId: string, userId: string) => {
  const response = await api.post(`/conversations/${conversationId}/members`, {
    userId,
  });
  return response.data;
};

// Remove member from group
export const removeMember = async (conversationId: string, userId: string) => {
  const response = await api.delete(
    `/conversations/${conversationId}/members/${userId}`
  );
  return response.data;
};

// Make user admin
export const makeAdmin = async (conversationId: string, userId: string) => {
  const response = await api.post(`/conversations/${conversationId}/admins`, {
    userId,
  });
  return response.data;
};

// Get messages for a conversation
export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 50
) => {
  const response = await api.get(
    `/conversations/${conversationId}/messages`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

// Mark conversation as read
export const markConversationAsRead = async (conversationId: string) => {
  const response = await api.patch(`/conversations/${conversationId}/read`);
  return response.data;
};

// Create message
export const createMessage = async (data: {
  conversationId: string;
  text?: string;
  type?: string;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}) => {
  const response = await api.post("/messages", data);
  return response.data;
};

// Update message
export const updateMessage = async (messageId: string, text: string) => {
  const response = await api.put(`/messages/${messageId}`, { text });
  return response.data;
};

// Delete message
export const deleteMessage = async (messageId: string) => {
  const response = await api.delete(`/messages/${messageId}`);
  return response.data;
};

// Mark message as read
export const markMessageAsRead = async (messageId: string) => {
  const response = await api.patch(`/messages/${messageId}/read`);
  return response.data;
};

// Search users
export const searchUsers = async (query: string, page = 1, limit = 20) => {
  const response = await api.get("/auth/users/search", {
    params: { q: query, page, limit },
  });
  return response.data;
};
