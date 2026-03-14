import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser } from "../api/auth.api";
import { registerSessionExpiredHandler } from "../services/axios";
import type { User } from "../types/auth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  markAuthenticated: (nextUser: User) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const markAuthenticated = (nextUser: User) => {
    setUser(nextUser);
  };

  useEffect(() => {
    registerSessionExpiredHandler(clearSession);
    void refreshUser();

    return () => {
      registerSessionExpiredHandler(null);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        markAuthenticated,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};
