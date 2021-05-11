<template>
  <div
    class="
      border-solid
      border-2
      rounded-md
      bg-opacity-80
      shadow-md
    "
    :class="[
      classes,
      {
        'border-red-500': isError,
        'bg-red-100': isError,
        'border-yellow-300': isWarning,
        'bg-yellow-50': isWarning,
        'border-gray-200': isDefault,
        'bg-gray-50': isDefault
      }
    ]"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class Panel extends Vue {
  @Prop() classes?: string
  @Prop({ default: false }) isError!: boolean
  @Prop({ default: false }) isWarning!: boolean

  get isDefault () {
    return !this.isError && !this.isWarning
  }
}
</script>
