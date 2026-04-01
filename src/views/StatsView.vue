<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import visitsService from '@/services/visitsService'

const visits = ref([])
const loading = ref(false)
const error = ref('')

const fetchVisits = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await visitsService.getAll()
    visits.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu podataka.'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchVisits())

const totalKm = computed(() =>
  visits.value.reduce((sum, v) => sum + (v.kilometers || 0), 0)
)

const totalVisits = computed(() => visits.value.length)

const totalKmThisMonth = computed(() => {
  const now = new Date()
  return visits.value
    .filter(v => {
      const d = new Date(v.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, v) => sum + (v.kilometers || 0), 0)
})

const visitsThisMonth = computed(() => {
  const now = new Date()
  return visits.value.filter(v => {
    const d = new Date(v.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})

const topStores = computed(() => {
  const map = {}
  for (const v of visits.value) {
    const key = v.storeId
    if (!map[key]) {
      map[key] = { name: v.store?.name || '—', city: v.store?.city || '—', count: 0, km: 0 }
    }
    map[key].count++
    map[key].km += v.kilometers || 0
  }
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5)
})

const monthlyStats = computed(() => {
  const map = {}
  for (const v of visits.value) {
    const d = new Date(v.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { label: key, count: 0, km: 0 }
    map[key].count++
    map[key].km += v.kilometers || 0
  }
  return Object.values(map).sort((a, b) => b.label.localeCompare(a.label)).slice(0, 6)
})
</script>

<template>
  <MainLayout>
    <h2 class="text-2xl font-bold text-slate-800 mb-6">Statistika</h2>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Kartice -->
    <section class="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Ukupno posjeta</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalVisits }}</h3>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Ukupno kilometara</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalKm }} km</h3>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Posjeta ovaj mjesec</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ visitsThisMonth }}</h3>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Km ovaj mjesec</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalKmThisMonth }} km</h3>
      </div>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Top trgovine -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Top trgovine</h3>
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="pb-3 font-medium">Trgovina</th>
              <th class="pb-3 font-medium">Grad</th>
              <th class="pb-3 font-medium text-right">Posjeta</th>
              <th class="pb-3 font-medium text-right">Km</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in topStores" :key="s.name" class="border-b border-slate-100">
              <td class="py-3 font-medium text-slate-800">{{ s.name }}</td>
              <td class="py-3 text-slate-600">{{ s.city }}</td>
              <td class="py-3 text-right text-slate-800">{{ s.count }}</td>
              <td class="py-3 text-right text-blue-600 font-medium">{{ s.km }} km</td>
            </tr>
            <tr v-if="topStores.length === 0">
              <td colspan="4" class="py-6 text-center text-slate-400">Nema podataka</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Po mjesecima -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Po mjesecima</h3>
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="pb-3 font-medium">Mjesec</th>
              <th class="pb-3 font-medium text-right">Posjeta</th>
              <th class="pb-3 font-medium text-right">Km</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in monthlyStats" :key="m.label" class="border-b border-slate-100">
              <td class="py-3 text-slate-800">{{ m.label }}</td>
              <td class="py-3 text-right text-slate-800">{{ m.count }}</td>
              <td class="py-3 text-right text-blue-600 font-medium">{{ m.km }} km</td>
            </tr>
            <tr v-if="monthlyStats.length === 0">
              <td colspan="3" class="py-6 text-center text-slate-400">Nema podataka</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </MainLayout>
</template>
