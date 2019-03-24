import './css/global.css'
import Vue from 'vue'
import Router from 'vue-router'
import App from './components/App.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: App
    }
  ]
})

new Vue({
  el: '#app',
  router,
  render: h => h('router-view')
})
