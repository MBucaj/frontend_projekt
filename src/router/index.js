import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import StoresView from '../views/StoresView.vue'
import VisitsView from '../views/VisitsView.vue'
import StatsView from '../views/StatsView.vue'
import ProfileView from '../views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/register',
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/stores',
      name: 'stores',
      component: StoresView,
      meta: { title: 'Trgovine' }
    },
    {
      path: '/visits',
      name: 'visits',
      component: VisitsView,
      meta: { title: 'Posjeti' }
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView,
      meta: { title: 'Statistika' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { title: 'Profil' }
    }
  ],
})

router.beforeEach((to) => {
  const publicRoutes = ['login', 'register']
  const token = localStorage.getItem('token')

  if (!publicRoutes.includes(to.name) && !token) {
    return { name: 'login' }
  }

  if (publicRoutes.includes(to.name) && token) {
    return { name: 'dashboard' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — SalesTrack` : 'SalesTrack'
})

export default router
