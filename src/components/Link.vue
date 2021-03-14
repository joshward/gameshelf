<template>
  <a
    :href="url"
    class="text-blue-500 hover:text-blue-900"
  >
    <slot></slot>
  </a>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class Link extends Vue {
  @Prop() url!: string
}
</script>
