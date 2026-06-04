import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const emptyForm = { nombre: '', telefono: '', id_estacion: '' }

export default function Operadores() {
  const [operadores, setOperadores] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [o, e] = await Promise.all([api.get('/operadores'), api.get('/estaciones')])
    setOperadores(o.data); setEstaciones(e.data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm(emptyForm); setError(''); setModal('create') }
  function openEdit(o) { setForm({ nombre: o.nombre, telefono: o.telefono || '', id_estacion: o.id_estacion }); setCurrent(o); setError(''); setModal('edit') }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = { ...form, id_estacion: Number(form.id_estacion) }
      if (modal === 'create') await api.post('/operadores', payload)
      else await api.put(`/operadores/${current.id_operador}`, payload)
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este operador?')) return
    await api.delete(`/operadores/${id}`); load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Operadores</h2><p>Personal asignado a la atención de estaciones</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo operador</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" />Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Estación asignada</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {operadores.map(o => (
                  <tr key={o.id_operador}>
                    <td style={{ color: 'var(--gray-500)' }}>{o.id_operador}</td>
                    <td><strong>{o.nombre}</strong></td>
                    <td>{o.telefono || '—'}</td>
                    <td>{o.estacion_nombre || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(o)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(o.id_operador)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {operadores.length === 0 && <div className="empty-state"><div className="empty-icon">🎧</div><p>No hay operadores registrados</p></div>}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Nuevo operador' : '✏️ Editar operador'}
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
            <input className="form-control" type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="3333-0000" />
          </div>
          <div className="form-group">
            <label>Estación asignada *</label>
            <select className="form-control" value={form.id_estacion} onChange={e => setForm({ ...form, id_estacion: e.target.value })}>
              <option value="">Seleccionar estación...</option>
              {estaciones.map(e => (
                <option key={e.id_estacion} value={e.id_estacion}>{e.nombre}</option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}
