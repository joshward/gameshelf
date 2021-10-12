<template>
  <div>
    <label
      v-if="label"
      class="
        block
        text-sm
        font-medium
        text-gray-700
      "
    >
      {{ label }}
    </label>

    <div
      aria-checked="false"
      @click="handleClick"
      :class="value ? 'bg-indigo-600' : 'bg-gray-200'"
      class="
        relative
        inline-block
        flex-shrink-0
        h-6
        w-11
        border-2
        border-transparent
        rounded-full
        cursor-pointer
        transition-colors
        ease-in-out
        duration-200
        focus:outline-none
        focus:shadow-outline"
      role="checkbox"
      tabindex="0"
    >
      <span
        aria-hidden="true"
        :class="value ? 'translate-x-5' : 'translate-x-0'"
        class="
          inline-block
          h-5
          w-5
          rounded-full
          bg-white
          shadow
          transform
          transition
          ease-in-out
          duration-200"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class Toggle extends Vue {
  @Prop({ default: false })
  value!: boolean;

  @Prop({ default: '' })
  label!: string;

  handleClick () {
    this.$emit('onChange', !this.value)
  }
}
</script>
