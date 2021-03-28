<template>
  <div
    id="app"
    class="
      flex
      flex-col
      min-h-screen
      text-gray-800
    "
    style="background: url('./img/beanstalk.png')"
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
      <h1 class="text-3xl md:text-5xl font-bold">
        Josh's Game Shelve
      </h1>
    </header>
    <section class="flex-grow my-4 mx-6 md:mx-12">
      <GameProvider>
        <router-view />
      </GameProvider>
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
        Site © 2021 Joshua Ward
      </p>
      <p class="text-gray-500 text-center">
        Board game images and details provided by
        <Link url="https://www.boardgamegeek.com/">BoardGameGeek</Link>
        and is subject to their
        <Link url="https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use">terms of use</Link>.
      </p>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Link from '@/components/Link.vue'
import GameProvider from '@/components/GameProvider.vue'

@Component({
  components: {
    Link,
    GameProvider
  }
})
export default class App extends Vue {}
</script>
