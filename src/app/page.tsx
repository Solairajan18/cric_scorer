"use client";

import { AppTopBar, BottomNav } from "@/components/AppChrome";
import { RecentMatches } from "@/components/RecentMatches";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { MatchSetupWizard } from "@/components/MatchSetupWizard";

export default function HomePage() {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 text-white">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-emerald-500 shadow-2xl shadow-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="white" className="h-14 w-14">
              <path d="M18.5,2L5.5,15L4,19.5L8.5,18L21.5,5L18.5,2M7.4,15.6L16.6,6.4L17.6,7.4L8.4,16.6L7.4,15.6Z" />
              <circle cx="17" cy="17" r="2.5" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight">Solai&apos;s Cric Scorer</h1>
          <p className="mt-4 max-w-xs text-lg text-emerald-100/60 font-medium">
            Professional cricket scoring for your local weekend matches.
          </p>
          
          <button 
            onClick={() => void loginWithGoogle()}
            className="mt-12 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-white py-4 text-sm font-bold text-slate-900 shadow-xl transition hover:scale-105 active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
        
        <footer className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-100/20">
          Powered by Advanced Cricket Engine
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppTopBar />
      
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-24">
        {/* Welcome Section */}
        <section className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800/60">Scorer Dashboard</p>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-black tracking-tight text-slate-900">
              Hello, {user.displayName?.split(" ")[0]}! 🏏
            </h2>
          </div>
        </section>

        {/* Hero Action */}
        <button 
          onClick={() => setShowWizard(true)}
          className="group relative w-full overflow-hidden rounded-[32px] bg-emerald-900 p-8 text-left shadow-2xl shadow-emerald-900/20 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 transition-transform group-hover:scale-150" />
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
             <svg viewBox="0 0 24 24" fill="white" className="h-8 w-8">
               <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
             </svg>
          </div>
          <h3 className="font-display text-2xl font-black text-white">Start New Match</h3>
          <p className="mt-2 text-emerald-100/70 font-medium">Quick setup with saved teams and rosters.</p>
          
          <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
             <span>Configure Step-by-Step</span>
             <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
             </svg>
          </div>
        </button>

        {/* Activity Section */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between px-2">
            <h3 className="font-display text-xl font-black text-slate-900">Recent Matches</h3>
            <div className="h-px flex-1 bg-slate-200 mx-4" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">View All</span>
          </div>
          <RecentMatches />
        </section>
      </main>

      {/* Bottom Nav */}
      <BottomNav active="setup" />

      {/* Match Setup Wizard Modal */}
      <BottomSheet open={showWizard} title="Match Setup Wizard" onClose={() => setShowWizard(false)}>
        <MatchSetupWizard onCancel={() => setShowWizard(false)} />
      </BottomSheet>
    </div>
  );
}
