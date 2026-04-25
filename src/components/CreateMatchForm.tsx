"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch, parsePlayerNames, saveMatchLocal, sanitizeOvers, validateMatchInput } from "@/lib/match-engine";
import { pushMatch } from "@/lib/match-sync";
import { TeamKey } from "@/types/match";

const DEFAULT_PLAYERS = "Akash\nRohit\nSam\nKunal\nVijay\nNitin\nJay\nArun";

type FormErrors = Partial<Record<"teamAName" | "teamBName" | "teamAPlayers" | "teamBPlayers" | "oversLimit", string>>;

export function CreateMatchForm() {
  const router = useRouter();
  const [teamAName, setTeamAName] = useState("Weekend Warriors");
  const [teamBName, setTeamBName] = useState("Sunday Strikers");
  const [teamAPlayers, setTeamAPlayers] = useState(DEFAULT_PLAYERS);
  const [teamBPlayers, setTeamBPlayers] = useState(DEFAULT_PLAYERS);
  const [oversLimit, setOversLimit] = useState(8);
  const [tossWinnerId, setTossWinnerId] = useState<TeamKey>("A");
  const [battingFirstTeamId, setBattingFirstTeamId] = useState<TeamKey>("A");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const playerCount = useMemo(
    () => ({
      A: parsePlayerNames(teamAPlayers).length,
      B: parsePlayerNames(teamBPlayers).length,
    }),
    [teamAPlayers, teamBPlayers],
  );

  const tossWinnerName = tossWinnerId === "A" ? teamAName.trim() || "Team A" : teamBName.trim() || "Team B";

  async function handleSubmit(formData: FormData) {
    void formData;
    const validation = validateMatchInput({
      teamAName,
      teamBName,
      teamAPlayers: parsePlayerNames(teamAPlayers),
      teamBPlayers: parsePlayerNames(teamBPlayers),
      oversLimit,
      tossWinnerId,
      battingFirstTeamId,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const match = createMatch({
      teamAName: validation.normalized.teamAName,
      teamBName: validation.normalized.teamBName,
      teamAPlayers: validation.normalized.teamAPlayers,
      teamBPlayers: validation.normalized.teamBPlayers,
      oversLimit: validation.normalized.oversLimit,
      tossWinnerId,
      battingFirstTeamId,
    });

    saveMatchLocal(match);
    await pushMatch(match);
    router.push(`/m/${match.id}`);
  }

  return (
    <form action={handleSubmit} className="space-y-6 rounded-[28px] bg-white p-5 shadow-soft md:p-7">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-950">Set up the match</h2>
        <p className="text-sm leading-6 text-slate-600">Keep it quick: add team names, paste players, pick who bats first, then start scoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Team A</span>
          <input value={teamAName} onChange={(event) => setTeamAName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500" />
          {errors.teamAName ? <p className="text-sm text-rose-600">{errors.teamAName}</p> : null}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Team B</span>
          <input value={teamBName} onChange={(event) => setTeamBName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500" />
          {errors.teamBName ? <p className="text-sm text-rose-600">{errors.teamBName}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Team A players ({playerCount.A})</span>
          <span className="block text-xs leading-5 text-slate-500">Enter one player per line. Commas and pasted `&lt;br&gt;` values are cleaned up automatically.</span>
          <textarea value={teamAPlayers} onChange={(event) => setTeamAPlayers(event.target.value)} rows={8} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500" />
          {errors.teamAPlayers ? <p className="text-sm text-rose-600">{errors.teamAPlayers}</p> : null}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Team B players ({playerCount.B})</span>
          <span className="block text-xs leading-5 text-slate-500">Enter one player per line. Blank rows are ignored.</span>
          <textarea value={teamBPlayers} onChange={(event) => setTeamBPlayers(event.target.value)} rows={8} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500" />
          {errors.teamBPlayers ? <p className="text-sm text-rose-600">{errors.teamBPlayers}</p> : null}
        </label>
      </div>

      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Toss and innings</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">Toss winner and batting first are separate on purpose. Use both fields to match the real decision.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Overs</span>
          <input type="number" min={1} max={50} step={1} value={oversLimit} onChange={(event) => setOversLimit(sanitizeOvers(Number(event.target.value)))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500" />
          {errors.oversLimit ? <p className="text-sm text-rose-600">{errors.oversLimit}</p> : null}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Toss winner</span>
          <select value={tossWinnerId} onChange={(event) => setTossWinnerId(event.target.value as TeamKey)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500">
            <option value="A">{teamAName.trim() || "Team A"}</option>
            <option value="B">{teamBName.trim() || "Team B"}</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Batting first</span>
          <select value={battingFirstTeamId} onChange={(event) => setBattingFirstTeamId(event.target.value as TeamKey)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500">
            <option value="A">{teamAName.trim() || "Team A"}</option>
            <option value="B">{teamBName.trim() || "Team B"}</option>
          </select>
        </label>
        </div>
        <p className="mt-4 text-sm text-slate-600">Toss winner: <span className="font-medium text-slate-900">{tossWinnerName}</span>. Batting first: <span className="font-medium text-slate-900">{battingFirstTeamId === "A" ? teamAName.trim() || "Team A" : teamBName.trim() || "Team B"}</span>.</p>
      </div>

      <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
        {submitting ? "Creating match..." : "Create match"}
      </button>
    </form>
  );
}
