"use client";

import { useState } from "react";
import { MessageCircle, User, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      await register(formData.username, formData.email, formData.password);
      // Router will redirect automatically on success
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // TODO: Implement Google OAuth
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-3 py-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 animate-slide-up">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-4 animate-scale-in-logo">
            <div className="relative w-14 h-14 mb-3">
              <div className="absolute inset-0 bg-blue-600 rounded-xl transform rotate-6"></div>
              <div className="relative bg-blue-600 rounded-xl p-2.5 shadow-lg">
                <MessageCircle className="w-9 h-9 text-white" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              RealTime Chat
            </h1>
            <p className="text-sm text-slate-600">สร้างบัญชีใหม่</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username field */}
            <div className="animate-slide-up animate-stagger-3">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="กรอกชื่อผู้ใช้"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div className="animate-slide-up animate-stagger-3">
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="animate-slide-up animate-stagger-4">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
              </p>
            </div>

            {/* Confirm Password field */}
            <div className="animate-slide-up animate-stagger-4">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs animate-slide-up">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] animate-slide-up animate-stagger-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4 animate-slide-up animate-stagger-4">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-xs text-slate-500">หรือ</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full px-3 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-white hover:border-blue-500 hover:scale-[1.02] transition-all duration-200 shadow-sm text-slate-700 text-sm font-medium animate-slide-up animate-stagger-4 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            ดำเนินการด้วย Google
          </button>

          {/* Bottom Menu */}
          <div className="mt-4 bg-slate-50/80 rounded-xl border border-slate-200/80 backdrop-blur-sm p-3 animate-slide-up animate-stagger-4">
            <div className="flex items-center justify-center gap-1.5 text-xs">
              <span className="text-slate-600">มีบัญชีอยู่แล้ว?</span>
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors cursor-pointer"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center mt-3 text-xs text-slate-600 animate-fade-in">
          สมัครสมาชิกแล้ว คุณยอมรับ{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer">
            เงื่อนไขการใช้งาน
          </a>{" "}
          และ{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer">
            นโยบายความเป็นส่วนตัว
          </a>
        </p>
      </div>
    </div>
  );
}
