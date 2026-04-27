"use client";

import { Player, Match } from "@/types/match";
import { BottomSheet } from "@/components/BottomSheet";
import { getCurrentInnings, toOvers } from "@/lib/match-engine";

type Props = {
  open: boolean;
  title: string;
  description: string;
  players: Player[];
  onClose: () => void;
  onSelect: (playerId: string) => void;
  match: Match;
};

export function BowlerSelectionSheet({ open, title, description, players, onClose, onSelect, match }: Props) {
  const innings = getCurrentInnings(match);
  const lastBowlerId = innings.currentBowlerId;
  const maxOvers = match.rules.maxOversPerBowler || Math.ceil(match.oversLimit / 4); // Default to 1/4 of total if not set

  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-6 pb-8">
        <p className="text-xs font-medium text-slate-500 leading-relaxed border-l-2 border-emerald-500 pl-3">{description}</p>
        
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available Bowlers</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {players.map((player) => {
              const stats = innings.bowlers[player.id];
              const oversBowled = stats ? Math.floor(stats.balls / 6) : 0;
              const isOverLimit = oversBowled >= maxOvers;
              const isConsecutive = player.id === lastBowlerId && innings.legalBalls > 0 && innings.legalBalls % 6 === 0;
              const isDisabled = isOverLimit || isConsecutive;

              return (
                <button 
                  key={player.id} 
                  disabled={isDisabled}
                  onClick={() => onSelect(player.id)} 
                  className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                    isDisabled 
                      ? "border-slate-50 bg-slate-50 opacity-60 grayscale" 
                      : "border-slate-100 bg-white hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-50 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${isDisabled ? "text-slate-400" : "text-slate-900"}`}>{player.name}</span>
                    {stats && <span className="text-[10px] font-black text-emerald-600">{stats.wickets} Wkts</span>}
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Overs: {stats ? toOvers(stats.balls) : "0.0"} / {maxOvers}</span>
                    {isConsecutive && <span className="text-rose-500">Consecutive Over</span>}
                    {isOverLimit && <span className="text-rose-500">Limit Reached</span>}
                  </div>

                  {!isDisabled && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
