<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import storesService from '@/services/storesService'

const stores = ref([])
const loading = ref(false)
const error = ref('')

const showForm = ref(false)
const editingStore = ref(null)
const form = ref({ name: '', city: '' })
const formError = ref('')
const formLoading = ref(false)

const fetchStores = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await storesService.getAll()
    stores.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu trgovina.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStores()
})

const openAdd = () => {
  editingStore.value = null
  form.value = { name: '', city: '' }
  formError.value = ''
  showForm.value = true
}

const openEdit = (store) => {
  editingStore.value = store
  form.value = { name: store.name, city: store.city }
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingStore.value = null
  form.value = { name: '', city: '' }
  formError.value = ''
}

const submitForm = async () => {
  if (!form.value.name || !form.value.city) {
    formError.value = 'Ime i grad su obavezni.'
    return
  }

  try {
    formLoading.value = true
    formError.value = ''

    if (editingStore.value) {
      await storesService.update(editingStore.value._id, form.value)
    } else {
      await storesService.create(form.value)
    }

    await fetchStores()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const deleteStore = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovu trgovinu?')) return

  try {
    await storesService.remove(id)
    await fetchStores()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Trgovine</h2>
      <button
        @click="openAdd"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj trgovinu
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingStore ? 'Uredi trgovinu' : 'Nova trgovina' }}
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Ime</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naziv trgovine"
            />
          </div>

          <div>
            <label class="block text-sm text-slate-600 mb-1">Grad</label>
            <input
              v-model="form.city"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Grad"
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

    <!-- Tablica -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-slate-200 text-slate-500 text-sm">
            <th class="py-3 px-6 font-medium">Ime</th>
            <th class="py-3 px-6 font-medium">Grad</th>
            <th class="py-3 px-6 font-medium text-right">Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="store in stores"
            :key="store._id"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="py-4 px-6 font-medium text-slate-800">{{ store.name }}</td>
            <td class="py-4 px-6 text-slate-600">{{ store.city }}</td>
            <td class="py-4 px-6 text-right space-x-2">
              <button @click="openEdit(store)" class="text-sm text-blue-600 hover:underline">
                Uredi
              </button>
              <button @click="deleteStore(store._id)" class="text-sm text-red-500 hover:underline">
                Obriši
              </button>
            </td>
          </tr>
          <tr v-if="stores.length === 0 && !loading">
            <td colspan="3" class="py-8 text-center text-slate-400">Nema dodanih trgovina</td>
          </tr>
        </tbody>
      </table>
    </div>
  </MainLayout>
</template>
