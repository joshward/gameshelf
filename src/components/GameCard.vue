<template>
  <div
    class="
      p-2
      border
      border-gray-200
      border-solid
      rounded-md
      bg-white
      shadow-md
    "
  >
    <h3
      class="
          text-gray-900
          text-xl
          font-semibold
        "
      >
      {{ game.name }}
    </h3>
  </div>
</template>

<script lang="ts">
import { Game } from '@/models/game'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class GameCard extends Vue {
  @Prop() readonly game!: Game
}
</script>
