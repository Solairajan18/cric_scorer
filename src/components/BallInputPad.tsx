"use client";

import { EventKind, WicketKind } from "@/types/match";

type Props = {
  onBall: (input: { kind: EventKind; runs: number; wicketKind?: WicketKind }) => void;
  onUndo: () => void;
};

const runButtons = [0, 1, 2, 3, 4, 6];
const extras = [
  { label: "Wd", kind: "wide" as const, runs: 1 },
  { label: "Nb", kind: "no_ball" as const, runs: 1 },
  { label: "B1", kind: "bye" as const, runs: 1 },
  { label: "Lb1", kind: "leg_bye" as const, runs: 1 },
];

export function BallInputPad({ onBall, onUndo }: Props) {
  return (
    <section className="space-y-4 rounded-[28px] bg-white p-5 shadow-soft">
      <div>
        <p className="text-sm font-medium text-slate-700">Ball by ball</p>
        <p className="text-sm text-slate-500">Large controls for quick scoring on phone.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {runButtons.map((runs) => (
          <button key={runs} onClick={() => onBall({ kind: "run", runs })} className="min-h-14 rounded-2xl bg-teal-50 text-lg font-semibold text-teal-900 transition hover:bg-teal-100">
            {runs}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {extras.map((item) => (
          <button key={item.label} onClick={() => onBall({ kind: item.kind, runs: item.runs })} className="min-h-12 rounded-2xl bg-amber-50 font-semibold text-amber-900 transition hover:bg-amber-100">
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onBall({ kind: "wicket", runs: 0, wicketKind: "bowled" })} className="min-h-14 rounded-2xl bg-rose-100 font-semibold text-rose-900 transition hover:bg-rose-200">
          Wicket
        </button>
        <button onClick={onUndo} className="min-h-14 rounded-2xl bg-slate-100 font-semibold text-slate-900 transition hover:bg-slate-200">
          Undo last ball
        </button>
      </div>
    </section>
  );
}
