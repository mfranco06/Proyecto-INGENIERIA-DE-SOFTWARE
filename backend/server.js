const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'sigetra_secret_2024';

app.use(cors());
app.use(express.json());

// ─── Middleware de autenticación ───────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM usuario WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const token = jwt.sign(
    { id: user.id_usuario, username: user.username, rol: user.rol, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id_usuario, username: user.username, rol: user.rol, nombre: user.nombre } });
});

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', authMiddleware, (req, res) => {
  const db = getDb();
  const totalLineas = db.prepare('SELECT COUNT(*) as total FROM linea').get().total;
  const totalEstaciones = db.prepare('SELECT COUNT(*) as total FROM estacion').get().total;
  const totalBuses = db.prepare('SELECT COUNT(*) as total FROM bus').get().total;
  const totalParqueos = db.prepare('SELECT COUNT(*) as total FROM parqueo').get().total;

  // Alertas: estaciones con >50% ocupación
  const alertasEstaciones = db.prepare(`
    SELECT nombre, capacidad, pasajeros_actuales,
           ROUND(pasajeros_actuales * 100.0 / capacidad, 1) as ocupacion_pct
    FROM estacion WHERE pasajeros_actuales * 1.0 / capacidad > 0.5
  `).all();

  // Alertas: buses con <25% ocupación
  const alertasBusesLow = db.prepare(`
    SELECT placa, capacidad_maxima, pasajeros_actuales,
           ROUND(pasajeros_actuales * 100.0 / capacidad_maxima, 1) as ocupacion_pct
    FROM bus WHERE pasajeros_actuales * 1.0 / capacidad_maxima < 0.25 AND estado = 'activo'
  `).all();

  // Alertas: buses con >80% ocupación
  const alertasBusesHigh = db.prepare(`
    SELECT placa, capacidad_maxima, pasajeros_actuales,
           ROUND(pasajeros_actuales * 100.0 / capacidad_maxima, 1) as ocupacion_pct
    FROM bus WHERE pasajeros_actuales * 1.0 / capacidad_maxima > 0.80 AND estado = 'activo'
  `).all();

  const alertasBuses = [...alertasBusesLow, ...alertasBusesHigh];

  // Alertas: parqueos con >= 80% de capacidad ocupada
  const alertasParqueos = db.prepare(`
    SELECT p.ubicacion, p.zona, p.capacidad, COUNT(b.id_bus) as buses_actuales,
           ROUND(COUNT(b.id_bus) * 100.0 / p.capacidad, 1) as ocupacion_pct
    FROM parqueo p
    LEFT JOIN bus b ON p.id_parqueo = b.id_parqueo
    WHERE p.capacidad > 0
    GROUP BY p.id_parqueo
    HAVING COUNT(b.id_bus) * 1.0 / p.capacidad >= 0.80
  `).all();

  const totalAlertas = alertasEstaciones.length + alertasBuses.length + alertasParqueos.length;

  // Datos para gráfico de estaciones
  const ocupacionEstaciones = db.prepare(`
    SELECT nombre, pasajeros_actuales, capacidad,
           ROUND(pasajeros_actuales * 100.0 / capacidad, 1) as pct
    FROM estacion ORDER BY pct DESC
  `).all();

  // Distribución de buses por línea
  const busesPorLinea = db.prepare(`
    SELECT l.nombre as linea, COUNT(b.id_bus) as total
    FROM linea l LEFT JOIN bus b ON l.id_linea = b.id_linea
    GROUP BY l.id_linea, l.nombre
  `).all();

  res.json({
    totalLineas,
    totalEstaciones,
    totalBuses,
    totalParqueos,
    totalAlertas,
    alertasEstaciones,
    alertasBuses,
    alertasParqueos,
    ocupacionEstaciones,
    busesPorLinea
  });
});

// ─── BUSES ─────────────────────────────────────────────────────────────────────
app.get('/api/buses', authMiddleware, (req, res) => {
  const db = getDb();
  const buses = db.prepare(`
    SELECT b.*, l.nombre as linea_nombre, p.ubicacion as parqueo_ubicacion,
           pi.nombre as piloto_nombre
    FROM bus b
    LEFT JOIN linea l ON b.id_linea = l.id_linea
    LEFT JOIN parqueo p ON b.id_parqueo = p.id_parqueo
    LEFT JOIN piloto pi ON b.id_piloto = pi.id_piloto
    ORDER BY b.id_bus
  `).all();
  res.json(buses);
});

app.post('/api/buses', authMiddleware, (req, res) => {
  const { placa, capacidad_maxima, estado, id_linea, id_parqueo, id_piloto } = req.body;
  if (!placa || !capacidad_maxima || !id_parqueo) {
    return res.status(400).json({ error: 'Placa, capacidad y parqueo son requeridos' });
  }
  const db = getDb();
  // Verificar que el piloto no tenga otro bus asignado
  if (id_piloto) {
    const pilotoOcupado = db.prepare('SELECT id_bus FROM bus WHERE id_piloto = ?').get(id_piloto);
    if (pilotoOcupado) return res.status(400).json({ error: 'El piloto ya tiene un bus asignado' });
  }
  const stmt = db.prepare(`
    INSERT INTO bus (placa, capacidad_maxima, estado, id_linea, id_parqueo, id_piloto)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(placa, capacidad_maxima, estado || 'activo', id_linea || null, id_parqueo, id_piloto || null);
  res.status(201).json({ id_bus: result.lastInsertRowid, message: 'Bus creado exitosamente' });
});

app.put('/api/buses/:id', authMiddleware, (req, res) => {
  const { placa, capacidad_maxima, pasajeros_actuales, estado, id_linea, id_parqueo, id_piloto } = req.body;
  const db = getDb();
  if (id_piloto) {
    const pilotoOcupado = db.prepare('SELECT id_bus FROM bus WHERE id_piloto = ? AND id_bus != ?').get(id_piloto, req.params.id);
    if (pilotoOcupado) return res.status(400).json({ error: 'El piloto ya tiene un bus asignado' });
  }
  db.prepare(`
    UPDATE bus SET placa=?, capacidad_maxima=?, pasajeros_actuales=?, estado=?, id_linea=?, id_parqueo=?, id_piloto=?
    WHERE id_bus=?
  `).run(placa, capacidad_maxima, pasajeros_actuales || 0, estado, id_linea || null, id_parqueo, id_piloto || null, req.params.id);
  res.json({ message: 'Bus actualizado exitosamente' });
});

app.delete('/api/buses/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM bus WHERE id_bus = ?').run(req.params.id);
  res.json({ message: 'Bus eliminado exitosamente' });
});

// ─── LÍNEAS ────────────────────────────────────────────────────────────────────
app.get('/api/lineas', authMiddleware, (req, res) => {
  const db = getDb();
  const lineas = db.prepare(`
    SELECT l.*, m.nombre as municipalidad_nombre,
           COUNT(DISTINCT le.id_estacion) as total_estaciones,
           COUNT(DISTINCT b.id_bus) as total_buses
    FROM linea l
    LEFT JOIN municipalidad m ON l.id_municipalidad = m.id_municipalidad
    LEFT JOIN linea_estacion le ON l.id_linea = le.id_linea
    LEFT JOIN bus b ON l.id_linea = b.id_linea
    GROUP BY l.id_linea
    ORDER BY l.id_linea
  `).all();
  res.json(lineas);
});

app.post('/api/lineas', authMiddleware, (req, res) => {
  const { nombre, distancia_total, id_municipalidad } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
  const db = getDb();
  const result = db.prepare('INSERT INTO linea (nombre, distancia_total, id_municipalidad) VALUES (?, ?, ?)').run(nombre, distancia_total || 0, id_municipalidad || 1);
  res.status(201).json({ id_linea: result.lastInsertRowid, message: 'Línea creada exitosamente' });
});

app.put('/api/lineas/:id', authMiddleware, (req, res) => {
  const { nombre, distancia_total, id_municipalidad } = req.body;
  const db = getDb();
  db.prepare('UPDATE linea SET nombre=?, distancia_total=?, id_municipalidad=? WHERE id_linea=?').run(nombre, distancia_total, id_municipalidad, req.params.id);
  res.json({ message: 'Línea actualizada exitosamente' });
});

app.delete('/api/lineas/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM linea WHERE id_linea = ?').run(req.params.id);
  res.json({ message: 'Línea eliminada exitosamente' });
});

// ─── ESTACIONES ────────────────────────────────────────────────────────────────
app.get('/api/estaciones', authMiddleware, (req, res) => {
  const db = getDb();
  const estaciones = db.prepare(`
    SELECT e.*, m.nombre as municipalidad_nombre,
           COUNT(DISTINCT le.id_linea) as total_lineas,
           ROUND(e.pasajeros_actuales * 100.0 / e.capacidad, 1) as ocupacion_pct
    FROM estacion e
    LEFT JOIN municipalidad m ON e.id_municipalidad = m.id_municipalidad
    LEFT JOIN linea_estacion le ON e.id_estacion = le.id_estacion
    GROUP BY e.id_estacion
    ORDER BY e.id_estacion
  `).all();
  res.json(estaciones);
});

app.post('/api/estaciones', authMiddleware, (req, res) => {
  const { nombre, capacidad, id_municipalidad } = req.body;
  if (!nombre || !capacidad) return res.status(400).json({ error: 'Nombre y capacidad son requeridos' });
  const db = getDb();
  const result = db.prepare('INSERT INTO estacion (nombre, capacidad, id_municipalidad) VALUES (?, ?, ?)').run(nombre, capacidad, id_municipalidad || 1);
  res.status(201).json({ id_estacion: result.lastInsertRowid, message: 'Estación creada exitosamente' });
});

app.put('/api/estaciones/:id', authMiddleware, (req, res) => {
  const { nombre, capacidad, pasajeros_actuales, id_municipalidad } = req.body;
  const db = getDb();
  db.prepare('UPDATE estacion SET nombre=?, capacidad=?, pasajeros_actuales=?, id_municipalidad=? WHERE id_estacion=?').run(nombre, capacidad, pasajeros_actuales || 0, id_municipalidad, req.params.id);
  res.json({ message: 'Estación actualizada exitosamente' });
});

app.delete('/api/estaciones/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM estacion WHERE id_estacion = ?').run(req.params.id);
  res.json({ message: 'Estación eliminada exitosamente' });
});

// ─── PILOTOS ───────────────────────────────────────────────────────────────────
app.get('/api/pilotos', authMiddleware, (req, res) => {
  const db = getDb();
  const pilotos = db.prepare(`
    SELECT p.*, b.placa as bus_asignado, b.id_bus
    FROM piloto p
    LEFT JOIN bus b ON p.id_piloto = b.id_piloto
    ORDER BY p.id_piloto
  `).all();
  res.json(pilotos);
});

app.post('/api/pilotos', authMiddleware, (req, res) => {
  const { nombre, direccion, telefono, correo, historial_educativo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
  const db = getDb();
  const result = db.prepare('INSERT INTO piloto (nombre, direccion, telefono, correo, historial_educativo) VALUES (?, ?, ?, ?, ?)').run(nombre, direccion, telefono, correo, historial_educativo);
  res.status(201).json({ id_piloto: result.lastInsertRowid, message: 'Piloto registrado exitosamente' });
});

app.put('/api/pilotos/:id', authMiddleware, (req, res) => {
  const { nombre, direccion, telefono, correo, historial_educativo } = req.body;
  const db = getDb();
  db.prepare('UPDATE piloto SET nombre=?, direccion=?, telefono=?, correo=?, historial_educativo=? WHERE id_piloto=?').run(nombre, direccion, telefono, correo, historial_educativo, req.params.id);
  res.json({ message: 'Piloto actualizado exitosamente' });
});

app.delete('/api/pilotos/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM piloto WHERE id_piloto = ?').run(req.params.id);
  res.json({ message: 'Piloto eliminado exitosamente' });
});

// ─── GUARDIAS ──────────────────────────────────────────────────────────────────
app.get('/api/guardias', authMiddleware, (req, res) => {
  const db = getDb();
  const guardias = db.prepare(`
    SELECT g.*, a.descripcion as acceso_descripcion, e.nombre as estacion_nombre
    FROM guardia g
    LEFT JOIN acceso a ON g.id_acceso = a.id_acceso
    LEFT JOIN estacion e ON a.id_estacion = e.id_estacion
    ORDER BY g.id_guardia
  `).all();
  res.json(guardias);
});

app.post('/api/guardias', authMiddleware, (req, res) => {
  const { nombre, telefono, id_acceso } = req.body;
  if (!nombre || !id_acceso) return res.status(400).json({ error: 'Nombre y acceso son requeridos' });
  const db = getDb();
  const result = db.prepare('INSERT INTO guardia (nombre, telefono, id_acceso) VALUES (?, ?, ?)').run(nombre, telefono, id_acceso);
  res.status(201).json({ id_guardia: result.lastInsertRowid, message: 'Guardia registrado exitosamente' });
});

app.put('/api/guardias/:id', authMiddleware, (req, res) => {
  const { nombre, telefono, id_acceso } = req.body;
  const db = getDb();
  db.prepare('UPDATE guardia SET nombre=?, telefono=?, id_acceso=? WHERE id_guardia=?').run(nombre, telefono, id_acceso, req.params.id);
  res.json({ message: 'Guardia actualizado exitosamente' });
});

app.delete('/api/guardias/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM guardia WHERE id_guardia = ?').run(req.params.id);
  res.json({ message: 'Guardia eliminado exitosamente' });
});

// ─── OPERADORES ────────────────────────────────────────────────────────────────
app.get('/api/operadores', authMiddleware, (req, res) => {
  const db = getDb();
  const operadores = db.prepare(`
    SELECT o.*, e.nombre as estacion_nombre
    FROM operador o
    LEFT JOIN estacion e ON o.id_estacion = e.id_estacion
    ORDER BY o.id_operador
  `).all();
  res.json(operadores);
});

app.post('/api/operadores', authMiddleware, (req, res) => {
  const { nombre, telefono, id_estacion } = req.body;
  if (!nombre || !id_estacion) return res.status(400).json({ error: 'Nombre y estación son requeridos' });
  const db = getDb();
  const result = db.prepare('INSERT INTO operador (nombre, telefono, id_estacion) VALUES (?, ?, ?)').run(nombre, telefono, id_estacion);
  res.status(201).json({ id_operador: result.lastInsertRowid, message: 'Operador registrado exitosamente' });
});

app.put('/api/operadores/:id', authMiddleware, (req, res) => {
  const { nombre, telefono, id_estacion } = req.body;
  const db = getDb();
  db.prepare('UPDATE operador SET nombre=?, telefono=?, id_estacion=? WHERE id_operador=?').run(nombre, telefono, id_estacion, req.params.id);
  res.json({ message: 'Operador actualizado exitosamente' });
});

app.delete('/api/operadores/:id', authMiddleware, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM operador WHERE id_operador = ?').run(req.params.id);
  res.json({ message: 'Operador eliminado exitosamente' });
});

// ─── AUXILIARES (para selects en formularios) ──────────────────────────────────
app.get('/api/municipalidades', authMiddleware, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM municipalidad').all());
});

// ─── PARQUEOS ──────────────────────────────────────────────────────────────────
app.get('/api/parqueos', authMiddleware, (req, res) => {
  const db = getDb();
  const parqueos = db.prepare(`
    SELECT p.*, COUNT(b.id_bus) as buses_actuales,
           CASE WHEN p.capacidad > 0 THEN ROUND(COUNT(b.id_bus) * 100.0 / p.capacidad, 1) ELSE 0 END as ocupacion_pct
    FROM parqueo p
    LEFT JOIN bus b ON p.id_parqueo = b.id_parqueo
    GROUP BY p.id_parqueo
    ORDER BY p.id_parqueo
  `).all();
  res.json(parqueos);
});

app.post('/api/parqueos', authMiddleware, (req, res) => {
  const { ubicacion, zona, capacidad } = req.body;
  if (!ubicacion) return res.status(400).json({ error: 'El nombre del parqueo es requerido' });
  const db = getDb();
  const result = db.prepare('INSERT INTO parqueo (ubicacion, zona, capacidad) VALUES (?, ?, ?)').run(ubicacion, zona || '', Number(capacidad) || 0);
  res.status(201).json({ id_parqueo: result.lastInsertRowid, message: 'Parqueo creado exitosamente' });
});

app.put('/api/parqueos/:id', authMiddleware, (req, res) => {
  const { ubicacion, zona, capacidad } = req.body;
  if (!ubicacion) return res.status(400).json({ error: 'El nombre del parqueo es requerido' });
  const db = getDb();
  db.prepare('UPDATE parqueo SET ubicacion=?, zona=?, capacidad=? WHERE id_parqueo=?').run(ubicacion, zona || '', Number(capacidad) || 0, req.params.id);
  res.json({ message: 'Parqueo actualizado exitosamente' });
});

app.delete('/api/parqueos/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const asignados = db.prepare('SELECT COUNT(*) as total FROM bus WHERE id_parqueo = ?').get(req.params.id);
  if (asignados.total > 0) return res.status(400).json({ error: `No se puede eliminar: tiene ${asignados.total} bus(es) asignado(s)` });
  db.prepare('DELETE FROM parqueo WHERE id_parqueo = ?').run(req.params.id);
  res.json({ message: 'Parqueo eliminado exitosamente' });
});
app.get('/api/accesos', authMiddleware, (req, res) => {
  const accesos = getDb().prepare(`
    SELECT a.*, e.nombre as estacion_nombre FROM acceso a
    LEFT JOIN estacion e ON a.id_estacion = e.id_estacion
  `).all();
  res.json(accesos);
});

// ─── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚌 SIGETRA Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Usuarios de prueba:`);
  console.log(`   - admin / password (Administrador)`);
  console.log(`   - operador1 / password (Operador)\n`);
});
