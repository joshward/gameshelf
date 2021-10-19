<template>
  <game-provider>
    <div
      id="app"
      class="
        flex
        flex-col
        min-h-screen
        text-gray-800
      "
      :style="`background: url(${require('./img/memphis-colorful.png')})`"
    >
      <header
        class="
          flex-shrink-0
          bg-opacity-80
          bg-blue-400
          p-4 md:p-8
          shadow-md
          border-b
          border-blue-500
        "
      >
        <router-link
          :to="{ name: 'Home' }"
          class="
            flex
            space-x-4
            items-center
          "
        >
          <div class="w-12 h-12 md:w-16 md:h-16">
            <board-game-logo />
          </div>
          <h1 class="text-3xl md:text-5xl font-serif font-bold">
            Josh's Game Shelf
          </h1>
        </router-link>
      </header>
      <section class="flex-grow my-4 mx-6 md:mx-12 flex">
        <router-view />
      </section>
      <footer
        class="
          flex-shrink-0
          bg-opacity-80
          bg-gray-200
          p-4 md:p-8
          border-t
          border-gray-300
        "
      >
        <p class="text-center font-semibold pb-2">
          Site © 2021 Josh Ward
        </p>
        <p class="text-gray-500 text-center pb-2">
          Board game images and details provided by
          <Link url="https://www.boardgamegeek.com/">BoardGameGeek</Link>
          and is subject to their
          <Link url="https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use">terms of use</Link>.
        </p>
        <p class="text-gray-500 text-center">
          Icons made by
          <Link url="https://www.freepik.com">Freepik</Link>
          from
          <Link url="https://www.flaticon.com/">www.flaticon.com</Link>
        </p>
      </footer>
    </div>
  </game-provider>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { GameProvider, Link } from '@/components'
import BoardGameLogo from './assets/board-game.svg'

@Component({
  components: {
    Link,
    GameProvider,
    BoardGameLogo
  }
})
export default class App extends Vue {}
</script>
