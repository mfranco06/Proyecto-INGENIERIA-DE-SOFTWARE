import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const emptyForm = { nombre: '', direccion: '', telefono: '', correo: '', historial_educativo: '' }

export default function Pilotos() {
  const [pilotos, setPilotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await api.get('/pilotos')
    setPilotos(data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setForm(emptyForm); setError(''); setModal('create') }
  function openEdit(p) { setForm({ nombre: p.nombre, direccion: p.direccion || '', telefono: p.telefono || '', correo: p.correo || '', historial_educativo: p.historial_educativo || '' }); setCurrent(p); setError(''); setModal('edit') }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      if (modal === 'create') await api.post('/pilotos', form)
      else await api.put(`/pilotos/${current.id_piloto}`, form)
      setModal(null); load()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este piloto?')) return
    await api.delete(`/pilotos/${id}`); load()
  }

  const f = (label, key, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label>{label}</label>
      <input className="form-control" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div><h2>Pilotos</h2><p>Personal conductor asignado a buses Transmetro</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo piloto</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" />Cargando...</div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Bus asignado</th><th>Educación</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pilotos.map(p => (
                  <tr key={p.id_piloto}>
                    <td style={{ color: 'var(--gray-500)' }}>{p.id_piloto}</td>
                    <td><strong>{p.nombre}</strong><div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{p.direccion}</div></td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.correo || '—'}</td>
                    <td>{p.bus_asignado ? <span className="badge badge-blue">{p.bus_asignado}</span> : <span style={{ color: 'var(--gray-300)' }}>Sin asignar</span>}</td>
                    <td>{p.historial_educativo || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id_piloto)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pilotos.length === 0 && <div className="empty-state"><div className="empty-icon">👨‍✈️</div><p>No hay pilotos registrados</p></div>}
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Nuevo piloto' : '✏️ Editar piloto'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </>
          }
        >
          {error && <div className="error-msg">⚠️ {error}</div>}
          {f('Nombre *', 'nombre', 'text', 'Nombre completo')}
          <div className="form-row">
            {f('Teléfono', 'telefono', 'tel', '5555-0000')}
            {f('Correo electrónico', 'correo', 'email', 'correo@ejemplo.com')}
          </div>
          {f('Dirección / Residencia', 'direccion', 'text', 'Zona, municipio')}
          {f('Historial educativo', 'historial_educativo', 'text', 'Ej: Bachiller en Computación')}
        </Modal>
      )}
    </div>
  )
}
