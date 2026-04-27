"use client";

import { useState } from "react";
import { Match, BallOutcome, WicketKind, Player } from "@/types/match";
import { getCurrentBattingTeam, getCurrentBowlingTeam, getCurrentInnings } from "@/lib/match-engine";

type Props = {
  match: Match;
  onConfirm: (outcome: BallOutcome) => void;
  onCancel: () => void;
};

export function WicketModal({ match, onConfirm, onCancel }: Props) {
  const innings = getCurrentInnings(match);
  const battingTeam = getCurrentBattingTeam(match);
  const bowlingTeam = getCurrentBowlingTeam(match);
  
  const [wicketType, setWicketType] = useState<WicketKind>("caught");
  const [dismissedId, setDismissedId] = useState(innings.strikerId);
  const [fielderId, setFielderId] = useState<string>("");
  const [runsCompleted, setRunsCompleted] = useState<0 | 1 | 2 | 3>(0);
  const [nextStrikerId, setNextStrikerId] = useState<string>("");

  const needsFielder = ["caught", "run_out", "stumped"].includes(wicketType);
  const canHaveRuns = ["run_out", "retired_hurt", "retired_out"].includes(wicketType);
  
  const availableNextBatters = battingTeam.players.filter(p => {
    const stats = innings.batsmen[p.id];
    return !stats.out && !stats.retiredHurt && p.id !== innings.strikerId && p.id !== innings.nonStrikerId;
  });

  const handleConfirm = () => {
    const outcome: BallOutcome = {
      type: "wicket",
      wicketType,
      dismissedPlayerId: dismissedId,
      fielderId: fielderId || undefined,
      runsCompleted: canHaveRuns ? runsCompleted : 0,
      nextStrikerId: nextStrikerId || undefined,
    };
    onConfirm(outcome);
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Wicket Type */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wicket Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "retired_hurt", "retired_out"] as WicketKind[]).map(type => (
            <button
              key={type}
              onClick={() => setWicketType(type)}
              className={`rounded-xl border-2 py-3 text-[10px] font-bold uppercase transition-all ${
                wicketType === type ? "border-rose-600 bg-rose-50 text-rose-700 shadow-sm" : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Dismissed Player (for Run Out / Retired) */}
      {["run_out", "retired_hurt", "retired_out"].includes(wicketType) && (
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Who is out?</label>
          <div className="flex gap-2">
            {[innings.strikerId, innings.nonStrikerId].map(id => (
              <button
                key={id}
                onClick={() => setDismissedId(id)}
                className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all ${
                  dismissedId === id ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-500"
                }`}
              >
                {battingTeam.players.find(p => p.id === id)?.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fielder Selection */}
      {needsFielder && (
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fielder (Optional)</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {bowlingTeam.players.map(p => (
              <button
                key={p.id}
                onClick={() => setFielderId(fielderId === p.id ? "" : p.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  fielderId === p.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Runs Completed & Next Striker (The "End Correction") */}
      <div className="grid grid-cols-2 gap-4">
        {canHaveRuns && (
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Runs Completed</label>
             <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
               {[0, 1, 2, 3].map(r => (
                 <button key={r} onClick={() => setRunsCompleted(r as any)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${runsCompleted === r ? "bg-white shadow-sm" : "text-slate-500"}`}>{r}</button>
               ))}
             </div>
          </div>
        )}
        
        <div className="space-y-3">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Striker</label>
           <select 
             value={nextStrikerId}
             onChange={(e) => setNextStrikerId(e.target.value)}
             className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
           >
             <option value="">Auto Select</option>
             {availableNextBatters.map(p => (
               <option key={p.id} value={p.id}>{p.name}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-2xl border border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
        <button 
          onClick={handleConfirm}
          className="flex-[2] rounded-2xl bg-rose-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
        >
          Confirm Wicket
        </button>
      </div>
    </div>
  );
}
