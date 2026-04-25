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
          <div className="mt-2 flex items-end gap-2">
            <h1 className="font-display text-5xl font-extrabold leading-none">{innings.runs}/{innings.wickets}</h1>
            <p className="pb-1 text-base text-emerald-200">({toOvers(innings.legalBalls)})</p>
          </div>
        </div>
        <div className="text-right">
          <span className="mb-2 inline-block rounded-sm bg-[var(--on-tertiary-container)] px-2 py-1 font-display text-[10px] font-bold uppercase text-white">Live Match</span>
          <p className="text-sm text-emerald-100">CRR: {innings.legalBalls ? ((innings.runs * 6) / innings.legalBalls).toFixed(2) : "0.00"}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-900/40 p-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Bowler</p>
          <p className="mt-1 break-words text-sm font-semibold text-white">{normalizeTeamName(bowling.name)}</p>
        </div>
        <div className="rounded-lg bg-emerald-900/40 p-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Overs</p>
          <p className="mt-1 text-sm font-semibold text-white">{toOvers(innings.legalBalls)} / {match.oversLimit}</p>
        </div>
        <div className="rounded-lg bg-emerald-900/40 p-3">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Status</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {isCompleted
              ? <Link href={`/m/${match.id}/report`} className="underline underline-offset-2">Scorecard</Link>
              : target
              ? `${required} needed`
              : `Extras: ${innings.extras}`}
          </p>
        </div>
      </div>
    </section>
  );
}
