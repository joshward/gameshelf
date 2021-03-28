import { Game } from "./game";

export interface GameData {
  games: Game[];
  isLoading: boolean;
  error?: string | null;
}
