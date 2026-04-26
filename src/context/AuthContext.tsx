"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup,
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";

import { getFirebaseAuth, isFirebaseEnabled } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[cric-scorer] Auth state changed:", user?.email || "No user");
      setUser(user);
      setLoading(false);
    });



    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    console.log("[cric-scorer] loginWithGoogle clicked (Popup)");
    if (!isFirebaseEnabled()) {
      console.error("[cric-scorer] Firebase not enabled - check config");
      return;
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      console.log("[cric-scorer] triggering signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      console.log("[cric-scorer] Popup login success:", result.user.email);
    } catch (error) {
      console.error("[cric-scorer] Login failed:", error);
      alert("Login failed. If using Brave, please disable Shields for this site.");
    }
  };



  const logout = async () => {
    if (!isFirebaseEnabled()) return;
    const auth = getFirebaseAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
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
