// Typed API helpers using apiFetch

const API = {
  auth: {
    register: (data) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
    me: () => apiFetch('/api/auth/me')
  },
  users: {
    get: (id) => apiFetch(`/api/users/${id}`),
    updateProfile: (data) => apiFetch('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    list: (page = 1) => apiFetch(`/api/users?page=${page}`)
  },
  gigs: {
    create: (data) => apiFetch('/api/gigs', { method: 'POST', body: JSON.stringify(data) }),
    list: (params = '') => apiFetch(`/api/gigs${params}`),
    get: (id) => apiFetch(`/api/gigs/${id}`),
    updateStatus: (id, status) => apiFetch(`/api/gigs/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
  },
  comments: {
    create: (data) => apiFetch('/api/comments', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/api/comments/${id}`, { method: 'DELETE' })
  },
  messages: {
    send: (data) => apiFetch('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
    conversation: (userId, gigId) => apiFetch(`/api/messages/conversation/${userId}${gigId ? `?gig_id=${gigId}` : ''}`),
    conversations: () => apiFetch('/api/messages/conversations'),
    markRead: (userId) => apiFetch(`/api/messages/read/${userId}`, { method: 'PUT' })
  },
  notifications: {
    unread: () => apiFetch('/api/notifications/unread'),
    all: (page = 1) => apiFetch(`/api/notifications?page=${page}`),
    markRead: (id) => apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiFetch('/api/notifications/read-all', { method: 'PUT' })
  },
  admin: {
    banUser: (id, ban) => apiFetch(`/api/admin/users/${id}/ban`, { method: 'PUT', body: JSON.stringify({ ban }) }),
    verifyUser: (id) => apiFetch(`/api/admin/users/${id}/verify`, { method: 'PUT' }),
    deleteGig: (id) => apiFetch(`/api/admin/gigs/${id}`, { method: 'DELETE' }),
    deleteComment: (id) => apiFetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
  }
};
