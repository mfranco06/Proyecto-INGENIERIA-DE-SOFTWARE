import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const emptyForm = { nombre: '', distancia_total: '', id_municipalidad: '1' }

export default function Lineas() {
  const [lineas, setLineas] = useState([])
  const [municipalidades, setMunicipalidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [l, m] = await Promise.all([api.get('/lineas'), api.get('/municipalidades')])
    setLineas(l.data); setMunicipalidades(m.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() { setForm(emptyForm); setError(''); setModal('create') }
  function openEdit(l) {
    setForm({ nombre: l.nombre, distancia_total: l.distancia_total, id_municipalidad: l.id_municipalidad })
    setCurrent(l); setError(''); setModal('edit')
  }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = { ...form, distancia_total: Number(form.distancia_total), id_municipalidad: Number(form.id_municipalidad) }
      if (modal === 'create') await api.post('/lineas', payload)
      else await api.put(`/lineas/${current.id_linea}`, payload)
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta línea? Se desasignarán los buses relacionados.')) return
    await api.delete(`/lineas/${id}`); load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Líneas</h2><p>Rutas de transporte del sistema Transmetro</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nueva línea</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /> Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Municipalidad</th><th>Distancia total</th><th>Estaciones</th><th>Buses</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lineas.map(l => (
                  <tr key={l.id_linea}>
                    <td style={{ color: 'var(--gray-500)' }}>{l.id_linea}</td>
                    <td><strong>{l.nombre}</strong></td>
                    <td>{l.municipalidad_nombre}</td>
                    <td>{l.distancia_total} km</td>
                    <td><span className="badge badge-blue">{l.total_estaciones}</span></td>
                    <td><span className="badge badge-green">{l.total_buses}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(l)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(l.id_linea)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lineas.length === 0 && <div className="empty-state"><div className="empty-icon">🗺️</div><p>No hay líneas registradas</p></div>}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Nueva línea' : '✏️ Editar línea'}
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
            <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Transmetro Línea 1" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Distancia total (km)</label>
              <input className="form-control" type="number" step="0.1" min="0" value={form.distancia_total} onChange={e => setForm({ ...form, distancia_total: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Municipalidad</label>
              <select className="form-control" value={form.id_municipalidad} onChange={e => setForm({ ...form, id_municipalidad: e.target.value })}>
                {municipalidades.map(m => <option key={m.id_municipalidad} value={m.id_municipalidad}>{m.nombre}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
