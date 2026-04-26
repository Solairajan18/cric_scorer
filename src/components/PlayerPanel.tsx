"use client";

import { Match } from "@/types/match";
import { getCurrentInnings, getPlayerName } from "@/lib/match-engine";

type Props = {
  match: Match;
  onBatsmanClick?: (slot: "striker" | "nonStriker") => void;
  onBowlerClick?: () => void;
  readOnly?: boolean;
  partnerLabel?: string;
};


function StatCard({
  label,
  name,
  meta,
  accent,
  onClick,
  readOnly
}: {
  label: string;
  name: string;
  meta: string;
  accent?: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold ${accent ? "bg-emerald-400 text-emerald-950" : "bg-emerald-800 text-white/90"}`}>
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={`font-display text-[9px] font-bold uppercase tracking-[0.15em] ${accent ? "text-emerald-100" : "text-slate-500"}`}>{label}</p>
          <p className={`truncate font-display text-sm font-semibold leading-tight ${accent ? "text-white" : "text-slate-950"}`}>{name}</p>
        </div>
      </div>
      <p className={`mt-2 text-left text-sm font-bold ${accent ? "text-white" : "text-slate-700"}`}>{meta}</p>
    </>
  );

  const className = `flex flex-col justify-between rounded-lg border-2 p-3 text-left transition ${accent ? "border-emerald-400 bg-emerald-700/40" : "border-transparent bg-slate-100"} ${!readOnly && !accent ? "hover:border-[var(--primary-fixed-dim)] hover:bg-slate-50 cursor-pointer" : ""}`;

  if (readOnly) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function PlayerPanel({ match, onBatsmanClick, onBowlerClick, readOnly, partnerLabel = "Partner" }: Props) {
  const innings = getCurrentInnings(match);

  return (
    <section className="shrink-0 rounded-xl border-2 border-emerald-900 bg-[var(--primary-container)] p-4 text-white shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="On strike"
          name={`${getPlayerName(match, innings.strikerId)}*`}
          meta={`${innings.batsmen[innings.strikerId]?.runs ?? 0} (${innings.batsmen[innings.strikerId]?.balls ?? 0})`}
          accent
          readOnly={readOnly}
          onClick={() => onBatsmanClick?.("striker")}
        />
        <StatCard
          label={partnerLabel}
          name={getPlayerName(match, innings.nonStrikerId)}
          meta={`${innings.batsmen[innings.nonStrikerId]?.runs ?? 0} (${innings.batsmen[innings.nonStrikerId]?.balls ?? 0})`}
          readOnly={readOnly}
          onClick={() => onBatsmanClick?.("nonStriker")}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-emerald-800 pt-4">
        <div className="flex items-center gap-2 text-left">
          <span className="text-lg text-[var(--on-primary-container)] opacity-60">O</span>
          <span className="text-sm font-bold text-emerald-50">{getPlayerName(match, innings.currentBowlerId)}</span>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <span className="block font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--on-primary-container)] opacity-60">Overs</span>
            <span className="font-display text-lg font-semibold">{Math.floor((innings.bowlers[innings.currentBowlerId]?.balls ?? 0) / 6)}.{(innings.bowlers[innings.currentBowlerId]?.balls ?? 0) % 6}</span>
          </div>
          <div>
            <span className="block font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--on-primary-container)] opacity-60">Runs</span>
            <span className="font-display text-lg font-semibold">{innings.bowlers[innings.currentBowlerId]?.runs ?? 0}</span>
          </div>
          <div>
            <span className="block font-display text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--on-primary-container)] opacity-60">Wkts</span>
            <span className="font-display text-lg font-semibold">{innings.bowlers[innings.currentBowlerId]?.wickets ?? 0}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

