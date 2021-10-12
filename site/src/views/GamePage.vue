<template>
  <div class="flex w-full">
    <div v-if="gameData.isLoading">
      LOADING!
    </div>

    <game-data-error v-else-if="gameData.error" />

    <game-not-found v-else-if="game == null" />

    <game-details
      v-else
      :game="this.game"
    />
  </div>
</template>

<script lang="ts">
import { Meta } from '@sophosoft/vue-meta-decorator'
import { Component, Inject, Prop, Vue, Watch } from 'vue-property-decorator'
import { gameDataKey } from '@/components/GameProvider.vue'
import { GameDetails, GameDataError, GameNotFound } from '@/components'
import { Game, GameData } from '@/models'
import router from '@/router'

@Component({
  components: {
    GameDetails,
    GameDataError,
    GameNotFound
  }
})
export default class GamePage extends Vue {
  @Inject(gameDataKey) readonly gameData!: GameData

  @Prop() id!: string
  @Prop() name?: string

  @Meta
  getMetaInfo () {
    const gameTitle = this.gameData.isLoading
      ? 'Game'
      : this.game?.name ?? 'Game Not Found'

    return {
      title: `${gameTitle} - Josh's Games`
    }
  }

  get parsedId (): number | undefined {
    const parsed = parseInt(this.id)
    return !isNaN(parsed) && isFinite(parsed)
      ? parsed
      : undefined
  }

  get game (): Game | undefined {
    return this.gameData.games?.find(game => game.bggId === this.parsedId)
  }

  @Watch('game')
  onGameChanged (value: Game) {
    if (!value) {
      return
    }

    if (this.name !== value.slug) {
      router.replace({ name: 'Game', params: { id: this.id, name: value.slug } })
    }
  }
}
</script>
