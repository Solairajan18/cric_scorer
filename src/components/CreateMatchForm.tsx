"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createMatch, parsePlayerNames, saveMatchLocal, sanitizeOvers, validateMatchInput } from "@/lib/match-engine";
import { pushMatch } from "@/lib/match-sync";
import { TeamKey } from "@/types/match";

const DEFAULT_PLAYERS_A = "Akash\nRohit\nSam\nKunal\nVijay\nNitin\nJay\nArun";
const DEFAULT_PLAYERS_B = "Ravi\nKarthik\nSuresh\nPradeep\nAnbu\nMohan\nSenthil\nDinesh";

type FormErrors = Partial<Record<"teamAName" | "teamBName" | "teamAPlayers" | "teamBPlayers" | "oversLimit", string>>;

export function CreateMatchForm() {
  const router = useRouter();
  const [teamAName, setTeamAName] = useState("Weekend Warriors");
  const [teamBName, setTeamBName] = useState("Sunday Strikers");
  const [teamAPlayers, setTeamAPlayers] = useState(DEFAULT_PLAYERS_A);
  const [teamBPlayers, setTeamBPlayers] = useState(DEFAULT_PLAYERS_B);
  const [oversLimit, setOversLimit] = useState(8);
  const [tossWinnerId, setTossWinnerId] = useState<TeamKey>("A");
  const [battingFirstTeamId, setBattingFirstTeamId] = useState<TeamKey>("A");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [wideRuns, setWideRuns] = useState(1);
  const [noBallRuns, setNoBallRuns] = useState(1);


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
      rules: { wideRuns, noBallRuns },
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
      rules: { wideRuns, noBallRuns },
    });


    saveMatchLocal(match);
    await pushMatch(match);
    router.push(`/m/${match.id}`);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="app-card space-y-2 p-4">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Team A (Home)</span>
          <input value={teamAName} onChange={(event) => setTeamAName(event.target.value)} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--primary-container)]" />
          <div className="flex gap-2">
            {battingFirstTeamId === "A" ? <span className="rounded-md bg-[var(--primary-fixed-dim)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--primary-container)]">Batting First</span> : null}
            {tossWinnerId === "A" ? <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-[var(--tertiary-container)]">Won Toss</span> : null}
          </div>
          {errors.teamAName ? <p className="text-sm text-rose-600">{errors.teamAName}</p> : null}
        </label>
        <label className="app-card space-y-2 p-4">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Team B (Away)</span>
          <input value={teamBName} onChange={(event) => setTeamBName(event.target.value)} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--primary-container)]" />
          <div className="flex gap-2">
            {battingFirstTeamId === "B" ? <span className="rounded-md bg-[var(--primary-fixed-dim)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--primary-container)]">Batting First</span> : null}
            {tossWinnerId === "B" ? <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-[var(--tertiary-container)]">Won Toss</span> : null}
          </div>
          {errors.teamBName ? <p className="text-sm text-rose-600">{errors.teamBName}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="app-card space-y-2 p-4">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Team A Players ({playerCount.A})</span>
          <span className="text-xs leading-5 text-slate-500">Enter one player per line. Commas and pasted `&lt;br&gt;` values are cleaned up automatically.</span>
          <textarea value={teamAPlayers} onChange={(event) => setTeamAPlayers(event.target.value)} rows={8} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 outline-none focus:border-[var(--primary-container)]" />
          {errors.teamAPlayers ? <p className="text-sm text-rose-600">{errors.teamAPlayers}</p> : null}
        </label>
        <label className="app-card space-y-2 p-4">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Team B Players ({playerCount.B})</span>
          <span className="text-xs leading-5 text-slate-500">Enter one player per line. Blank rows are ignored.</span>
          <textarea value={teamBPlayers} onChange={(event) => setTeamBPlayers(event.target.value)} rows={8} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 outline-none focus:border-[var(--primary-container)]" />
          {errors.teamBPlayers ? <p className="text-sm text-rose-600">{errors.teamBPlayers}</p> : null}
        </label>
      </div>

      <div className="rounded-2xl border-2 border-[var(--tertiary-container)] bg-orange-50 p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg text-[var(--tertiary-container)]">O</span>
          <p className="font-display text-lg font-semibold uppercase tracking-tight text-[var(--tertiary-container)]">The Toss</p>
        </div>
        <p className="text-sm leading-6 text-slate-600">Use both fields to match the real toss result and decision.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Overs</span>
          <input type="number" min={1} max={50} step={1} value={oversLimit} onChange={(event) => setOversLimit(sanitizeOvers(Number(event.target.value)))} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 outline-none focus:border-[var(--primary-container)]" />
          {errors.oversLimit ? <p className="text-sm text-rose-600">{errors.oversLimit}</p> : null}
        </label>
        <label className="space-y-2">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Toss Winner</span>
          <select value={tossWinnerId} onChange={(event) => setTossWinnerId(event.target.value as TeamKey)} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 outline-none focus:border-[var(--primary-container)]">
            <option value="A">{teamAName.trim() || "Team A"}</option>
            <option value="B">{teamBName.trim() || "Team B"}</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Batting First</span>
          <select value={battingFirstTeamId} onChange={(event) => setBattingFirstTeamId(event.target.value as TeamKey)} className="w-full border-2 border-[var(--outline-variant)] bg-white px-4 py-3 outline-none focus:border-[var(--primary-container)]">
            <option value="A">{teamAName.trim() || "Team A"}</option>
            <option value="B">{teamBName.trim() || "Team B"}</option>
          </select>
        </label>
        </div>
        <p className="mt-4 text-sm text-slate-600">Toss winner: <span className="font-semibold text-slate-900">{tossWinnerName}</span>. Batting first: <span className="font-semibold text-slate-900">{battingFirstTeamId === "A" ? teamAName.trim() || "Team A" : teamBName.trim() || "Team B"}</span>.</p>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg text-slate-500">⚙</span>
          <p className="font-display text-lg font-semibold uppercase tracking-tight text-slate-700">Match Rules</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">Wide Runs</span>
            <div className="flex gap-2">
              {[0, 1].map(r => (
                <button 
                  key={r} 
                  type="button"
                  onClick={() => setWideRuns(r)}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition ${wideRuns === r ? "bg-emerald-900 text-white border-emerald-900" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {r} {r === 1 ? "Run" : "Runs"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">Runs awarded to batting team per wide ball.</p>
          </label>
          <label className="space-y-2">
            <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-container)]">No-ball Runs</span>
            <div className="flex gap-2">
              {[0, 1].map(r => (
                <button 
                  key={r} 
                  type="button"
                  onClick={() => setNoBallRuns(r)}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition ${noBallRuns === r ? "bg-emerald-900 text-white border-emerald-900" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {r} {r === 1 ? "Run" : "Runs"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">Runs awarded to batting team per no-ball.</p>
          </label>
        </div>
      </div>


      <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-5 font-display text-xl font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-70">
        {submitting ? "Creating match..." : "Start Match"}
        <span className="text-lg">&gt;</span>
      </button>
    </form>
  );
}
