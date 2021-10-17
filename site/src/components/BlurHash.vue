<template>
  <canvas
    ref="canvas"
    class="block h-full w-full bg-gray-100 animate-pulse"
    width="32"
    height="32"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue, Ref } from 'vue-property-decorator'
import { decode } from 'blurhash'

@Component({})
export default class BlurHash extends Vue {
  @Prop() readonly hash?: string

  @Ref('canvas') readonly canvas!: HTMLCanvasElement

  mounted () {
    if (!this.hash || !this.canvas) {
      return
    }

    const pixels = decode(this.hash, 32, 32)
    const context = this.canvas.getContext('2d')
    if (!context || !pixels) {
      return
    }

    const imageData = new ImageData(pixels, 32, 32)
    context.putImageData(imageData, 0, 0)
  }
}
</script>
