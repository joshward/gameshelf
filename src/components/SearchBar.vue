<template>
  <panel
    class="
      p-4
      mb-5
      flex
      items-center
      space-x-4
    "
  >
    <div
      class="
        flex-grow
        shadow-sm
        rounded-md
        relative
      "
    >
      <div
        class="
          absolute
          inset-y-0
          left-0
          pl-3
          flex
          items-center
          pointer-events-none
        "
      >
        <search-icon />
      </div>
      <input
        v-model.trim="searchValue"
        v-debounce="handleSearch"
        @focus="handleSearchFocus"
        type="text"
        name="search"
        placeholder="Search"
        class="
          block
          w-full
          sm:text-sm
          px-10
          rounded-md
          focus:ring-indigo-500
          border-gray-300 focus:border-indigo-500
        "
      >
      <div
        v-if="searchValue"
        class="
          absolute
          inset-y-0
          right-0
          pr-3
          flex
          items-center
        "
      >
        <button
          @click.prevent="() => searchValue = ''"
          type="button"
        >
          <close-icon />
        </button>
      </div>
    </div>
    <game-counter
      :current="currentCount"
      :total="totalCount"
    />
  </panel>
</template>

<script lang="ts">
import Fuse from 'fuse.js'
import { Route } from 'vue-router'
import { SearchIcon, CloseIcon } from './icons'
import { Game, GameData, FilterSelection } from '@/models'
import { Component, Emit, Inject, Vue, Watch } from 'vue-property-decorator'
import { gameDataKey } from './GameProvider.vue'
import Panel from './Panel.vue'
import GameCounter from './GameCounter.vue'

interface SearchValue {
  name: string;
  bggId: number;
}

@Component({
  components: {
    SearchIcon,
    CloseIcon,
    Panel,
    GameCounter
  }
})
export default class SearchBar extends Vue {
  @Inject(gameDataKey) readonly gameData!: GameData

  searchIndex: Fuse<Game> | null = null
  creatingSearchIndex = false
  searchValue = ''
  filterSelection: FilterSelection | null = null

  $route!: Route;

  get currentCount (): number | undefined {
    return this.filterSelection?.size ?? this.totalCount
  }

  get totalCount (): number | undefined {
    return this.gameData.isLoading
      ? undefined
      : this.gameData.games.length
  }

  created (): void {
    this.setValuesFromRoute()
    this.gameDataChanged()
  }

  handleSearch () {
    if (this.creatingSearchIndex || this.searchIndex == null) {
      return
    }

    const key = this.searchValue

    if (!key) {
      this.filter(null)
      this.setRouteFromValues()
      return
    }

    const searchResults = this.searchIndex.search(key)
    const selection: FilterSelection = new Map(searchResults.map(result => [
      result.item.bggId,
      result.score ?? 2
    ]))

    this.filter(selection)
    this.setRouteFromValues()
  }

  handleSearchFocus () {
    if (!this.searchIndex) {
      this.createSearchIndex().then(this.handleSearch)
    }
  }

  @Watch('gameData.games')
  @Watch('gameData.isLoading')
  private gameDataChanged (): void {
    if (this.gameData.isLoading) {
      return
    }

    if (this.searchIndex != null || this.hasSearchSet()) {
      this.createSearchIndex().then(this.handleSearch)
    }
  }

  @Watch('$route.query')
  private handleRouteChange (): void {
    this.setValuesFromRoute()
    this.handleSearch()
  }

  @Emit()
  private filter (selection: FilterSelection | null) {
    this.filterSelection = selection
  }

  private async createSearchIndex (): Promise<void> {
    if (this.creatingSearchIndex || this.gameData.isLoading) {
      return
    }

    this.creatingSearchIndex = true

    try {
      // TODO load pre-created index
      const indexOptions: Fuse.FuseOptionKey[] = [
        {
          name: 'primaryName',
          weight: 2
        },
        {
          name: 'subName',
          weight: 1
        },
        {
          name: 'noteName',
          weight: 1
        }
      ]

      const index = Fuse.createIndex(indexOptions, this.gameData.games)
      this.searchIndex = new Fuse(
        this.gameData.games,
        {
          isCaseSensitive: false,
          includeScore: true,
          includeMatches: true,
          threshold: 0.4
        },
        index)
    } finally {
      this.creatingSearchIndex = false
    }
  }

  private setValuesFromRoute (): void {
    this.searchValue = this.asSingleValue(this.$route.query.s) ?? ''
  }

  private setRouteFromValues () {
    if (this.$route.query.s === (this.searchValue || undefined)) {
      return
    }

    const alreadySet = this.$route.query.s != null

    const query = {
      s: this.searchValue || undefined
    }

    if (alreadySet) {
      this.$router.replace({ query })
    } else {
      this.$router.push({ query })
    }
  }

  private hasSearchSet (): boolean {
    return this.searchValue != null
  }

  private asSingleValue (value?: string | (string | null)[]): string | null {
    if (!value) {
      return null
    }

    if (Array.isArray(value)) {
      return value[0] ?? null
    }

    return value
  }
}
</script>
