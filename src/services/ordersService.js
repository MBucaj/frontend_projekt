import api from './axios'

export default {
  getAll() {
    return api.get('/orders')
  },

  create(data) {
    return api.post('/orders', data)
  },

  remove(id) {
    return api.delete(`/orders/${id}`)
  },
}
