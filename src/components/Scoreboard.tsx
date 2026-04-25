import Link from "next/link";
import { Match } from "@/types/match";
import { getCurrentBattingTeam, getCurrentBowlingTeam, getCurrentInnings, normalizeTeamName, toOvers } from "@/lib/match-engine";

export function Scoreboard({ match }: { match: Match }) {
  const innings = getCurrentInnings(match);
  const batting = getCurrentBattingTeam(match);
  const bowling = getCurrentBowlingTeam(match);
  const target = match.currentInnings === 2 ? match.innings[0].runs + 1 : undefined;
  const required = target ? target - innings.runs : undefined;

  return (
    <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm uppercase tracking-[0.2em] text-teal-300">{normalizeTeamName(batting.name)} batting</p>
          <h1 className="mt-2 text-4xl font-bold">{innings.runs}/{innings.wickets}</h1>
          <p className="mt-2 text-sm text-slate-300">Overs {toOvers(innings.legalBalls)} of {match.oversLimit}</p>
        </div>
        <Link href={`/m/${match.id}/report`} className="rounded-full border border-white/15 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10">
          Final report
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Bowling</p>
          <p className="mt-1 break-words text-lg font-semibold">{normalizeTeamName(bowling.name)}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Run rate</p>
          <p className="mt-1 text-lg font-semibold">{innings.legalBalls ? ((innings.runs * 6) / innings.legalBalls).toFixed(2) : "0.00"}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Chase</p>
          <p className="mt-1 text-lg font-semibold">{target ? `${required} needed` : "1st innings"}</p>
        </div>
      </div>
    </section>
  );
}
