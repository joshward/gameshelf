<template>
  <div>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide } from 'vue-property-decorator'
import { GameData } from '@/models/game-data'
import { GameDataService } from '@/services/game-data-service'

export const gameDataKey = Symbol('gameDataKey')

@Component({})
export default class GameProvider extends Vue {
  private service: GameDataService

  @Provide(gameDataKey) gameData: GameData

  constructor () {
    super()

    this.gameData = {
      isLoading: true,
      games: [],
      error: null
    }

    this.service = new GameDataService()
  }

  created () {
    this.loadData()
  }

  private async loadData (): Promise<void> {
    Object.assign(this.gameData, await this.service.fetchGames())
  }
}
</script>
