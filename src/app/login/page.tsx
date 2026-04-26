"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log("[cric-scorer] User detected on login page, redirecting to home...");
      router.push("/");
    }
  }, [user, router]);


  if (loading) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--primary-container)] shadow-xl">
        <svg viewBox="0 0 24 24" fill="white" className="h-12 w-12 drop-shadow-sm">
          <path d="M18.5,2L5.5,15L4,19.5L8.5,18L21.5,5L18.5,2M7.4,15.6L16.6,6.4L17.6,7.4L8.4,16.6L7.4,15.6Z" />
          <circle cx="17" cy="17" r="2.5" />
        </svg>
      </div>

      <h1 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900">
        Solai&apos;s Cric Scorer
      </h1>
      <p className="mt-2 text-slate-600">
        Sign in to save and sync your matches across devices.
      </p>

      <div className="mt-12 w-full max-w-sm space-y-4">
        <button
          onClick={loginWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-display font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Trusted by weekend warriors
        </p>
      </div>
    </main>
  );
}
