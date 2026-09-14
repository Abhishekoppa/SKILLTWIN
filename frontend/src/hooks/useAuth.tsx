import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, UserCredentials } from "../types/auth";
import { authApi } from "../api/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: UserCredentials) => Promise<void>;
  register: (credentials: UserCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authApi.me()
        .then(user => setUser(user))
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: UserCredentials) => {
    const response = await authApi.login(credentials);
    localStorage.setItem("token", response.access_token);
    const user = await authApi.me();
    setUser(user);
  };

  const register = async (credentials: UserCredentials) => {
    await authApi.register(credentials);
    await login(credentials);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
