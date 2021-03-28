export class Game {
  bggId!: number;
  name!: string;
  image!: string;
  thumbnail!: string;
  minPlayers!: number;
  maxPlayers!: number;
  playingTime!: number;
  year!: string;
  designers!: string[];
  publisher!: string;
  categories!: string[];
  mechanics!: string[];
  expansions!: GameExpansion[];
  rating!: number;
  weight!: number;
  description!: string;
  favorite?: boolean;
  new?: boolean;
  wifeFavorite?: boolean;
}

export class GameExpansion {
  bggId!: number;
  name!: string;
  year!: string;
}
