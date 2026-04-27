"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { WicketModal } from "@/components/WicketModal";
import { useMatch } from "@/hooks/useMatch";

import {
  applyBall,
  getCurrentBowlingTeam,
  getCurrentInnings,
  getEligibleIncomingBatters,
  getPlayerName,
  retireHurtPlayer,
  setCurrentBowler,
  startSecondInnings,
  swapCurrentPlayer,
  undoLastAction,
} from "@/lib/match-engine";
import { BallOutcome, Match, WicketKind } from "@/types/match";

type Sheet = null | "wide" | "noBall" | "bye" | "wicket" | "bowler" | "batsman" | "end_match" | "match_settings";

const runOptions = [1, 2, 3, 4, 5] as const;
const wicketTypes: WicketKind[] = ["bowled", "caught", "run_out", "lbw", "stumped", "hit_wicket", "retired_hurt", "retired_out"];

function canScore(match: Match | null) {

  if (!match) return false;
  const innings = getCurrentInnings(match);
  return match.status === "live" && !innings.awaitingBowlerChange && !innings.completed;
}

export default function MatchPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const { match, loading, save } = useMatch(params.matchId);
  const reportRef = useRef<{ exportImage: () => void }>(null);
  
  const [openSheet, setOpenSheet] = useState<Sheet>(null);
  const [abandonReason, setAbandonReason] = useState<string>("Rain");
  const [customReason, setCustomReason] = useState<string>("");
  
  const [wideExtras, setWideExtras] = useState(0);
  const [wideWicket, setWideWicket] = useState(false);
  const [wideWicketType, setWideWicketType] = useState<"run_out" | "stumped">("run_out");
  const [wideDismissed, setWideDismissed] = useState("");
  
  const [noBallBatRuns, setNoBallBatRuns] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
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

  const [autoOpenedKey, setAutoOpenedKey] = useState<string>("");

  useEffect(() => {
    const handleExportEvent = () => {
      reportRef.current?.exportImage();
    };
    window.addEventListener("export-match-image", handleExportEvent);
    return () => window.removeEventListener("export-match-image", handleExportEvent);
  }, []);

  useEffect(() => {
    if (!match || !innings) return;


    const isAwaiting = innings.awaitingBowlerChange || match.status === "innings_break";
    const stateKey = isAwaiting ? `${match.status}-${innings.legalBalls}-${match.currentInnings}` : "";
    
    if (isAwaiting && autoOpenedKey !== stateKey) {
      setOpenSheet("bowler");
      setAutoOpenedKey(stateKey);
    }

    if (wideDismissed !== innings.strikerId) setWideDismissed(innings.strikerId);
    if (noBallDismissed !== innings.strikerId) setNoBallDismissed(innings.strikerId);
    if (wicketDismissed !== innings.strikerId) setWicketDismissed(innings.strikerId);
    
    const firstEligible = getEligibleIncomingBatters(match)[0]?.id ?? "";
    if (playIncoming !== firstEligible) setPlayIncoming(firstEligible);
  }, [match, innings?.strikerId, innings?.nonStrikerId, innings?.legalBalls, innings?.awaitingBowlerChange]);


  if (loading) return <div className="flex h-screen items-center justify-center p-4"><p className="font-display font-bold animate-pulse text-slate-400 uppercase tracking-widest text-xs">Syncing Match...</p></div>;
  if (!match) return <div className="flex h-screen items-center justify-center p-4 text-slate-500 font-bold">Match not found</div>;

  const currentMatch = match;
  const currentInnings = getCurrentInnings(currentMatch);

  if (currentMatch.status === "completed") {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-10 md:px-6">
        <Scoreboard match={currentMatch} />
        <div className="mt-8 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-sm">
             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Match Concluded</h2>
             <p className="text-slate-500 font-medium">{currentMatch.summary?.result}</p>
             <Link href="/" className="inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 hover:scale-105 transition-transform">
               Back to Home
             </Link>
          </div>
          <ReportSummary ref={reportRef} match={currentMatch} />
        </div>
      </main>
    );
  }

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

  function scoreRun(runs: 0 | 1 | 2 | 3 | 4 | 5 | 6, isOverthrow?: boolean) {
    guardedAction(() => {
      void saveNext(applyBall(currentMatch, { type: "run", runs, isOverthrow }));
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

  function handleWicketConfirm(outcome: BallOutcome) {
    const nextMatch = applyBall(currentMatch, outcome);
    void saveNext(nextMatch);
    setOpenSheet(null);
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

  async function handleAbandonMatch() {
    const finalReason = abandonReason === "Others" ? customReason : `Match abandoned due to ${abandonReason}`;
    const abandonedMatch: Match = {
      ...currentMatch,
      status: "completed",
      summary: {
        ...currentMatch.summary,
        result: finalReason,
        completedAt: new Date().toISOString()
      }
    };
    await saveNext(abandonedMatch);
    setOpenSheet(null);
  }

  return (
    <>
      <AppTopBar />
      <main className="mx-auto max-w-2xl px-3 pb-24 pt-20 md:px-6">
        <div className="space-y-4">
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" className="px-2 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Back
            </Link>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button 
              onClick={() => setOpenSheet("match_settings")}
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 hover:text-emerald-700 shadow-sm"
            >
              Settings
            </button>
            <ShareBar 
              title={`${currentMatch.teamA.name} vs ${currentMatch.teamB.name}`} 
              text={`Follow the live score of ${currentMatch.teamA.name} vs ${currentMatch.teamB.name}!`}
              url={typeof window !== 'undefined' ? `${window.location.origin}/m/${currentMatch.id}/live` : ''}
              match={currentMatch}
            />
          </div>


          <Scoreboard match={currentMatch} />

          {activeTab === "scoring" ? (
            <div className="space-y-3">
              <PlayerPanel match={currentMatch} onBatsmanClick={openBatsmanSheet} onBowlerClick={() => setOpenSheet("bowler")} />
              <BallInputPad
                onRun={scoreRun}
                onWide={() => guardedAction(() => setOpenSheet("wide"))}
                onNoBall={() => guardedAction(() => setOpenSheet("noBall"))}
                onBye={openByeSheet}
                onWicket={() => guardedAction(() => setOpenSheet("wicket"))}
                onUndo={() => void saveNext(undoLastAction(currentMatch))}
                match={currentMatch}
              />
              <div className="sr-only fixed -left-[9999px] top-0 w-[400px]">
                <ReportSummary ref={reportRef} match={currentMatch} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <ReportSummary ref={reportRef} match={currentMatch} />
            </div>
          )}
        </div>
      </main>

      <BottomNav 
        active={activeTab === "scoring" ? "live" : "scorecard"} 
        onTabChange={(key) => {
          if (key === "live") setActiveTab("scoring");
          if (key === "scorecard") setActiveTab("scorecard");
        }} 
      />

      <BottomSheet open={openSheet === "end_match"} title="End Match Early" onClose={() => setOpenSheet(null)}>
        <div className="space-y-5">
          <p className="text-sm text-slate-500">Why is this match ending before its natural conclusion?</p>
          <div className="space-y-3">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Reason</p>
             <div className="grid grid-cols-2 gap-2">
               {["Rain", "Bad Weather", "Abandoned", "Others"].map((reason) => (
                 <button 
                   key={reason}
                   onClick={() => setAbandonReason(reason)}
                   className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${abandonReason === reason ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 bg-slate-50 text-slate-600"}`}
                 >
                   {reason}
                 </button>
               ))}
             </div>
          </div>
          {abandonReason === "Others" && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Specify Reason</p>
              <textarea 
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type the reason here..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:bg-white transition-all"
                rows={3}
              />
            </div>
          )}
          <button 
            onClick={handleAbandonMatch}
            className="w-full rounded-2xl bg-rose-600 py-4 text-sm font-bold text-white shadow-lg shadow-rose-200 transition active:scale-[0.98]"
          >
            Confirm & End Match
          </button>
        </div>
      </BottomSheet>

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
          <button onClick={submitWide} className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white transition active:scale-[0.98]">Record wide</button>
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
            Penalty: +{currentMatch.rules.noBallRuns} {currentMatch.rules.noBallRuns === 1 ? "run" : "runs"}
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
          <button onClick={submitNoBall} className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white transition active:scale-[0.98]">Record no ball</button>
        </div>
      </BottomSheet>

      <BottomSheet open={openSheet === "bye"} title={byeKind === "bye" ? "Byes" : "Leg byes"} onClose={() => setOpenSheet(null)}>
        <div className="grid grid-cols-5 gap-2">
          {runOptions.map((value) => (
            <button key={value} onClick={() => submitBye(value)} className="rounded-2xl bg-slate-100 px-3 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
              {value}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={openSheet === "wicket"} title="Wicket" onClose={() => setOpenSheet(null)}>
        <WicketModal match={currentMatch} onConfirm={handleWicketConfirm} onCancel={() => setOpenSheet(null)} />
      </BottomSheet>

      <BottomSheet open={openSheet === "match_settings"} title="Match Management" onClose={() => setOpenSheet(null)}>
        <div className="space-y-6 pb-6">
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reduce Total Overs</label>
             <div className="grid grid-cols-4 gap-2">
               {[2, 5, 8, 10, 12, 15, 20].map(v => (
                 <button 
                   key={v}
                   onClick={() => void saveNext({ ...currentMatch, oversLimit: v })}
                   className={`rounded-xl border-2 py-3 text-xs font-bold ${currentMatch.oversLimit === v ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-100 bg-slate-50 text-slate-500"}`}
                 >
                   {v} Ov
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match Rules</label>
             <div className="grid grid-cols-2 gap-3">
               <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Wide Runs</p>
                  <p className="text-lg font-black text-slate-900">{currentMatch.rules.wideRuns}</p>
               </div>
               <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">No-ball Runs</p>
                  <p className="text-lg font-black text-slate-900">{currentMatch.rules.noBallRuns}</p>
               </div>
             </div>
          </div>

          <button 
            onClick={() => setOpenSheet("end_match")}
            className="w-full rounded-2xl bg-rose-50 border border-rose-100 py-4 text-xs font-black uppercase tracking-widest text-rose-600"
          >
            Abandon/End Match Early
          </button>
        </div>
      </BottomSheet>


      <BowlerSelectionSheet
        open={openSheet === "bowler"}
        title={currentMatch.status === "innings_break" ? "Start the chase" : "Choose the next bowler"}
        description={currentMatch.status === "innings_break" ? `Target is ${currentMatch.innings[0].runs + 1}. Pick the opening bowler.` : currentInnings.awaitingBowlerChange ? "This over is complete. Select the bowler for the next over." : "Change the current bowler."}
        players={bowlingTeam.players}
        onClose={() => setOpenSheet(null)}
        onSelect={submitBowler}
        match={currentMatch}
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
