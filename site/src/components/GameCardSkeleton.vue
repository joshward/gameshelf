<template>
  <div
    class="
      h-80
      p-1
      animate-pulse
      border-2
      border-gray-200
      border-solid
      rounded-md
      bg-gray-50
      bg-opacity-80
      shadow-md
      flex
      flex-col
      justify-between
    "
  >
    <div class="self-center h-52 w-52 mt-10 rounded bg-gray-200" />
    <div class="self-center h-4 w-1/2 mb-2 rounded bg-gray-300" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class GameCardSkeleton extends Vue {}
</script>
