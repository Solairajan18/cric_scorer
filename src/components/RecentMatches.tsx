"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Match } from "@/types/match";
import { listMatchesLocal, normalizeTeamName, toOvers } from "@/lib/match-engine";

export function RecentMatches() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    setMatches(listMatchesLocal().slice(0, 4));
  }, []);

  if (!matches.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent matches</h2>
        <p className="text-sm text-slate-600">Jump back into a saved local match or keep scoring on the same phone.</p>
      </div>
      <div className="grid gap-3">
        {matches.map((match) => (
          <Link key={match.id} href={`/m/${match.id}`} className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-soft transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900">{normalizeTeamName(match.teamA.name)} vs {normalizeTeamName(match.teamB.name)}</p>
                <p className="text-sm text-slate-600">{match.innings[0].runs}/{match.innings[0].wickets} and {match.innings[1].runs}/{match.innings[1].wickets}</p>
              </div>
              <div className="shrink-0 text-right text-sm text-slate-500">
                <p>{match.status.replace("_", " ")}</p>
                <p>{toOvers(match.innings[match.currentInnings - 1].legalBalls)} ov</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
