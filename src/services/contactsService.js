import api from './axios'

export default {
  getAll() {
    return api.get('/contacts')
  },

  create(data) {
    return api.post('/contacts', data)
  },

  update(id, data) {
    return api.patch(`/contacts/${id}`, data)
  },

  remove(id) {
    return api.delete(`/contacts/${id}`)
  },

  getStoreContacts() {
    return api.get('/storecontacts')
  },

  assignToStore(storeId, contactId) {
    return api.post('/storecontacts', { storeId, contactId })
  },

  removeFromStore(id) {
    return api.delete(`/storecontacts/${id}`)
  },
}
