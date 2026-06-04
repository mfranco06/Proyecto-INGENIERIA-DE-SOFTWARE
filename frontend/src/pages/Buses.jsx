import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const estadoColors = { activo: 'badge-green', inactivo: 'badge-gray', mantenimiento: 'badge-yellow' }

const emptyForm = {
  placa: '', capacidad_maxima: '', pasajeros_actuales: 0,
  estado: 'activo', id_linea: '', id_parqueo: '', id_piloto: ''
}

export default function Buses() {
  const [buses, setBuses] = useState([])
  const [lineas, setLineas] = useState([])
  const [parqueos, setParqueos] = useState([])
  const [pilotos, setPilotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'view'
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [b, l, p, pi] = await Promise.all([
      api.get('/buses'), api.get('/lineas'), api.get('/parqueos'), api.get('/pilotos')
    ])
    setBuses(b.data); setLineas(l.data); setParqueos(p.data); setPilotos(pi.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm(emptyForm); setError(''); setModal('create')
  }

  function openEdit(bus) {
    setForm({
      placa: bus.placa, capacidad_maxima: bus.capacidad_maxima,
      pasajeros_actuales: bus.pasajeros_actuales, estado: bus.estado,
      id_linea: bus.id_linea || '', id_parqueo: bus.id_parqueo || '', id_piloto: bus.id_piloto || ''
    })
    setCurrent(bus); setError(''); setModal('edit')
  }

  function openView(bus) {
    setCurrent(bus); setModal('view')
  }

  async function handleSave() {
    setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        capacidad_maxima: Number(form.capacidad_maxima),
        pasajeros_actuales: Number(form.pasajeros_actuales),
        id_linea: form.id_linea || null,
        id_parqueo: Number(form.id_parqueo),
        id_piloto: form.id_piloto || null
      }
      if (modal === 'create') await api.post('/buses', payload)
      else await api.put(`/buses/${current.id_bus}`, payload)
      setModal(null); load()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este bus?')) return
    await api.delete(`/buses/${id}`)
    load()
  }

  const occ = (bus) => bus.capacidad_maxima ? Math.round(bus.pasajeros_actuales / bus.capacidad_maxima * 100) : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Buses</h2>
          <p>Gestión de la flota de buses del sistema Transmetro</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Agregar bus</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /> Cargando...</div>
        ) : buses.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🚌</div><p>No hay buses registrados</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Placa</th><th>Capacidad</th><th>Ocupación</th>
                  <th>Estado</th><th>Línea</th><th>Parqueo</th><th>Piloto</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(bus => {
                  const pct = occ(bus)
                  return (
                    <tr key={bus.id_bus}>
                      <td style={{ color: 'var(--gray-500)' }}>{bus.id_bus}</td>
                      <td><strong>{bus.placa}</strong></td>
                      <td>{bus.capacidad_maxima} pax</td>
                      <td>
                        <div style={{ minWidth: 100 }}>
                          <span style={{ fontSize: 12 }}>{bus.pasajeros_actuales} / {bus.capacidad_maxima} ({pct}%)</span>
                          <div className="progress-bar">
                            <div
                              className={`progress-fill ${pct < 25 ? 'medium' : pct > 80 ? 'high' : 'low'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${estadoColors[bus.estado] || 'badge-gray'}`}>{bus.estado}</span></td>
                      <td>{bus.linea_nombre || <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>{bus.parqueo_ubicacion || '—'}</td>
                      <td>{bus.piloto_nombre || <span style={{ color: 'var(--gray-300)' }}>—</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openView(bus)} title="Ver">👁️</button>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(bus)} title="Editar">✏️</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(bus.id_bus)} title="Eliminar">🗑️</button>
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

      {/* Modal Crear/Editar */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? '➕ Agregar bus' : '✏️ Editar bus'}
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
          <div className="form-row">
            <div className="form-group">
              <label>Placa *</label>
              <input className="form-control" value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value })} placeholder="TM-XXX" />
            </div>
            <div className="form-group">
              <label>Capacidad máxima *</label>
              <input className="form-control" type="number" min="1" value={form.capacidad_maxima} onChange={e => setForm({ ...form, capacidad_maxima: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Pasajeros actuales</label>
              <input className="form-control" type="number" min="0" value={form.pasajeros_actuales} onChange={e => setForm({ ...form, pasajeros_actuales: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select className="form-control" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Línea asignada</label>
              <select className="form-control" value={form.id_linea} onChange={e => setForm({ ...form, id_linea: e.target.value })}>
                <option value="">Sin asignar</option>
                {lineas.map(l => <option key={l.id_linea} value={l.id_linea}>{l.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Parqueo *</label>
              <select className="form-control" value={form.id_parqueo} onChange={e => setForm({ ...form, id_parqueo: e.target.value })}>
                <option value="">Seleccionar...</option>
                {parqueos.map(p => <option key={p.id_parqueo} value={p.id_parqueo}>{p.ubicacion}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Piloto asignado</label>
            <select className="form-control" value={form.id_piloto} onChange={e => setForm({ ...form, id_piloto: e.target.value })}>
              <option value="">Sin asignar</option>
              {pilotos.filter(p => !p.id_bus || p.id_piloto === current?.id_piloto).map(p => (
                <option key={p.id_piloto} value={p.id_piloto}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {/* Modal Ver */}
      {modal === 'view' && current && (
        <Modal title="🔍 Detalle del bus" onClose={() => setModal(null)} footer={
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cerrar</button>
        }>
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                ['Placa', current.placa],
                ['Capacidad', `${current.capacidad_maxima} pasajeros`],
                ['Pasajeros actuales', `${current.pasajeros_actuales} (${occ(current)}%)`],
                ['Estado', current.estado],
                ['Línea', current.linea_nombre || 'Sin asignar'],
                ['Parqueo', current.parqueo_ubicacion || 'Sin asignar'],
                ['Piloto', current.piloto_nombre || 'Sin asignar'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 600, color: 'var(--gray-500)', padding: '7px 0', width: 140, fontSize: 12 }}>{k}</td>
                  <td style={{ padding: '7px 0', fontSize: 13.5 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  )
}
