import { Config } from "./config";
import { loadData, saveData } from "./core/data";

export interface GameDataExpansion {
  bggId: number,
  name: string,
  year: string,
}

export interface GameDataGame {
  bggId: number,
  name: string,
  version?: number;
  versionName?: string;

  image: string,
  thumbnail: string;
  minPlayers: number,
  maxPlayers: number,
  playingTime: number,
  year: string,
  designers: string[],
  publisher: string,
  categories: string[],
  mechanics: string[],
  expansions: GameDataExpansion[],
  rating: number,
  weight: number,
  description: string,

  favorite?: boolean;
  wifeFavorite?: boolean;
  new?: boolean;
}

export type GameDataList = GameDataGame[];

export const loadGameDataList = async (config: Config): Promise<GameDataList> => {
  const file = config.data.gamesFile;
  return await loadData<GameDataList>(file, { default: () => [] });
}

export const saveGameDataList = async (gameDataList: GameDataList, config: Config): Promise<void> => {
  const file = config.data.gamesFile;
  await saveData(file, gameDataList);
}
