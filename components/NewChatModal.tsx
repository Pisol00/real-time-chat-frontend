"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, MessageCircle, Users } from "lucide-react";
import { searchUsers, createDirectConversation } from "@/lib/api/conversations";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status?: string;
  bio?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: () => void;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Search users when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await searchUsers(searchQuery);
        if (response.success) {
          setSearchResults(response.data.users);
        }
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดในการค้นหา");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCreateChat = async (userId: string) => {
    try {
      setCreating(true);
      setError("");
      const response = await createDirectConversation(userId);
      if (response.success) {
        onConversationCreated();
        onClose();
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสร้างการสนทนา");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              เริ่มการสนทนาใหม่
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              autoFocus
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Search className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 mb-1">
                ค้นหาผู้ใช้เพื่อเริ่มแชท
              </p>
              <p className="text-xs text-slate-400">
                พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 mb-1">ไม่พบผู้ใช้</p>
              <p className="text-xs text-slate-400">
                ลองค้นหาด้วยคำอื่น
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-base font-semibold text-blue-600 overflow-hidden flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.displayName?.[0] || user.username?.[0] || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {user.displayName || user.username}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCreateChat(user._id)}
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "แชท"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            เลือกผู้ใช้เพื่อเริ่มการสนทนาแบบตัวต่อตัว
          </p>
        </div>
      </div>
    </div>
  );
}
