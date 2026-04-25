"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BallInputPad } from "@/components/BallInputPad";
import { InningsBreakCard } from "@/components/InningsBreakCard";
import { OverTimeline } from "@/components/OverTimeline";
import { PlayerPanel } from "@/components/PlayerPanel";
import { Scoreboard } from "@/components/Scoreboard";
import { ShareBar } from "@/components/ShareBar";
import { useMatch } from "@/hooks/useMatch";
import { applyBall, startSecondInnings, undoLastBall, updateCurrentPlayers } from "@/lib/match-engine";

export default function MatchPage() {
  const params = useParams<{ matchId: string }>();
  const { match, loading, save } = useMatch(params.matchId);

  if (loading) {
    return <main className="mx-auto max-w-4xl p-6 text-slate-600">Loading match...</main>;
  }

  if (!match) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-[28px] bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-semibold text-slate-900">Match not found</h1>
          <p className="mt-2 text-slate-600">Open this match on the scorer device first, or configure Firebase for multi-device sync.</p>
          <Link href="/" className="mt-5 inline-flex rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white">
            Create a match
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-4 py-5 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">Back</Link>
        <ShareBar title={`${match.teamA.name} vs ${match.teamB.name}`} text="Join the live weekend cricket scorecard." />
      </div>

      <Scoreboard match={match} />
      <InningsBreakCard match={match} onStart={(bowlerId) => void save(startSecondInnings(match, bowlerId))} />
      <PlayerPanel match={match} onChangePlayers={(input) => void save(updateCurrentPlayers(match, input))} />
      {match.status !== "completed" && match.status !== "innings_break" ? (
        <BallInputPad
          onBall={(input) => void save(applyBall(match, input))}
          onUndo={() => void save(undoLastBall(match))}
        />
      ) : null}
      <OverTimeline match={match} />
    </main>
  );
}
