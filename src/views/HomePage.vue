<template>
  <div class="w-full">
    <search-bar
      v-if="!hasError"
      @filter="handleFilter"
    />
    <game-data-error v-if="hasError" />
    <empty-search v-else-if="hasEmptySearch" />
    <div
      v-else
      class="
        grid
        grid-cols-cards
        gap-3
      "
    >
      <game-card-skeleton
        v-for="index in loaders"
        :key="index"
      />
      <game-card
        v-for="game in games"
        :key="game.bggId"
        :game="game"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Meta } from '@sophosoft/vue-meta-decorator'
import { Component, Vue, Inject } from 'vue-property-decorator'
import { gameDataKey } from '@/components/GameProvider.vue'
import { GameCard, GameCardSkeleton, GameDataError, SearchBar, EmptySearch } from '@/components'
import { FilterPriority, FilterSelection, Game, GameData } from '@/models'

@Component({
  components: {
    GameCard,
    GameCardSkeleton,
    GameDataError,
    SearchBar,
    EmptySearch
  }
})
export default class HomePage extends Vue {
  @Inject(gameDataKey) readonly gameData!: GameData

  filterSelection: FilterSelection | null = null

  @Meta
  getMetaInfo () {
    if (this.filterSelection != null) {
      return {
        title: `Filtered (${this.games.length}) - Josh's Games`
      }
    }

    return {
      title: "Josh's Games"
    }
  }

  handleFilter (selection: FilterSelection | null) {
    this.filterSelection = selection
  }

  get games (): Game[] {
    const filterSelection = this.filterSelection
    if (!filterSelection) {
      return this.sortedGames
    }

    return this.sortedGames
      .filter(game => filterSelection.has(game.bggId))
      .sort((left, right) =>
        this.normalizeFilterPriority(filterSelection.get(left.bggId)) - this.normalizeFilterPriority(filterSelection.get(right.bggId)))
  }

  get loaders (): number[] {
    if (!this.gameData.isLoading) {
      return []
    }

    return [1, 2, 3, 4, 5, 6, 7, 8]
  }

  get hasError (): boolean {
    return !this.gameData.isLoading && this.gameData.error != null
  }

  get hasEmptySearch (): boolean {
    return this.games.length === 0 && !this.gameData.isLoading
  }

  private get sortedGames (): Game[] {
    if (this.gameData.isLoading) {
      return []
    }

    return [...this.gameData.games].sort((left, right) => left.name.localeCompare(right.name))
  }

  private normalizeFilterPriority (priority: FilterPriority | undefined | null): number {
    return typeof priority === 'number' ? priority : 2
  }
}
</script>
