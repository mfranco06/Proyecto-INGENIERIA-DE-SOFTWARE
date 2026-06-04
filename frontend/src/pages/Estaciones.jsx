import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const emptyForm = { nombre: '', capacidad: '', pasajeros_actuales: 0, id_municipalidad: '1' }

export default function Estaciones() {
  const [estaciones, setEstaciones] = useState([])
  const [municipalidades, setMunicipalidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [e, m] = await Promise.all([api.get('/estaciones'), api.get('/municipalidades')])
    setEstaciones(e.data); setMunicipalidades(m.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm(emptyForm); setError(''); setModal('create') }
  function openEdit(e) {
    setForm({ nombre: e.nombre, capacidad: e.capacidad, pasajeros_actuales: e.pasajeros_actuales, id_municipalidad: e.id_municipalidad })
    setCurrent(e); setError(''); setModal('edit')
  }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = { ...form, capacidad: Number(form.capacidad), pasajeros_actuales: Number(form.pasajeros_actuales), id_municipalidad: Number(form.id_municipalidad) }
      if (modal === 'create') await api.post('/estaciones', payload)
      else await api.put(`/estaciones/${current.id_estacion}`, payload)
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta estación?')) return
    await api.delete(`/estaciones/${id}`); load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Estaciones</h2><p>Control de capacidad y pasajeros por estación</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nueva estación</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" />Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Municipalidad</th><th>Capacidad</th><th>Ocupación</th><th>Líneas</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {estaciones.map(e => {
                  const pct = e.ocupacion_pct || 0
                  return (
                    <tr key={e.id_estacion}>
                      <td style={{ color: 'var(--gray-500)' }}>{e.id_estacion}</td>
                      <td><strong>{e.nombre}</strong></td>
                      <td>{e.municipalidad_nombre}</td>
                      <td>{e.capacidad} pax</td>
                      <td>
                        <div style={{ minWidth: 120 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span>{e.pasajeros_actuales} pax</span>
                            <span style={{ color: pct > 50 ? 'var(--danger)' : 'var(--gray-500)' }}>{pct}%{pct > 50 ? ' ⚠️' : ''}</span>
                          </div>
                          <div className="progress-bar">
                            <div className={`progress-fill ${pct > 50 ? 'high' : pct > 30 ? 'medium' : 'low'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{e.total_lineas}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(e)}>✏️</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(e.id_estacion)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {estaciones.length === 0 && <div className="empty-state"><div className="empty-icon">🏢</div><p>No hay estaciones registradas</p></div>}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Nueva estación' : '✏️ Editar estación'}
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
            <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la estación" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Capacidad máxima *</label>
              <input className="form-control" type="number" min="1" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Pasajeros actuales</label>
              <input className="form-control" type="number" min="0" value={form.pasajeros_actuales} onChange={e => setForm({ ...form, pasajeros_actuales: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Municipalidad</label>
            <select className="form-control" value={form.id_municipalidad} onChange={e => setForm({ ...form, id_municipalidad: e.target.value })}>
              {municipalidades.map(m => <option key={m.id_municipalidad} value={m.id_municipalidad}>{m.nombre}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}
