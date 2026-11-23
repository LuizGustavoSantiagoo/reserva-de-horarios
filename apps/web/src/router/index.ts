import {
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { requireSession } from './guards'

// Toda rota é lazy: `component: () => import(...)` (architecture §2).
const routes: RouteRecordRaw[] = [
  {
    // Sem `meta`: a grade abre com ou sem token guardado (CA16).
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
    component: () => import('@/features/admin/pages/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin',
        component: () => import('@/features/admin/pages/PainelPage.vue'),
      },
      {
        // Filha de `/admin`: herda o `requiresAuth`, e o `roles` barra o Operador (CA16).
        path: 'operadores/novo',
        name: 'admin-novo-operador',
        component: () => import('@/features/admin/pages/CadastrarOperadorPage.vue'),
        meta: { roles: ['ADMIN'] },
      },
      {
        // Sem `roles`: os dois papéis veem as quadras; só o ADMIN vê o formulário (CA9, CA10).
        path: 'quadras',
        name: 'admin-quadras',
        component: () => import('@/features/admin/pages/QuadrasPage.vue'),
      },
    ],
  },
]

/** O router do app, com o guard; o teste o monta sobre um histórico em memória. */
export function createAppRouter(history: RouterHistory): Router {
  const router = createRouter({ history, routes })
  router.beforeEach(requireSession)
  return router
}

export default createAppRouter(createWebHistory(import.meta.env.BASE_URL))
