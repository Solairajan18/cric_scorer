"use client";

import { Match } from "@/types/match";
import { getCurrentBowlingTeam } from "@/lib/match-engine";

type Props = {
  match: Match;
  onStart: (bowlerId: string) => void;
};

export function InningsBreakCard({ match, onStart }: Props) {
  const team = getCurrentBowlingTeam(match);

  if (match.status !== "innings_break") return null;

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Innings break</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Target is {match.innings[0].runs + 1}</h2>
      <p className="mt-2 text-sm text-slate-700">Pick the opening bowler for the chase and continue scoring.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {team.players.map((player) => (
          <button key={player.id} onClick={() => onStart(player.id)} className="rounded-2xl bg-white px-4 py-3 text-left font-medium text-slate-900 transition hover:bg-slate-100">
            {player.name}
          </button>
        ))}
      </div>
    </section>
  );
}
