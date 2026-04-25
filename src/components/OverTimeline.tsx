import { Match } from "@/types/match";
import { getCurrentInnings } from "@/lib/match-engine";
import { BallEvent } from "@/types/match";

function ballCircleClass(event: BallEvent) {
  if (!event.legal) {
    if (event.kind === "wide") return "bg-amber-100 border-amber-400 text-amber-800";
    if (event.kind === "no_ball") return "bg-orange-100 border-orange-400 text-orange-800";
  }
  if (event.kind === "wicket") return "bg-red-100 border-red-500 text-red-700";
  if (event.batterRuns === 6) return "bg-emerald-100 border-emerald-500 text-emerald-800";
  if (event.batterRuns === 4) return "bg-green-100 border-green-400 text-green-800";
  return "bg-white border-[var(--outline-variant)] text-slate-800";
}

export function OverTimeline({ match }: { match: Match }) {
  const innings = getCurrentInnings(match);
  // Over number based on legal balls only — wides/no-balls don't advance this
  const currentOverNumber = Math.floor(innings.legalBalls / 6) + 1;
  const recent = match.events.filter(
    (e) => e.inningsNumber === match.currentInnings && e.overNumber === currentOverNumber,
  );

  // Empty circles = remaining LEGAL balls needed to complete the over
  // Wides and no-balls don't occupy one of the 6 legal slots
  const legalBallsInOver = recent.filter((e) => e.legal).length;
  const emptySlots = Math.max(0, 6 - legalBallsInOver);

  return (
    <section className="app-muted-card shrink-0 border-2 border-[var(--surface-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
          Over {currentOverNumber} &mdash; {legalBallsInOver}/6
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Wd</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-400" />Nb</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />W</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {recent.length ? recent.map((event) => (
          <div
            key={event.id}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${ballCircleClass(event)}`}
            title={event.legal ? "Legal delivery" : "Illegal delivery — not counted in over"}
          >
            {event.displaySequence}
          </div>
        )) : <p className="text-xs text-slate-500">No balls recorded yet.</p>}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div key={`empty-${index}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--outline-variant)]" />
        ))}
      </div>
    </section>
  );
}
