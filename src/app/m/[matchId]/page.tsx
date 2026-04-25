"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppTopBar, BottomNav } from "@/components/AppChrome";
import { BallInputPad } from "@/components/BallInputPad";
import { BatsmanActionSheet } from "@/components/BatsmanActionSheet";
import { BottomSheet } from "@/components/BottomSheet";
import { BowlerSelectionSheet } from "@/components/BowlerSelectionSheet";
import { OverTimeline } from "@/components/OverTimeline";
import { PlayerPanel } from "@/components/PlayerPanel";
import { Scoreboard } from "@/components/Scoreboard";
import { ShareBar } from "@/components/ShareBar";
import { ReportSummary } from "@/components/ReportSummary";
import { useMatch } from "@/hooks/useMatch";
import {
  applyBall,
  getCurrentBowlingTeam,
  getCurrentInnings,
  getEligibleIncomingBatters,
  getLastActionLabel,
  getPlayerName,
  retireHurtPlayer,
  setCurrentBowler,
  startSecondInnings,
  swapCurrentPlayer,
  undoLastAction,
} from "@/lib/match-engine";
import { BallOutcome, Match, WicketKind } from "@/types/match";

type Sheet = null | "wide" | "noBall" | "bye" | "wicket" | "bowler" | "batsman";

const runOptions = [1, 2, 3, 4, 5] as const;
const wicketTypes: WicketKind[] = ["bowled", "caught", "run_out", "lbw", "stumped", "hit_wicket", "retired_hurt"];

function canScore(match: Match | null) {
  if (!match) return false;
  const innings = getCurrentInnings(match);
  return match.status === "live" && !innings.awaitingBowlerChange && !innings.completed;
}

export default function MatchPage() {
  const params = useParams<{ matchId: string }>();
  const { match, loading, save } = useMatch(params.matchId);
  const [openSheet, setOpenSheet] = useState<Sheet>(null);
  const [wideExtras, setWideExtras] = useState(0);
  const [wideWicket, setWideWicket] = useState(false);
  const [wideWicketType, setWideWicketType] = useState<"run_out" | "stumped">("run_out");
  const [wideDismissed, setWideDismissed] = useState("");
  const [noBallBatRuns, setNoBallBatRuns] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [noBallExtraRuns, setNoBallExtraRuns] = useState(1);
  const [noBallWicket, setNoBallWicket] = useState(false);
  const [noBallDismissed, setNoBallDismissed] = useState("");
  const [byeKind, setByeKind] = useState<"bye" | "leg_bye">("bye");
  const [wicketType, setWicketType] = useState<WicketKind>("bowled");
  const [wicketRunsCompleted, setWicketRunsCompleted] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [wicketDismissed, setWicketDismissed] = useState("");
  const [playMode, setPlayMode] = useState<"swap" | "retire">("swap");
  const [playSlot, setPlaySlot] = useState<"striker" | "nonStriker">("striker");
  const [playIncoming, setPlayIncoming] = useState("");
  const [activeTab, setActiveTab] = useState<"scoring" | "scorecard">("scoring");

  const innings = match ? getCurrentInnings(match) : null;
  const incomingBatters = useMemo(() => (match ? getEligibleIncomingBatters(match) : []), [match]);

  // Track if we've already auto-opened the bowler sheet for the current state
  const [autoOpenedKey, setAutoOpenedKey] = useState<string>("");

  useEffect(() => {
    if (!match || !innings) return;

    // Create a unique key for the state that requires a bowler
    const isAwaiting = innings.awaitingBowlerChange || match.status === "innings_break";
    const stateKey = isAwaiting ? `${match.status}-${innings.legalBalls}-${match.currentInnings}` : "";
    
    if (isAwaiting && autoOpenedKey !== stateKey) {
      setOpenSheet("bowler");
      setAutoOpenedKey(stateKey);
    }

    setWideDismissed(innings.strikerId);
    setNoBallDismissed(innings.strikerId);
    setWicketDismissed(innings.strikerId);
    setPlayIncoming(getEligibleIncomingBatters(match)[0]?.id ?? "");
  }, [match, innings?.strikerId, innings?.nonStrikerId, innings?.legalBalls, innings?.awaitingBowlerChange]);

  if (loading) {
    return <main className="mx-auto max-w-4xl p-6 text-slate-600">Loading match...</main>;
  }

  if (!match || !innings) {
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

  const currentMatch = match;
  const currentInnings = innings;
  const bowlingTeam = getCurrentBowlingTeam(currentMatch);
  const activeDismissalOptions = [currentInnings.strikerId, currentInnings.nonStrikerId].filter(Boolean);

  async function saveNext(nextMatch: Match) {
    await save(nextMatch);
  }

  function guardedAction(callback: () => void) {
    if (!canScore(currentMatch)) {
      setOpenSheet("bowler");
      return;
    }

    callback();
  }

  function scoreRun(runs: 0 | 1 | 2 | 3 | 4 | 5 | 6) {
    guardedAction(() => {
      void saveNext(applyBall(currentMatch, { type: "run", runs }));
    });
  }

  function openByeSheet(kind: "bye" | "leg_bye") {
    guardedAction(() => {
      setByeKind(kind);
      setOpenSheet("bye");
    });
  }

  function submitWide() {
    const outcome: BallOutcome = {
      type: "wide",
      totalExtras: currentMatch.rules.wideRuns + wideExtras,
      wicket: wideWicket,
      wicketType: wideWicket ? wideWicketType : undefined,
      dismissedPlayerId: wideWicket ? wideDismissed : undefined,
    };

    void saveNext(applyBall(currentMatch, outcome));
    setOpenSheet(null);
    setWideExtras(0);
    setWideWicket(false);
  }

  function submitNoBall() {
    const outcome: BallOutcome = {
      type: "no_ball",
      batRuns: noBallBatRuns,
      extraRuns: currentMatch.rules.noBallRuns,
      wicket: noBallWicket,
      wicketType: noBallWicket ? "run_out" : undefined,
      dismissedPlayerId: noBallWicket ? noBallDismissed : undefined,
    };

    void saveNext(applyBall(currentMatch, outcome));
    setOpenSheet(null);
  }

  function submitBye(runs: 1 | 2 | 3 | 4 | 5) {
    void saveNext(applyBall(currentMatch, byeKind === "bye" ? { type: "bye", runs } : { type: "leg_bye", runs }));
    setOpenSheet(null);
  }

  function submitWicket() {
    const outcome: BallOutcome = {
      type: "wicket",
      wicketType,
      runsCompleted: wicketType === "run_out" ? wicketRunsCompleted : 0,
      dismissedPlayerId: wicketDismissed,
    };

    const nextMatch = applyBall(currentMatch, outcome);
    void saveNext(nextMatch);
    if (nextMatch.status === "completed" || nextMatch.status === "innings_break" || !getEligibleIncomingBatters(nextMatch).length) {
      setOpenSheet(null);
      return;
    }

    const nextInnings = getCurrentInnings(nextMatch);
    const lastDismissed = outcome.dismissedPlayerId;
    setPlaySlot(lastDismissed === nextInnings.nonStrikerId ? "nonStriker" : "striker");
    setPlayIncoming(getEligibleIncomingBatters(nextMatch)[0]?.id ?? "");
    setOpenSheet("batsman");
  }

  function submitBowler(bowlerId: string) {
    const nextMatch = currentMatch.status === "innings_break" ? startSecondInnings(currentMatch, bowlerId) : setCurrentBowler(currentMatch, bowlerId);
    void saveNext(nextMatch);
    setOpenSheet(null);
  }

  function submitPlay() {
    if (!playIncoming) return;
    const nextMatch = playMode === "retire"
      ? retireHurtPlayer(currentMatch, playSlot === "striker" ? currentInnings.strikerId : currentInnings.nonStrikerId, playIncoming)
      : swapCurrentPlayer(currentMatch, playSlot, playIncoming);

    void saveNext(nextMatch);
    setOpenSheet(null);
  }

  function openBatsmanSheet(slot: "striker" | "nonStriker") {
    setPlaySlot(slot);
    setPlayIncoming(incomingBatters[0]?.id ?? "");
    setPlayMode("swap");
    setOpenSheet("batsman");
  }

  return (
    <>
      <AppTopBar />
      <main className="mx-auto max-w-2xl px-3 pb-24 pt-20 md:px-6">
        <div className="space-y-4">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">Back</Link>
            <ShareBar title={`${currentMatch.teamA.name} vs ${currentMatch.teamB.name}`} text="Join the live weekend cricket scorecard." />
          </div>

          <Scoreboard match={currentMatch} />

          {activeTab === "scoring" ? (
            <div className="space-y-3">
              <PlayerPanel match={currentMatch} onBatsmanClick={openBatsmanSheet} onBowlerClick={() => setOpenSheet("bowler")} />

              {currentMatch.status !== "completed" ? (
                <BallInputPad
                  onRun={scoreRun}
                  onWide={() => guardedAction(() => setOpenSheet("wide"))}
                  onNoBall={() => guardedAction(() => setOpenSheet("noBall"))}
                  onBye={openByeSheet}
                  onWicket={() => guardedAction(() => setOpenSheet("wicket"))}
                  onUndo={() => void saveNext(undoLastAction(currentMatch))}
                  lastActionLabel={getLastActionLabel(currentMatch)}
                />
              ) : null}

              <OverTimeline match={currentMatch} />
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <ReportSummary match={currentMatch} showActions={false} />
            </div>
          )}
        </div>
      </main>
      <BottomNav 
        active={activeTab === "scoring" ? "live" : "scorecard"} 
        onTabChange={(key) => {
          if (key === "live") setActiveTab("scoring");
          if (key === "scorecard") setActiveTab("scorecard");
          if (key === "summary") {
            // Summary usually goes to the report page
            window.location.href = `/m/${currentMatch.id}/report`;
          }
        }} 
      />

      <BottomSheet open={openSheet === "wide"} title="Wide details" onClose={() => setOpenSheet(null)}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Extra runs completed</p>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <button key={value} onClick={() => setWideExtras(value)} className={`rounded-2xl px-3 py-3 text-sm font-semibold ${wideExtras === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                  {value}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            Wicket on this ball
            <input type="checkbox" checked={wideWicket} onChange={(event) => setWideWicket(event.target.checked)} />
          </label>
          {wideWicket ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Wicket type</span>
                <select value={wideWicketType} onChange={(event) => setWideWicketType(event.target.value as "run_out" | "stumped")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                  <option value="run_out">Run out</option>
                  <option value="stumped">Stumped</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Dismissed batter</span>
                <select value={wideDismissed} onChange={(event) => setWideDismissed(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                  {activeDismissalOptions.map((playerId) => <option key={playerId} value={playerId}>{getPlayerName(currentMatch, playerId)}</option>)}
                </select>
              </label>
            </div>
          ) : null}
          <button onClick={submitWide} className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white">Record wide</button>
        </div>
      </BottomSheet>

      <BottomSheet open={openSheet === "noBall"} title="No-ball details" onClose={() => setOpenSheet(null)}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Bat runs</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((value) => (
                <button key={value} onClick={() => setNoBallBatRuns(value as 0 | 1 | 2 | 3 | 4 | 5 | 6)} className={`rounded-2xl px-3 py-3 text-sm font-semibold ${noBallBatRuns === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                  {value}
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 border border-slate-200 italic">
            Penalty: +{currentMatch.rules.noBallRuns} {currentMatch.rules.noBallRuns === 1 ? "run" : "runs"} (defined in rules)
          </p>

          <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            Run out on this ball
            <input type="checkbox" checked={noBallWicket} onChange={(event) => setNoBallWicket(event.target.checked)} />
          </label>
          {noBallWicket ? (
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Dismissed batter</span>
              <select value={noBallDismissed} onChange={(event) => setNoBallDismissed(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                {activeDismissalOptions.map((playerId) => <option key={playerId} value={playerId}>{getPlayerName(currentMatch, playerId)}</option>)}
              </select>
            </label>
          ) : null}
          <button onClick={submitNoBall} className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white">Record no ball</button>
        </div>
      </BottomSheet>

      <BottomSheet open={openSheet === "bye"} title={byeKind === "bye" ? "Byes" : "Leg byes"} onClose={() => setOpenSheet(null)}>
        <div className="grid grid-cols-5 gap-2">
          {runOptions.map((value) => (
            <button key={value} onClick={() => submitBye(value)} className="rounded-2xl bg-slate-100 px-3 py-4 text-sm font-semibold text-slate-900">
              {value}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={openSheet === "wicket"} title="Wicket details" onClose={() => setOpenSheet(null)}>
        <div className="space-y-4">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Wicket type</span>
            <select value={wicketType} onChange={(event) => setWicketType(event.target.value as WicketKind)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {wicketTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Dismissed batter</span>
            <select value={wicketDismissed} onChange={(event) => setWicketDismissed(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {activeDismissalOptions.map((playerId) => <option key={playerId} value={playerId}>{getPlayerName(currentMatch, playerId)}</option>)}
            </select>
          </label>
          {wicketType === "run_out" ? (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Runs completed before wicket</p>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <button key={value} onClick={() => setWicketRunsCompleted(value as 0 | 1 | 2 | 3 | 4 | 5)} className={`rounded-2xl px-3 py-3 text-sm font-semibold ${wicketRunsCompleted === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button onClick={submitWicket} className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white">Record wicket</button>
        </div>
      </BottomSheet>

      <BowlerSelectionSheet
        open={openSheet === "bowler"}
        title={currentMatch.status === "innings_break" ? "Start the chase" : "Choose the next bowler"}
        description={currentMatch.status === "innings_break" ? `Target is ${currentMatch.innings[0].runs + 1}. Pick the opening bowler.` : currentInnings.awaitingBowlerChange ? "This over is complete. Select the bowler for the next over." : "Change the current bowler."}
        players={bowlingTeam.players}
        onClose={() => setOpenSheet(null)}
        onSelect={submitBowler}
      />

      <BatsmanActionSheet
        open={openSheet === "batsman"}
        match={currentMatch}
        slot={playSlot}
        selectedPlayerId={playSlot === "striker" ? currentInnings.strikerId : currentInnings.nonStrikerId}
        incomingBatters={incomingBatters}
        mode={playMode}
        incomingPlayerId={playIncoming}
        onModeChange={setPlayMode}
        onIncomingChange={setPlayIncoming}
        onClose={() => setOpenSheet(null)}
        onConfirm={submitPlay}
      />
    </>
  );
}
