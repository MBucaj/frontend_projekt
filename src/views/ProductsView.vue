<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import productsService from '@/services/productsService'
import categoriesService from '@/services/categoriesService'

const products = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return products.value
  return products.value.filter(p => {
    const cat = categories.value.find(c => c._id === p.categoryId?.toString())
    return (
      p.name?.toLowerCase().includes(q) ||
      cat?.name?.toLowerCase().includes(q)
    )
  })
})

const showForm = ref(false)
const editingProduct = ref(null)
const form = ref({ name: '', price: '', categoryId: '' })
const formError = ref('')
const formLoading = ref(false)

const fetchProducts = async () => {
  try {
    loading.value = true
    error.value = ''
    const response = await productsService.getAll()
    products.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu proizvoda.'
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const response = await categoriesService.getAll()
    categories.value = response.data
  } catch {
    // tiha greška
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})

const categoryName = (categoryId) => {
  const cat = categories.value.find(c => c._id === categoryId?.toString())
  return cat ? cat.name : '—'
}

const openAdd = () => {
  editingProduct.value = null
  form.value = { name: '', price: '', categoryId: '' }
  formError.value = ''
  showForm.value = true
}

const openEdit = (product) => {
  editingProduct.value = product
  form.value = {
    name: product.name,
    price: product.price,
    categoryId: product.categoryId?.toString() || '',
  }
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingProduct.value = null
  form.value = { name: '', price: '', categoryId: '' }
  formError.value = ''
}

const submitForm = async () => {
  if (!form.value.name || form.value.price === '' || !form.value.categoryId) {
    formError.value = 'Sva polja su obavezna.'
    return
  }

  const payload = {
    name: form.value.name,
    price: Number(form.value.price),
    categoryId: form.value.categoryId,
  }

  try {
    formLoading.value = true
    formError.value = ''

    if (editingProduct.value) {
      await productsService.update(editingProduct.value._id, payload)
    } else {
      await productsService.create(payload)
    }

    await fetchProducts()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const deleteProduct = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovaj proizvod?')) return

  try {
    await productsService.remove(id)
    await fetchProducts()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Proizvodi</h2>
      <button
        @click="openAdd"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj proizvod
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingProduct ? 'Uredi proizvod' : 'Novi proizvod' }}
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Naziv</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naziv proizvoda"
            />
          </div>

          <div>
            <label class="block text-sm text-slate-600 mb-1">Cijena (eu)</label>
            <input
              v-model="form.price"
              type="number"
              min="0"
              step="0.01"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label class="block text-sm text-slate-600 mb-1">Kategorija</label>
            <select
              v-model="form.categoryId"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Odaberi kategoriju</option>
              <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
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
      placeholder="Pretraži po nazivu ili kategoriji..."
      class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <!-- Tablica -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-slate-200 text-slate-500 text-sm">
            <th class="py-3 px-6 font-medium">Naziv</th>
            <th class="py-3 px-6 font-medium">Kategorija</th>
            <th class="py-3 px-6 font-medium">Cijena</th>
            <th class="py-3 px-6 font-medium text-right">Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in filteredProducts"
            :key="product._id"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="py-4 px-6 font-medium text-slate-800">{{ product.name }}</td>
            <td class="py-4 px-6 text-slate-600">{{ categoryName(product.categoryId) }}</td>
            <td class="py-4 px-6 text-slate-600">{{ product.price }} eu</td>
            <td class="py-4 px-6 text-right space-x-2">
              <button @click="openEdit(product)" class="text-sm text-blue-600 hover:underline">
                Uredi
              </button>
              <button @click="deleteProduct(product._id)" class="text-sm text-red-500 hover:underline">
                Obriši
              </button>
            </td>
          </tr>
          <tr v-if="filteredProducts.length === 0 && !loading">
            <td colspan="4" class="py-8 text-center text-slate-400">Nema rezultata</td>
          </tr>
        </tbody>
      </table>
    </div>
  </MainLayout>
</template>
