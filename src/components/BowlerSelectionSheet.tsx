"use client";

import { Player } from "@/types/match";
import { BottomSheet } from "@/components/BottomSheet";

type Props = {
  open: boolean;
  title: string;
  description: string;
  players: Player[];
  onClose: () => void;
  onSelect: (playerId: string) => void;
};

export function BowlerSelectionSheet({ open, title, description, players, onClose, onSelect }: Props) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">{description}</p>
        <div className="grid grid-cols-2 gap-2">
          {players.map((player) => (
            <button key={player.id} onClick={() => onSelect(player.id)} className="rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-900">
              {player.name}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
