<script setup>
import { computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'

const user = computed(() => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      username: payload.username || '—',
      email: payload.email || '—',
    }
  } catch {
    return null
  }
})

const userInitial = computed(() => user.value?.username?.charAt(0).toUpperCase() || '?')

</script>

<template>
  <MainLayout>
    <!-- Header baner -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 flex items-center gap-6">
      <div class="h-20 w-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shrink-0">
        {{ userInitial }}
      </div>
      <div>
        <h2 class="text-2xl font-bold text-slate-800">{{ user?.username }}</h2>
        <p class="text-slate-500 mt-1">{{ user?.email }}</p>
      </div>
    </div>

    <!-- Detalji -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 class="text-lg font-semibold text-slate-800 mb-5">Podaci računa</h3>

      <div class="divide-y divide-slate-100">
        <div class="py-4 flex justify-between items-center">
          <p class="text-sm text-slate-500">Korisničko ime</p>
          <p class="text-sm font-medium text-slate-800">{{ user?.username }}</p>
        </div>
        <div class="py-4 flex justify-between items-center">
          <p class="text-sm text-slate-500">Email</p>
          <p class="text-sm font-medium text-slate-800">{{ user?.email }}</p>
        </div>
        <div class="py-4 flex justify-between items-center">
          <p class="text-sm text-slate-500">Lozinka</p>
          <p class="text-sm text-slate-400">••••••••</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
