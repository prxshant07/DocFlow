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
      // In a real app, you would validate the token here
      // For now, we'll just check if it exists and set a mock user
      try {
        // We don't have a way to decode JWT without a library, so we'll just assume it's valid
        // In a real app, you might want to fetch user info from /auth/me endpoint
        setUser({
          id: "user-from-token", // This would come from decoding the token
          email: "user@example.com", // This would come from decoding the token
          full_name: "User Name", // This would come from decoding the token
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
      // Call the actual login API
      // Note: We don't have the actual API endpoints implemented yet in the frontend api.ts
      // For now, we'll simulate with localStorage but in a real app this would be:
      // const response = await fetch("/api/v1/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();
      // localStorage.setItem("token", data.access_token);
      // setUser(data.user);

      // For now, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data - in real app this would come from the API
      const mockUser = {
        id: "user-123",
        email,
        full_name: "Test User",
      };

      // Create a mock JWT token
      const payload = btoa(JSON.stringify({
        sub: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
      }));
      const token = `header.${payload}.signature`;

      localStorage.setItem("token", token);
      setUser(mockUser);
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
      // Call the actual register API
      // Similar to login, we'd call the actual endpoint
      // For now, we'll simulate
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data
      const mockUser = {
        id: "user-123",
        email,
        full_name: full_name || "",
      };

      // Create a mock JWT token
      const payload = btoa(JSON.stringify({
        sub: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
      }));
      const token = `header.${payload}.signature`;

      localStorage.setItem("token", token);
      setUser(mockUser);
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