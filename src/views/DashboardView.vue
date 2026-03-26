<script setup>
import { ref, computed } from 'vue'
import logo from '@/components/dashboard.png'

const username = ref('Korisnik')

const visits = ref([
  { _id: '1', store: { name: 'Konzum', city: 'Zagreb' }, date: '2024-03-20', note: 'Redovni posjet', kilometers: 12 },
  { _id: '2', store: { name: 'Spar', city: 'Split' }, date: '2024-03-18', note: 'Provjera zaliha', kilometers: 8 },
  { _id: '3', store: { name: 'Lidl', city: 'Rijeka' }, date: '2024-03-15', note: '', kilometers: 25 },
])

const recentVisits = computed(() => {
  return [...visits.value]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)
})

const lastVisit = computed(() => recentVisits.value[0] || null)

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

const totalStores = computed(() => {
  const ids = new Set(visits.value.map(v => v.store?.name))
  return ids.size
})
</script>

<template>
  <div class="min-h-screen bg-slate-100">

    <header class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <div class="flex items-center gap-3">
          <img :src="logo" alt="SalesTrack logo" class="h-10 w-auto" />
          <div>
            <h1 class="text-xl font-bold text-slate-800">SalesTrack</h1>
          </div>
        </div>

        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition"
        >
          Dodaj posjet
        </button>
      </div>
    </header>

    <!-- MAIN -->
    <main class="max-w-7xl mx-auto px-6 py-8">

      <!-- NASLOV -->
      <section class="mb-8">
        <h2 class="text-3xl font-bold text-slate-800 mb-2">
          Dobrodošao, {{ username }}
        </h2>
        <p class="text-slate-500">
          Ovdje imaš pregled trgovina, posjeta i osnovne statistike.
        </p>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p class="text-sm text-slate-500 mb-2">Ukupno trgovina</p>
          <h3 class="text-3xl font-bold text-slate-800">{{ totalStores }}</h3>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p class="text-sm text-slate-500 mb-2">Ukupno posjeta</p>
          <h3 class="text-3xl font-bold text-slate-800">{{ visits.length }}</h3>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p class="text-sm text-slate-500 mb-2">Ovaj mjesec</p>
          <h3 class="text-3xl font-bold text-slate-800">{{ visitsThisMonth }}</h3>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p class="text-sm text-slate-500 mb-2">Km ovaj mjesec</p>
          <h3 class="text-3xl font-bold text-slate-800">{{ totalKmThisMonth }} km</h3>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p class="text-sm text-slate-500 mb-2">Zadnja posjeta</p>
          <template v-if="lastVisit">
            <p class="text-lg font-bold text-slate-800">{{ lastVisit.store?.name }}</p>
            <p class="text-sm text-slate-500">{{ lastVisit.store?.city }}</p>
            <p class="text-sm text-slate-500">{{ lastVisit.date }}</p>
            <p class="text-sm text-blue-600 font-medium">{{ lastVisit.kilometers }} km</p>
          </template>
          <p v-else class="text-slate-400 text-sm">Nema posjeta</p>
        </div>

      </section>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-slate-800">
              Zadnje posjete
            </h3>
            <button class="text-blue-600 font-medium hover:underline">
              Vidi sve
            </button>
          </div>

          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 text-sm">
                <th class="py-3 pr-4 font-medium">Trgovina</th>
                <th class="py-3 pr-4 font-medium">Grad</th>
                <th class="py-3 pr-4 font-medium">Datum</th>
                <th class="py-3 pr-4 font-medium">Bilješka</th>
                <th class="py-3 pr-4 font-medium">Km</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="visit in recentVisits"
                :key="visit._id"
                class="border-b border-slate-100"
              >
                <td class="py-4 pr-4 font-medium text-slate-800">
                  {{ visit.store?.name }}
                </td>
                <td class="py-4 pr-4 text-slate-600">
                  {{ visit.store?.city }}
                </td>
                <td class="py-4 pr-4 text-slate-600">
                  {{ visit.date }}
                </td>
                <td class="py-4 pr-4 text-slate-600">
                  {{ visit.note }}
                </td>
                <td class="py-4 pr-4 text-blue-600 font-medium">
                  {{ visit.kilometers }} km
                </td>
              </tr>
              <tr v-if="recentVisits.length === 0">
                <td colspan="5" class="py-8 text-center text-slate-400">Nema posjeta</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 class="text-xl font-semibold text-slate-800 mb-4">
            Brze akcije
          </h3>

          <div class="space-y-3">
            <button class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 transition">
              Dodaj novu trgovinu
            </button>

            <button class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 transition">
              Dodaj novu posjetu
            </button>

            <button class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 transition">
              Pregled statistike
            </button>
          </div>
        </div>

      </section>
    </main>
  </div>
</template>
