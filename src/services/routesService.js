import api from './axios'

export default {
  getAll() {
    return api.get('/routes')
  },

  create(data) {
    return api.post('/routes', data)
  },

  update(id, data) {
    return api.patch(`/routes/${id}`, data)
  },

  remove(id) {
    return api.delete(`/routes/${id}`)
  },

  complete(id) {
    return api.post(`/routes/${id}/complete`)
  },

  copy(id) {
    return api.post(`/routes/${id}/copy`)
  },
}
