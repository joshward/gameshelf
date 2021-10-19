<template>
  <router-link
    :to="link"
    class="group"
  >
    <panel
      classes="
        px-1
        pb-1
        group-hover:border-indigo-700
        group-hover:bg-white
        bg-opacity-80
        group-hover:shadow-lg
        flex
        flex-col
        justify-between
        h-full
      "
    >
      <ribbon-bar :game="game" />
      <clazy-load
        :src="require(`../img/games/${game.thumbnail}`)"
        loaded-class="self-center"
        loading-class="self-center"
        error-class="self-center"
      >
        <figure
          :style="{ height: `${game.thumbHeight}px`, width: `${game.thumbWidth}px` }"
        >
          <img
            :src="require(`../img/games/${game.thumbnail}`)"
            :alt="`Image of ${game.name}`"
            class="h-full w-full"
          >
        </figure>
        <figure
          :style="{ height: `${game.thumbHeight}px`, width: `${game.thumbWidth}px` }"
          slot="placeholder"
        >
          <blur-hash
            :hash="game.blurhash"
          />
        </figure>
      </clazy-load>
      <div class="mx-3 py-2 text-center">
        <h3
          class="
            font-serif
            text-gray-900
            text-2xl
            group-hover:underline
          "
        >
          {{ game.name }}
        </h3>
        <h4
          v-if="game.subTitle"
          class="
            text-gray-800
            text-base
            font-semibold
          "
        >
          {{ game.subTitle }}
        </h4>
        <p
          v-if="game.editionTitle"
          class="
            text-gray-600
            italic
          "
        >
          {{ game.editionTitle }}
        </p>
      </div>
    </panel>
  </router-link>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VueClazyLoad } from 'vue-clazy-load'
import { Location } from 'vue-router'
import { Game } from '@/models/game'
import RibbonBar from './RibbonBar.vue'
import Panel from './Panel.vue'
import BlurHash from './BlurHash.vue'

@Component({
  components: {
    ClazyLoad: VueClazyLoad,
    RibbonBar,
    Panel,
    BlurHash
  }
})
export default class GameCard extends Vue {
  @Prop() readonly game!: Game

  get link (): Location {
    return {
      name: 'Game',
      params: { id: `${this.game.bggId}`, name: this.game.slug }
    }
  }
}
</script>
