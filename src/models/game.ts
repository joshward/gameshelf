import { toSlug } from '@/helpers'

const namePattern = /^\s*(?<main>.*?)\s*(?::\s*(?<sub>.*?))?\s*(?:\((?<note>.*)\)|\s(?<edition>\w+\s+Edition))?\s*$/i

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

  // TODO Do this work in the back end?
  private _primaryName?: string
  private _subName?: string
  private _noteName?: string
  private _slug?: string

  get primaryName (): string {
    this.breakupName()
    return this._primaryName ?? this.name
  }

  get subName (): string | undefined {
    this.breakupName()
    return this._subName
  }

  get noteName (): string | undefined {
    this.breakupName()
    return this._noteName
  }

  get slug (): string {
    let slug = this._slug

    if (!slug) {
      this._slug = slug = toSlug(this.name)
    }

    return slug
  }

  private breakupName (): void {
    if (this._primaryName) {
      return
    }

    const match = this.name.match(namePattern)
    if (!match) {
      return
    }

    const groups = match.groups
    this._primaryName = groups?.main
    this._subName = groups?.sub
    this._noteName = groups?.note ?? groups?.edition
  }
}

export class GameExpansion {
  bggId!: number;
  name!: string;
  year!: string;
}
