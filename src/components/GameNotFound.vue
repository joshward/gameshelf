<template>
  <panel
    :is-error="true"
    classes="
      self-center
      w-full
      text-center
      relative
      py-10
      px-5
    "
  >
    <image-message>
      <template slot="image">
        <box-image />
      </template>

      Doesn't look like I have that game, yet.
    </image-message>
  </panel>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Panel from './Panel.vue'
import ImageMessage from './ImageMessage.vue'
import BoxImage from '@/assets/box.svg'

@Component({
  components: {
    Panel,
    BoxImage,
    ImageMessage
  }
})
export default class GameNotFound extends Vue {
}
</script>
