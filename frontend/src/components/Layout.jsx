import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', group: 'General' },
  { to: '/lineas', icon: '🗺️', label: 'Líneas', group: 'Operaciones' },
  { to: '/estaciones', icon: '🏢', label: 'Estaciones', group: 'Operaciones' },
  { to: '/buses', icon: '🚌', label: 'Buses', group: 'Operaciones' },
  { to: '/pilotos', icon: '👨‍✈️', label: 'Pilotos', group: 'Personal' },
  { to: '/guardias', icon: '💂', label: 'Guardias', group: 'Personal' },
  { to: '/operadores', icon: '🎧', label: 'Operadores', group: 'Personal' },
]

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/lineas': 'Gestión de Líneas',
  '/estaciones': 'Gestión de Estaciones',
  '/buses': 'Gestión de Buses',
  '/pilotos': 'Gestión de Pilotos',
  '/guardias': 'Gestión de Guardias',
  '/operadores': 'Gestión de Operadores',
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('sigetra_user') || '{}')

  const groups = [...new Set(navItems.map(n => n.group))]

  function handleLogout() {
    localStorage.removeItem('sigetra_token')
    localStorage.removeItem('sigetra_user')
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🚌 <span>SIGE</span>TRA</h1>
          <p>Municipalidad de Guatemala</p>
        </div>

        <nav className="sidebar-nav">
          {groups.map(group => (
            <div className="nav-group" key={group}>
              <div className="nav-group-label">{group}</div>
              {navItems.filter(n => n.group === group).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user.nombre || 'A')[0].toUpperCase()}</div>
            <div>
              <div className="user-name">{user.nombre || user.username}</div>
              <div className="user-role">{user.rol}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <div className="topbar">
          <h2>{pageTitles[location.pathname] || 'SIGETRA'}</h2>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>MF Solutions · v1.0</span>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
