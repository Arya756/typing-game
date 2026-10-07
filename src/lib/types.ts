export type RaceStatus = "lobby" | "countdown" | "racing" | "finished";
export type Difficulty = "easy" | "medium" | "hard";

export interface PlayerData {
  id: string;
  name: string;
  color: string;
  emoji: string;
  isHost: boolean;
  ready: boolean;
  progress: number;
  errors: number;
  wpm: number;
  accuracy: number;
  finishedAt: string | null;
  rank: number | null;
}

export interface RaceData {
  code: string;
  status: RaceStatus;
  difficulty: Difficulty;
  raceText: string;
  startAt: string | null;
  finishedAt: string | null;
  serverNow: string;
  players: PlayerData[];
}
