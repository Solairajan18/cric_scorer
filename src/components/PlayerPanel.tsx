"use client";

import { Match } from "@/types/match";
import { getCurrentBattingTeam, getCurrentBowlingTeam, getCurrentInnings, getPlayerName } from "@/lib/match-engine";

type Props = {
  match: Match;
  onChangePlayers: (input: { strikerId?: string; nonStrikerId?: string; currentBowlerId?: string }) => void;
};

export function PlayerPanel({ match, onChangePlayers }: Props) {
  const innings = getCurrentInnings(match);
  const batting = getCurrentBattingTeam(match);
  const bowling = getCurrentBowlingTeam(match);

  return (
    <section className="grid gap-4 rounded-[28px] bg-white p-5 shadow-soft md:grid-cols-3">
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-600">Striker</span>
        <select value={innings.strikerId} onChange={(event) => onChangePlayers({ strikerId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500">
          {batting.players.filter((player) => !innings.batsmen[player.id].out || player.id === innings.strikerId).map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-600">Non-striker</span>
        <select value={innings.nonStrikerId} onChange={(event) => onChangePlayers({ nonStrikerId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500">
          {batting.players.filter((player) => !innings.batsmen[player.id].out || player.id === innings.nonStrikerId).map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-600">Bowler</span>
        <select value={innings.currentBowlerId} onChange={(event) => onChangePlayers({ currentBowlerId: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500">
          {bowling.players.map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
      </label>

      <div className="md:col-span-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">On strike</p>
          <p className="mt-1 font-semibold text-slate-900">{getPlayerName(match, innings.strikerId)}</p>
          <p className="text-sm text-slate-600">{innings.batsmen[innings.strikerId]?.runs ?? 0} ({innings.batsmen[innings.strikerId]?.balls ?? 0})</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Partner</p>
          <p className="mt-1 font-semibold text-slate-900">{getPlayerName(match, innings.nonStrikerId)}</p>
          <p className="text-sm text-slate-600">{innings.batsmen[innings.nonStrikerId]?.runs ?? 0} ({innings.batsmen[innings.nonStrikerId]?.balls ?? 0})</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current bowler</p>
          <p className="mt-1 font-semibold text-slate-900">{getPlayerName(match, innings.currentBowlerId)}</p>
          <p className="text-sm text-slate-600">{innings.bowlers[innings.currentBowlerId]?.wickets ?? 0}/{innings.bowlers[innings.currentBowlerId]?.runs ?? 0}</p>
        </div>
      </div>
    </section>
  );
}
