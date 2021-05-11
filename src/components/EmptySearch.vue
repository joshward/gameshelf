<template>
  <panel
    classes="my-6 p-6"
    :is-warning="true"
  >
    <image-message>
      <template v-slot:image>
        <not-found-image />
      </template>

      No Results.
    </image-message>
  </panel>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NotFoundImage from '@/assets/not-found.svg'
import Panel from './Panel.vue'
import ImageMessage from './ImageMessage.vue'

@Component({
  components: {
    Panel,
    ImageMessage,
    NotFoundImage
  }
})
export default class EmptySearch extends Vue {}
</script>
