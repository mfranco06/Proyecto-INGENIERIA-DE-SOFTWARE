import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const emptyForm = { nombre: '', telefono: '', id_acceso: '' }

export default function Guardias() {
  const [guardias, setGuardias] = useState([])
  const [accesos, setAccesos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [g, a] = await Promise.all([api.get('/guardias'), api.get('/accesos')])
    setGuardias(g.data); setAccesos(a.data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm(emptyForm); setError(''); setModal('create') }
  function openEdit(g) { setForm({ nombre: g.nombre, telefono: g.telefono || '', id_acceso: g.id_acceso }); setCurrent(g); setError(''); setModal('edit') }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = { ...form, id_acceso: Number(form.id_acceso) }
      if (modal === 'create') await api.post('/guardias', payload)
      else await api.put(`/guardias/${current.id_guardia}`, payload)
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este guardia?')) return
    await api.delete(`/guardias/${id}`); load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Guardias</h2><p>Personal de seguridad asignado a accesos de estaciones</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo guardia</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" />Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Acceso asignado</th><th>Estación</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {guardias.map(g => (
                  <tr key={g.id_guardia}>
                    <td style={{ color: 'var(--gray-500)' }}>{g.id_guardia}</td>
                    <td><strong>{g.nombre}</strong></td>
                    <td>{g.telefono || '—'}</td>
                    <td>{g.acceso_descripcion || '—'}</td>
                    <td>{g.estacion_nombre || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(g)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(g.id_guardia)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {guardias.length === 0 && <div className="empty-state"><div className="empty-icon">💂</div><p>No hay guardias registrados</p></div>}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Nuevo guardia' : '✏️ Editar guardia'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </>
          }
        >
          {error && <div className="error-msg">⚠️ {error}</div>}
          <div className="form-group">
            <label>Nombre *</label>
            <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input className="form-control" type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="4444-0000" />
          </div>
          <div className="form-group">
            <label>Acceso asignado *</label>
            <select className="form-control" value={form.id_acceso} onChange={e => setForm({ ...form, id_acceso: e.target.value })}>
              <option value="">Seleccionar acceso...</option>
              {accesos.map(a => (
                <option key={a.id_acceso} value={a.id_acceso}>{a.descripcion} — {a.estacion_nombre}</option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}
