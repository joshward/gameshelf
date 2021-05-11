<template>
  <panel
    classes="my-6 p-6"
    :is-error="true"
  >
    <image-message>
      <template v-slot:image>
        <data-error-image />
      </template>

      Whoops! Failed to load the game data.
    </image-message>
  </panel>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DataErrorImage from '@/assets/data-error.svg'
import Panel from './Panel.vue'
import ImageMessage from './ImageMessage.vue'

@Component({
  components: {
    Panel,
    DataErrorImage,
    ImageMessage
  }
})
export default class GameDataError extends Vue {}
</script>
