<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import visitsService from '@/services/visitsService'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

const visits = ref([])
const loading = ref(false)
const error = ref('')
const period = ref('month')

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

const filteredVisits = computed(() => {
  const now = new Date()
  return visits.value.filter(v => {
    const d = new Date(v.date)
    if (period.value === 'day') {
      return d.toDateString() === now.toDateString()
    }
    if (period.value === 'week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
      startOfWeek.setHours(0, 0, 0, 0)
      return d >= startOfWeek
    }
    if (period.value === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return true
  })
})

const totalVisits = computed(() => filteredVisits.value.length)

const totalKm = computed(() =>
  filteredVisits.value.reduce((sum, v) => sum + (v.kilometers || 0), 0)
)

const totalStores = computed(() =>
  new Set(filteredVisits.value.map(v => v.storeId)).size
)

const topStores = computed(() => {
  const map = {}
  for (const v of filteredVisits.value) {
    const key = v.storeId
    if (!map[key]) {
      map[key] = { name: v.store?.name || '—', city: v.store?.city || '—', count: 0, km: 0 }
    }
    map[key].count++
    map[key].km += v.kilometers || 0
  }
  return Object.values(map).sort((a, b) => b.count - a.count)
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
  return Object.values(map).sort((a, b) => a.label.localeCompare(b.label)).slice(-6)
})

// Graf: Posjete po danu u tjednu
const dayLabels = ['Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota', 'Nedjelja']

const visitsByDayChartData = computed(() => {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const v of filteredVisits.value) {
    const d = new Date(v.date)
    const day = (d.getDay() + 6) % 7 // pretvori u pon=0 ... ned=6
    counts[day]++
  }
  return {
    labels: dayLabels,
    datasets: [{
      label: 'Posjeta',
      data: counts,
      backgroundColor: '#10b981',
      borderRadius: 6,
    }]
  }
})

const dayChartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
}


const periods = [
  { value: 'day', label: 'Dan' },
  { value: 'week', label: 'Tjedan' },
  { value: 'month', label: 'Mjesec' },
  { value: 'all', label: 'Sve' },
]
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Statistika</h2>
      <div class="flex gap-2">
        <button
          v-for="p in periods"
          :key="p.value"
          @click="period = p.value"
          class="px-4 py-2 rounded-xl text-sm font-medium transition"
          :class="period === p.value
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Kartice -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Posjeta</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalVisits }}</h3>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Kilometara</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalKm }} km</h3>
      </div>
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <p class="text-sm text-slate-500 mb-2">Trgovina posjećeno</p>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalStores }}</h3>
      </div>
    </section>

    <!-- Graf: Posjete po danu u tjednu -->
    <section class="mb-8">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-1">Posjete po danu u tjednu</h3>
        <p class="text-xs text-slate-400 mb-4">U koje dane si najaktivniji</p>
        <div class="h-48">
          <Bar :data="visitsByDayChartData" :options="{ ...dayChartOptions, maintainAspectRatio: false }" />
        </div>
      </div>
    </section>

    <!-- Tablice -->
    <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Trgovine po posjetima</h3>
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="pb-3 font-medium">#</th>
              <th class="pb-3 font-medium">Trgovina</th>
              <th class="pb-3 font-medium">Grad</th>
              <th class="pb-3 font-medium text-right">Posjeta</th>
              <th class="pb-3 font-medium text-right">Km</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, i) in topStores"
              :key="i"
              class="border-b border-slate-100"
              :class="i === 0 ? 'bg-green-50' : i === topStores.length - 1 && topStores.length > 1 ? 'bg-red-50' : ''"
            >
              <td class="py-3 text-slate-400 text-xs">{{ i + 1 }}</td>
              <td class="py-3 font-medium text-slate-800">{{ s.name }}</td>
              <td class="py-3 text-slate-600">{{ s.city }}</td>
              <td class="py-3 text-right text-slate-800">{{ s.count }}</td>
              <td class="py-3 text-right text-blue-600 font-medium">{{ s.km }} km</td>
            </tr>
            <tr v-if="topStores.length === 0">
              <td colspan="5" class="py-6 text-center text-slate-400">Nema podataka</td>
            </tr>
          </tbody>
        </table>
        <p v-if="topStores.length > 1" class="text-xs text-slate-400 mt-3">
          <span class="inline-block w-3 h-3 rounded-sm bg-green-100 mr-1"></span>Najposjećenija
          &nbsp;
          <span class="inline-block w-3 h-3 rounded-sm bg-red-100 mr-1"></span>Najmanje posjećena
        </p>
      </div>

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
