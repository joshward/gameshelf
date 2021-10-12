<template>
  <div
    class="
      relative
      -top-2
      inline-block
    "
  >
    <div
      class="
        relative
        px-2
        pb-1
        w-min
        bg-gradient-to-br
        rounded-tr-lg
        shadow

        before:empty-content
        before:absolute
        before:h-1.5
        before:w-1.5
        before:-left-1.5

        after:empty-content
        after:absolute
        after:h-1.5
        after:w-2
        after:-left-2
        after:rounded-tl-lg
        after:rounded-tr-lg
        after:top-0
      "
      :class="coloring"
      v-tooltip="tooltip"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class Ribbon extends Vue {
  @Prop() readonly coloring!: string
  @Prop() readonly tooltip!: string
}
</script>
