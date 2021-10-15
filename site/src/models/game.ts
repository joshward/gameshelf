export class Game {
  bggId!: number;
  name!: string;
  subTitle!: string;
  editionTitle!: string;
  minPlayers!: number;
  maxPlayers!: number;
  playingTime!: number;
  year!: string;
  designers!: string[];
  publisher!: string;
  categories!: string[];
  mechanics!: string[];
  rating!: number;
  weight!: number;
  description!: string;
  tags!: string[];
  image!: string;
  thumbnail!: string;
  thumbHeight!: number;
  thumbWidth!: number;
  blurhash!: string;
  expansions!: GameExpansion[];
  slug!: string;
  new!: boolean;
  sale?: string;

  get forSale (): boolean {
    return this.sale !== undefined && this.sale !== ''
  }
}

export class GameExpansion {
  bggId!: number;
  name!: string;
  year!: string;
}
