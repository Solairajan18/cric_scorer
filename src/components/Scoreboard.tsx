import { Match } from "@/types/match";
import { getCurrentBattingTeam, getCurrentBowlingTeam, getCurrentInnings, getTeam, normalizeTeamName, toOvers } from "@/lib/match-engine";

export function Scoreboard({ match }: { match: Match }) {
  const innings = getCurrentInnings(match);
  const batting = getCurrentBattingTeam(match);
  const bowling = getCurrentBowlingTeam(match);
  const target = match.currentInnings === 2 ? match.innings[0].runs + 1 : undefined;
  const required = target ? target - innings.runs : undefined;
  const isCompleted = match.status === "completed";

  const tossWinner = getTeam(match, match.tossWinnerId);
  const batFirst = getTeam(match, match.battingFirstTeamId);

  return (
    <section className="relative shrink-0 overflow-hidden rounded-[28px] bg-slate-900 p-6 text-white shadow-2xl">
      {/* Decorative Background Element */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      
      <div className="relative z-10">
        <header className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <p className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
              {isCompleted ? "Final Result" : `Innings ${match.currentInnings} • Live`}
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              {normalizeTeamName(tossWinner.name)} won toss & elected to {match.tossWinnerId === match.battingFirstTeamId ? "bat" : "bowl"}
            </p>
          </div>
          <div className="text-right">
             <div className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500 mr-2" />
             <span className="font-display text-[10px] font-black uppercase tracking-widest text-white/90">
                {isCompleted ? "Completed" : "Scoring"}
             </span>
          </div>
        </header>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-slate-400">{normalizeTeamName(batting.name)}</p>
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-5xl font-black tracking-tighter text-white">
                {innings.runs}<span className="text-emerald-500">/</span>{innings.wickets}
              </h1>
              <p className="text-lg font-bold text-slate-500">({toOvers(innings.legalBalls)})</p>
            </div>
          </div>
          <div className="text-right pb-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Current RR</p>
             <p className="text-xl font-black text-emerald-400">
               {innings.legalBalls ? ((innings.runs * 6) / innings.legalBalls).toFixed(2) : "0.00"}
             </p>
          </div>
        </div>

        {match.summary?.result && (
          <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center shadow-inner">
            <p className="font-display text-sm font-bold text-emerald-400">{match.summary.result}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <p className="font-display text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Overs Left</p>
            <p className="text-sm font-black text-white">
               {toOvers(Math.max(0, match.oversLimit * 6 - innings.legalBalls))} <span className="text-slate-600 font-medium">of {match.oversLimit}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <p className="font-display text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
              {target ? "Target" : "Extras"}
            </p>
            <p className="text-sm font-black text-white">
              {target 
                ? `${target} (${required} to win)` 
                : `${innings.extras} (Wd ${Object.values(innings.bowlers).reduce((a, b) => a + b.wides, 0)})`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
