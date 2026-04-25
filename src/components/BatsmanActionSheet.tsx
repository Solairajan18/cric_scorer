"use client";

import { Match } from "@/types/match";
import { getPlayerName } from "@/lib/match-engine";
import { BottomSheet } from "@/components/BottomSheet";

type Props = {
  open: boolean;
  match: Match;
  slot: "striker" | "nonStriker";
  selectedPlayerId: string;
  incomingBatters: Array<{ id: string; name: string }>;
  mode: "swap" | "retire";
  incomingPlayerId: string;
  onModeChange: (mode: "swap" | "retire") => void;
  onIncomingChange: (playerId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function BatsmanActionSheet({
  open,
  match,
  slot,
  selectedPlayerId,
  incomingBatters,
  mode,
  incomingPlayerId,
  onModeChange,
  onIncomingChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <BottomSheet open={open} title={getPlayerName(match, selectedPlayerId)} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{slot === "striker" ? "On strike" : "Non-striker"}. Choose a contextual action.</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onModeChange("swap")} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${mode === "swap" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
            Swap Player
          </button>
          <button onClick={() => onModeChange("retire")} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${mode === "retire" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
            Retired Hurt
          </button>
        </div>
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">Incoming player</span>
          <select value={incomingPlayerId} onChange={(event) => onIncomingChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
            {incomingBatters.map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </label>
        <button onClick={onConfirm} disabled={!incomingBatters.length || !incomingPlayerId} className="w-full rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white disabled:opacity-50">
          Confirm action
        </button>
      </div>
    </BottomSheet>
  );
}
