<template>
  <panel classes="p-4 mb-5">
    <div class="flex items-center space-x-4">
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
          v-model.trim="filters.search"
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
          v-if="filters.search"
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
            @click.prevent="clearSearch"
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
    </div>

    <div class="mt-2">
      <div
        v-if="!areFiltersVisable"
        class="flex justify-center"
      >
        <button
          @click="handleOpenFilters"
          class="
            text-sm
            text-gray-600 hover:text-gray-800
            hover:underline
            flex
          "
        >
          <filter-icon /> Filters
        </button>
      </div>

      <div
        v-else
        class="flex justify-center gap-5"
      >
        <toggle
          :value="filters.favorite"
          @onChange="handleFilterFavoritesChange"
          label="Favorites"
        />

        <toggle
          :value="filters.new"
          @onChange="handleFilterNewChange"
          label="New"
        />
      </div>
    </div>
  </panel>
</template>

<script lang="ts">
import Fuse from 'fuse.js'
import { Route } from 'vue-router'
import { SearchIcon, CloseIcon, FilterIcon } from './icons'
import { Game, GameData, FilterSelection, FilterPriority } from '@/models'
import { isQuerySame, parseQueryParameters, setQueryParameters, query } from '@/router/route-query-processor'
import { Component, Emit, Inject, Vue, Watch } from 'vue-property-decorator'
import { gameDataKey } from './GameProvider.vue'
import Panel from './Panel.vue'
import GameCounter from './GameCounter.vue'
import Toggle from './Toggle.vue'
import { isTruthy } from '@/helpers'

const searchProp = 'search'

class FilterValues {
  @query('s', '')
  [searchProp] = ''

  @query('fav', false)
  favorite = false

  @query('new', false)
  new = false
}

interface FilterItem {
  game: Game;
  priority: FilterPriority;
}

type FilterHandler = (items: FilterItem[], filterValues: FilterValues, searchIndex: Fuse<Game>) => FilterItem[]

@Component({
  components: {
    SearchIcon,
    CloseIcon,
    Panel,
    GameCounter,
    FilterIcon,
    Toggle
  }
})
export default class SearchBar extends Vue {
  @Inject(gameDataKey) readonly gameData!: GameData

  searchIndex: Fuse<Game> | null = null
  creatingSearchIndex = false
  filterSelection: FilterSelection | null = null
  areFiltersVisable = false

  filters = new FilterValues()

  $route!: Route

  private readonly filterHandlers: ReadonlyArray<FilterHandler> = [
    (items, { search }, searchIndex) => search
      ? searchIndex.search(search).map(searchResult => ({ game: searchResult.item, priority: searchResult.score ?? 2 }))
      : items,

    (items, { favorite }) => favorite
      ? items.filter(item => item.game.favorite === true || item.game.wifeFavorite === true)
      : items,

    (items, { new: newValue }) => newValue
      ? items.filter(item => item.game.new === true)
      : items
  ]

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

    if (!this.hasFiltersSet()) {
      this.setFilter(null)
      this.setRouteFromValues()
      return
    }

    let filterItems: FilterItem[] = this.gameData.games.map(game => ({ game, priority: true }))

    for (const filterHandler of this.filterHandlers) {
      filterItems = filterHandler(filterItems, this.filters, this.searchIndex)
    }

    const selection: FilterSelection = new Map(filterItems.map(item => [
      item.game.bggId,
      item.priority
    ]))

    this.setFilter(selection)
    this.setRouteFromValues()
  }

  clearSearch () {
    if (!this.filters.search) {
      return
    }

    this.filters.search = ''
    this.handleSearch()
  }

  handleSearchFocus () {
    if (!this.searchIndex) {
      this.createSearchIndex().then(this.handleSearch)
    }
  }

  handleOpenFilters () {
    this.areFiltersVisable = true

    if (!this.searchIndex) {
      this.createSearchIndex().then(this.handleSearch)
    }
  }

  handleFilterFavoritesChange (value: boolean) {
    this.filters.favorite = value
    this.handleSearch()
  }

  handleFilterNewChange (value: boolean) {
    this.filters.new = value
    this.handleSearch()
  }

  @Watch('gameData.games')
  @Watch('gameData.isLoading')
  private gameDataChanged (): void {
    if (this.gameData.isLoading) {
      return
    }

    if (this.searchIndex != null || this.hasFiltersSet()) {
      this.createSearchIndex().then(this.handleSearch)
    }
  }

  @Watch('$route.query')
  private handleRouteChange (): void {
    if (isQuerySame(this.filters, this.$route.query)) {
      return
    }

    this.setValuesFromRoute()
    this.handleSearch()
  }

  @Emit('filter')
  private setFilter (selection: FilterSelection | null) {
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
    this.filters = parseQueryParameters(FilterValues, this.$route.query)

    if (this.hasFiltersSet(true)) {
      this.handleOpenFilters()
    }
  }

  private setRouteFromValues () {
    if (isQuerySame(this.filters, this.$route.query)) {
      return
    }

    setQueryParameters(this.filters, this.$route.query, this.$router)
  }

  private hasFiltersSet (ignoreSearch?: boolean): boolean {
    let entries = Object.entries(this.filters)

    if (ignoreSearch) {
      entries = entries.filter(entry => entry[0] !== searchProp)
    }

    return entries.map(entry => entry[1]).some(isTruthy)
  }
}
</script>
