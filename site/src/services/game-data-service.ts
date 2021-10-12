import { plainToClass } from 'class-transformer'
import { GameData } from '@/models/game-data'
import { Game } from '@/models/game'

export class GameDataService {
  private readonly publicPath = process.env.BASE_URL
  private cachedData: GameData | null = null

  async fetchGames (): Promise<GameData> {
    if (this.cachedData) {
      return this.cachedData
    }

    this.cachedData = await this.loadGames()
    return this.cachedData
  }

  private async loadGames (): Promise<GameData> {
    try {
      const hash = await import('../assets/hash.json')
      const response = await fetch(`/games.json?${hash.games}`)
      const data = await response.json() as []
      const games = plainToClass(Game, data)
      return {
        games,
        isLoading: false
      }
    } catch {
      return {
        isLoading: false,
        games: [],
        error: 'Failed to load game data'
      }
    }
  }
}
