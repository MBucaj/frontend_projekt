import api from './axios'

export default {
  getAll() {
    return api.get('/categories')
  },

  create(data) {
    return api.post('/categories', data)
  },

  update(id, data) {
    return api.patch(`/categories/${id}`, data)
  },

  remove(id) {
    return api.delete(`/categories/${id}`)
  },
}
