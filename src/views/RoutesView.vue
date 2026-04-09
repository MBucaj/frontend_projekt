<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import routesService from '@/services/routesService'
import storesService from '@/services/storesService'

const currentRoute = useRoute()
const routes = ref([])
const stores = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const filterStatus = ref('sve')
const highlightedId = ref(null)

const showForm = ref(false)
const editingRoute = ref(null)
const form = ref({ name: '', date: '', note: '', stops: [{ storeId: '', kilometers: '' }] })
const formError = ref('')
const formLoading = ref(false)

const fetchAll = async () => {
  try {
    loading.value = true
    error.value = ''
    const [routesRes, storesRes] = await Promise.all([
      routesService.getAll(),
      storesService.getAll(),
    ])
    routes.value = routesRes.data
    stores.value = storesRes.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu podataka.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchAll()
  if (currentRoute.query.add === '1') {
    openAdd()
  } else if (currentRoute.query.id) {
    highlightedId.value = currentRoute.query.id
    await nextTick()
    const el = document.getElementById(`route-${currentRoute.query.id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

const totalKm = (route) =>
  (route.stops || []).reduce((sum, s) => sum + (s.kilometers || 0), 0)

const filteredRoutes = computed(() => {
  let result = routes.value

  if (filterStatus.value !== 'sve') {
    result = result.filter(r => r.status === filterStatus.value)
  }

  const q = search.value.toLowerCase().trim()
  if (q) {
    result = result.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.stops?.some(s => s.store?.name?.toLowerCase().includes(q) || s.store?.city?.toLowerCase().includes(q))
    )
  }

  return result
})

// --- Forma ---
const addStop = () => {
  form.value.stops.push({ storeId: '', kilometers: '' })
}

const removeStop = (index) => {
  if (form.value.stops.length > 1) {
    form.value.stops.splice(index, 1)
  }
}

const openAdd = () => {
  editingRoute.value = null
  form.value = { name: '', date: '', note: '', stops: [{ storeId: '', kilometers: '' }] }
  formError.value = ''
  showForm.value = true
}

const openEdit = (route) => {
  editingRoute.value = route
  form.value = {
    name: route.name,
    date: route.date,
    note: route.note || '',
    stops: route.stops.map(s => ({
      storeId: s.storeId?.toString(),
      kilometers: s.kilometers,
    })),
  }
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingRoute.value = null
  form.value = { name: '', date: '', note: '', stops: [{ storeId: '', kilometers: '' }] }
  formError.value = ''
}

const submitForm = async () => {
  if (!form.value.name || !form.value.date) {
    formError.value = 'Naziv i datum su obavezni.'
    return
  }
  if (form.value.stops.some(s => !s.storeId || s.kilometers === '')) {
    formError.value = 'Svaka stanica mora imati odabranu trgovinu i kilometre.'
    return
  }

  const payload = {
    name: form.value.name,
    date: form.value.date,
    note: form.value.note,
    stops: form.value.stops.map(s => ({
      storeId: s.storeId,
      kilometers: Number(s.kilometers),
    })),
  }

  try {
    formLoading.value = true
    formError.value = ''
    if (editingRoute.value) {
      await routesService.update(editingRoute.value._id, payload)
    } else {
      await routesService.create(payload)
    }
    await fetchAll()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const deleteRoute = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovu rutu?')) return
  try {
    await routesService.remove(id)
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}

const completeRoute = async (id) => {
  if (!confirm('Završiti rutu? Automatski će se kreirati posjeti za sve stanice.')) return
  try {
    await routesService.complete(id)
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri završavanju rute.'
  }
}

const copyRoute = async (id) => {
  try {
    await routesService.copy(id)
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri kopiranju rute.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Rute</h2>
      <button
        @click="openAdd"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj rutu
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingRoute ? 'Uredi rutu' : 'Nova ruta' }}
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Naziv</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="npr. Pula obilazak"
            />
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
            <label class="block text-sm text-slate-600 mb-1">Bilješka</label>
            <textarea
              v-model="form.note"
              rows="2"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Opcionalna bilješka..."
            />
          </div>

          <!-- Stanice -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm text-slate-600">Stanice</label>
              <button @click="addStop" class="text-xs text-blue-600 hover:underline">+ Dodaj stanicu</button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(stop, index) in form.stops"
                :key="index"
                class="flex gap-2 items-center"
              >
                <select
                  v-model="stop.storeId"
                  class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Odaberi trgovinu</option>
                  <option v-for="store in stores" :key="store._id" :value="store._id">
                    {{ store.name }} — {{ store.city }}
                  </option>
                </select>

                <div class="relative w-32">
                  <input
                    v-model="stop.kilometers"
                    type="number"
                    min="0"
                    class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    placeholder="0"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">km</span>
                </div>

                <button
                  @click="removeStop(index)"
                  :disabled="form.stops.length === 1"
                  class="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-red-500 text-sm">{{ formError }}</p>
        </div>

        <div class="flex gap-3 mt-5">
          <button
            @click="submitForm"
            :disabled="formLoading"
            class="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {{ formLoading ? 'Spremanje...' : 'Spremi rutu' }}
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

    <!-- Search + filter -->
    <div class="flex gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Pretraži po nazivu ili trgovini..."
        class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        v-model="filterStatus"
        class="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="sve">Sve</option>
        <option value="planirana">Planirane</option>
        <option value="završena">Završene</option>
      </select>
    </div>

    <!-- Lista ruta -->
    <div class="space-y-4">
      <div
        v-for="route in filteredRoutes"
        :key="route._id"
        :id="`route-${route._id}`"
        class="bg-white rounded-2xl shadow-sm border p-5 transition-colors duration-500"
        :class="highlightedId === route._id.toString() ? 'border-purple-400 bg-purple-50' : 'border-slate-200'"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-slate-800">{{ route.name }}</h3>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="route.status === 'završena'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'"
              >
                {{ route.status }}
              </span>
            </div>
            <p class="text-sm text-slate-500">{{ route.date }}</p>
            <p v-if="route.note" class="text-sm text-slate-400 mt-1">{{ route.note }}</p>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <span class="text-sm font-bold text-slate-700">{{ totalKm(route) }} km ukupno</span>
            <button
              v-if="route.status === 'planirana'"
              @click="completeRoute(route._id)"
              class="text-sm text-green-600 hover:underline font-medium"
            >
              Završi
            </button>
            <button
              v-if="route.status === 'planirana'"
              @click="openEdit(route)"
              class="text-sm text-blue-600 hover:underline"
            >
              Uredi
            </button>
            <button
              @click="copyRoute(route._id)"
              class="text-sm text-slate-500 hover:underline"
            >
              Kopiraj
            </button>
            <button
              @click="deleteRoute(route._id)"
              class="text-sm text-red-500 hover:underline"
            >
              Obriši
            </button>
          </div>
        </div>

        <!-- Stanice -->
        <div class="border-t border-slate-100 pt-3 space-y-2">
          <div
            v-for="(stop, i) in route.stops"
            :key="i"
            class="flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-2">
              <span class="text-slate-400 text-xs w-5 text-center">{{ i + 1 }}.</span>
              <span class="font-medium text-slate-700">{{ stop.store?.name }}</span>
              <span class="text-slate-400">{{ stop.store?.city }}</span>
            </div>
            <span class="text-blue-600 font-medium">{{ stop.kilometers }} km</span>
          </div>
        </div>
      </div>

      <div v-if="filteredRoutes.length === 0 && !loading" class="bg-white rounded-2xl shadow-sm border border-slate-200 py-12 text-center text-slate-400">
        Nema ruta
      </div>
    </div>
  </MainLayout>
</template>
