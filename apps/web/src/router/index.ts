import { createRouter, createWebHistory } from 'vue-router'

// Toda rota é lazy: `component: () => import(...)` (architecture §2).
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'grade',
      component: () => import('@/features/grade/pages/GradePage.vue'),
    },
  ],
})

export default router
