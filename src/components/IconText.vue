<template>
  <div
    class="flex items-end"
    v-tooltip="tooltip"
  >
    <figure class="pr-1 h-8">
      <slot name="image" />
    </figure>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class IconText extends Vue {
  @Prop() readonly tooltip?: string | undefined
}
</script>
