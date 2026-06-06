import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const emptyForm = { ubicacion: '', zona: '', capacidad: '' }

export default function Parqueos() {
  const [parqueos, setParqueos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const r = await api.get('/parqueos')
    setParqueos(r.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm(emptyForm); setError(''); setModal('create') }
  function openEdit(p) {
    setForm({ ubicacion: p.ubicacion, zona: p.zona || '', capacidad: p.capacidad || '' })
    setCurrent(p); setError(''); setModal('edit')
  }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = { ...form, capacidad: Number(form.capacidad) || 0 }
      if (modal === 'create') await api.post('/parqueos', payload)
      else await api.put(`/parqueos/${current.id_parqueo}`, payload)
      setModal(null); load()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este parqueo?')) return
    try {
      await api.delete(`/parqueos/${id}`)
      load()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al eliminar')
    }
  }

  const occ = (p) => p.capacidad > 0 ? Math.round(p.buses_actuales / p.capacidad * 100) : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Parqueos</h2>
          <p>Gestión de parqueos y espacios de estacionamiento para buses</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Agregar parqueo</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /> Cargando...</div>
        ) : parqueos.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🅿️</div><p>No hay parqueos registrados</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Nombre</th><th>Zona</th><th>Capacidad</th><th>Ocupación</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parqueos.map(p => {
                  const pct = occ(p)
                  return (
                    <tr key={p.id_parqueo}>
                      <td style={{ color: 'var(--gray-500)' }}>{p.id_parqueo}</td>
                      <td><strong>{p.ubicacion}</strong></td>
                      <td>{p.zona || <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>{p.capacidad > 0 ? `${p.capacidad} buses` : <span style={{ color: 'var(--gray-300)' }}>Sin límite</span>}</td>
                      <td>
                        {p.capacidad > 0 ? (
                          <div style={{ minWidth: 130 }}>
                            <span style={{ fontSize: 12 }}>{p.buses_actuales} / {p.capacidad} ({pct}%)</span>
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13 }}>{p.buses_actuales} buses asignados</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Editar">✏️</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id_parqueo)} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Agregar parqueo' : '✏️ Editar parqueo'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="form-group">
            <label>Nombre del parqueo *</label>
            <input
              className="form-control"
              value={form.ubicacion}
              onChange={e => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej: Parqueo Central"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Zona</label>
              <input
                className="form-control"
                value={form.zona}
                onChange={e => setForm({ ...form, zona: e.target.value })}
                placeholder="Ej: Zona 1"
              />
            </div>
            <div className="form-group">
              <label>Capacidad (buses)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.capacidad}
                onChange={e => setForm({ ...form, capacidad: e.target.value })}
                placeholder="Ej: 20"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
