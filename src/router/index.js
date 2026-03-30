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
      component: DashboardView,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/stores',
      component: StoresView,
      meta: { title: 'Trgovine' }
    },
    {
      path: '/visits',
      component: VisitsView,
      meta: { title: 'Posjeti' }
    },
    {
      path: '/stats',
      component: StatsView,
      meta: { title: 'Statistika' }
    },
    {
      path: '/profile',
      component: ProfileView,
      meta: { title: 'Profil' }
    }
  ],
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — SalesTrack` : 'SalesTrack'
})

export default router
