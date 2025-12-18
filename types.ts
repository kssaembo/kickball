
export type Team = 'HOME' | 'AWAY';

export interface GameState {
  inning: number;
  isBottom: boolean; // false = Top (Away attacks), true = Bottom (Home attacks)
  homeScore: number;
  awayScore: number;
  homeName: string;
  awayName: string;
  balls: number;
  strikes: number;
  outs: number;
  fouls: number;
}

export const INITIAL_STATE: GameState = {
  inning: 1,
  isBottom: false,
  homeScore: 0,
  awayScore: 0,
  homeName: 'HOME',
  awayName: 'AWAY',
  balls: 0,
  strikes: 0,
  outs: 0,
  fouls: 0,
};

export const MAX_BALLS = 4;
export const MAX_STRIKES = 3;
export const MAX_OUTS = 3;
export const MAX_FOULS = 3;
