import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../api'

const COLORS = ['#1a56db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /> Cargando datos...</div>
  if (!data) return <div className="loading">Error al cargar el dashboard</div>

  const alertasBusesHigh = data.alertasBuses.filter(b => b.ocupacion_pct > 80)
  const alertasBusesLow = data.alertasBuses.filter(b => b.ocupacion_pct <= 80)
  const totalAlertas = data.alertasEstaciones.length + data.alertasBuses.length

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🗺️</div>
          <div>
            <div className="stat-value">{data.totalLineas}</div>
            <div className="stat-label">Líneas activas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🏢</div>
          <div>
            <div className="stat-value">{data.totalEstaciones}</div>
            <div className="stat-label">Estaciones</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">🚌</div>
          <div>
            <div className="stat-value">{data.totalBuses}</div>
            <div className="stat-label">Buses en servicio</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🔔</div>
          <div>
            <div className="stat-value" style={{ color: totalAlertas > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {totalAlertas}
            </div>
            <div className="stat-label">Alertas activas</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="chart-title">📊 Ocupación de estaciones (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ocupacionEstaciones} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Ocupación']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="pct" fill="#1a56db" radius={[4,4,0,0]}>
                {data.ocupacionEstaciones.map((entry, i) => (
                  <Cell key={i} fill={entry.pct > 50 ? '#ef4444' : entry.pct > 30 ? '#f59e0b' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="chart-title">🚌 Buses por línea</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.busesPorLinea}
                dataKey="total"
                nameKey="linea"
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {data.busesPorLinea.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas */}
      <div className="card">
        <div className="chart-title">
          🔔 Alertas del sistema
          {totalAlertas === 0 && <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>✅ Sin alertas activas</span>}
        </div>
        <div className="alert-list">
          {data.alertasEstaciones.map((a, i) => (
            <div className="alert-item danger" key={`e${i}`}>
              <strong>⚠️ Estación con alta ocupación:</strong> {a.nombre}
              <br /><span>{a.pasajeros_actuales} / {a.capacidad} pasajeros · {a.ocupacion_pct}% ocupación (límite: 50%)</span>
            </div>
          ))}
          {alertasBusesHigh.map((b, i) => (
            <div className="alert-item danger" key={`bh${i}`}>
              <strong>⚠️ Bus con alta ocupación:</strong> {b.placa}
              <br /><span>{b.pasajeros_actuales} / {b.capacidad_maxima} pasajeros · {b.ocupacion_pct}% ocupación (límite: 80%)</span>
            </div>
          ))}
          {alertasBusesLow.map((b, i) => (
            <div className="alert-item warning" key={`bl${i}`}>
              <strong>🚌 Bus con baja ocupación:</strong> {b.placa}
              <br /><span>{b.pasajeros_actuales} / {b.capacidad_maxima} pasajeros · {b.ocupacion_pct}% — permanecerá 5 min extra por estación</span>
            </div>
          ))}
          {totalAlertas === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>Todas las estaciones y buses operan dentro de parámetros normales</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
