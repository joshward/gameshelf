import Fuse from 'fuse.js'
import { Config } from './config'
import { loadData, saveData } from './core/data'
import { hash } from './core/hash'
import { sliceTopGroup, toSlug } from './core/utils'

interface GameExtendedData {
  bggId: number;
  versionId?: number;

  addedDate: number;
}

export interface GameListExpansion {
  bggId: number;

  name: string;
  year: string;
}

interface BaseGameData {
  bggId: number;

  name: string;
  subTitle: string;
  editionTitle: string;

  thumbnail: string;
  thumbHeight: number;
  thumbWidth: number;
  blurhash: string;

  slug: string;

  tags: string[];
  new: boolean;
}

interface GameListData {
  name: string;
  subTitle: string;
  editionTitle: string;

  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  year: string;
  designers: string[];
  publisher: string;
  categories: string[];
  mechanics: string[];
  rating: number;
  weight: number;
  description: string;

  tags: string[];

  image: string;
  thumbnail: string;
  thumbHeight: number;
  thumbWidth: number;
  blurhash: string;

  expansions: GameListExpansion[];

  sale?: string;
}

interface GameListGame extends GameListData, BaseGameData {}

export interface GameProcessingData extends GameListData, GameExtendedData {}

export class GameList {
  private readonly games: Map<number, GameListGame>
  private readonly extendedData: Map<number, GameExtendedData>
  private readonly dataFile: string
  private readonly extendedDataFile: string
  private readonly hashFile: string
  private readonly initFile: string
  private readonly newCount: number
  private readonly initCount: number
  private readonly searchIndex: Fuse<BaseGameData>

  private constructor (
    games: GameListGame[],
    extendedData: GameExtendedData[],
    searchIndex: Fuse<BaseGameData>,
    config: Config
  ) {
    this.games = new Map(games.map(game => [game.bggId, game]))
    this.extendedData = new Map(extendedData.map(data => [data.bggId, data]))

    const configData = config.data
    this.dataFile = configData.gamesFile
    this.hashFile = configData.hashFile
    this.initFile = configData.initFile
    this.newCount = configData.newCount
    this.initCount = configData.initCount

    this.extendedDataFile = config.extended.extendedFile

    this.searchIndex = searchIndex
  }

  public static async LoadGameList (config: Config): Promise<GameList> {
    const dataFile = config.data.gamesFile
    const data = await loadData<GameListGame[]>(dataFile, { default: () => [] })

    const extendedDataFile = config.extended.extendedFile
    const extendedData = await loadData<GameExtendedData[]>(extendedDataFile, { default: () => [] })

    const searchIndex = this.buildSearchIndex(data)

    return new GameList(data, extendedData, searchIndex, config)
  }

  public hasGame (bggId: number): boolean {
    return this.games.has(bggId)
  }

  public async insertGame (game: GameProcessingData): Promise<void> {
    const gameData = this.convert(game)
    this.games.set(game.bggId, gameData)

    const extendedData = this.getExtendedData(game)
    this.extendedData.set(game.bggId, extendedData)

    this.searchIndex.add(gameData)
    await this.save()
  }

  public async removeGame (bggId: number): Promise<void> {
    const deleted = this.games.delete(bggId)
    if (!deleted) {
      return
    }

    this.searchIndex.remove(doc => doc.bggId === bggId)
    await this.save()
  }

  private async save (): Promise<void> {
    this.updateGeneratedFields()

    const gameData = [...this.games.values()].sort((a, b) => a.bggId - b.bggId)
    await saveData(this.dataFile, gameData)

    const extendedData = [...this.extendedData.values()].sort((a, b) => a.bggId - b.bggId)
    await saveData(this.extendedDataFile, extendedData)

    const gameDataHash = hash(gameData)
    await saveData(this.hashFile, { games: gameDataHash })

    const baseGameData = this.createBaseGameData(gameData)
    await saveData(this.initFile, baseGameData)
  }

  public search (value: string): GameProcessingData[] {
    const matches = this.searchIndex.search(value)

    return matches.map(match => this.buildGameProcessingData(match.item.bggId))
  }

  public getGame (bggId: number): GameProcessingData {
    return this.buildGameProcessingData(bggId)
  }

  public getAllGameIds (): number[] {
    return [...this.games.keys()]
  }

  private static buildSearchIndex (games: BaseGameData[]): Fuse<BaseGameData> {

    const indexOptions: Fuse.FuseOptionKey[] = [
      {
        name: 'name',
        weight: 2
      },
      {
        name: 'subTitle',
        weight: 1
      },
      {
        name: 'editionTitle',
        weight: 1
      }
    ]

    const index = Fuse.createIndex(indexOptions, games)

    const searchIndex = new Fuse(
      games,
      {
        isCaseSensitive: false,
        includeScore: true,
        includeMatches: true,
        threshold: 0.4
      },
      index)

    return searchIndex
  }

  private buildGameProcessingData(bggId: number): GameProcessingData {
    const game = this.games.get(bggId)
    const extendedData = this.extendedData.get(bggId)

    if (!game || !extendedData) {
      throw new Error(`Missing Expected game data in game list ${bggId}`)
    }

    return {
      ...game,
      ...extendedData,
    }
  }

  private convert (game: GameProcessingData): GameListGame {
    return {
      bggId: game.bggId,
      categories: game.categories,
      description: game.description,
      designers: game.designers,
      editionTitle: game.editionTitle,
      maxPlayers: game.maxPlayers,
      mechanics: game.mechanics,
      minPlayers: game.minPlayers,
      name: game.name,
      playingTime: game.playingTime,
      publisher: game.publisher,
      rating: game.rating,
      subTitle: game.subTitle,
      tags: game.tags,
      weight: game.weight,
      year: game.year,
      expansions: game.expansions,
      image: game.image,
      thumbnail: game.thumbnail,
      thumbHeight: game.thumbHeight,
      thumbWidth: game.thumbWidth,
      blurhash: game.blurhash,
      sale: game.sale,

      slug: toSlug(game.name),
      new: false,
    }
  }

  private getExtendedData (game: GameProcessingData): GameExtendedData {
    return {
      bggId: game.bggId,
      addedDate: game.addedDate,
      versionId: game.versionId,
    }
  }

  private createBaseGameData (games: GameListGame[]): { count: number, sale: boolean, games: BaseGameData[] } {
    return {
      count: games.length,
      sale: games.some(game => game.sale ? true : false),
      games: [...games].sort((a, b) => a.name.localeCompare(b.name)).slice(0, this.initCount).map(game => ({
        bggId: game.bggId,
        name: game.name,
        subTitle: game.subTitle,
        editionTitle: game.editionTitle,
        new: game.new,
        tags: game.tags,
        slug: game.slug,
        blurhash: game.blurhash,
        thumbHeight: game.thumbHeight,
        thumbWidth: game.thumbWidth,
        thumbnail: game.thumbnail,
      }))
    }
  }

  private updateGeneratedFields (): void {
    const games = [...this.games.values()]

    const newGames = this.computeNewGames()

    for (const game of games) {
      game.new = newGames.has(game.bggId)
    }
  }

  private computeNewGames(): Set<number> {
    const slice = sliceTopGroup(
      [...this.extendedData.values()].filter(game => game.addedDate > 0),
      this.newCount,
      (a, b) => b.addedDate - a.addedDate
    )
    return new Set(slice.map(game => game.bggId))
  }
}

