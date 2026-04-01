import api from './axios'

export default {
  getAll() {
    return api.get('/stores')
  },

  getById(id) {
    return api.get(`/stores/${id}`)
  },

  create(storeData) {
    return api.post('/stores', storeData)
  },

  update(id, storeData) {
    return api.patch(`/stores/${id}`, storeData)
  },

  remove(id) {
    return api.delete(`/stores/${id}`)
  },
}
