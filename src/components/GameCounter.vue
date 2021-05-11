<template>
  <div
    v-tooltip="'Visable / Total'"
    class="
      font-mono
      text-lg
      font-semibold
    "
  >
    {{ normalizeCount(current) }} / {{ normalizeCount(total) }}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { pad } from '@/helpers'

@Component({})
export default class GameCounter extends Vue {
  @Prop() current?: number
  @Prop() total?: number

  normalizeCount (value?: number): string {
    if (value == null) {
      return '___'
    }

    return pad(value, 3)
  }
}
</script>
