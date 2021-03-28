<template>
  <div class="home">
    <div v-if="gameData.isLoading">
      LOADING!
    </div>
    <div
      v-else
      class="
        grid
        grid-cols-cards
        gap-3
        "
    >
      <GameCard
        v-for="game in gameData.games"
        :key="game.bggId"
        :game="game"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Inject } from 'vue-property-decorator'
import { gameDataKey } from '@/components/GameProvider.vue'
import GameCard from '@/components/GameCard.vue'
import { GameData } from '@/models/game-data'

@Component({
  components: {
    GameCard
  }
})
export default class Home extends Vue {
  @Inject(gameDataKey) readonly gameData!: GameData;
}
</script>
