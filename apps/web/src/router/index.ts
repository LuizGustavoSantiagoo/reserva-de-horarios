import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'

// Toda rota é lazy: `component: () => import(...)` (architecture §2).
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'grade',
      component: () => import('@/features/grade/pages/GradePage.vue'),
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/features/admin/pages/LoginPage.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      // TODO #7: provisória, só para o login ter para onde ir; a Tarefa 9 troca pelo
      // AdminLayout + PainelPage, com o guard de navegação.
      component: () => Promise.resolve({ render: () => h('p', 'Painel') }),
    },
  ],
})

export default router
