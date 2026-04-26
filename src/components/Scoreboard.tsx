import Link from "next/link";
import { Match } from "@/types/match";
import { getCurrentBattingTeam, getCurrentBowlingTeam, getCurrentInnings, normalizeTeamName, toOvers } from "@/lib/match-engine";

export function Scoreboard({ match }: { match: Match }) {
  const innings = getCurrentInnings(match);
  const batting = getCurrentBattingTeam(match);
  const bowling = getCurrentBowlingTeam(match);
  const target = match.currentInnings === 2 ? match.innings[0].runs + 1 : undefined;
  const required = target ? target - innings.runs : undefined;
  const isCompleted = match.status === "completed";

  return (
    <section className="relative shrink-0 overflow-hidden rounded-xl border-2 border-emerald-900 bg-[var(--primary-container)] p-5 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--on-primary-container)]">Innings {match.currentInnings} - {normalizeTeamName(batting.name)}</p>
          <div className="mt-2 flex items-baseline gap-3">
            <h1 className="font-display text-5xl font-extrabold leading-none tracking-tighter">{innings.runs}/{innings.wickets}</h1>
            <p className="text-lg font-medium text-emerald-200">({toOvers(innings.legalBalls)})</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300/60">vs</span>
              <span className="text-lg font-bold text-white/90">{normalizeTeamName(bowling.name)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`mb-2 inline-block rounded-sm px-2 py-1 font-display text-[10px] font-bold uppercase text-white ${isCompleted ? "bg-slate-700" : "bg-[var(--on-tertiary-container)] shadow-sm"}`}>
            {isCompleted ? "Match Ended" : "Live Match"}
          </span>
          <p className="text-sm font-bold text-emerald-100/90">CRR: {innings.legalBalls ? ((innings.runs * 6) / innings.legalBalls).toFixed(2) : "0.00"}</p>
        </div>
      </div>

      {isCompleted && match.summary?.result && (
        <div className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/20 shadow-inner">
          <p className="font-display text-base font-bold text-emerald-50">{match.summary.result}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-900/40 p-3 ring-1 ring-white/5">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70">Overs Progress</p>
          <p className="mt-1 text-sm font-black text-white">{toOvers(innings.legalBalls)} <span className="text-[10px] text-emerald-300/40">/</span> {match.oversLimit}</p>
        </div>
        <div className="rounded-lg bg-emerald-900/40 p-3 ring-1 ring-white/5">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/70">Innings Status</p>
          <p className="mt-1 text-sm font-black text-white">
            {isCompleted
              ? "Match Completed"
              : target
              ? `${required} runs to win`
              : `Extras: ${innings.extras}`}
          </p>
        </div>
      </div>

    </section>
  );
}
