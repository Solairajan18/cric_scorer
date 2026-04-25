"use client";

import { Match } from "@/types/match";
import { getPlayerName, normalizeTeamName, toOvers } from "@/lib/match-engine";

export function ReportSummary({ match }: { match: Match }) {
  async function handleShare() {
    const summary = `${normalizeTeamName(match.teamA.name)} ${match.innings[0].runs}/${match.innings[0].wickets} vs ${normalizeTeamName(match.teamB.name)} ${match.innings[1].runs}/${match.innings[1].wickets}. ${match.summary?.result ?? "Match in progress"}`;
    if (navigator.share) {
      await navigator.share({ title: "Weekend Cric Report", text: summary, url: window.location.href });
      return;
    }

    await navigator.clipboard.writeText(`${summary}\n${window.location.href}`);
    window.alert("Report copied to clipboard");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.2em] text-teal-300">Final report</p>
        <h1 className="mt-2 break-words text-3xl font-bold">{normalizeTeamName(match.teamA.name)} vs {normalizeTeamName(match.teamB.name)}</h1>
        <p className="mt-3 text-lg text-slate-100">{match.summary?.result ?? "Match in progress"}</p>
        <p className="mt-2 text-sm text-slate-300">{match.summary?.highlight}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {match.innings.map((innings, index) => {
          const teamName = normalizeTeamName(innings.battingTeamId === "A" ? match.teamA.name : match.teamB.name);
          const players = (innings.battingTeamId === "A" ? match.teamA : match.teamB).players;

          return (
            <div key={index} className="rounded-[28px] bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Innings {index + 1}</p>
                  <h2 className="mt-1 break-words text-xl font-semibold text-slate-900">{teamName}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{innings.runs}/{innings.wickets}</p>
                  <p className="text-sm text-slate-500">{toOvers(innings.legalBalls)} overs</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {players.map((player) => {
                  const stats = innings.batsmen[player.id];
                  if (!stats) return null;
                  return (
                    <div key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{player.name}</p>
                        <p className="text-slate-500">{stats.out ? "out" : "not out"}</p>
                      </div>
                      <p className="font-semibold text-slate-900">{stats.runs} ({stats.balls})</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Top batter</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{match.summary?.topBatter?.name ?? "-"}</p>
          <p className="text-sm text-slate-600">{match.summary?.topBatter?.runs ?? 0} runs</p>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Top bowler</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{match.summary?.topBowler?.name ?? "-"}</p>
          <p className="text-sm text-slate-600">{match.summary?.topBowler?.wickets ?? 0} wickets</p>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Last wicket</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{match.events.findLast((event) => event.isWicket)?.label ?? "No wicket"}</p>
          <p className="text-sm text-slate-600">{getPlayerName(match, match.events.findLast((event) => event.isWicket)?.dismissedPlayerId ?? "")}</p>
        </div>
      </section>

      <button onClick={handleShare} className="w-full rounded-2xl bg-teal-600 px-4 py-4 font-semibold text-white transition hover:bg-teal-700">
        Share final report
      </button>
    </div>
  );
}
