<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import logo from '@/components/dashboard.png'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Trgovine', path: '/stores' },
  { name: 'Posjeti', path: '/visits' },
  { name: 'Kategorije', path: '/categories' },
  { name: 'Proizvodi', path: '/products' },
  { name: 'Kontakti', path: '/contacts' },
  { name: 'Narudžbe', path: '/orders' },
  { name: 'Statistika', path: '/stats' },
  { name: 'Profil', path: '/profile' },
]

const pageTitle = computed(() => route.meta.title || 'SalesTrack')

const username = computed(() => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return 'Korisnik'
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.username || payload.email || 'Korisnik'
  } catch {
    return 'Korisnik'
  }
})

const userInitial = computed(() => username.value.charAt(0).toUpperCase())

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex">
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div class="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
        <img :src="logo" alt="SalesTrack logo" class="h-10 w-auto" />
        <div>
          <h1 class="text-xl font-bold text-slate-800">SalesTrack</h1>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="block rounded-xl px-4 py-3 text-sm font-medium transition"
          :class="
            route.path === item.path
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          "
        >
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-slate-200">
        <button
          @click="handleLogout"
          class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          Odjava
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col">
      <header
        class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
      >
        <div>
          <h2 class="text-lg font-semibold text-slate-800">{{ pageTitle }}</h2>
          <p class="text-sm text-slate-500">Pregled aplikacije</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-sm font-medium text-slate-800">{{ username }}</p>
          </div>

          <div
            class="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold"
          >
            {{ userInitial }}
          </div>
        </div>
      </header>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
