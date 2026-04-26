"use client";

import { useMatch } from "@/hooks/useMatch";
import { Scoreboard } from "@/components/Scoreboard";
import { ReportSummary } from "@/components/ReportSummary";
import { OverTimeline } from "@/components/OverTimeline";
import { PlayerPanel } from "@/components/PlayerPanel";

export default function PublicLivePage({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const { match, loading } = useMatch(matchId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-display font-bold animate-pulse text-slate-400">Loading live score...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-display font-bold text-rose-500">Match not found</p>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl bg-slate-50 pb-10">
      {/* Top Header Branding */}
      <header className="app-topbar sticky top-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
            <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 drop-shadow-sm">
              <path d="M18.5,2L5.5,15L4,19.5L8.5,18L21.5,5L18.5,2M7.4,15.6L16.6,6.4L17.6,7.4L8.4,16.6L7.4,15.6Z" />
              <circle cx="17" cy="17" r="2.5" />
            </svg>
          </div>
          <h1 className="font-display text-lg font-black uppercase tracking-widest text-white">Live Scorecard</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 animate-pulse shadow-lg shadow-red-500/20">
           <span className="h-2 w-2 rounded-full bg-white"></span>
           <span className="text-[10px] font-black uppercase tracking-tighter text-white">Live</span>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-6">
        {/* Main Scorecard */}
        <Scoreboard match={match} />

        {/* Players In Action */}
        <PlayerPanel match={match} readOnly partnerLabel="Non-Striker" />
        
        {/* Current Over Progress */}
        <div className="app-card overflow-hidden">
          <div className="bg-emerald-900/5 px-4 py-2 border-b border-emerald-900/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60">Over Timeline</p>
          </div>
          <div className="p-4">
             <OverTimeline match={match} />
          </div>
        </div>

        {/* Detailed Stats */}
        <ReportSummary match={match} />
      </div>


      <footer className="mt-10 px-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Powered by Solai&apos;s Cric Scorer
        </p>
      </footer>
    </main>
  );
}
