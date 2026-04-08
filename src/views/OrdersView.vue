<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import ordersService from '@/services/ordersService'
import visitsService from '@/services/visitsService'
import productsService from '@/services/productsService'
import storesService from '@/services/storesService'

const orders = ref([])
const visits = ref([])
const products = ref([])
const stores = ref([])
const loading = ref(false)
const error = ref('')

// --- Forma ---
const showForm = ref(false)
const selectedStoreId = ref('')
const selectedVisitId = ref('')
const formItems = ref([{ productId: '', quantity: '' }])
const formError = ref('')
const formLoading = ref(false)

const fetchAll = async () => {
  try {
    loading.value = true
    error.value = ''
    const [ordersRes, visitsRes, productsRes, storesRes] = await Promise.all([
      ordersService.getAll(),
      visitsService.getAll(),
      productsService.getAll(),
      storesService.getAll(),
    ])
    orders.value = ordersRes.data
    visits.value = visitsRes.data
    products.value = productsRes.data
    stores.value = storesRes.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu podataka.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAll()
})

// Filtrira posjete po odabranoj trgovini
const filteredVisits = computed(() => {
  if (!selectedStoreId.value) return []
  return visits.value.filter(v => v.storeId?.toString() === selectedStoreId.value || v.store?._id?.toString() === selectedStoreId.value)
})


const visitLabel = (visitId) => {
  const v = visits.value.find(v => v._id?.toString() === visitId?.toString())
  if (!v) return '—'
  return `${v.store?.name} — ${v.date}`
}

const productById = (productId) => {
  return products.value.find(p => p._id === productId?.toString()) || null
}

const orderTotal = (order) => {
  if (!order.items) return 0
  return order.items.reduce((sum, item) => {
    const p = productById(item.productId)
    return sum + (p ? p.price * item.quantity : 0)
  }, 0)
}


// --- Upravljanje stavkama forme ---
const addItem = () => {
  formItems.value.push({ productId: '', quantity: '' })
}

const removeItem = (index) => {
  if (formItems.value.length > 1) {
    formItems.value.splice(index, 1)
  }
}

const openForm = () => {
  selectedStoreId.value = ''
  selectedVisitId.value = ''
  formItems.value = [{ productId: '', quantity: '' }]
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  selectedStoreId.value = ''
  selectedVisitId.value = ''
  formItems.value = [{ productId: '', quantity: '' }]
  formError.value = ''
}

const onStoreChange = () => {
  selectedVisitId.value = ''
}

const submitForm = async () => {
  if (!selectedVisitId.value) {
    formError.value = 'Odaberi posjet.'
    return
  }
  if (formItems.value.some(i => !i.productId || i.quantity === '')) {
    formError.value = 'Svaki red mora imati odabran proizvod i količinu.'
    return
  }

  try {
    formLoading.value = true
    formError.value = ''
    await ordersService.create({
      visitId: selectedVisitId.value,
      items: formItems.value.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
      })),
    })
    await fetchAll()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const search = ref('')

const filteredOrders = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return orders.value
  return orders.value.filter(o => {
    const v = visits.value.find(v => v._id === o.visitId?.toString())
    if (v?.store?.name?.toLowerCase().includes(q)) return true
    if (v?.date?.toLowerCase().includes(q)) return true
    return o.items?.some(item => {
      const p = productById(item.productId)
      return p?.name?.toLowerCase().includes(q)
    })
  })
})

const deleteOrder = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovu narudžbu?')) return

  try {
    await ordersService.remove(id)
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Narudžbe</h2>
      <button
        @click="openForm"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj narudžbu
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">Nova narudžba</h3>

        <div class="space-y-4">
          <!-- Odabir trgovine -->
          <div>
            <label class="block text-sm text-slate-600 mb-1">Trgovina</label>
            <select
              v-model="selectedStoreId"
              @change="onStoreChange"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Odaberi trgovinu</option>
              <option v-for="store in stores" :key="store._id" :value="store._id">
                {{ store.name }} — {{ store.city }}
              </option>
            </select>
          </div>

          <!-- Odabir posjeta (filtriran po trgovini) -->
          <div>
            <label class="block text-sm text-slate-600 mb-1">Posjet</label>
            <select
              v-model="selectedVisitId"
              :disabled="!selectedStoreId"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="" disabled>
                {{ selectedStoreId ? 'Odaberi posjet' : 'Prvo odaberi trgovinu' }}
              </option>
              <option v-for="visit in filteredVisits" :key="visit._id" :value="visit._id">
                {{ visit.date }} — {{ visit.note }}
              </option>
            </select>
            <p v-if="selectedStoreId && filteredVisits.length === 0" class="text-xs text-slate-400 mt-1">
              Nema posjeta za ovu trgovinu.
            </p>
          </div>

          <!-- Stavke narudžbe -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm text-slate-600">Proizvodi</label>
              <button
                @click="addItem"
                class="text-xs text-blue-600 hover:underline"
              >
                + Dodaj red
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(item, index) in formItems"
                :key="index"
                class="flex gap-2 items-center"
              >
                <select
                  v-model="item.productId"
                  class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Odaberi proizvod</option>
                  <option v-for="product in products" :key="product._id" :value="product._id">
                    {{ product.name }} — {{ product.price }} eu
                  </option>
                </select>

                <div class="relative w-36">
                  <input
                    v-model="item.quantity"
                    type="number"
                    min="1"
                    class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                    placeholder="0"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    kartona
                  </span>
                </div>

                <button
                  @click="removeItem(index)"
                  :disabled="formItems.length === 1"
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
            {{ formLoading ? 'Spremanje...' : 'Spremi narudžbu' }}
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
      placeholder="Pretraži po trgovini, datumu ili proizvodu..."
      class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <!-- Lista narudžbi -->
    <div class="space-y-4">
      <div
        v-for="order in filteredOrders"
        :key="order._id"
        class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-semibold text-slate-800">{{ visitLabel(order.visitId) }}</p>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-slate-800">
              Ukupno: {{ orderTotal(order).toFixed(2) }} eu
            </span>
            <button
              @click="deleteOrder(order._id)"
              class="text-sm text-red-500 hover:underline"
            >
              Obriši
            </button>
          </div>
        </div>

        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400">
              <th class="pb-2 font-medium">Proizvod</th>
              <th class="pb-2 font-medium">Cijena/kom</th>
              <th class="pb-2 font-medium">Količina</th>
              <th class="pb-2 font-medium text-right">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, i) in order.items"
              :key="i"
              class="border-b border-slate-50"
            >
              <td class="py-2 text-slate-800">{{ productById(item.productId)?.name || '—' }}</td>
              <td class="py-2 text-slate-600">{{ productById(item.productId)?.price ?? '—' }} eu</td>
              <td class="py-2 text-slate-600">
                {{ item.quantity }}
                <span class="text-slate-400">({{ item.quantity }} kartona)</span>
              </td>
              <td class="py-2 text-right font-medium text-slate-800">
                {{ productById(item.productId) ? (productById(item.productId).price * item.quantity).toFixed(2) + ' eu' : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredOrders.length === 0 && !loading" class="bg-white rounded-2xl shadow-sm border border-slate-200 py-12 text-center text-slate-400">
        Nema dodanih narudžbi
      </div>
    </div>

  </MainLayout>
</template>
