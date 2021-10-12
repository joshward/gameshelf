<template>
  <panel
    :is-error="true"
    classes="
      self-center
      w-full
      text-center
      relative
    "
  >
    <figure
      class="
        absolute
        top-0.5
        left-0.5
        w-10 md:w-20
        h-10 md:h-20
      "
    >
      <cobweb-image />
    </figure>
    <h2
      class="
        p-10
        text-5xl md:text-8xl
      "
    >
      Page Not Found
    </h2>
  </panel>
</template>

<script lang="ts">
import { Meta } from '@sophosoft/vue-meta-decorator'
import { Component, Vue } from 'vue-property-decorator'
import { Panel } from '@/components'
import CobwebImage from '@/assets/cobweb.svg'

@Component({
  components: {
    Panel,
    CobwebImage
  }
})
export default class NotFoundPage extends Vue {
  @Meta
  getMetaInfo () {
    return {
      title: 'Page Not Found - Josh\'s Games'
    }
  }
}
</script>
