"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  Camera,
  User,
  Mail,
  Lock,
  Phone,
  AtSign,
  Save,
  X,
  ArrowLeft,
  Edit2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    phone: "",
    bio: "",
    status: "ออนไลน์",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        displayName: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        status: user.status || "ออนไลน์",
      });
      setPreviewImage(user.avatar || null);
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Update profile data
      await updateProfile({
        username: formData.username,
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        status: formData.status,
        ...(previewImage && { avatar: previewImage }),
      });

      // TODO: Handle password change if provided
      if (passwordData.currentPassword && passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error("รหัสผ่านใหม่ไม่ตรงกัน");
        }
        // Call change password API
        // await changePassword(passwordData.currentPassword, passwordData.newPassword);
      }

      setSuccess("อัปเดตโปรไฟล์สำเร็จ");
      setIsEditing(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    // Reset form data to original values
    if (user) {
      setFormData({
        username: user.username || "",
        displayName: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        status: user.status || "ออนไลน์",
      });
      setPreviewImage(user.avatar || null);
    }
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7">
                  <div className="absolute inset-0 bg-blue-600 rounded-lg transform rotate-6"></div>
                  <div className="relative bg-blue-600 rounded-lg p-1 shadow-lg">
                    <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>
                <span className="text-base font-bold text-slate-900">โปรไฟล์</span>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                แก้ไข
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-3.5 h-3.5" />
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Cover/Header Section */}
          <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>

          {/* Profile Photo Section */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    "SC"
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mt-4 sm:mt-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {formData.status}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs">
                  {success}
                </div>
              )}

              {/* Display Name */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {formData.displayName}
                </h2>
                <p className="text-sm text-slate-500">@{formData.username}</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  เกี่ยวกับฉัน
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="เขียนอะไรสักหน่อยเกี่ยวกับตัวคุณ..."
                  />
                ) : (
                  <p className="text-sm text-slate-600">{formData.bio}</p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200"></div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    ชื่อผู้ใช้
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <AtSign className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    ชื่อที่แสดง
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    อีเมล
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              {isEditing && (
                <>
                  <div className="border-t border-slate-200"></div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      เปลี่ยนรหัสผ่าน
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          รหัสผ่านเดิม
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            รหัสผ่านใหม่
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                              placeholder="••••••••"
                              minLength={8}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            ยืนยันรหัสผ่านใหม่
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                              placeholder="••••••••"
                              minLength={8}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
