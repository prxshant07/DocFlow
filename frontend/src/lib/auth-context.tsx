"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

interface AuthContextType {
  user: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    full_name?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Try to get user info from the token or an endpoint
      // For now, we'll decode the JWT to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          full_name: payload.full_name,
        });
      } catch (e) {
        // Invalid token
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      localStorage.setItem("token", response.access_token);
      setUser(response.user);
    } catch (error) {
      throw new Error("Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const register = async (email: string, password: string, full_name?: string) => {
    try {
      const response = await api.register({ email, password, full_name });
      localStorage.setItem("token", response.access_token);
      setUser(response.user);
    } catch (error) {
      throw new Error("Registration failed");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading: false, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}