<script setup>
import { RouterLink } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import visitsService from '@/services/visitsService'
import storesService from '@/services/storesService'
const username = computed(() => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return 'Korisnik'
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.name || payload.username || payload.email || 'Korisnik'
  } catch {
    return 'Korisnik'
  }
})
const visits = ref([])
const stores = ref([])
const loading = ref(false)
const error = ref('')

const fetchVisits = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await visitsService.getAll()
    visits.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu posjeta.'
  } finally {
    loading.value = false
  }
}

const fetchStores = async () => {
  try {
    const response = await storesService.getAll()
    stores.value = response.data
  } catch {
    // tiha greška
  }
}

onMounted(() => {
  fetchVisits()
  fetchStores()
})

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

// --- Modal za trgovinu ---
const showStoreForm = ref(false)
const storeForm = ref({ name: '', city: '' })
const storeFormError = ref('')
const storeFormLoading = ref(false)

const openStoreForm = () => {
  storeForm.value = { name: '', city: '' }
  storeFormError.value = ''
  showStoreForm.value = true
}

const closeStoreForm = () => {
  showStoreForm.value = false
  storeForm.value = { name: '', city: '' }
  storeFormError.value = ''
}

const submitStoreForm = async () => {
  if (!storeForm.value.name || !storeForm.value.city) {
    storeFormError.value = 'Ime i grad su obavezni.'
    return
  }
  try {
    storeFormLoading.value = true
    storeFormError.value = ''
    await storesService.create(storeForm.value)
    await fetchStores()
    closeStoreForm()
  } catch (err) {
    storeFormError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    storeFormLoading.value = false
  }
}

// --- Modal za posjet ---
const showVisitForm = ref(false)
const visitForm = ref({ storeId: '', date: '', kilometers: '', note: '' })
const visitFormError = ref('')
const visitFormLoading = ref(false)

const openVisitForm = () => {
  visitForm.value = { storeId: '', date: '', kilometers: '', note: '' }
  visitFormError.value = ''
  showVisitForm.value = true
}

const closeVisitForm = () => {
  showVisitForm.value = false
  visitForm.value = { storeId: '', date: '', kilometers: '', note: '' }
  visitFormError.value = ''
}

const submitVisitForm = async () => {
  if (!visitForm.value.storeId || !visitForm.value.date || visitForm.value.kilometers === '' || !visitForm.value.note) {
    visitFormError.value = 'Sva polja su obavezna.'
    return
  }
  const payload = {
    storeId: visitForm.value.storeId,
    date: visitForm.value.date,
    kilometers: Number(visitForm.value.kilometers),
    note: visitForm.value.note,
  }
  try {
    visitFormLoading.value = true
    visitFormError.value = ''
    await visitsService.create(payload)
    await fetchVisits()
    closeVisitForm()
  } catch (err) {
    visitFormError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    visitFormLoading.value = false
  }
}
</script>

<template>
  <MainLayout>
    <section class="mb-8">
      <h2 class="text-3xl font-bold text-slate-800 mb-2">
        Dobrodošao, {{ username }}
      </h2>
      <p class="text-slate-500">
        Ovdje imaš pregled trgovina, posjeta i osnovne statistike.
      </p>
    </section>

    <div v-if="loading" class="mb-6 text-slate-500">
      Učitavanje podataka...
    </div>

    <div v-if="error" class="mb-6 text-red-500">
      {{ error }}
    </div>

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
          <h3 class="text-xl font-semibold text-slate-800">Zadnje posjete</h3>
          <RouterLink to="/visits" class="text-blue-600 font-medium hover:underline">
            Vidi sve
          </RouterLink>
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
              <td colspan="5" class="py-8 text-center text-slate-400">
                Nema posjeta
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-xl font-semibold text-slate-800 mb-4">
          Brze akcije
        </h3>

        <div class="space-y-3">
          <button
            @click="openStoreForm"
            class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 transition"
          >
            Dodaj novu trgovinu
          </button>

          <button
            @click="openVisitForm"
            class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-slate-50 transition"
          >
            Dodaj novu posjetu
          </button>

        </div>
      </div>
    </section>

    <!-- Modal: Nova trgovina -->
    <div v-if="showStoreForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Nova trgovina</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Ime</label>
            <input
              v-model="storeForm.name"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naziv trgovine"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Grad</label>
            <input
              v-model="storeForm.city"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Grad"
            />
          </div>
          <p v-if="storeFormError" class="text-red-500 text-sm">{{ storeFormError }}</p>
        </div>

        <div class="flex gap-3 mt-5">
          <button
            @click="submitStoreForm"
            :disabled="storeFormLoading"
            class="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {{ storeFormLoading ? 'Spremanje...' : 'Spremi' }}
          </button>
          <button
            @click="closeStoreForm"
            class="flex-1 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition text-sm"
          >
            Odustani
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Novi posjet -->
    <div v-if="showVisitForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Novi posjet</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Trgovina</label>
            <select
              v-model="visitForm.storeId"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Odaberi trgovinu</option>
              <option v-for="store in stores" :key="store._id" :value="store._id">
                {{ store.name }} — {{ store.city }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Datum</label>
            <input
              v-model="visitForm.date"
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Kilometri</label>
            <input
              v-model="visitForm.kilometers"
              type="number"
              min="0"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Bilješka</label>
            <textarea
              v-model="visitForm.note"
              rows="3"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bilješka o posjetu..."
            />
          </div>
          <p v-if="visitFormError" class="text-red-500 text-sm">{{ visitFormError }}</p>
        </div>

        <div class="flex gap-3 mt-5">
          <button
            @click="submitVisitForm"
            :disabled="visitFormLoading"
            class="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {{ visitFormLoading ? 'Spremanje...' : 'Spremi' }}
          </button>
          <button
            @click="closeVisitForm"
            class="flex-1 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition text-sm"
          >
            Odustani
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
