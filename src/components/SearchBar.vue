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
        v-else-if="this.gameData.isLoading"
        class="
          flex
          flex-wrap
          justify-center
          gap-5
        "
      >
        <div class="animate-pulse h-6 w-32 mt-5 rounded bg-gray-300" />
        <div class="animate-pulse h-6 w-32 mt-5 rounded bg-gray-300" />
        <div class="animate-pulse h-6 w-32 mt-5 rounded bg-gray-300" />
      </div>

      <div
        v-else
      >
        <div
          class="
            flex
            flex-wrap
            justify-center
            gap-5
          "
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

          <Select
            label="Players"
            :value="filters.players"
            :options="playerCountOptions"
            @onChange="handlePlayerChange"
          />

          <Select
            label="Time"
            :value="filters.time"
            :options="timeOptions"
            @onChange="handleTimeChange"
          />

          <Select
            label="Complexity"
            :value="filters.complexity"
            :options="complexityOptions"
            @onChange="handleComplexityChange"
          />

          <Select
            label="Category"
            :value="filters.category"
            :options="categoryOptions"
            @onChange="handleCategoryChange"
          />

          <Select
            label="Mechanic"
            :value="filters.mechanic"
            :options="mechanicOptions"
            @onChange="handleMechanicChange"
          />

          <Select
            label="Designer"
            :value="filters.designer"
            :options="designerOptions"
            @onChange="handleDesignerChange"
          />

          <Select
            label="Publisher"
            :value="filters.publisher"
            :options="publisherOptions"
            @onChange="handlePublisherChange"
          />
        </div>

        <div class="mt-2 flex justify-center">
          <button
            @click="clearFilters"
            class="
              text-sm
              text-red-600 hover:text-red-800
              hover:underline
              flex
            "
          >
            <close-icon /> Clear
          </button>
        </div>
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
import Select, { SelectOption } from './Select.vue'
import { isTruthy, toSlug } from '@/helpers'

const searchProp = 'search'

class FilterValues {
  @query('s', '')
  [searchProp] = ''

  @query('fav', false)
  favorite = false

  @query('new', false)
  new = false

  @query('pc', '')
  players = ''

  @query('cat', '')
  category = ''

  @query('mec', '')
  mechanic = ''

  @query('des', '')
  designer = ''

  @query('pub', '')
  publisher = ''

  @query('cpx', '')
  complexity = ''

  @query('time', '')
  time = ''
}

interface FilterItem {
  game: Game;
  priority: FilterPriority;
}

interface FilterHandlerState {
  readonly filterValues: FilterValues;
  readonly searchIndex: Fuse<Game>;
  readonly categoryOptions: ReadonlyArray<SelectOption>;
  readonly mechanicOptions: ReadonlyArray<SelectOption>;
  readonly designerOptions: ReadonlyArray<SelectOption>;
  readonly publisherOptions: ReadonlyArray<SelectOption>;
  readonly timeOptions: ReadonlyArray<SelectOption>;
}

type FilterHandler = (items: FilterItem[], state: FilterHandlerState) => FilterItem[]

function filterDropdown (
  items: FilterItem[],
  options: readonly SelectOption[],
  filterValue: string,
  matcher: (game: Game, key: string) => boolean
): FilterItem[] {
  const key = options.find(option => option.value === filterValue)?.name

  if (!key) {
    return items
  }

  return items.filter(item => matcher(item.game, key))
}

@Component({
  components: {
    SearchIcon,
    CloseIcon,
    Panel,
    GameCounter,
    FilterIcon,
    Toggle,
    Select
  }
})
export default class SearchBar extends Vue {
  @Inject(gameDataKey) readonly gameData!: GameData

  private searchIndex: Fuse<Game> | null = null
  private creatingSearchIndex = false
  private filterSelection: FilterSelection | null = null
  private areFiltersVisable = false

  private filters = new FilterValues()

  $route!: Route

  get filtersAreLoaded (): boolean {
    return !this.gameData.isLoading || !this.createSearchIndex
  }

  private readonly playerCountOptions: ReadonlyArray<SelectOption> = [
    { name: '1', value: '1' },
    { name: '2', value: '2' },
    { name: '3', value: '3' },
    { name: '4', value: '4' },
    { name: '5', value: '5' },
    { name: '6', value: '6' },
    { name: '7', value: '7' },
    { name: '8', value: '8' },
    { name: '9', value: '9' },
    { name: '10+', value: '10' }
  ]

  private readonly complexityOptions: ReadonlyArray<SelectOption> = [
    { name: '0-1', value: '1' },
    { name: '1-2', value: '2' },
    { name: '2-3', value: '3' },
    { name: '3-4', value: '4' },
    { name: '4-5', value: '5' }
  ]

  private readonly timeOptions: ReadonlyArray<SelectOption> = [
    { name: '15 mins', value: '15' },
    { name: '30 mins', value: '30' },
    { name: '1 hour', value: '60' },
    { name: '2 hours', value: '120' },
    { name: '3+ hours', value: '180' }
  ]

  private categoryOptions: ReadonlyArray<SelectOption> = []

  private mechanicOptions: ReadonlyArray<SelectOption> = []

  private designerOptions: ReadonlyArray<SelectOption> = []

  private publisherOptions: ReadonlyArray<SelectOption> = []

  private readonly filterHandlers: ReadonlyArray<FilterHandler> = [
    (items, { filterValues: { search }, searchIndex }) => search
      ? searchIndex.search(search).map(searchResult => ({ game: searchResult.item, priority: searchResult.score ?? 2 }))
      : items,

    (items, { filterValues: { favorite } }) => favorite
      ? items.filter(item => item.game.favorite === true || item.game.wifeFavorite === true)
      : items,

    (items, { filterValues: { new: newValue } }) => newValue
      ? items.filter(item => item.game.new === true)
      : items,

    (items, { filterValues: { players } }) => {
      if (!players) {
        return items
      }

      const target = parseInt(players)

      if (isNaN(target) || target < 1) {
        return items
      }

      const noMin = target >= 10

      return items.filter(item =>
        (noMin || item.game.minPlayers <= target) && item.game.maxPlayers >= target)
    },

    (items, { filterValues: { category }, categoryOptions }) =>
      filterDropdown(items, categoryOptions, category, (game, key) => game.categories.includes(key)),

    (items, { filterValues: { mechanic }, mechanicOptions }) =>
      filterDropdown(items, mechanicOptions, mechanic, (game, key) => game.mechanics.includes(key)),

    (items, { filterValues: { designer }, designerOptions }) =>
      filterDropdown(items, designerOptions, designer, (game, key) => game.designers.includes(key)),

    (items, { filterValues: { publisher }, publisherOptions }) =>
      filterDropdown(items, publisherOptions, publisher, (game, key) => game.publisher === key),

    (items, { filterValues: { complexity } }) => {
      if (!complexity) {
        return items
      }

      const target = parseInt(complexity)

      if (isNaN(target) || target < 1 || target > 5) {
        return items
      }

      return items.filter(item =>
        item.game.weight > target - 1 && item.game.weight <= target
      )
    },

    (items, { filterValues: { time }, timeOptions }) => {
      if (!time) {
        return items
      }

      const optionIndex = timeOptions.findIndex(option => option.value === time)
      const minTime = optionIndex > 1
        ? parseInt(timeOptions[optionIndex - 1].value)
        : 0
      const maxTime = parseInt(timeOptions[optionIndex].value)

      return items.filter(item => item.game.playingTime > minTime && item.game.playingTime <= maxTime)
    }
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

    const state: FilterHandlerState = {
      filterValues: this.filters,
      searchIndex: this.searchIndex,
      categoryOptions: this.categoryOptions,
      mechanicOptions: this.mechanicOptions,
      designerOptions: this.designerOptions,
      publisherOptions: this.publisherOptions,
      timeOptions: this.timeOptions
    }

    for (const filterHandler of this.filterHandlers) {
      filterItems = filterHandler(filterItems, state)
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

  clearFilters () {
    const searchValue = this.filters.search

    this.filters = new FilterValues()
    this.filters.search = searchValue
    this.areFiltersVisable = false

    this.handleSearch()
  }

  handleSearchFocus () {
    if (!this.searchIndex) {
      this.createSearchData().then(this.handleSearch)
    }
  }

  handleOpenFilters () {
    this.areFiltersVisable = true

    if (!this.searchIndex) {
      this.createSearchData().then(this.handleSearch)
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

  handlePlayerChange (value: string) {
    this.filters.players = value
    this.handleSearch()
  }

  handleCategoryChange (value: string) {
    this.filters.category = value
    this.handleSearch()
  }

  handleMechanicChange (value: string) {
    this.filters.mechanic = value
    this.handleSearch()
  }

  handleDesignerChange (value: string) {
    this.filters.designer = value
    this.handleSearch()
  }

  handlePublisherChange (value: string) {
    this.filters.publisher = value
    this.handleSearch()
  }

  handleComplexityChange (value: string) {
    this.filters.complexity = value
    this.handleSearch()
  }

  handleTimeChange (value: string) {
    this.filters.time = value
    this.handleSearch()
  }

  @Watch('gameData.games')
  @Watch('gameData.isLoading')
  private gameDataChanged (): void {
    if (this.gameData.isLoading) {
      return
    }

    if (this.searchIndex != null || this.hasFiltersSet()) {
      this.createSearchData().then(this.handleSearch)
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

  private async createSearchData (): Promise<void> {
    await Promise.all([
      this.createSearchIndex(),
      this.buildFilterOptions()
    ])
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

  private buildFilterOptions (): void {
    if (this.gameData.isLoading) {
      return
    }

    this.categoryOptions = this.buildSelectOptions(this.gameData.games.flatMap(game => game.categories))
    this.mechanicOptions = this.buildSelectOptions(this.gameData.games.flatMap(game => game.mechanics))
    this.publisherOptions = this.buildSelectOptions(this.gameData.games.map(game => game.publisher))
    this.designerOptions = this.buildSelectOptions(this.gameData.games.flatMap(game => game.designers).filter(designer => isTruthy(designer)))
  }

  private buildSelectOptions (options: string[]): SelectOption[] {
    const distinct = [...new Set(options)].sort()
    return distinct.map(item => ({
      name: item,
      value: toSlug(item)
    }))
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
