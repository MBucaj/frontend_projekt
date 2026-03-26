<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/authService'

const router = useRouter()

const form = ref({
  username: '',
  password: '',
})

const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''

  try {
    loading.value = true

    const response = await authService.login({
      username: form.value.username,
      password: form.value.password,
    })

    localStorage.setItem('token', response.data.token)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.error || 'Prijava nije uspjela'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100">
    <img src="@/components/logo.png" alt="Logo" class="h-56 mb-6" />
    <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
      <h2 class="text-2xl font-bold text-center mb-6">Prijava</h2>

      <div v-if="error" class="mb-4 text-red-500 text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <input
          v-model="form.username"
          type="text"
          placeholder="Korisničko ime"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          v-model="form.password"
          type="password"
          placeholder="Lozinka"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {{ loading ? 'Prijava...' : 'Prijavi se' }}
        </button>
      </form>

      <p class="text-sm text-center mt-4">
        Nemaš račun?
        <router-link to="/register" class="text-blue-600 hover:underline">Registriraj se</router-link>
      </p>
    </div>
  </div>
</template>
