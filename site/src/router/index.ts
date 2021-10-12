import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Meta from 'vue-meta'
import HomePage from '@/views/HomePage.vue'
import NotFoundPage from '@/views/NotFoundPage.vue'
import GamePage from '@/views/GamePage.vue'

Vue.use(VueRouter)
Vue.use(Meta)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/game/:id/:name?',
    name: 'Game',
    component: GamePage,
    props: true
  },
  {
    path: '*',
    component: NotFoundPage
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return { x: 0, y: 0 }
  }
})

export default router
