"use client";

import { useState } from "react";
import { Match } from "@/types/match";
import { BallCircles } from "./OverTimeline";
import { getOverProgressLabel } from "@/lib/match-engine";

type Props = {
  onRun: (runs: 0 | 1 | 2 | 3 | 4 | 5 | 6, isOverthrow?: boolean) => void;
  onWide: () => void;
  onNoBall: () => void;
  onBye: (kind: "bye" | "leg_bye") => void;
  onWicket: () => void;
  onUndo: () => void;
  match: Match;
};

const runRows = [
  [0, 1, 2, 3],
  [4, 5, 6, "W"],
] as const;

export function BallInputPad({ onRun, onWide, onNoBall, onBye, onWicket, onUndo, match }: Props) {
  const [isOverthrowMode, setIsOverthrowMode] = useState(false);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
            Scoring Zone &mdash; {getOverProgressLabel(match)}
          </p>
          <BallCircles match={match} />
        </div>
        <button onClick={onUndo} className="rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 shrink-0">
          Undo
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Runs</p>
          <button 
            onClick={() => setIsOverthrowMode(!isOverthrowMode)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
              isOverthrowMode ? "bg-rose-500 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {isOverthrowMode ? "Overthrow: ON" : "Overthrow: OFF"}
          </button>
        </div>
        <div className="grid grid-rows-2 gap-3">
          {runRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-3">
              {row.map((item) => {
                const isWicket = item === "W";
                return (
                  <button
                    key={item}
                    onClick={() => {
                      if (isWicket) {
                        onWicket();
                      } else {
                        onRun(item as 0 | 1 | 2 | 3 | 4 | 5 | 6, isOverthrowMode);
                        setIsOverthrowMode(false); // Reset after use
                      }
                    }}
                    className={`min-h-16 rounded-lg border-b-4 transition active:translate-y-1 active:border-b-0 ${
                      isWicket 
                        ? "border-rose-700 bg-rose-600 text-white shadow-lg shadow-rose-200" 
                        : isOverthrowMode
                        ? "border-amber-600 bg-amber-500 text-white"
                        : "border-slate-200 bg-slate-100 text-slate-900"
                    }`}
                  >
                    <span className="font-display text-[28px] font-black">{item}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Extras</p>
          <p className="text-[11px] text-slate-400">Re-ball delivery</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={onWide} className="min-h-12 rounded-lg border-2 border-slate-200 bg-white text-sm font-bold uppercase text-slate-800 hover:bg-slate-50 transition">Wd</button>
          <button onClick={onNoBall} className="min-h-12 rounded-lg border-2 border-slate-200 bg-white text-sm font-bold uppercase text-slate-800 hover:bg-slate-50 transition">Nb</button>
          <button onClick={() => onBye("leg_bye")} className="min-h-12 rounded-lg border-2 border-slate-200 bg-white text-sm font-bold uppercase text-slate-800 hover:bg-slate-50 transition">LB</button>
          <button onClick={() => onBye("bye")} className="min-h-12 rounded-lg border-2 border-slate-200 bg-white text-sm font-bold uppercase text-slate-800 hover:bg-slate-50 transition">B</button>
        </div>
      </div>
    </section>
  );
}
