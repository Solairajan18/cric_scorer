import {
  BallEvent,
  BallOutcome,
  BatterStats,
  BowlerStats,
  Dismissal,
  Innings,
  Match,
  MatchAction,
  MatchCreateInput,
  MatchSummary,
  Player,
  Team,
  TeamKey,
  WicketKind,
} from "@/types/match";

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
      { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, retiredHurt: false } satisfies BatterStats,
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

function createTeam(id: TeamKey, name: string, playerNames: string[]): Team {
  return {
    id,
    name: normalizeTeamName(name),
    players: createPlayers(playerNames.filter(Boolean)),
  };
}

function createInnings(battingTeam: Team, bowlingTeam: Team, awaitingBowlerChange = false): Innings {
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
    awaitingBowlerChange,
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
    innings: [createInnings(battingFirst, bowlingFirst), createInnings(bowlingFirst, battingFirst, true)],
    events: [],
    actions: [],
    tossWinnerId: original.tossWinnerId,
    battingFirstTeamId: original.battingFirstTeamId,
  };
}

export function toOvers(legalBalls: number) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

export function isLegalDelivery(outcome: BallOutcome) {
  return outcome.type !== "wide" && outcome.type !== "no_ball" && !(outcome.type === "wicket" && outcome.wicketType === "retired_hurt");
}

export function isDismissalCreditedToBowler(outcome: BallOutcome) {
  if (outcome.type === "wicket") return outcome.wicketType !== "run_out" && outcome.wicketType !== "retired_hurt";
  if (outcome.type === "wide") return outcome.wicket && outcome.wicketType === "stumped";
  if (outcome.type === "no_ball") return false;
  return false;
}

function cloneMatch(match: Match): Match {
  return JSON.parse(JSON.stringify(match)) as Match;
}

function swapStrike(innings: Innings) {
  [innings.strikerId, innings.nonStrikerId] = [innings.nonStrikerId, innings.strikerId];
}

function oversDone(match: Match, innings: Innings) {
  return innings.legalBalls >= match.oversLimit * 6;
}

function activeBattingTeam(match: Match, innings: Innings) {
  return innings.battingTeamId === "A" ? match.teamA : match.teamB;
}

function nextAvailableBatter(match: Match, innings: Innings) {
  return activeBattingTeam(match, innings).players.find((player) => {
    const stats = innings.batsmen[player.id];
    return !stats.out && !stats.retiredHurt && player.id !== innings.strikerId && player.id !== innings.nonStrikerId;
  });
}

function isAllOut(match: Match, innings: Innings) {
  const batting = activeBattingTeam(match, innings);
  return innings.wickets >= Math.max(0, batting.players.length - 1);
}

function totalRunsForOutcome(outcome: BallOutcome) {
  switch (outcome.type) {
    case "run":
      return outcome.runs;
    case "wide":
      return outcome.totalExtras;
    case "no_ball":
      return outcome.batRuns + outcome.extraRuns;
    case "bye":
    case "leg_bye":
      return outcome.runs;
    case "wicket":
      return outcome.runsCompleted ?? 0;
  }
}

function batterRunsForOutcome(outcome: BallOutcome) {
  switch (outcome.type) {
    case "run":
      return outcome.runs;
    case "no_ball":
      return outcome.batRuns;
    default:
      return 0;
  }
}

function extrasForOutcome(outcome: BallOutcome) {
  switch (outcome.type) {
    case "wide":
      return outcome.totalExtras;
    case "no_ball":
      return outcome.extraRuns;
    case "bye":
    case "leg_bye":
      return outcome.runs;
    default:
      return 0;
  }
}

function outcomeKind(outcome: BallOutcome) {
  switch (outcome.type) {
    case "run":
      return "run" as const;
    case "wide":
      return "wide" as const;
    case "no_ball":
      return "no_ball" as const;
    case "bye":
      return "bye" as const;
    case "leg_bye":
      return "leg_bye" as const;
    case "wicket":
      return "wicket" as const;
  }
}

function dismissalFromOutcome(outcome: BallOutcome): Dismissal | undefined {
  if (outcome.type === "wicket") {
    return {
      playerId: outcome.dismissedPlayerId,
      type: outcome.wicketType,
      creditedToBowler: isDismissalCreditedToBowler(outcome),
      onIllegalDelivery: false,
    };
  }

  if ((outcome.type === "wide" || outcome.type === "no_ball") && outcome.wicket && outcome.dismissedPlayerId && outcome.wicketType) {
    return {
      playerId: outcome.dismissedPlayerId,
      type: outcome.wicketType,
      creditedToBowler: isDismissalCreditedToBowler(outcome),
      onIllegalDelivery: true,
    };
  }

  return undefined;
}

function labelForOutcome(outcome: BallOutcome) {
  switch (outcome.type) {
    case "run":
      return `${outcome.runs}`;
    case "wide":
      return outcome.totalExtras > 1 ? `Wd+${outcome.totalExtras - 1}` : "Wd";
    case "no_ball":
      return outcome.batRuns ? `Nb+${outcome.batRuns}` : "Nb";
    case "bye":
      return `B${outcome.runs}`;
    case "leg_bye":
      return `LB${outcome.runs}`;
    case "wicket":
      return `W-${outcome.wicketType.replace("_", " ")}`;
  }
}

function shouldRotateStrike(outcome: BallOutcome) {
  return totalRunsForOutcome(outcome) % 2 === 1;
}

function bowlingRunsCharged(outcome: BallOutcome) {
  switch (outcome.type) {
    case "run":
    case "wide":
    case "no_ball":
      return totalRunsForOutcome(outcome);
    case "bye":
    case "leg_bye":
      return 0;
    case "wicket":
      return outcome.runsCompleted ?? 0;
  }
}

function validateOutcome(outcome: BallOutcome) {
  if (outcome.type === "wide") {
    if (outcome.totalExtras < 1) throw new Error("Wide must add at least one run.");
    if (outcome.wicket && !outcome.wicketType) throw new Error("Choose a wicket type for the wide.");
    if (outcome.wicketType && !["run_out", "stumped"].includes(outcome.wicketType)) throw new Error("Only run out or stumped can happen on a wide.");
    if (outcome.wicket && !outcome.dismissedPlayerId) throw new Error("Choose the dismissed batter.");
  }

  if (outcome.type === "no_ball") {
    if (outcome.extraRuns < 1) throw new Error("No ball must include the automatic extra run.");
    if (outcome.wicket && outcome.wicketType !== "run_out") throw new Error("Only run out is allowed on a no ball.");
    if (outcome.wicket && !outcome.dismissedPlayerId) throw new Error("Choose the dismissed batter.");
  }

  if (outcome.type === "wicket" && !outcome.dismissedPlayerId) {
    throw new Error("Choose the dismissed batter.");
  }
}

function applyDismissal(match: Match, innings: Innings, dismissal: Dismissal) {
  const dismissed = innings.batsmen[dismissal.playerId];
  if (!dismissed) return;

  if (dismissal.type === "retired_hurt") {
    dismissed.retiredHurt = true;
  } else {
    dismissed.out = true;
    innings.wickets += 1;
  }

  if (dismissal.creditedToBowler) {
    innings.bowlers[innings.currentBowlerId].wickets += 1;
  }

  if (dismissal.playerId === innings.strikerId) {
    innings.strikerId = nextAvailableBatter(match, innings)?.id ?? innings.strikerId;
  } else if (dismissal.playerId === innings.nonStrikerId) {
    innings.nonStrikerId = nextAvailableBatter(match, innings)?.id ?? innings.nonStrikerId;
  }
}

function applyBallToState(match: Match, outcome: BallOutcome) {
  validateOutcome(outcome);
  const innings = match.innings[match.currentInnings - 1];
  if (innings.completed || match.status === "completed") return match;
  if (innings.awaitingBowlerChange) throw new Error("Choose the next bowler before scoring again.");

  const legal = isLegalDelivery(outcome);
  const batterRuns = batterRunsForOutcome(outcome);
  const extraRuns = extrasForOutcome(outcome);
  const totalRuns = totalRunsForOutcome(outcome);
  const strikerBefore = innings.strikerId;
  const legalBefore = innings.legalBalls;
  const dismissal = dismissalFromOutcome(outcome);

  innings.runs += totalRuns;
  innings.extras += extraRuns;
  if (legal) innings.legalBalls += 1;

  const batter = innings.batsmen[strikerBefore];
  if (batter) {
    batter.runs += batterRuns;
    if (legal) batter.balls += 1;
    if (batterRuns === 4) batter.fours += 1;
    if (batterRuns === 6) batter.sixes += 1;
  }

  const bowler = innings.bowlers[innings.currentBowlerId];
  if (bowler) {
    if (legal) bowler.balls += 1;
    bowler.runs += bowlingRunsCharged(outcome);
    if (outcome.type === "wide") bowler.wides += outcome.totalExtras;
    if (outcome.type === "no_ball") bowler.noBalls += outcome.extraRuns;
  }

  if (dismissal) {
    applyDismissal(match, innings, dismissal);
  }

  if (shouldRotateStrike(outcome) && dismissal?.type !== "retired_hurt") {
    swapStrike(innings);
  }

  const completedOver = legal && innings.legalBalls > 0 && innings.legalBalls % 6 === 0;
  if (completedOver && !innings.completed) {
    swapStrike(innings);
  }

  const event: BallEvent = {
    id: makeId("event"),
    inningsNumber: match.currentInnings,
    overNumber: Math.floor(legalBefore / 6) + 1,
    ballInOver: legal ? (legalBefore % 6) + 1 : legalBefore % 6,
    displaySequence: labelForOutcome(outcome),
    kind: outcomeKind(outcome),
    legal,
    totalRuns,
    batterRuns,
    extraRuns,
    strikerId: strikerBefore,
    bowlerId: innings.currentBowlerId,
    dismissal,
    outcome,
    timestamp: Date.now(),
  };

  match.events.push(event);
  innings.eventIds.push(event.id);

  if (!innings.completed && completedOver) {
    innings.awaitingBowlerChange = true;
  }

  finalizeMatchState(match);
  return match;
}

function startSecondInningsInternal(match: Match, bowlerId: string) {
  match.status = "live";
  match.currentInnings = 2;
  const innings = match.innings[1];
  innings.currentBowlerId = bowlerId;
  innings.awaitingBowlerChange = false;
  finalizeMatchState(match);
  return match;
}

function setBowlerInternal(match: Match, bowlerId: string) {
  const innings = match.innings[match.currentInnings - 1];
  innings.currentBowlerId = bowlerId;
  innings.awaitingBowlerChange = false;
  return match;
}

function swapPlayerInternal(match: Match, slot: "striker" | "nonStriker", incomingPlayerId: string) {
  const innings = match.innings[match.currentInnings - 1];
  const stats = innings.batsmen[incomingPlayerId];
  if (!stats || stats.out || stats.retiredHurt) return match;
  innings[slot === "striker" ? "strikerId" : "nonStrikerId"] = incomingPlayerId;
  return match;
}

function retireHurtInternal(match: Match, playerId: string, replacementPlayerId: string) {
  const innings = match.innings[match.currentInnings - 1];
  const stats = innings.batsmen[playerId];
  const replacementStats = innings.batsmen[replacementPlayerId];
  if (!stats || !replacementStats || replacementStats.out || replacementStats.retiredHurt) return match;

  stats.retiredHurt = true;
  if (innings.strikerId === playerId) innings.strikerId = replacementPlayerId;
  if (innings.nonStrikerId === playerId) innings.nonStrikerId = replacementPlayerId;
  return match;
}

function reduceAction(match: Match, action: MatchAction) {
  switch (action.type) {
    case "ball":
      return applyBallToState(match, action.outcome);
    case "set_bowler":
      return setBowlerInternal(match, action.bowlerId);
    case "swap_player":
      return swapPlayerInternal(match, action.slot, action.incomingPlayerId);
    case "retire_hurt":
      return retireHurtInternal(match, action.playerId, action.replacementPlayerId);
    case "start_second_innings":
      return startSecondInningsInternal(match, action.bowlerId);
  }
}

function buildSummary(match: Match): MatchSummary {
  const teams = { A: match.teamA, B: match.teamB };
  const inningsOne = match.innings[0];
  const inningsTwo = match.innings[1];

  const topBatterCandidate = [match.teamA, match.teamB]
    .flatMap((team) =>
      team.players.map((player) => ({
        name: player.name,
        runs: Math.max(match.innings[0].batsmen[player.id]?.runs ?? 0, match.innings[1].batsmen[player.id]?.runs ?? 0),
      })),
    )
    .sort((a, b) => b.runs - a.runs)[0];

  const topBowlerCandidate = [match.teamA, match.teamB]
    .flatMap((team) =>
      team.players.map((player) => ({
        name: player.name,
        wickets: Math.max(match.innings[0].bowlers[player.id]?.wickets ?? 0, match.innings[1].bowlers[player.id]?.wickets ?? 0),
      })),
    )
    .sort((a, b) => b.wickets - a.wickets)[0];

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
    ? `${teams[inningsTwo.battingTeamId].name} need ${Math.max(0, chaseTarget - inningsTwo.runs)} from ${toOvers(Math.max(0, match.oversLimit * 6 - inningsTwo.legalBalls))} overs remaining.`
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
    innings.awaitingBowlerChange = false;
    match.status = "completed";
    match.winnerTeamId = inningsTwo.battingTeamId;
  }

  if (!innings.completed && (isAllOut(match, innings) || oversDone(match, innings))) {
    innings.completed = true;
    innings.awaitingBowlerChange = false;
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
  } else if (match.currentInnings === 2 && match.status !== "completed") {
    match.status = "live";
  }

  match.summary = buildSummary(match);
}

export function createMatch(input: MatchCreateInput): Match {
  const teamA = createTeam("A", input.teamAName, input.teamAPlayers);
  const teamB = createTeam("B", input.teamBName, input.teamBPlayers);
  const battingFirst = input.battingFirstTeamId === "A" ? teamA : teamB;
  const bowlingFirst = input.battingFirstTeamId === "A" ? teamB : teamA;

  const match: Match = {
    id: makeId("match"),
    createdAt: Date.now(),
    status: "live",
    oversLimit: sanitizeOvers(input.oversLimit),
    teamA,
    teamB,
    currentInnings: 1,
    innings: [createInnings(battingFirst, bowlingFirst), createInnings(bowlingFirst, battingFirst, true)],
    events: [],
    actions: [],
    tossWinnerId: input.tossWinnerId,
    battingFirstTeamId: input.battingFirstTeamId,
  };

  finalizeMatchState(match);
  return match;
}

function replayMatch(original: Match, actions: MatchAction[]) {
  const recreated = resetMatchFromExisting(original);
  let current = recreated;

  for (const action of actions) {
    current.actions.push(action);
    current = reduceAction(current, action);
  }

  finalizeMatchState(current);
  return current;
}

export function applyMatchAction(original: Match, action: MatchAction) {
  return replayMatch(original, [...original.actions, action]);
}

export function applyBall(original: Match, outcome: BallOutcome) {
  return applyMatchAction(original, { type: "ball", outcome });
}

export function setCurrentBowler(original: Match, bowlerId: string) {
  return applyMatchAction(original, { type: "set_bowler", bowlerId });
}

export function swapCurrentPlayer(original: Match, slot: "striker" | "nonStriker", incomingPlayerId: string) {
  return applyMatchAction(original, { type: "swap_player", slot, incomingPlayerId });
}

export function retireHurtPlayer(original: Match, playerId: string, replacementPlayerId: string) {
  return applyMatchAction(original, { type: "retire_hurt", playerId, replacementPlayerId });
}

export function startSecondInnings(original: Match, bowlerId: string) {
  return applyMatchAction(original, { type: "start_second_innings", bowlerId });
}

export function undoLastAction(original: Match) {
  return replayMatch(original, original.actions.slice(0, -1));
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

export function getEligibleIncomingBatters(match: Match) {
  const innings = getCurrentInnings(match);
  return activeBattingTeam(match, innings).players.filter((player) => {
    const stats = innings.batsmen[player.id];
    return !stats.out && !stats.retiredHurt && player.id !== innings.strikerId && player.id !== innings.nonStrikerId;
  });
}

export function getLastActionLabel(match: Match) {
  const lastEvent = match.events.at(-1);
  if (lastEvent) return `Last: ${lastEvent.displaySequence}`;
  const lastAction = match.actions.at(-1);
  if (!lastAction) return "No actions yet";
  if (lastAction.type === "set_bowler") return "Last: bowler changed";
  if (lastAction.type === "retire_hurt") return "Last: retired hurt";
  if (lastAction.type === "swap_player") return "Last: player swapped";
  if (lastAction.type === "start_second_innings") return "Last: chase started";
  return "No actions yet";
}
export function getExtrasBreakdown(events: BallEvent[]) {
  return events.reduce(
    (acc, event) => {
      if (event.kind === "wide") acc.w += event.extraRuns;
      if (event.kind === "no_ball") acc.nb += event.extraRuns;
      if (event.kind === "bye") acc.b += event.extraRuns;
      if (event.kind === "leg_bye") acc.lb += event.extraRuns;
      return acc;
    },
    { b: 0, lb: 0, w: 0, nb: 0, p: 0 },
  );
}

export function getFallOfWickets(match: Match, inningsIndex: number) {
  const innings = match.innings[inningsIndex];
  const fows: { playerName: string; score: number; overs: string }[] = [];
  let currentRuns = 0;
  let currentBalls = 0;

  match.events
    .filter((e) => e.inningsNumber === inningsIndex + 1)
    .forEach((event) => {
      currentRuns += event.totalRuns;
      if (event.legal) currentBalls++;
      if (event.dismissal && event.dismissal.type !== "retired_hurt") {
        fows.push({
          playerName: getPlayerName(match, event.dismissal.playerId),
          score: currentRuns,
          overs: toOvers(currentBalls),
        });
      }
    });

  return fows;
}

export function getPartnerships(match: Match, inningsIndex: number) {
  const innings = match.innings[inningsIndex];
  const battingTeam = getTeam(match, innings.battingTeamId);
  const partnerships: { batter1: string; batter1Runs: number; batter1Balls: number; batter2: string; batter2Runs: number; batter2Balls: number; totalRuns: number; totalBalls: number }[] = [];
  
  let pRuns = 0;
  let pBalls = 0;
  let b1Id = battingTeam.players[0]?.id;
  let b2Id = battingTeam.players[1]?.id;
  let b1Runs = 0;
  let b1Balls = 0;
  let b2Runs = 0;
  let b2Balls = 0;

  match.events
    .filter((e) => e.inningsNumber === inningsIndex + 1)
    .forEach((event) => {
      pRuns += event.totalRuns;
      if (event.legal) pBalls++;

      if (event.strikerId === b1Id) {
        b1Runs += event.batterRuns;
        if (event.legal) b1Balls++;
      } else if (event.strikerId === b2Id) {
        b2Runs += event.batterRuns;
        if (event.legal) b2Balls++;
      }

      if (event.dismissal && event.dismissal.type !== "retired_hurt") {
        partnerships.push({
          batter1: getPlayerName(match, b1Id),
          batter1Runs: b1Runs,
          batter1Balls: b1Balls,
          batter2: getPlayerName(match, b2Id),
          batter2Runs: b2Runs,
          batter2Balls: b2Balls,
          totalRuns: pRuns,
          totalBalls: pBalls,
        });
        
        // Reset for next partnership
        const dismissedId = event.dismissal.playerId;
        const nextBatter = battingTeam.players.find(p => {
          // Find someone who hasn't batted and isn't the one currently in
          const isCurrentlyIn = (p.id === b1Id || p.id === b2Id) && p.id !== dismissedId;
          const hasBatted = partnerships.some(ptr => ptr.batter1 === p.name || ptr.batter2 === p.name);
          return !isCurrentlyIn && !hasBatted && p.id !== dismissedId;
        });

        if (dismissedId === b1Id) {
          b1Id = nextBatter?.id || "";
          b1Runs = 0;
          b1Balls = 0;
        } else {
          b2Id = nextBatter?.id || "";
          b2Runs = 0;
          b2Balls = 0;
        }
        pRuns = 0;
        pBalls = 0;
      }
    });

  // Add current partnership if innings not over
  if (pBalls > 0 || pRuns > 0) {
      partnerships.push({
          batter1: getPlayerName(match, b1Id),
          batter1Runs: b1Runs,
          batter1Balls: b1Balls,
          batter2: getPlayerName(match, b2Id),
          batter2Runs: b2Runs,
          batter2Balls: b2Balls,
          totalRuns: pRuns,
          totalBalls: pBalls,
      });
  }

  return partnerships;
}

export function getYetToBat(match: Match, inningsIndex: number) {
    const innings = match.innings[inningsIndex];
    const battingTeam = getTeam(match, innings.battingTeamId);
    
    return battingTeam.players.filter(player => {
        const stats = innings.batsmen[player.id];
        const hasBatted = stats && (stats.balls > 0 || stats.out || stats.retiredHurt);
        const isCurrentlyIn = player.id === innings.strikerId || player.id === innings.nonStrikerId;
        return !hasBatted && !isCurrentlyIn;
    });
}

export function getBowlerStatsWithMaidens(match: Match, inningsIndex: number) {
    const innings = match.innings[inningsIndex];
    const events = match.events.filter(e => e.inningsNumber === inningsIndex + 1);
    
    const bowlerStats: Record<string, { overs: string; maidens: number; runs: number; wickets: number; nb: number; wd: number; eco: string }> = {};

    Object.keys(innings.bowlers).forEach(bowlerId => {
        const stats = innings.bowlers[bowlerId];
        const bowlerEvents = events.filter(e => e.bowlerId === bowlerId);
        
        // Group by over number
        const oversMap: Record<number, BallEvent[]> = {};
        bowlerEvents.forEach(e => {
            if (!oversMap[e.overNumber]) oversMap[e.overNumber] = [];
            oversMap[e.overNumber].push(e);
        });

        let maidens = 0;
        Object.values(oversMap).forEach(overEvents => {
            const legalBallsInOver = overEvents.filter(e => e.legal).length;
            const runsInOver = overEvents.reduce((sum, e) => sum + e.totalRuns, 0);
            if (legalBallsInOver === 6 && runsInOver === 0) {
                maidens++;
            }
        });

        const eco = stats.balls > 0 ? ((stats.runs * 6) / stats.balls).toFixed(2) : "0.00";

        bowlerStats[bowlerId] = {
            overs: toOvers(stats.balls),
            maidens,
            runs: stats.runs,
            wickets: stats.wickets,
            nb: stats.noBalls,
            wd: stats.wides,
            eco
        };
    });

    return bowlerStats;
}
