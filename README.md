# 🚌 SIGETRA
**Sistema Integral de Gestión de Transmetro**
Municipalidad de Guatemala · Desarrollado por MF Solutions

---

## ⚡ Instalación rápida

### 1. Clona o descarga el proyecto

```bash
git clone https://github.com/TU_USUARIO/sigetra.git
cd sigetra
```

### 2. Instala y arranca el backend

```bash
cd backend
npm install
npm start
```
El API quedará corriendo en **http://localhost:3001**

### 3. Instala y arranca el frontend (otra terminal)

```bash
cd frontend
npm install
npm run dev
```
La app quedará en **http://localhost:3000**

---

## 🔐 Usuarios de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | password | Administrador |
| operador1 | password | Operador |

---

## 📁 Estructura del proyecto

```
sigetra/
├── backend/
│   ├── server.js          # API REST Express
│   ├── database.js        # Conexión SQLite
│   ├── db/
│   │   └── schema.js      # Tablas + datos iniciales
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js          # Cliente HTTP (axios)
│   │   ├── components/
│   │   │   ├── Layout.jsx  # Sidebar + topbar
│   │   │   └── Modal.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Buses.jsx
│   │       ├── Lineas.jsx
│   │       ├── Estaciones.jsx
│   │       ├── Pilotos.jsx
│   │       ├── Guardias.jsx
│   │       └── Operadores.jsx
│   └── package.json
└── .gitignore
```

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + React Router + Recharts |
| Backend | Node.js + Express |
| Base de datos | SQLite (better-sqlite3) |
| Autenticación | JWT + bcrypt |
| Build tool | Vite |

---

## 📋 Módulos implementados

- ✅ Login con autenticación JWT
- ✅ Dashboard con indicadores y gráficos
- ✅ Gestión de Líneas (CRUD completo)
- ✅ Gestión de Estaciones con monitoreo de ocupación
- ✅ Gestión de Buses con alertas de ocupación
- ✅ Gestión de Pilotos
- ✅ Gestión de Guardias
- ✅ Gestión de Operadores

---

## 🔔 Reglas de negocio implementadas

- Alerta cuando estación supera 50% de ocupación
- Alerta cuando bus tiene menos del 25% de ocupación
- Un piloto no puede tener más de un bus asignado
- Todo bus debe tener un parqueo asignado

---

*Universidad · Proyecto académico · 2024*
