import { createRouter, createWebHistory } from 'vue-router'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import StoresView from '../views/StoresView.vue'
import VisitsView from '../views/VisitsView.vue'
import StatsView from '../views/StatsView.vue'
import ProfileView from '../views/ProfileView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import ProductsView from '../views/ProductsView.vue'
import ContactsView from '../views/ContactsView.vue'
import OrdersView from '../views/OrdersView.vue'
import RoutesView from '../views/RoutesView.vue'

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
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView,
      meta: { title: 'Kategorije' }
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: { title: 'Proizvodi' }
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: ContactsView,
      meta: { title: 'Kontakti' }
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrdersView,
      meta: { title: 'Narudžbe' }
    },
    {
      path: '/routes',
      name: 'routes',
      component: RoutesView,
      meta: { title: 'Rute' }
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
