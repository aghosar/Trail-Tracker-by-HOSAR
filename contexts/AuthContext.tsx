
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  if (Platform.OS === "web") {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      `/auth-popup?provider=${provider}`,
      "OAuth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    return new Promise<void>((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          reject(new Error("OAuth popup was closed"));
        }
      }, 1000);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "oauth-success") {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          popup?.close();
          resolve();
        } else if (event.data?.type === "oauth-error") {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          popup?.close();
          reject(new Error(event.data.error || "OAuth failed"));
        }
      };
      
      window.addEventListener("message", handleMessage);
    });
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
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
      console.log("[AuthContext] Fetching user session");
      const session = await authClient.getSession();
      
      if (session?.user) {
        console.log("[AuthContext] User session found:", session.user.email);
        setUser(session.user as User);
      } else {
        console.log("[AuthContext] No active session");
        setUser(null);
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log("[AuthContext] Signing in with email:", email);
    const result = await authClient.signIn.email({ email, password });
    
    if (result.error) {
      console.error("[AuthContext] Sign in error:", result.error);
      throw new Error(result.error.message || "Sign in failed");
    }
    
    if (result.data?.session?.token) {
      await setBearerToken(result.data.session.token);
    }
    
    await fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log("[AuthContext] Signing up with email:", email);
    const result = await authClient.signUp.email({ email, password, name });
    
    if (result.error) {
      console.error("[AuthContext] Sign up error:", result.error);
      throw new Error(result.error.message || "Sign up failed");
    }
    
    if (result.data?.session?.token) {
      await setBearerToken(result.data.session.token);
    }
    
    await fetchUser();
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    console.log(`[AuthContext] Signing in with ${provider}`);
    
    if (Platform.OS === "web") {
      await openOAuthPopup(provider);
      await fetchUser();
    } else {
      const redirectUri = Linking.createURL("/auth-callback");
      console.log("[AuthContext] OAuth redirect URI:", redirectUri);
      
      const result = await authClient.signIn.social({
        provider,
        callbackURL: redirectUri,
      });
      
      if (result.error) {
        console.error(`[AuthContext] ${provider} sign in error:`, result.error);
        throw new Error(result.error.message || `${provider} sign in failed`);
      }
      
      if (result.data?.url) {
        console.log("[AuthContext] Opening OAuth URL:", result.data.url);
        await Linking.openURL(result.data.url);
      }
    }
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
      console.log("[AuthContext] Signing out");
      await authClient.signOut();
    } catch (error) {
      console.error("[AuthContext] Error signing out:", error);
    } finally {
      await clearAuthTokens();
      setUser(null);
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
