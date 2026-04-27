export type TeamKey = "A" | "B";
export type MatchStatus = "live" | "innings_break" | "completed";
export type WicketKind = "bowled" | "caught" | "run_out" | "lbw" | "stumped" | "hit_wicket" | "retired_hurt" | "retired_out";
export type EventKind = "run" | "wicket" | "wide" | "no_ball" | "bye" | "leg_bye" | "overthrow";
export type MatchRules = {
  wideRuns: number;
  noBallRuns: number;
  maxOversPerBowler?: number;
};


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
  retiredHurt: boolean;
  retiredOut?: boolean;
};

export type BowlerStats = {
  balls: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
};

export type Dismissal = {
  playerId: string;
  type: WicketKind;
  creditedToBowler: boolean;
  onIllegalDelivery: boolean;
  fielderId?: string;
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
  wicketkeeperId?: string;
  awaitingBowlerChange: boolean;
  batsmen: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  eventIds: string[];
  completed: boolean;
};

export type BallOutcome =
  | { type: "run"; runs: 0 | 1 | 2 | 3 | 4 | 5 | 6; isOverthrow?: boolean }
  | { type: "wide"; totalExtras: number; wicket: boolean; wicketType?: "run_out" | "stumped"; dismissedPlayerId?: string; nextStrikerId?: string }
  | { type: "no_ball"; batRuns: 0 | 1 | 2 | 3 | 4 | 5 | 6; extraRuns: number; wicket: boolean; wicketType?: "run_out"; dismissedPlayerId?: string; nextStrikerId?: string }
  | { type: "bye"; runs: 1 | 2 | 3 | 4 | 5 }
  | { type: "leg_bye"; runs: 1 | 2 | 3 | 4 | 5 }
  | { type: "wicket"; wicketType: WicketKind; runsCompleted?: 0 | 1 | 2 | 3 | 4 | 5; dismissedPlayerId: string; fielderId?: string; nextStrikerId?: string };

export type BallEvent = {
  id: string;
  inningsNumber: 1 | 2;
  overNumber: number;
  ballInOver: number;
  displaySequence: string;
  kind: EventKind;
  legal: boolean;
  totalRuns: number;
  batterRuns: number;
  extraRuns: number;
  strikerId: string;
  bowlerId: string;
  dismissal?: Dismissal;
  outcome: BallOutcome;
  timestamp: number;
};

export type MatchAction =
  | { type: "ball"; outcome: BallOutcome }
  | { type: "set_bowler"; bowlerId: string }
  | { type: "set_keeper"; fielderId: string }
  | { type: "update_rules"; rules: Partial<MatchRules>; oversLimit?: number }
  | { type: "swap_player"; slot: "striker" | "nonStriker"; incomingPlayerId: string }
  | { type: "retire_hurt"; playerId: string; replacementPlayerId: string }
  | { type: "start_second_innings"; bowlerId: string };

export type MatchSummary = {
  result?: string;
  topBatter?: { id: string; name: string; runs: number };
  topBowler?: { id: string; name: string; wickets: number; runs: number };
  highlight?: string;
  completedAt?: string;
  awards?: {
    potm?: string;
    bestBatter?: string;
    bestBowler?: string;
    bestFielder?: string;
  };
};


export type Match = {
  id: string;

  userId?: string;
  createdAt: number;

  status: MatchStatus;
  oversLimit: number;
  teamA: Team;
  teamB: Team;
  currentInnings: 1 | 2;
  innings: [Innings, Innings];
  events: BallEvent[];
  actions: MatchAction[];
  tossWinnerId: TeamKey;
  battingFirstTeamId: TeamKey;
  winnerTeamId?: TeamKey | "tie";
  summary?: MatchSummary;
  rules: MatchRules;
};



export type MatchCreateInput = {
  userId?: string;
  teamAName: string;

  teamBName: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  oversLimit: number;
  tossWinnerId: TeamKey;
  battingFirstTeamId: TeamKey;
  rules: MatchRules;
};
