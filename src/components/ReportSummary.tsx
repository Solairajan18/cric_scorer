"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { toBlob } from "html-to-image";
import { Match, BallEvent } from "@/types/match";
import { 
  getPlayerName, 
  normalizeTeamName, 
  toOvers, 
  getExtrasBreakdown, 
  getFallOfWickets, 
  getPartnerships, 
  getYetToBat, 
  getBowlerStatsWithMaidens 
} from "@/lib/match-engine";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getDetailedDismissal(match: Match, event: BallEvent) {
  if (!event.dismissal) return "not out";
  const { type, fielderId } = event.dismissal;
  const bowlerId = event.bowlerId;
  const bowlerName = getPlayerName(match, bowlerId);
  const fielderName = fielderId ? getPlayerName(match, fielderId) : "";


  switch (type) {
    case "caught": return `c ${fielderName} b ${bowlerName}`;
    case "bowled": return `b ${bowlerName}`;
    case "lbw": return `lbw b ${bowlerName}`;
    case "stumped": return `st ${fielderName} b ${bowlerName}`;
    case "run_out": return `run out (${fielderName || "direct"})`;
    case "hit_wicket": return `hit wicket b ${bowlerName}`;
    case "retired_hurt": return `retired hurt`;
    case "retired_out": return `retired out`;
    default: return type.replace("_", " ");
  }
}

export const ReportSummary = forwardRef(function ReportSummary({ match }: { match: Match }, ref) {
  const exportRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    if (!exportRef.current) return;
    const blob = await toBlob(exportRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    if (!blob) return;

    const file = new File([blob], `${match.id}-scorecard.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Solai's Cric Scorer — Match Summary" });
      return;
    }

    downloadBlob(blob, `${match.id}-scorecard.png`);
  }

  useImperativeHandle(ref, () => ({
    exportImage: handleExport
  }));

  const isCompleted = match.status === "completed";

  return (
    <div className="space-y-6">
      <div ref={exportRef} className="bg-white p-0 space-y-4 border border-slate-200 shadow-sm rounded-lg overflow-hidden">
        {/* Match Header for Image Export */}
        <div className="bg-slate-900 text-white p-6 text-center border-b border-white/10">
          <h1 className="font-display text-xl font-black uppercase tracking-[0.2em] mb-1">Match Report</h1>
          <p className="text-emerald-400 font-bold text-sm tracking-widest">{normalizeTeamName(match.teamA.name)} vs {normalizeTeamName(match.teamB.name)}</p>
          {match.summary?.result && <p className="mt-4 text-xs font-medium text-slate-400 bg-white/5 py-2 rounded-full ring-1 ring-white/10">{match.summary.result}</p>}
        </div>

        {match.innings.map((innings, idx) => {
          if (idx === 1 && !innings.completed && innings.legalBalls === 0 && innings.runs === 0) return null;

          const teamName = normalizeTeamName(innings.battingTeamId === "A" ? match.teamA.name : match.teamB.name);
          const battingPlayers = (innings.battingTeamId === "A" ? match.teamA : match.teamB).players;
          const bowlingPlayers = (innings.battingTeamId === "A" ? match.teamB : match.teamA).players;
          const extras = getExtrasBreakdown(match.events.filter(e => e.inningsNumber === idx + 1));
          const fows = getFallOfWickets(match, idx);
          const partnerships = getPartnerships(match, idx);
          const yetToBat = getYetToBat(match, idx);
          const bowlerStats = getBowlerStatsWithMaidens(match, idx);
          const rr = innings.legalBalls > 0 ? ((innings.runs * 6) / innings.legalBalls).toFixed(2) : "0.00";

          return (
            <section key={idx} className="space-y-0">
              {/* Team Header */}
              <div className="bg-[#064e3b] text-white px-4 py-3 flex justify-between items-center border-b border-white/10">
                <h2 className="font-bold text-sm uppercase tracking-widest">{teamName}</h2>
                <p className="font-black text-lg">{innings.runs}/{innings.wickets} <span className="font-medium text-xs opacity-60 ml-1">({toOvers(innings.legalBalls)} Ov)</span></p>
              </div>

              {/* Batter Table */}
              <div className="w-full">
                <div className="grid grid-cols-[1fr_35px_35px_35px_35px_55px] bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <div>Batter</div>
                  <div className="text-right">R</div>
                  <div className="text-right">B</div>
                  <div className="text-right">4s</div>
                  <div className="text-right">6s</div>
                  <div className="text-right">SR</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {battingPlayers.map(player => {
                    const stats = innings.batsmen[player.id];
                    if (!stats || (stats.balls === 0 && !stats.out && !stats.retiredHurt)) return null;
                    
                    const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                    const dismissalEvent = match.events.find(e => e.inningsNumber === idx + 1 && e.dismissal?.playerId === player.id);
                    const dismissalLabel = dismissalEvent ? getDetailedDismissal(match, dismissalEvent) : (stats.out ? "out" : stats.retiredHurt ? "retired hurt" : "not out");

                    return (
                      <div key={player.id} className="grid grid-cols-[1fr_35px_35px_35px_35px_55px] px-4 py-3 text-[12px] items-center hover:bg-slate-50/50 transition-colors">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-slate-900 font-bold truncate">{player.name}</span>
                          <span className="text-slate-400 text-[10px] font-medium italic truncate">{dismissalLabel}</span>
                        </div>
                        <div className="text-right font-black text-slate-900">{stats.runs}</div>
                        <div className="text-right text-slate-500 font-medium">{stats.balls}</div>
                        <div className="text-right text-slate-400">{stats.fours}</div>
                        <div className="text-right text-slate-400">{stats.sixes}</div>
                        <div className="text-right text-slate-400 font-bold">{sr}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Extras */}
                <div className="grid grid-cols-[1fr_auto] px-4 py-3 border-t border-slate-100 text-[12px] bg-slate-50/30">
                  <div className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Extras</div>
                  <div className="text-right flex items-center gap-2">
                    <span className="font-black text-slate-900">{innings.extras}</span>
                    <span className="text-slate-400 text-[10px] font-medium">(b {extras.b}, lb {extras.lb}, w {extras.w}, nb {extras.nb})</span>
                  </div>
                </div>
              </div>

              {/* Bowler Table */}
              <div className="w-full">
                <div className="grid grid-cols-[1fr_35px_35px_35px_35px_55px] bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-y border-slate-100">
                  <div>Bowling</div>
                  <div className="text-right">O</div>
                  <div className="text-right">M</div>
                  <div className="text-right">R</div>
                  <div className="text-right">W</div>
                  <div className="text-right">ECO</div>
                </div>
                <div className="divide-y divide-slate-50">
                  {bowlingPlayers.map(player => {
                    const stats = bowlerStats[player.id];
                    if (!stats || stats.overs === "0.0") return null;

                    return (
                      <div key={player.id} className="grid grid-cols-[1fr_35px_35px_35px_35px_55px] px-4 py-3 text-[12px] items-center hover:bg-slate-50/50 transition-colors">
                        <div className="text-slate-900 font-bold truncate">{player.name}</div>
                        <div className="text-right text-slate-900 font-medium">{stats.overs}</div>
                        <div className="text-right text-slate-400">{stats.maidens}</div>
                        <div className="text-right text-slate-900 font-medium">{stats.runs}</div>
                        <div className="text-right font-black text-emerald-700">{stats.wickets}</div>
                        <div className="text-right text-slate-400 font-bold">{stats.eco}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Partnerships */}
              {partnerships.length > 0 && (
                <div className="w-full border-t border-slate-100">
                  <div className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                    Partnerships
                  </div>
                  <div className="divide-y divide-slate-50">
                    {partnerships.map((p, pIdx) => (
                      <div key={pIdx} className="px-4 py-3 flex items-center justify-between text-[11px] hover:bg-slate-50/30">
                        <div className="w-[42%] text-right">
                            <p className="font-bold text-slate-900 truncate">{p.batter1}</p>
                            <p className="text-slate-400 text-[10px]">{p.batter1Runs} ({p.batter1Balls})</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="h-px w-8 bg-slate-200 mb-1" />
                            <p className="text-emerald-700 font-black">{p.totalRuns}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{p.totalBalls}b</p>
                        </div>
                        <div className="w-[42%] text-left">
                            <p className="font-bold text-slate-900 truncate">{p.batter2}</p>
                            <p className="text-slate-400 text-[10px]">{p.batter2Runs} ({p.batter2Balls})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* Awards Section (Footer of the Image) */}
        {isCompleted && (
          <div className="bg-slate-900 text-white p-6 rounded-b-lg border-t border-white/10">
            <h3 className="text-center font-display text-xs font-black uppercase tracking-[0.3em] mb-6 text-emerald-400">Match Awards</h3>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: "Player of the Match", name: match.summary?.awards?.potm || "To be decided", icon: "⭐" },
                 { label: "Best Batsman", name: match.summary?.awards?.bestBatter || match.summary?.topBatter?.name || "N/A", icon: "🏏" },
                 { label: "Best Bowler", name: match.summary?.awards?.bestBowler || match.summary?.topBowler?.name || "N/A", icon: "🥎" },
                 { label: "Best Fielder", name: match.summary?.awards?.bestFielder || "N/A", icon: "🧤" },
               ].map((award, i) => (
                 <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center">
                    <span className="text-xl mb-2">{award.icon}</span>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">{award.label}</p>
                    <p className="text-xs font-bold text-white truncate w-full">{award.name}</p>
                 </div>
               ))}
            </div>
            <p className="text-center mt-8 text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">Generated by Solai&apos;s Cric Scorer</p>
          </div>
        )}
      </div>
    </div>
  );
});
