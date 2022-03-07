import 'reflect-metadata'
import '@fontsource/cutive'
import '@fontsource/cutive-mono'
import '@fontsource/open-sans'
import Vue from 'vue'
import vueDebounce from 'vue-debounce'
import { VuePlausible } from 'vue-plausible'
import VTooltip from 'v-tooltip'
import App from './App.vue'
import router from './router'
import './index.css'

Vue.config.productionTip = false

Vue.use(vueDebounce, {
  fireOnEmpty: true
})

Vue.use(VuePlausible, {
  domain: 'games.joshward.dev',
  enableAutoPageviews: true
})

Vue.use(VTooltip)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
