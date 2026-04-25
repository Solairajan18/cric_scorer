"use client";

import { useRef } from "react";
import { toBlob } from "html-to-image";
import Link from "next/link";
import { Match } from "@/types/match";
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

export function ReportSummary({ match, showActions = true }: { match: Match; showActions?: boolean }) {
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

  return (
    <div className="space-y-6">
      <div ref={exportRef} className="bg-white p-0 space-y-4 border border-slate-200 shadow-sm rounded-lg overflow-hidden">
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
              <div className="bg-[#008264] text-white px-4 py-2.5 flex justify-between items-center">
                <h2 className="font-bold text-base">{teamName}</h2>
                <p className="font-bold text-base">{innings.runs}-{innings.wickets} <span className="font-normal text-sm opacity-90">({toOvers(innings.legalBalls)} Ov)</span></p>
              </div>

              {/* Batter Table */}
              <div className="w-full">
                <div className="grid grid-cols-[1fr_40px_40px_40px_40px_60px_20px] bg-[#f2f2f2] px-4 py-2 text-[13px] font-bold text-[#333]">
                  <div>Batter</div>
                  <div className="text-right">R</div>
                  <div className="text-right">B</div>
                  <div className="text-right">4s</div>
                  <div className="text-right">6s</div>
                  <div className="text-right">SR</div>
                  <div></div>
                </div>
                <div className="divide-y divide-slate-100">
                  {battingPlayers.map(player => {
                    const stats = innings.batsmen[player.id];
                    if (!stats || (stats.balls === 0 && !stats.out && !stats.retiredHurt)) return null;
                    
                    const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : "0.00";
                    const dismissal = match.events.find(e => e.inningsNumber === idx + 1 && e.dismissal?.playerId === player.id)?.displaySequence || (stats.out ? "out" : stats.retiredHurt ? "retired hurt" : "batting");

                    return (
                      <div key={player.id} className="grid grid-cols-[1fr_40px_40px_40px_40px_60px_20px] px-4 py-2.5 text-[14px] items-center">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 min-w-0">
                          <span className="text-[#0059B2] font-medium truncate">{player.name}</span>
                          <span className="text-[#666] text-[12px] truncate">{dismissal}</span>
                        </div>
                        <div className="text-right font-bold text-[#333]">{stats.runs}</div>
                        <div className="text-right text-[#333]">{stats.balls}</div>
                        <div className="text-right text-[#333]">{stats.fours}</div>
                        <div className="text-right text-[#333]">{stats.sixes}</div>
                        <div className="text-right text-[#333]">{sr}</div>
                        <div className="text-right text-[#ccc] text-xs pl-2">❯</div>
                      </div>
                    );
                  })}
                </div>
                {/* Extras */}
                <div className="grid grid-cols-[1fr_auto] px-4 py-2.5 border-t border-slate-100 text-[14px]">
                  <div className="font-bold text-[#333]">Extras</div>
                  <div className="text-right">
                    <span className="font-bold text-[#333] mr-2">{innings.extras}</span>
                    <span className="text-[#666] text-[13px]">(b {extras.b}, lb {extras.lb}, w {extras.w}, nb {extras.nb}, p {extras.p})</span>
                  </div>
                </div>
                {/* Total */}
                <div className="grid grid-cols-[1fr_auto] px-4 py-2.5 border-t border-slate-100 text-[14px]">
                  <div className="font-bold text-[#333]">Total</div>
                  <div className="text-right">
                    <span className="font-bold text-[#333]">{innings.runs}-{innings.wickets}</span>
                    <span className="text-[#333] text-[13px] ml-1">({toOvers(innings.legalBalls)} Overs, RR: {rr})</span>
                  </div>
                </div>
                {/* Yet to Bat */}
                {yetToBat.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-slate-100 text-[14px] flex gap-2">
                    <div className="font-bold text-[#333] whitespace-nowrap">Yet to Bat</div>
                    <div className="text-[#0059B2] text-[13px]">
                      {yetToBat.map(p => p.name).join(", ")}
                    </div>
                  </div>
                )}
              </div>

              {/* Bowler Table */}
              <div className="w-full pt-4">
                <div className="grid grid-cols-[1fr_40px_40px_40px_40px_40px_40px_60px_20px] bg-[#f2f2f2] px-4 py-2 text-[13px] font-bold text-[#333]">
                  <div>Bowler</div>
                  <div className="text-right">O</div>
                  <div className="text-right">M</div>
                  <div className="text-right">R</div>
                  <div className="text-right">W</div>
                  <div className="text-right">NB</div>
                  <div className="text-right">WD</div>
                  <div className="text-right">ECO</div>
                  <div></div>
                </div>
                <div className="divide-y divide-slate-100">
                  {bowlingPlayers.map(player => {
                    const stats = bowlerStats[player.id];
                    if (!stats || stats.overs === "0.0") return null;

                    return (
                      <div key={player.id} className="grid grid-cols-[1fr_40px_40px_40px_40px_40px_40px_60px_20px] px-4 py-2.5 text-[14px] items-center">
                        <div className="text-[#0059B2] font-medium truncate">{player.name}</div>
                        <div className="text-right text-[#333]">{stats.overs}</div>
                        <div className="text-right text-[#333]">{stats.maidens}</div>
                        <div className="text-right text-[#333]">{stats.runs}</div>
                        <div className="text-right font-bold text-[#333]">{stats.wickets}</div>
                        <div className="text-right text-[#333]">{stats.nb}</div>
                        <div className="text-right text-[#333]">{stats.wd}</div>
                        <div className="text-right text-[#333]">{stats.eco}</div>
                        <div className="text-right text-[#ccc] text-xs pl-2">❯</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fall of Wickets */}
              {fows.length > 0 && (
                <div className="w-full pt-4">
                  <div className="grid grid-cols-[1fr_100px_100px] bg-[#f2f2f2] px-4 py-2 text-[13px] font-bold text-[#333]">
                    <div>Fall of Wickets</div>
                    <div className="text-center">Score</div>
                    <div className="text-right pr-4">Over</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fows.map((fow, fIdx) => (
                      <div key={fIdx} className="grid grid-cols-[1fr_100px_100px] px-4 py-2.5 text-[14px] items-center">
                        <div className="text-[#0059B2] font-medium">{fow.playerName}</div>
                        <div className="text-center text-[#333]">{fow.score}-{fIdx + 1}</div>
                        <div className="text-right text-[#333] pr-4">{fow.overs}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partnerships - Simplified to match clean style */}
              {partnerships.length > 0 && (
                <div className="w-full pt-4 pb-4">
                  <div className="bg-[#f2f2f2] px-4 py-2 text-[13px] font-bold text-[#333]">
                    Partnerships
                  </div>
                  <div className="divide-y divide-slate-100">
                    {partnerships.map((p, pIdx) => (
                      <div key={pIdx} className="px-4 py-3 flex items-center justify-between text-[13px]">
                        <div className="w-[45%] text-right pr-2">
                            <span className="font-bold text-[#333]">{p.batter1}</span>
                            <span className="text-[#666] ml-1">{p.batter1Runs}({p.batter1Balls})</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <p className="text-[#333] font-bold">{p.totalRuns} ({p.totalBalls})</p>
                        </div>
                        <div className="w-[45%] text-left pl-2">
                            <span className="font-bold text-[#333]">{p.batter2}</span>
                            <span className="text-[#666] ml-1">{p.batter2Runs}({p.batter2Balls})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {showActions && (
        <div className="grid grid-cols-2 gap-3 px-0">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 font-display text-sm font-bold uppercase text-slate-900 border border-slate-200">
            Share Image
          </button>
          <Link href="/" className="flex items-center justify-center gap-2 rounded-lg bg-[#008264] px-4 py-3 font-display text-sm font-bold uppercase text-white">
            New Match
          </Link>
        </div>
      )}
    </div>
  );
}
