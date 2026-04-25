export type TeamKey = "A" | "B";
export type MatchStatus = "live" | "innings_break" | "completed";
export type WicketKind = "bowled" | "caught" | "run_out" | "lbw" | "stumped" | "retired";
export type EventKind = "run" | "wicket" | "wide" | "no_ball" | "bye" | "leg_bye";

export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: TeamKey;
  name: string;
  players: Player[];
};

export type BatterStats = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
};

export type BowlerStats = {
  balls: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
};

export type Innings = {
  battingTeamId: TeamKey;
  bowlingTeamId: TeamKey;
  runs: number;
  wickets: number;
  legalBalls: number;
  extras: number;
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  batsmen: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  eventIds: string[];
  completed: boolean;
};

export type BallEvent = {
  id: string;
  inningsNumber: 1 | 2;
  over: number;
  ballInOver: number;
  label: string;
  kind: EventKind;
  runs: number;
  extraRuns: number;
  legal: boolean;
  isWicket: boolean;
  wicketKind?: WicketKind;
  strikerId: string;
  bowlerId: string;
  dismissedPlayerId?: string;
  timestamp: number;
};

export type MatchSummary = {
  result: string;
  topBatter?: { name: string; runs: number };
  topBowler?: { name: string; wickets: number };
  highlight: string;
};

export type Match = {
  id: string;
  createdAt: number;
  status: MatchStatus;
  oversLimit: number;
  teamA: Team;
  teamB: Team;
  currentInnings: 1 | 2;
  innings: [Innings, Innings];
  events: BallEvent[];
  tossWinnerId: TeamKey;
  battingFirstTeamId: TeamKey;
  winnerTeamId?: TeamKey | "tie";
  summary?: MatchSummary;
};

export type MatchCreateInput = {
  teamAName: string;
  teamBName: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  oversLimit: number;
  tossWinnerId: TeamKey;
  battingFirstTeamId: TeamKey;
};
