
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";
import * as Linking from "expo-linking";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string) {
  const redirectUri = Linking.createURL("/auth-callback");
  const popupUrl = Linking.createURL("/auth-popup", {
    queryParams: { provider, redirectUri },
  });
  
  if (Platform.OS === "web") {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      popupUrl,
      "OAuth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  } else {
    Linking.openURL(popupUrl);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Initializing, fetching user session");
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      console.log("[AuthContext] Fetching session from Better Auth...");
      const session = await authClient.getSession();
      console.log("[AuthContext] Session response:", session);
      
      if (session && session.data && session.data.user) {
        setUser(session.data.user as User);
      } else {
        console.log("[AuthContext] No active session, clearing tokens");
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user session:", error);
      setUser(null);
      await clearAuthTokens();
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });
      
      if (response.data) {
        await setBearerToken(response.data.token);
        await fetchUser();
      } else {
        throw new Error("Sign in failed");
      }
    } catch (error) {
      console.error("[AuthContext] Sign in error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const response = await authClient.signUp.email({
        email,
        password,
        name,
      });
      
      if (response.data) {
        await setBearerToken(response.data.token);
        await fetchUser();
      } else {
        throw new Error("Sign up failed");
      }
    } catch (error) {
      console.error("[AuthContext] Sign up error:", error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    openOAuthPopup(provider);
  };

  const signInWithGoogle = async () => {
    await signInWithSocial("google");
  };

  const signInWithApple = async () => {
    await signInWithSocial("apple");
  };

  const signInWithGitHub = async () => {
    await signInWithSocial("github");
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      await clearAuthTokens();
    } catch (error) {
      console.error("[AuthContext] Sign out error:", error);
      // Always clear local state even if API call fails
      setUser(null);
      await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
