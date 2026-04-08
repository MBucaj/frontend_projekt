<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import categoriesService from '@/services/categoriesService'
import productsService from '@/services/productsService'

const categories = ref([])
const products = ref([])
const loading = ref(false)
const error = ref('')

const expandedId = ref(null)
const search = ref('')

const filteredCategories = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return categories.value
  return categories.value.filter(c => {
    if (c.name?.toLowerCase().includes(q)) return true
    return products.value.some(p =>
      p.categoryId?.toString() === c._id && p.name?.toLowerCase().includes(q)
    )
  })
})

const showForm = ref(false)
const editingCategory = ref(null)
const form = ref({ name: '' })
const formError = ref('')
const formLoading = ref(false)

const fetchAll = async () => {
  try {
    loading.value = true
    error.value = ''
    const [catRes, prodRes] = await Promise.all([
      categoriesService.getAll(),
      productsService.getAll(),
    ])
    categories.value = catRes.data
    products.value = prodRes.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu kategorija.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAll()
})

const productsForCategory = (categoryId) => {
  return products.value.filter(p => p.categoryId?.toString() === categoryId?.toString())
}

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

const openAdd = () => {
  editingCategory.value = null
  form.value = { name: '' }
  formError.value = ''
  showForm.value = true
}

const openEdit = (category) => {
  editingCategory.value = category
  form.value = { name: category.name }
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingCategory.value = null
  form.value = { name: '' }
  formError.value = ''
}

const submitForm = async () => {
  if (!form.value.name) {
    formError.value = 'Naziv je obavezan.'
    return
  }

  try {
    formLoading.value = true
    formError.value = ''

    if (editingCategory.value) {
      await categoriesService.update(editingCategory.value._id, form.value)
    } else {
      await categoriesService.create(form.value)
    }

    await fetchAll()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const deleteCategory = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovu kategoriju?')) return

  try {
    await categoriesService.remove(id)
    if (expandedId.value === id) expandedId.value = null
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Kategorije</h2>
      <button
        @click="openAdd"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj kategoriju
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingCategory ? 'Uredi kategoriju' : 'Nova kategorija' }}
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Naziv</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naziv kategorije"
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
      placeholder="Pretraži po nazivu kategorije ili proizvodu..."
      class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <!-- Lista kategorija -->
    <div class="space-y-3">
      <div
        v-for="category in filteredCategories"
        :key="category._id"
        class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <!-- Zaglavlje kategorije -->
        <div
          class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition"
          @click="toggleExpand(category._id)"
        >
          <div class="flex items-center gap-3">
            <span
              class="text-slate-400 text-xs transition-transform duration-200"
              :class="expandedId === category._id ? 'rotate-90' : ''"
            >
              ▶
            </span>
            <span class="font-semibold text-slate-800">{{ category.name }}</span>
            <span class="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
              {{ productsForCategory(category._id).length }}
              {{ productsForCategory(category._id).length === 1 ? 'proizvod' : 'proizvoda' }}
            </span>
          </div>

          <div class="flex items-center gap-3" @click.stop>
            <button @click="openEdit(category)" class="text-sm text-blue-600 hover:underline">
              Uredi
            </button>
            <button @click="deleteCategory(category._id)" class="text-sm text-red-500 hover:underline">
              Obriši
            </button>
          </div>
        </div>

        <!-- Ekspandirani prikaz proizvoda -->
        <div v-if="expandedId === category._id" class="border-t border-slate-100">
          <table v-if="productsForCategory(category._id).length > 0" class="w-full text-left text-sm">
            <thead>
              <tr class="bg-slate-50 text-slate-400 text-xs">
                <th class="py-2 px-6 font-medium">Naziv</th>
                <th class="py-2 px-6 font-medium">Cijena</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in productsForCategory(category._id)"
                :key="product._id"
                class="border-t border-slate-50 hover:bg-slate-50"
              >
                <td class="py-3 px-6 text-slate-700">{{ product.name }}</td>
                <td class="py-3 px-6 text-slate-500">{{ product.price }} eu</td>
              </tr>
            </tbody>
          </table>

          <p v-else class="py-4 px-6 text-sm text-slate-400">
            Nema proizvoda u ovoj kategoriji.
          </p>
        </div>
      </div>

      <div v-if="filteredCategories.length === 0 && !loading" class="bg-white rounded-2xl shadow-sm border border-slate-200 py-12 text-center text-slate-400">
        Nema rezultata
      </div>
    </div>
  </MainLayout>
</template>
