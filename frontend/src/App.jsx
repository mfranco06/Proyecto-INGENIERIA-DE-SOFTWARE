import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Buses from './pages/Buses'
import Lineas from './pages/Lineas'
import Estaciones from './pages/Estaciones'
import Pilotos from './pages/Pilotos'
import Guardias from './pages/Guardias'
import Operadores from './pages/Operadores'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('sigetra_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="buses" element={<Buses />} />
          <Route path="lineas" element={<Lineas />} />
          <Route path="estaciones" element={<Estaciones />} />
          <Route path="pilotos" element={<Pilotos />} />
          <Route path="guardias" element={<Guardias />} />
          <Route path="operadores" element={<Operadores />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
