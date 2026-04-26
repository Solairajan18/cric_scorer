"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Match } from "@/types/match";
import { listMatchesLocal, normalizeTeamName, toOvers } from "@/lib/match-engine";

import { getUserMatches } from "@/lib/match-sync";
import { useAuth } from "@/context/AuthContext";

export function RecentMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      if (user) {
        const cloudMatches = await getUserMatches(user.uid);
        if (cloudMatches.length > 0) {
          setMatches(cloudMatches.slice(0, 5));
          return;
        }
      }
      setMatches(listMatchesLocal().slice(0, 4));
    }
    void load();
  }, [user]);


  if (!matches.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--primary)]">Recent Matches</h2>
        <p className="text-sm text-slate-600">Jump back into a saved local match or keep scoring on the same phone.</p>
      </div>
      <div className="grid gap-3">
        {matches.map((match) => (
          <Link key={match.id} href={`/m/${match.id}`} className="app-card p-4 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display break-words text-lg font-semibold text-slate-900">{normalizeTeamName(match.teamA.name)} vs {normalizeTeamName(match.teamB.name)}</p>
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
