<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import contactsService from '@/services/contactsService'
import storesService from '@/services/storesService'

const contacts = ref([])
const stores = ref([])
const storeContacts = ref([])
const loading = ref(false)
const error = ref('')

const search = ref('')

const filteredContacts = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return contacts.value
  return contacts.value.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.phone?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.role?.toLowerCase().includes(q)
  )
})

// --- Forma za kontakt ---
const showForm = ref(false)
const editingContact = ref(null)
const form = ref({ name: '', phone: '', email: '', role: '' })
const formError = ref('')
const formLoading = ref(false)

// --- Modal za dodjelu trgovini ---
const showAssignModal = ref(false)
const assignContact = ref(null)
const assignStoreId = ref('')
const assignError = ref('')
const assignLoading = ref(false)

const fetchAll = async () => {
  try {
    loading.value = true
    error.value = ''
    const [contactsRes, storesRes, scRes] = await Promise.all([
      contactsService.getAll(),
      storesService.getAll(),
      contactsService.getStoreContacts(),
    ])
    contacts.value = contactsRes.data
    stores.value = storesRes.data
    storeContacts.value = scRes.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri dohvatu podataka.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAll()
})

const assignedStores = (contactId) => {
  return storeContacts.value
    .filter(sc => sc.contactId?.toString() === contactId)
    .map(sc => {
      const store = stores.value.find(s => s._id === sc.storeId?.toString())
      return store ? { scId: sc._id, storeName: store.name, storeCity: store.city } : null
    })
    .filter(Boolean)
}

// --- CRUD kontakti ---
const openAdd = () => {
  editingContact.value = null
  form.value = { name: '', phone: '', email: '', role: '' }
  formError.value = ''
  showForm.value = true
}

const openEdit = (contact) => {
  editingContact.value = contact
  form.value = { name: contact.name, phone: contact.phone, email: contact.email, role: contact.role }
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingContact.value = null
  form.value = { name: '', phone: '', email: '', role: '' }
  formError.value = ''
}

const submitForm = async () => {
  if (!form.value.name || !form.value.phone || !form.value.email || !form.value.role) {
    formError.value = 'Sva polja su obavezna.'
    return
  }

  try {
    formLoading.value = true
    formError.value = ''

    if (editingContact.value) {
      await contactsService.update(editingContact.value._id, form.value)
    } else {
      await contactsService.create(form.value)
    }

    await fetchAll()
    closeForm()
  } catch (err) {
    formError.value = err.response?.data?.error || 'Greška pri spremanju.'
  } finally {
    formLoading.value = false
  }
}

const deleteContact = async (id) => {
  if (!confirm('Jesi li siguran da želiš obrisati ovaj kontakt?')) return

  try {
    await contactsService.remove(id)
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri brisanju.'
  }
}

// --- Dodjela trgovini ---
const openAssign = (contact) => {
  assignContact.value = contact
  assignStoreId.value = ''
  assignError.value = ''
  showAssignModal.value = true
}

const closeAssign = () => {
  showAssignModal.value = false
  assignContact.value = null
  assignStoreId.value = ''
  assignError.value = ''
}

const submitAssign = async () => {
  if (!assignStoreId.value) {
    assignError.value = 'Odaberi trgovinu.'
    return
  }

  try {
    assignLoading.value = true
    assignError.value = ''
    await contactsService.assignToStore(assignStoreId.value, assignContact.value._id)
    await fetchAll()
    closeAssign()
  } catch (err) {
    assignError.value = err.response?.data?.error || 'Greška pri dodjeli.'
  } finally {
    assignLoading.value = false
  }
}

const removeAssignment = async (scId) => {
  try {
    await contactsService.removeFromStore(scId)
    await fetchAll()
  } catch (err) {
    error.value = err.response?.data?.error || 'Greška pri uklanjanju.'
  }
}

const availableStores = (contactId) => {
  const assigned = storeContacts.value
    .filter(sc => sc.contactId?.toString() === contactId)
    .map(sc => sc.storeId?.toString())
  return stores.value.filter(s => !assigned.includes(s._id))
}
</script>

<template>
  <MainLayout>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Kontakti</h2>
      <button
        @click="openAdd"
        class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
      >
        + Dodaj kontakt
      </button>
    </div>

    <div v-if="loading" class="text-slate-500">Učitavanje...</div>
    <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

    <!-- Modal: Kontakt forma -->
    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">
          {{ editingContact ? 'Uredi kontakt' : 'Novi kontakt' }}
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Ime i prezime</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ime i prezime"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Telefon</label>
            <input
              v-model="form.phone"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+387..."
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@primjer.com"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-600 mb-1">Uloga</label>
            <input
              v-model="form.role"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="npr. Direktor, Voditelj nabave..."
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

    <!-- Modal: Dodjela trgovini -->
    <div v-if="showAssignModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-slate-800 mb-1">Dodjela trgovini</h3>
        <p class="text-sm text-slate-500 mb-4">{{ assignContact?.name }}</p>

        <!-- Već dodijeljene -->
        <div class="mb-4">
          <p class="text-sm font-medium text-slate-600 mb-2">Dodijeljene trgovine:</p>
          <div v-if="assignedStores(assignContact?._id).length === 0" class="text-sm text-slate-400">
            Nema dodijeljenih trgovina
          </div>
          <div
            v-for="item in assignedStores(assignContact?._id)"
            :key="item.scId"
            class="flex items-center justify-between py-1"
          >
            <span class="text-sm text-slate-700">{{ item.storeName }} — {{ item.storeCity }}</span>
            <button
              @click="removeAssignment(item.scId)"
              class="text-xs text-red-500 hover:underline"
            >
              Ukloni
            </button>
          </div>
        </div>

        <!-- Dodaj novu -->
        <div class="space-y-3 border-t border-slate-100 pt-4">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Dodaj u trgovinu</label>
            <select
              v-model="assignStoreId"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Odaberi trgovinu</option>
              <option
                v-for="store in availableStores(assignContact?._id)"
                :key="store._id"
                :value="store._id"
              >
                {{ store.name }} — {{ store.city }}
              </option>
            </select>
          </div>
          <p v-if="assignError" class="text-red-500 text-sm">{{ assignError }}</p>
        </div>

        <div class="flex gap-3 mt-5">
          <button
            @click="submitAssign"
            :disabled="assignLoading"
            class="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
          >
            {{ assignLoading ? 'Dodavanje...' : 'Dodaj' }}
          </button>
          <button
            @click="closeAssign"
            class="flex-1 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition text-sm"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>

    <input
      v-model="search"
      type="text"
      placeholder="Pretraži po imenu, telefonu, emailu ili ulozi..."
      class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <!-- Tablica -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-slate-200 text-slate-500 text-sm">
            <th class="py-3 px-6 font-medium">Ime</th>
            <th class="py-3 px-6 font-medium">Telefon</th>
            <th class="py-3 px-6 font-medium">Email</th>
            <th class="py-3 px-6 font-medium">Uloga</th>
            <th class="py-3 px-6 font-medium">Trgovine</th>
            <th class="py-3 px-6 font-medium text-right">Akcije</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="contact in filteredContacts"
            :key="contact._id"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="py-4 px-6 font-medium text-slate-800">{{ contact.name }}</td>
            <td class="py-4 px-6 text-slate-600">{{ contact.phone }}</td>
            <td class="py-4 px-6 text-slate-600">{{ contact.email }}</td>
            <td class="py-4 px-6 text-slate-600">{{ contact.role }}</td>
            <td class="py-4 px-6 text-slate-600">
              <span
                v-for="item in assignedStores(contact._id)"
                :key="item.scId"
                class="inline-block bg-slate-100 rounded-lg px-2 py-0.5 text-xs mr-1"
              >
                {{ item.storeName }}
              </span>
              <span v-if="assignedStores(contact._id).length === 0" class="text-slate-400 text-sm">—</span>
            </td>
            <td class="py-4 px-6 text-right space-x-2">
              <button @click="openAssign(contact)" class="text-sm text-green-600 hover:underline">
                Trgovine
              </button>
              <button @click="openEdit(contact)" class="text-sm text-blue-600 hover:underline">
                Uredi
              </button>
              <button @click="deleteContact(contact._id)" class="text-sm text-red-500 hover:underline">
                Obriši
              </button>
            </td>
          </tr>
          <tr v-if="filteredContacts.length === 0 && !loading">
            <td colspan="6" class="py-8 text-center text-slate-400">Nema dodanih kontakata</td>
          </tr>
        </tbody>
      </table>
    </div>
  </MainLayout>
</template>
