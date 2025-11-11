"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Fetch current user from API when token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const response = await api.get("/auth/me");
          if (response.data.success) {
            setUser(response.data.data.user);
            localStorage.setItem(
              "user",
              JSON.stringify(response.data.data.user)
            );
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          // Token might be invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      }
    };

    fetchUser();
  }, [token, user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        const { user, token } = response.data.data;

        setUser(user);
        setToken(token);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        router.push("/");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      throw new Error(message);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
      });

      if (response.data.success) {
        const { user, token } = response.data.data;

        setUser(user);
        setToken(token);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        router.push("/");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put("/auth/profile", data);

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์";
      throw new Error(message);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
