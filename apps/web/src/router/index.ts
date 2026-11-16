import { createRouter, createWebHistory } from 'vue-router'

// Toda rota é lazy: `component: () => import(...)` (architecture §2).
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // TODO #2: a Tarefa 3 registra `/` → features/grade/pages/GradePage.vue.
  routes: [],
})

export default router
