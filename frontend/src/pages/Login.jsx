import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/login', form)
      localStorage.setItem('sigetra_token', data.token)
      localStorage.setItem('sigetra_user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">🚌</span>
          <h1>SIGETRA</h1>
          <p>Sistema Integral de Gestión de Transmetro</p>
        </div>

        <h2>Iniciar sesión</h2>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input
              className="form-control"
              type="text"
              placeholder="Ingresa tu usuario"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              className="form-control"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? '⏳ Verificando...' : '🔐 Iniciar sesión'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Usuarios de prueba:</strong><br />
          admin / password · operador1 / password
        </div>
      </div>
    </div>
  )
}
