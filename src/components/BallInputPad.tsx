"use client";

type Props = {
  onRun: (runs: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
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

type RunRowItem = 0 | 1 | 2 | 3 | 4 | 5 | 6 | "W";

import { Match } from "@/types/match";
import { BallCircles } from "./OverTimeline";
import { getOverProgressLabel } from "@/lib/match-engine";

export function BallInputPad({ onRun, onWide, onNoBall, onBye, onWicket, onUndo, match }: Props) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
            Scoring Zone &mdash; {getOverProgressLabel(match)}
          </p>
          <BallCircles match={match} />
        </div>
        <button onClick={onUndo} className="rounded-lg border-2 border-[var(--outline-variant)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 shrink-0">
          Undo
        </button>
      </div>


      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Runs</p>
          <p className="text-[11px] text-slate-400">One tap scoring</p>
        </div>
        <div className="grid grid-rows-2 gap-3">
          {runRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-3">
              {row.map((item) => {
                const isWicket = item === "W";

                return (
                  <button
                    key={item}
                    onClick={() => (isWicket ? onWicket() : onRun(item))}
                    className={isWicket
                      ? "min-h-16 rounded-lg border-b-4 border-[var(--tertiary-container)] bg-[var(--on-tertiary-container)] text-lg font-bold text-white transition active:translate-y-1 active:border-b-0"
                      : "min-h-16 rounded-lg border-b-4 border-[var(--outline-variant)] bg-[var(--surface-soft)] text-slate-900 transition active:translate-y-1 active:border-b-0"}
                  >
                    <span className="font-display text-[32px] font-extrabold">{item}</span>
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
          <p className="text-[11px] text-slate-400">Always available</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <button onClick={onWide} className="min-h-12 rounded-lg border-2 border-[var(--outline)] bg-white text-sm font-bold uppercase text-slate-800">Wd</button>
          <button onClick={onNoBall} className="min-h-12 rounded-lg border-2 border-[var(--outline)] bg-white text-sm font-bold uppercase text-slate-800">Nb</button>
          <button onClick={() => onBye("leg_bye")} className="min-h-12 rounded-lg border-2 border-[var(--outline)] bg-white text-sm font-bold uppercase text-slate-800">LB</button>
          <button onClick={() => onBye("bye")} className="min-h-12 rounded-lg border-2 border-[var(--outline)] bg-white text-sm font-bold uppercase text-slate-800">B</button>
          <button onClick={onWicket} className="min-h-12 rounded-lg border-b-4 border-[var(--tertiary-container)] bg-[var(--on-tertiary-container)] px-3 text-sm font-bold uppercase text-white active:translate-y-1 active:border-b-0">Wicket</button>
        </div>
      </div>
    </section>
  );
}
