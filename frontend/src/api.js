import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Agrega el token JWT a cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sigetra_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expiró, redirige al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sigetra_token')
      localStorage.removeItem('sigetra_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
