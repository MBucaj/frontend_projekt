import api from './axios'

export default {
  getAll() {
    return api.get('/products')
  },

  create(data) {
    return api.post('/products', data)
  },

  update(id, data) {
    return api.patch(`/products/${id}`, data)
  },

  remove(id) {
    return api.delete(`/products/${id}`)
  },
}
