<template>
  <div
    class="
      h-10
      relative
      px-4
      space-x-3
      text-right
    "
  >
    <ribbon
      v-if="game.favorite"
      coloring="from-red-400 to-red-300 before:bg-red-400 after:bg-red-600"
      tooltip="Josh's Favorite"
    >
      <figure class="w-10 pt-2">
        <star-icon />
      </figure>
    </ribbon>

    <ribbon
      v-if="game.wifeFavorite"
      coloring="from-purple-400 to-purple-300 before:bg-purple-400 after:bg-purple-600"
      tooltip="Wife's Favorite"
    >
      <figure class="w-10 pt-2">
        <heart-icon />
      </figure>
    </ribbon>

    <ribbon
      v-if="game.new"
      coloring="from-yellow-400 to-yellow-300 before:bg-yellow-400 after:bg-yellow-600"
      tooltip="New to the Collection"
    >
      <figure class="w-10 pt-2">
        <new-icon />
      </figure>
    </ribbon>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import StarIcon from '@/assets/star.svg'
import HeartIcon from '@/assets/heart.svg'
import NewIcon from '@/assets/new.svg'
import { Game } from '@/models'
import Ribbon from './Ribbon.vue'

@Component({
  components: {
    StarIcon,
    HeartIcon,
    NewIcon,
    Ribbon
  }
})
export default class RibbonBar extends Vue {
  @Prop() readonly game!: Game
}
</script>
