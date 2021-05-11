<template>
  <div
    class="
      self-center
      w-full
      max-w-screen-xl
      mx-auto
      space-y-5
    "
  >
    <panel
      classes="
        px-4
        pb-4
      "
    >
      <ribbon-bar :game="game" />
      <h2
        class="
          font-serif
          text-gray-900
          text-2xl
          hidden md:block
        "
      >
        {{ game.name }}
      </h2>
      <h2
        class="
          font-serif
          text-gray-900
          text-2xl
          block md:hidden
          text-center
        "
      >
        {{ game.primaryName }}
      </h2>
      <h3
        v-if="game.subName"
        class="
        text-gray-800
          text-xl
          font-semibold
          block md:hidden
          text-center
        "
      >
        {{ game.subName }}
      </h3>
      <p
        v-if="game.noteName"
        class="
          text-gray-600
          italic
          block md:hidden
          text-center
        "
      >
        {{ game.noteName }}
      </p>
      <div
        class="my-3 md:my-1"
      >
        <a
          class="
            flex
            items-center
            text-gray-500
            text-sm
            justify-center md:justify-start
            hover:underline
          "
          :href="`https://www.boardgamegeek.com/boardgame/${game.bggId}`"
        >
          <external-link-icon /> View at BGG
        </a>
      </div>

      <div
        class="
          pt-4
          flex
          justify-evenly
          flex-col md:flex-row
          font-semibold
          space-y-4 md:space-y-0
          items-center md:items-start
        "
      >
        <icon-text tooltip="Player Count">
          <template slot="image">
            <group-image class="h-full" />
          </template>
          {{ playerRange }}
        </icon-text>

        <icon-text tooltip="Play Time">
          <template slot="image">
            <hourglass-image class="h-full" />
          </template>
          {{ game.playingTime }} mins
        </icon-text>

        <icon-text tooltip="Complexity">
          <template slot="image">
            <brain-image class="h-full" />
          </template>
          {{ game.weight.toFixed(1) }}/5
        </icon-text>

        <icon-text tooltip="BGG Rating">
          <template slot="image">
            <review-image class="h-full" />
          </template>
          {{ game.rating.toFixed(1) }}/10
        </icon-text>
      </div>
    </panel>

    <div
      class="
        flex
        flex-col md:flex-row
        space-y-5 md:space-y-0
        space-x-0 md:space-x-5
      "
    >
      <panel
        classes="
          p-3
        "
      >
        <img
          class="mx-auto"
          :src="require(`../img/games/${game.thumbnail}`)"
          :alt="`Image of ${game.name}`"
        >
      </panel>
      <div
        class="
          flex-grow
        "
      >
        <panel
          class="
            w-full
            p-5
            flex
            justify-evenly
            flex-wrap
            text-center
            flex-col md:flex-row
            space-y-6 md:space-y-0
            md:space-x-4
            md:h-full
            items-center
          "
        >
          <div>
            <h4
              class="
                font-serif
                font-semibold
                text-lg
                pb-4
              "
            >
              Published Year
            </h4>
            <p>
              {{ game.year }}
            </p>
          </div>

          <div>
            <h4
              class="
                font-serif
                font-semibold
                text-lg
                pb-4
              "
            >
              Designers
            </h4>
            <p
              v-for="designer in game.designers"
              :key="designer"
            >
              {{ designer }}
            </p>
          </div>

          <div>
            <h4
              class="
                font-serif
                font-semibold
                text-lg
                pb-4
              "
            >
              Publisher
            </h4>
            <p>
              {{ game.publisher }}
            </p>
          </div>
        </panel>
      </div>
    </div>

    <panel
      class="
        p-4
        text-center
        md:text-left
      "
      v-if="game.expansions.length"
    >
      <h4
        class="
          font-serif
          font-semibold
          text-lg
          pb-4
        "
      >
        Expansions
      </h4>
      <p
        class="pb-2 md:pb-0"
        v-for="expansion in game.expansions"
        :key="expansion.name"
      >
        {{ expansion.name }} | {{ expansion.year }}
      </p>
    </panel>

    <div
      class="
        flex
        flex-col md:flex-row
        space-y-5 md:space-y-0
        space-x-0 md:space-x-5
      "
    >
      <panel
        classes="
          p-4
          text-center
          whitespace-nowrap
        "
      >
        <div class="mb-8">
          <h4
            class="
              font-serif
              font-semibold
              text-lg
              pb-4
            "
          >
            Categories
          </h4>
          <p
            v-for="category in game.categories"
            :key="category"
          >
            - {{ category }} -
          </p>
        </div>

        <div>
          <h4
            class="
              font-serif
              font-semibold
              text-lg
              pb-4
            "
          >
            Mechanics
          </h4>
          <p
            v-for="mechanic in game.mechanics"
            :key="mechanic"
          >
            <span class="co">
              -
            </span>
            {{ mechanic }} -
          </p>
        </div>
      </panel>

      <panel
        classes="
          p-4
        "
      >
        <p
          class="whitespace-pre-line text-gray-700"
          v-html="game.description"
        />
      </panel>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Game } from '@/models'
import GroupImage from '@/assets/group.svg'
import HourglassImage from '@/assets/hourglass.svg'
import BrainImage from '@/assets/brain.svg'
import ReviewImage from '@/assets/review.svg'
import { ExternalLinkIcon } from './icons'
import Panel from './Panel.vue'
import RibbonBar from './RibbonBar.vue'
import IconText from './IconText.vue'

@Component({
  components: {
    Panel,
    RibbonBar,
    GroupImage,
    HourglassImage,
    ReviewImage,
    IconText,
    BrainImage,
    ExternalLinkIcon
  }
})
export default class GamePage extends Vue {
  @Prop() game!: Game

  get playerRange (): string {
    if (this.game.minPlayers === this.game.maxPlayers) {
      return `${this.game.minPlayers}`
    }

    return `${this.game.minPlayers}-${this.game.maxPlayers}`
  }
}
</script>
