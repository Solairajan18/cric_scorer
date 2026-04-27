"use client";

import { useState, useEffect } from "react";
import { TeamRecord, getGlobalTeams, saveTeam } from "@/lib/team-sync";
import { useAuth } from "@/context/AuthContext";
import { Player, TeamKey } from "@/types/match";
import { createMatch } from "@/lib/match-engine";
import { useRouter } from "next/navigation";

type Props = {
  onCancel: () => void;
};

type Step = "teams" | "players" | "settings";

export function MatchSetupWizard({ onCancel }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("teams");
  const [loading, setLoading] = useState(true);
  const [savedTeams, setSavedTeams] = useState<TeamRecord[]>([]);

  // Setup State
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [overs, setOvers] = useState(8);
  const [wideRuns, setWideRuns] = useState(1);
  const [noBallRuns, setNoBallRuns] = useState(1);
  const [tossWinner, setTossWinner] = useState<TeamKey>("A");
  const [batFirst, setBatFirst] = useState<TeamKey>("A");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getGlobalTeams().then(teams => {
      setSavedTeams(teams);
      setLoading(false);
    });
  }, []);

  const handleSelectTeam = (key: "A" | "B", team: TeamRecord) => {
    if (key === "A") {
      setTeamAName(team.name);
      setTeamAPlayers(team.players);
    } else {
      setTeamBName(team.name);
      setTeamBPlayers(team.players);
    }
  };

  const ensurePlayers = (existing: Player[]) => {
    if (existing.length >= 11) return existing;
    const players: Player[] = [...existing];
    for (let i = players.length + 1; i <= 11; i++) {
      players.push({ id: `p${Date.now()}_${i}`, name: `Player ${i}` });
    }
    return players;
  };

  const startMatch = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Create the match object
      const match = await createMatch({
        userId: user.uid,
        teamAName,
        teamBName,
        teamAPlayers: teamAPlayers.map(p => p.name),
        teamBPlayers: teamBPlayers.map(p => p.name),
        oversLimit: overs,
        tossWinnerId: tossWinner,
        battingFirstTeamId: batFirst,
        rules: { wideRuns, noBallRuns },
      });

      // 1. Save teams to global library
      await Promise.all([
        saveTeam(user.uid, teamAName, teamAPlayers),
        saveTeam(user.uid, teamBName, teamBPlayers)
      ]);

      // 2. Wait for Firestore sync to finish before redirecting
      const { pushMatch } = await import("@/lib/match-sync");
      await pushMatch(match);


      router.push(`/m/${match.id}`);
    } catch (error) {
      console.error("Match creation failed:", error);
      setSubmitting(false);
      alert("Failed to create match. Please try again.");
    }
  };

  if (loading) return <div className="p-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  const isSameTeam = teamAName.trim().toLowerCase() === teamBName.trim().toLowerCase() && teamAName.trim() !== "";

  return (
    <div className="space-y-6 pb-10">
      {/* Progress Indicator */}
      <div className="flex gap-2 px-1">
        {(["teams", "players", "settings"] as Step[]).map((s, idx) => (
          <div 
            key={s} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              (["teams", "players", "settings"] as Step[]).indexOf(step) >= idx ? "bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.4)]" : "bg-slate-100"
            }`} 
          />
        ))}
      </div>

      {step === "teams" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <header>
            <h3 className="text-xl font-bold text-slate-900">Choose Teams</h3>
            <p className="text-sm text-slate-500 font-medium">Pick from history or type new names.</p>
          </header>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Team A (Home)</label>
                {teamAName && <button onClick={() => setTeamAName("")} className="text-[10px] font-bold text-rose-500 uppercase">Clear</button>}
              </div>
              <input 
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                placeholder="e.g. Chennai Super Kings"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
              />
              <div className="flex flex-wrap gap-2 pt-1 max-h-24 overflow-y-auto">
                {savedTeams.filter(t => t.name.toLowerCase() !== teamBName.toLowerCase()).map(t => (
                  <button 
                    key={t.id}
                    onClick={() => handleSelectTeam("A", t)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors ${teamAName === t.name ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Team B (Visitor)</label>
                {teamBName && <button onClick={() => setTeamBName("")} className="text-[10px] font-bold text-rose-500 uppercase">Clear</button>}
              </div>
              <input 
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                placeholder="e.g. Mumbai Indians"
                className={`w-full rounded-2xl border px-4 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isSameTeam ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white"}`}
              />
              {isSameTeam && <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Team names must be unique</p>}
              <div className="flex flex-wrap gap-2 pt-1 max-h-24 overflow-y-auto">
                {savedTeams.filter(t => t.name.toLowerCase() !== teamAName.toLowerCase()).map(t => (
                  <button 
                    key={t.id}
                    onClick={() => handleSelectTeam("B", t)}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors ${teamBName === t.name ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            disabled={!teamAName || !teamBName || isSameTeam}
            onClick={() => {
              setTeamAPlayers(ensurePlayers(teamAPlayers));
              setTeamBPlayers(ensurePlayers(teamBPlayers));
              setStep("players");
            }}
            className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-200 transition hover:bg-black active:scale-[0.98] disabled:opacity-30"
          >
            Next: Configure Players
          </button>
        </div>
      )}

      {step === "players" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <header>
            <h3 className="text-xl font-bold text-slate-900">Team Rosters</h3>
            <p className="text-sm text-slate-500 font-medium">Verify or edit player names for this match.</p>
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{teamAName}</p>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {teamAPlayers.map((p, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">{idx + 1}</span>
                    <input 
                      value={p.name}
                      onChange={(e) => {
                        const next = [...teamAPlayers];
                        next[idx].name = e.target.value;
                        setTeamAPlayers(next);
                      }}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 pl-7 pr-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{teamBName}</p>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {teamBPlayers.map((p, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">{idx + 1}</span>
                    <input 
                      value={p.name}
                      onChange={(e) => {
                        const next = [...teamBPlayers];
                        next[idx].name = e.target.value;
                        setTeamBPlayers(next);
                      }}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 pl-7 pr-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep("teams")} className="flex-1 rounded-2xl border border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Back</button>
            <button 
              onClick={() => setStep("settings")}
              className="flex-[2] rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-200 hover:bg-black transition-all"
            >
              Next: Match Settings
            </button>
          </div>
        </div>
      )}

      {step === "settings" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <header>
            <h3 className="text-xl font-bold text-slate-900">Match Settings</h3>
            <p className="text-sm text-slate-500 font-medium">Finalize the rules and toss result.</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overs per Innings</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 8, 10, 12, 15, 20, 50].map(v => (
                  <button 
                    key={v}
                    onClick={() => setOvers(v)}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${overs === v ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Wide Run Rule</label>
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {[0, 1].map(v => (
                      <button key={v} onClick={() => setWideRuns(v)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${wideRuns === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{v} Run</button>
                    ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Ball Run Rule</label>
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {[0, 1].map(v => (
                      <button key={v} onClick={() => setNoBallRuns(v)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${noBallRuns === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{v} Run</button>
                    ))}
                  </div>
               </div>
            </div>


            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Toss Winner</label>
                  <div className="flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
                    <button onClick={() => setTossWinner("A")} className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all truncate px-2 ${tossWinner === "A" ? "bg-white text-emerald-700 shadow-md scale-[1.02]" : "text-slate-500"}`}>{teamAName}</button>
                    <button onClick={() => setTossWinner("B")} className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all truncate px-2 ${tossWinner === "B" ? "bg-white text-emerald-700 shadow-md scale-[1.02]" : "text-slate-500"}`}>{teamBName}</button>
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Batting First</label>
                  <div className="flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
                    <button onClick={() => setBatFirst("A")} className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all truncate px-2 ${batFirst === "A" ? "bg-white text-emerald-700 shadow-md scale-[1.02]" : "text-slate-500"}`}>{teamAName}</button>
                    <button onClick={() => setBatFirst("B")} className={`flex-1 rounded-xl py-3 text-xs font-bold transition-all truncate px-2 ${batFirst === "B" ? "bg-white text-emerald-700 shadow-md scale-[1.02]" : "text-slate-500"}`}>{teamBName}</button>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={() => setStep("players")} className="flex-1 rounded-2xl border border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Back</button>
            <button 
              disabled={submitting}
              onClick={startMatch}
              className="flex-[2] rounded-2xl bg-emerald-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Starting...</span>
                </div>
              ) : "Start Match 🔥"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
