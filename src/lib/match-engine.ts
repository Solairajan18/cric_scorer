import { BallEvent, BowlerStats, EventKind, Innings, Match, MatchCreateInput, MatchSummary, Player, Team, TeamKey, WicketKind } from "@/types/match";

const STORAGE_PREFIX = "cric-scorer:match:";

export const MIN_PLAYERS_PER_TEAM = 2;
export const MAX_OVERS = 50;

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeTeamName(name: string) {
  const trimmed = name.trim();
  return trimmed || "Team not set";
}

export function parsePlayerNames(input: string) {
  const normalized = input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&lt;br\s*\/?&gt;/gi, "\n");

  return normalized
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function findDuplicateNames(names: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of names) {
    const normalized = name.toLocaleLowerCase();
    if (seen.has(normalized)) duplicates.add(name);
    seen.add(normalized);
  }

  return [...duplicates];
}

export function sanitizeOvers(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_OVERS, Math.max(1, Math.floor(value)));
}

function createPlayers(names: string[]) {
  return names.map((name, index) => ({
    id: `p_${index + 1}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
  }));
}

function createStatsMap(players: Player[]) {
  return Object.fromEntries(
    players.map((player) => [
      player.id,
      { runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
    ]),
  );
}

function createBowlerStatsMap(players: Player[]) {
  return Object.fromEntries(
    players.map((player) => [
      player.id,
      { balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 } satisfies BowlerStats,
    ]),
  );
}

function createInnings(battingTeam: Team, bowlingTeam: Team): Innings {
  return {
    battingTeamId: battingTeam.id,
    bowlingTeamId: bowlingTeam.id,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    extras: 0,
    strikerId: battingTeam.players[0]?.id ?? "",
    nonStrikerId: battingTeam.players[1]?.id ?? battingTeam.players[0]?.id ?? "",
    currentBowlerId: bowlingTeam.players[0]?.id ?? "",
    batsmen: createStatsMap(battingTeam.players),
    bowlers: createBowlerStatsMap(bowlingTeam.players),
    eventIds: [],
    completed: false,
  };
}

function resetMatchFromExisting(original: Match): Match {
  const teamA = JSON.parse(JSON.stringify(original.teamA)) as Team;
  const teamB = JSON.parse(JSON.stringify(original.teamB)) as Team;
  const battingFirst = original.battingFirstTeamId === "A" ? teamA : teamB;
  const bowlingFirst = original.battingFirstTeamId === "A" ? teamB : teamA;

  return {
    id: original.id,
    createdAt: original.createdAt,
    status: "live",
    oversLimit: original.oversLimit,
    teamA,
    teamB,
    currentInnings: 1,
    innings: [createInnings(battingFirst, bowlingFirst), createInnings(bowlingFirst, battingFirst)],
    events: [],
    tossWinnerId: original.tossWinnerId,
    battingFirstTeamId: original.battingFirstTeamId,
  };
}

function createTeam(id: TeamKey, name: string, playerNames: string[]): Team {
  return {
    id,
    name: normalizeTeamName(name),
    players: createPlayers(playerNames.filter(Boolean)),
  };
}

function swapStrike(innings: Innings) {
  [innings.strikerId, innings.nonStrikerId] = [innings.nonStrikerId, innings.strikerId];
}

function isAllOut(match: Match, innings: Innings) {
  const batting = innings.battingTeamId === "A" ? match.teamA : match.teamB;
  return innings.wickets >= Math.max(0, batting.players.length - 1);
}

function oversDone(match: Match, innings: Innings) {
  return innings.legalBalls >= match.oversLimit * 6;
}

export function toOvers(legalBalls: number) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function getEventLabel(kind: EventKind, runs: number, wicketKind?: WicketKind) {
  if (kind === "wicket") return wicketKind ? `W-${wicketKind.replace("_", " ")}` : "W";
  if (kind === "wide") return runs > 1 ? `Wd+${runs - 1}` : "Wd";
  if (kind === "no_ball") return runs > 1 ? `Nb+${runs - 1}` : "Nb";
  if (kind === "bye") return `B${runs}`;
  if (kind === "leg_bye") return `Lb${runs}`;
  return `${runs}`;
}

function getRunsForStrike(kind: EventKind, runs: number) {
  if (kind === "bye" || kind === "leg_bye") return runs;
  if (kind === "run") return runs;
  if (kind === "no_ball") return Math.max(0, runs - 1);
  return 0;
}

function shouldRotate(kind: EventKind, runs: number) {
  return getRunsForStrike(kind, runs) % 2 === 1;
}

export function createMatch(input: MatchCreateInput): Match {
  const teamA = createTeam("A", input.teamAName, input.teamAPlayers);
  const teamB = createTeam("B", input.teamBName, input.teamBPlayers);
  const battingFirst = input.battingFirstTeamId === "A" ? teamA : teamB;
  const bowlingFirst = input.battingFirstTeamId === "A" ? teamB : teamA;

  return {
    id: makeId("match"),
    createdAt: Date.now(),
    status: "live",
    oversLimit: sanitizeOvers(input.oversLimit),
    teamA,
    teamB,
    currentInnings: 1,
    innings: [createInnings(battingFirst, bowlingFirst), createInnings(bowlingFirst, battingFirst)],
    events: [],
    tossWinnerId: input.tossWinnerId,
    battingFirstTeamId: input.battingFirstTeamId,
  };
}

export function cloneMatch(match: Match): Match {
  return JSON.parse(JSON.stringify(match)) as Match;
}

export function applyBall(
  original: Match,
  input: { kind: EventKind; runs: number; wicketKind?: WicketKind; dismissedPlayerId?: string },
) {
  const match = cloneMatch(original);
  const innings = match.innings[match.currentInnings - 1];
  const legal = input.kind === "run" || input.kind === "wicket" || input.kind === "bye" || input.kind === "leg_bye";
  const extraRuns = input.kind === "wide" || input.kind === "no_ball" ? input.runs : input.kind === "bye" || input.kind === "leg_bye" ? input.runs : 0;
  const runsOffBat = input.kind === "run" ? input.runs : input.kind === "no_ball" ? Math.max(0, input.runs - 1) : 0;
  const totalRuns = input.kind === "no_ball" ? input.runs : input.kind === "wide" ? input.runs : input.runs;

  const batter = innings.batsmen[innings.strikerId];
  const bowler = innings.bowlers[innings.currentBowlerId];

  innings.runs += totalRuns;
  innings.extras += extraRuns;
  if (legal) innings.legalBalls += 1;
  if (bowler) {
    bowler.runs += totalRuns;
    if (legal) bowler.balls += 1;
    if (input.kind === "wide") bowler.wides += totalRuns;
    if (input.kind === "no_ball") bowler.noBalls += 1;
  }

  if (batter) {
    batter.runs += runsOffBat;
    if (legal) batter.balls += 1;
    if (runsOffBat === 4) batter.fours += 1;
    if (runsOffBat === 6) batter.sixes += 1;
  }

  if (input.kind === "wicket") {
    innings.wickets += 1;
    if (bowler) bowler.wickets += 1;
    if (batter) batter.out = true;

    const battingTeam = innings.battingTeamId === "A" ? match.teamA : match.teamB;
    const nextBatter = battingTeam.players.find((player) => !innings.batsmen[player.id].out && player.id !== innings.nonStrikerId && player.id !== innings.strikerId);
    innings.strikerId = nextBatter?.id ?? innings.strikerId;
  }

  const event: BallEvent = {
    id: makeId("event"),
    inningsNumber: match.currentInnings,
    over: Math.floor((innings.legalBalls - (legal ? 1 : 0)) / 6),
    ballInOver: legal ? (innings.legalBalls - 1) % 6 : innings.legalBalls % 6,
    label: getEventLabel(input.kind, input.runs, input.wicketKind),
    kind: input.kind,
    runs: totalRuns,
    extraRuns,
    legal,
    isWicket: input.kind === "wicket",
    wicketKind: input.wicketKind,
    strikerId: original.innings[original.currentInnings - 1].strikerId,
    bowlerId: innings.currentBowlerId,
    dismissedPlayerId: input.dismissedPlayerId,
    timestamp: Date.now(),
  };

  match.events.push(event);
  innings.eventIds.push(event.id);

  if (input.kind !== "wicket" && shouldRotate(input.kind, totalRuns)) {
    swapStrike(innings);
  }

  if (legal && innings.legalBalls % 6 === 0 && !innings.completed) {
    swapStrike(innings);
  }

  finalizeMatchState(match);
  return match;
}

function buildSummary(match: Match): MatchSummary {
  const teams = { A: match.teamA, B: match.teamB };
  const inningsOne = match.innings[0];
  const inningsTwo = match.innings[1];

  const topBatterCandidate = [match.teamA, match.teamB].flatMap((team) =>
    team.players.map((player) => ({
      name: player.name,
      runs: Math.max(match.innings[0].batsmen[player.id]?.runs ?? 0, match.innings[1].batsmen[player.id]?.runs ?? 0),
    })),
  ).sort((a, b) => b.runs - a.runs)[0];

  const topBowlerCandidate = [match.teamA, match.teamB].flatMap((team) =>
    team.players.map((player) => ({
      name: player.name,
      wickets: Math.max(match.innings[0].bowlers[player.id]?.wickets ?? 0, match.innings[1].bowlers[player.id]?.wickets ?? 0),
    })),
  ).sort((a, b) => b.wickets - a.wickets)[0];

  let result = "Match in progress";
  if (match.winnerTeamId === "tie") {
    result = `Tie at ${inningsOne.runs} runs each`;
  } else if (match.winnerTeamId) {
    const winner = teams[match.winnerTeamId].name;
    if (inningsTwo.runs > inningsOne.runs) {
      const battingTeam = teams[inningsTwo.battingTeamId];
      const wicketsLeft = Math.max(0, battingTeam.players.length - 1 - inningsTwo.wickets);
      result = `${winner} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? "" : "s"}`;
    } else {
      const margin = inningsOne.runs - inningsTwo.runs;
      result = `${winner} won by ${margin} run${margin === 1 ? "" : "s"}`;
    }
  }

  const chaseTarget = inningsOne.runs + 1;
  const highlight = match.currentInnings === 2
    ? `${teams[inningsTwo.battingTeamId].name} chased ${chaseTarget} with ${toOvers(inningsTwo.legalBalls)} overs used.`
    : `${teams[inningsOne.battingTeamId].name} posted ${inningsOne.runs}/${inningsOne.wickets} in ${toOvers(inningsOne.legalBalls)} overs.`;

  return {
    result,
    topBatter: topBatterCandidate?.runs ? topBatterCandidate : undefined,
    topBowler: topBowlerCandidate?.wickets ? topBowlerCandidate : undefined,
    highlight,
  };
}

export function finalizeMatchState(match: Match) {
  const innings = match.innings[match.currentInnings - 1];
  const inningsOne = match.innings[0];
  const inningsTwo = match.innings[1];
  const target = inningsOne.runs + 1;

  if (match.currentInnings === 2 && inningsTwo.runs >= target) {
    innings.completed = true;
    match.status = "completed";
    match.winnerTeamId = inningsTwo.battingTeamId;
  }

  if (!innings.completed && (isAllOut(match, innings) || oversDone(match, innings))) {
    innings.completed = true;
    if (match.currentInnings === 1) {
      match.currentInnings = 2;
      match.status = "innings_break";
    } else {
      match.status = "completed";
      if (inningsTwo.runs > inningsOne.runs) {
        match.winnerTeamId = inningsTwo.battingTeamId;
      } else if (inningsTwo.runs < inningsOne.runs) {
        match.winnerTeamId = inningsOne.battingTeamId;
      } else {
        match.winnerTeamId = "tie";
      }
    }
  } else if (match.currentInnings === 2) {
    match.status = "live";
  }

  match.summary = buildSummary(match);
}

export function startSecondInnings(original: Match, bowlerId: string) {
  const match = cloneMatch(original);
  match.status = "live";
  match.currentInnings = 2;
  match.innings[1].currentBowlerId = bowlerId;
  finalizeMatchState(match);
  return match;
}

export function updateCurrentPlayers(original: Match, updates: Partial<Pick<Innings, "strikerId" | "nonStrikerId" | "currentBowlerId">>) {
  const match = cloneMatch(original);
  Object.assign(match.innings[match.currentInnings - 1], updates);
  return match;
}

export function undoLastBall(original: Match) {
  const remainingEvents = original.events.slice(0, -1);
  const recreated = resetMatchFromExisting(original);

  let current = recreated;
  for (const event of remainingEvents) {
    if (current.currentInnings !== event.inningsNumber) {
      current.currentInnings = event.inningsNumber;
      current.status = "live";
    }

    current.innings[current.currentInnings - 1].currentBowlerId = event.bowlerId;
    current.innings[current.currentInnings - 1].strikerId = event.strikerId;

    current = applyBall(current, {
      kind: event.kind,
      runs: event.runs,
      wicketKind: event.wicketKind,
      dismissedPlayerId: event.dismissedPlayerId,
    });
  }

  return current;
}

export function saveMatchLocal(match: Match) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${match.id}`, JSON.stringify(match));
}

export function loadMatchLocal(matchId: string) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${matchId}`);
  return raw ? (JSON.parse(raw) as Match) : null;
}

export function listMatchesLocal() {
  if (typeof window === "undefined") return [] as Match[];
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .map((key) => window.localStorage.getItem(key))
    .filter(Boolean)
    .map((raw) => JSON.parse(raw as string) as Match)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function validateMatchInput(input: MatchCreateInput) {
  const teamAName = input.teamAName.trim();
  const teamBName = input.teamBName.trim();
  const teamAPlayers = input.teamAPlayers.map((name) => name.trim()).filter(Boolean);
  const teamBPlayers = input.teamBPlayers.map((name) => name.trim()).filter(Boolean);
  const teamADuplicates = findDuplicateNames(teamAPlayers);
  const teamBDuplicates = findDuplicateNames(teamBPlayers);
  const errors: Partial<Record<"teamAName" | "teamBName" | "teamAPlayers" | "teamBPlayers" | "oversLimit", string>> = {};

  if (!teamAName) errors.teamAName = "Enter a team name.";
  if (!teamBName) errors.teamBName = "Enter a team name.";
  if (teamAPlayers.length < MIN_PLAYERS_PER_TEAM) errors.teamAPlayers = `Add at least ${MIN_PLAYERS_PER_TEAM} players.`;
  if (teamBPlayers.length < MIN_PLAYERS_PER_TEAM) errors.teamBPlayers = `Add at least ${MIN_PLAYERS_PER_TEAM} players.`;
  if (teamADuplicates.length) errors.teamAPlayers = `Duplicate names: ${teamADuplicates.join(", ")}`;
  if (teamBDuplicates.length) errors.teamBPlayers = `Duplicate names: ${teamBDuplicates.join(", ")}`;
  if (!Number.isInteger(input.oversLimit) || input.oversLimit < 1 || input.oversLimit > MAX_OVERS) {
    errors.oversLimit = `Overs must be a whole number between 1 and ${MAX_OVERS}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      ...input,
      teamAName,
      teamBName,
      teamAPlayers,
      teamBPlayers,
      oversLimit: sanitizeOvers(input.oversLimit),
    },
  };
}

export function getTeam(match: Match, id: TeamKey) {
  return id === "A" ? match.teamA : match.teamB;
}

export function getCurrentInnings(match: Match) {
  return match.innings[match.currentInnings - 1];
}

export function getCurrentBattingTeam(match: Match) {
  return getTeam(match, getCurrentInnings(match).battingTeamId);
}

export function getCurrentBowlingTeam(match: Match) {
  return getTeam(match, getCurrentInnings(match).bowlingTeamId);
}

export function getPlayerName(match: Match, playerId: string) {
  return [...match.teamA.players, ...match.teamB.players].find((player) => player.id === playerId)?.name ?? "Unknown";
}
