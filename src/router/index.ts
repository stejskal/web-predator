import { createRouter, createWebHistory } from 'vue-router'
import PredationView from '@/views/PredationView.vue'
import CreateEntityView from '@/views/CreateEntityView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'predation',
      component: PredationView,
    },
    {
      path: '/create/:entityType',
      name: 'create-entity',
      component: CreateEntityView,
      props: true,
    },
  ],
})

export default router
