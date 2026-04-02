<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import visitsService from '@/services/visitsService'
import storesService from '@/services/storesService'

const route = useRoute()
const search = ref('')

const visits = ref([])
const stores = ref([])
const loading = ref(false)
const error = ref('')

const showForm = ref(false)
const editingVisit = ref(null)
const form = ref({ storeId: '', date: '', kilometers: '', note: '' })
const formError = ref('')
const formLoading = ref(false)

const fetchVisits = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await visitsService.getAll()
    visits.value = response.data.sort((a, b) => new Date(b.date) - new Date(a.date))
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
    // tiha greška, stores su samo za dropdown
  }
}

onMounted(() => {
  fetchVisits()
  fetchStores()
  if (route.query.add === '1') {
    openAdd()
  }
})

const openAdd = () => {
  editingVisit.value = null
  form.value = { storeId: '', date: '', kilometers: '', note: '' }
  formError.value = ''
  showForm.value = true
}

const openEdit = (visit) => {
  editingVisit.value = visit
  form.value = {
    storeId: visit.storeId,
    date: visit.date,
    kilometers: visit.kilometers,
    note: visit.note,
  }
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingVisit.value = null
  form.value = { storeId: '', date: '', kilometers: '', note: '' }
  formError.value = ''
}

const submitForm = async () => {
  if (!form.value.storeId || !form.value.date || form.value.kilometers === '' || !form.value.note) {
    formError.value = 'Sva polja su obavezna.'
    return
  }

  const payload = {
    storeId: form.value.storeId,
    date: form.value.date,
    kilometers: Number(form.value.kilometers),
    note: form.value.note,
  }

  try {
    formLoading.value = true
    formError.value = ''

    if (editingVisit.value) {
      await visitsService.update(editingVisit.value._id, payload)
    } else {
      await visitsService.create(payload)
    }

    await fetchVisits()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const filteredVisits = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return visits.value

  return visits.value.filter(v => {
    return (
      v.store?.name?.toLowerCase().includes(q) ||
      v.store?.city?.toLowerCase().includes(q) ||
      v.note?.toLowerCase().includes(q)
    )
  })
})


const deleteVisit = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovaj posjet?')) return

  try {
    await visitsService.remove(id)
    await fetchVisits()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Posjeti</h2>
      <button
        @click="openAdd"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj posjet
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingVisit ? 'Uredi posjet' : 'Novi posjet' }}
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Trgovina</label>
            <select
              v-model="form.storeId"
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
              v-model="form.date"
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm text-slate-600 mb-1">Kilometri</label>
            <input
              v-model="form.kilometers"
              type="number"
              min="0"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label class="block text-sm text-slate-600 mb-1">Bilješka</label>
            <textarea
              v-model="form.note"
              rows="3"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bilješka o posjetu..."
            />
          </div>

          <p v-if="formError" class="text-red-500 text-sm">{{ formError }}</p>
        </div>

        <div class="flex gap-3 mt-5">
          <button
            @click="submitForm"
            :disabled="formLoading"
            class="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {{ formLoading ? 'Spremanje...' : 'Spremi' }}
          </button>
          <button
            @click="closeForm"
            class="flex-1 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition text-sm"
          >
            Odustani
          </button>
        </div>
      </div>
    </div>

    <input
    v-model="search"
    type="text"
    placeholder="Pretraži po trgovini, gradu, bilješci..."
   class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"/>


    <!-- Tablica -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-slate-200 text-slate-500 text-sm">
            <th class="py-3 px-6 font-medium">Trgovina</th>
            <th class="py-3 px-6 font-medium">Grad</th>
            <th class="py-3 px-6 font-medium">Datum</th>
            <th class="py-3 px-6 font-medium">Bilješka</th>
            <th class="py-3 px-6 font-medium">Km</th>
            <th class="py-3 px-6 font-medium text-right">Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="visit in filteredVisits"
            :key="visit._id"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="py-4 px-6 font-medium text-slate-800">{{ visit.store?.name }}</td>
            <td class="py-4 px-6 text-slate-600">{{ visit.store?.city }}</td>
            <td class="py-4 px-6 text-slate-600">{{ visit.date }}</td>
            <td class="py-4 px-6 text-slate-600">{{ visit.note }}</td>
            <td class="py-4 px-6 text-blue-600 font-medium">{{ visit.kilometers }} km</td>
            <td class="py-4 px-6 text-right space-x-2">
              <button @click="openEdit(visit)" class="text-sm text-blue-600 hover:underline">
                Uredi
              </button>
              <button @click="deleteVisit(visit._id)" class="text-sm text-red-500 hover:underline">
                Obriši
              </button>
            </td>
          </tr>
          <tr v-if="filteredVisits.length === 0 && !loading">
            <td colspan="6" class="py-8 text-center text-slate-400">Nema dodanih posjeta</td>
          </tr>
        </tbody>
      </table>
    </div>
  </MainLayout>
</template>
