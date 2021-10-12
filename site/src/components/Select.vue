<template>
  <div class="max-w-full">
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

    <select
      :value="value"
      @change="handleChange"
      class="
        focus:ring-indigo-500
        border-gray-300 focus:border-indigo-500
        bg-transparent
        text-gray-500
        sm:text-sm
        rounded-md
        bg-white
        py-1
        max-w-full
      "
    >
      <option
        :value="''"
      >
        -
      </option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

export interface SelectOption {
  name: string;
  value: string;
}

@Component({})
export default class Select extends Vue {
  @Prop({ default: '' })
  label!: string;

  @Prop({ default: () => [] })
  options!: ReadonlyArray<SelectOption>;

  @Prop({ default: '' })
  value!: string;

  private handleChange (e: Event) {
    const select = e.target as HTMLSelectElement
    const value = select.options[select.selectedIndex].value

    this.$emit('onChange', value)
  }
}
</script>
