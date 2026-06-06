// Esquema completo de la base de datos SIGETRA
const schema = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS municipalidad (
    id_municipalidad INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS linea (
    id_linea INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    distancia_total REAL DEFAULT 0,
    id_municipalidad INTEGER,
    FOREIGN KEY (id_municipalidad) REFERENCES municipalidad(id_municipalidad)
  );

  CREATE TABLE IF NOT EXISTS estacion (
    id_estacion INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    capacidad INTEGER NOT NULL,
    pasajeros_actuales INTEGER DEFAULT 0,
    id_municipalidad INTEGER,
    FOREIGN KEY (id_municipalidad) REFERENCES municipalidad(id_municipalidad)
  );

  CREATE TABLE IF NOT EXISTS linea_estacion (
    id_linea INTEGER,
    id_estacion INTEGER,
    orden_recorrido INTEGER NOT NULL,
    PRIMARY KEY (id_linea, id_estacion),
    FOREIGN KEY (id_linea) REFERENCES linea(id_linea),
    FOREIGN KEY (id_estacion) REFERENCES estacion(id_estacion)
  );

  CREATE TABLE IF NOT EXISTS acceso (
    id_acceso INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    id_estacion INTEGER,
    FOREIGN KEY (id_estacion) REFERENCES estacion(id_estacion)
  );

  CREATE TABLE IF NOT EXISTS parqueo (
    id_parqueo INTEGER PRIMARY KEY AUTOINCREMENT,
    ubicacion TEXT NOT NULL,
    zona TEXT,
    capacidad INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS piloto (
    id_piloto INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    correo TEXT,
    historial_educativo TEXT
  );

  CREATE TABLE IF NOT EXISTS bus (
    id_bus INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT NOT NULL UNIQUE,
    capacidad_maxima INTEGER NOT NULL,
    pasajeros_actuales INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'activo',
    id_linea INTEGER,
    id_parqueo INTEGER,
    id_piloto INTEGER,
    FOREIGN KEY (id_linea) REFERENCES linea(id_linea),
    FOREIGN KEY (id_parqueo) REFERENCES parqueo(id_parqueo),
    FOREIGN KEY (id_piloto) REFERENCES piloto(id_piloto)
  );

  CREATE TABLE IF NOT EXISTS guardia (
    id_guardia INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    id_acceso INTEGER,
    FOREIGN KEY (id_acceso) REFERENCES acceso(id_acceso)
  );

  CREATE TABLE IF NOT EXISTS operador (
    id_operador INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    id_estacion INTEGER,
    FOREIGN KEY (id_estacion) REFERENCES estacion(id_estacion)
  );

  CREATE TABLE IF NOT EXISTS distancia (
    id_distancia INTEGER PRIMARY KEY AUTOINCREMENT,
    estacion_origen INTEGER,
    estacion_destino INTEGER,
    kilometros REAL NOT NULL,
    FOREIGN KEY (estacion_origen) REFERENCES estacion(id_estacion),
    FOREIGN KEY (estacion_destino) REFERENCES estacion(id_estacion)
  );

  CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'operador',
    nombre TEXT
  );
`;

const seedData = `
  INSERT OR IGNORE INTO municipalidad (id_municipalidad, nombre) VALUES
    (1, 'Guatemala'),
    (2, 'Mixco'),
    (3, 'Villa Nueva');

  INSERT OR IGNORE INTO parqueo (id_parqueo, ubicacion, zona, capacidad) VALUES
    (1, 'Parqueo Central', 'Zona 1', 20),
    (2, 'Parqueo Norte', 'Zona 18', 15),
    (3, 'Parqueo Sur', 'Villa Nueva', 12),
    (4, 'Parqueo Mixco', 'Mixco', 10);

  UPDATE parqueo SET zona = 'Zona 1',    capacidad = 20 WHERE id_parqueo = 1 AND (zona IS NULL OR zona = '');
  UPDATE parqueo SET zona = 'Zona 18',   capacidad = 15 WHERE id_parqueo = 2 AND (zona IS NULL OR zona = '');
  UPDATE parqueo SET zona = 'Villa Nueva', capacidad = 12 WHERE id_parqueo = 3 AND (zona IS NULL OR zona = '');
  UPDATE parqueo SET zona = 'Mixco',     capacidad = 10 WHERE id_parqueo = 4 AND (zona IS NULL OR zona = '');

  INSERT OR IGNORE INTO piloto (id_piloto, nombre, direccion, telefono, correo, historial_educativo) VALUES
    (1, 'Carlos Ramírez', 'Zona 6, Guatemala', '5555-1111', 'carlos@transmetro.gt', 'Bachiller en Computación'),
    (2, 'José López', 'Zona 11, Guatemala', '5555-2222', 'jose@transmetro.gt', 'Perito Contador'),
    (3, 'Mario García', 'Mixco', '5555-3333', 'mario@transmetro.gt', 'Bachiller en Ciencias'),
    (4, 'Luis Morales', 'Villa Nueva', '5555-4444', 'luis@transmetro.gt', 'Diversificado');

  INSERT OR IGNORE INTO linea (id_linea, nombre, distancia_total, id_municipalidad) VALUES
    (1, 'Transmetro Línea 1 - Centra Norte', 18.5, 1),
    (2, 'Transmetro Línea 4 - Mixco', 12.3, 2),
    (3, 'Transmetro Línea 5 - Villa Nueva', 15.7, 3);

  INSERT OR IGNORE INTO estacion (id_estacion, nombre, capacidad, pasajeros_actuales, id_municipalidad) VALUES
    (1, 'Centra Norte', 500, 280, 1),
    (2, 'Plaza Barrios', 300, 120, 1),
    (3, 'Municipalidad', 400, 210, 1),
    (4, 'La Terminal', 600, 350, 1),
    (5, 'Mixco Centro', 350, 90, 2),
    (6, 'Villa Nueva Centro', 400, 310, 3);

  INSERT OR IGNORE INTO linea_estacion (id_linea, id_estacion, orden_recorrido) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4),
    (2, 2, 1), (2, 5, 2),
    (3, 4, 1), (3, 6, 2);

  INSERT OR IGNORE INTO acceso (id_acceso, descripcion, id_estacion) VALUES
    (1, 'Acceso Norte - Centra Norte', 1),
    (2, 'Acceso Sur - Centra Norte', 1),
    (3, 'Acceso Principal - Plaza Barrios', 2),
    (4, 'Acceso Este - Municipalidad', 3),
    (5, 'Acceso Principal - La Terminal', 4),
    (6, 'Acceso Secundario - La Terminal', 4),
    (7, 'Acceso Principal - Mixco Centro', 5),
    (8, 'Acceso Principal - Villa Nueva', 6);

  INSERT OR IGNORE INTO bus (id_bus, placa, capacidad_maxima, pasajeros_actuales, estado, id_linea, id_parqueo, id_piloto) VALUES
    (1, 'TM-001', 80, 45, 'activo', 1, 1, 1),
    (2, 'TM-002', 80, 12, 'activo', 1, 1, 2),
    (3, 'TM-003', 80, 65, 'activo', 2, 2, 3),
    (4, 'TM-004', 80, 70, 'activo', 3, 3, 4),
    (5, 'TM-005', 80, 8, 'mantenimiento', 1, 1, NULL);

  INSERT OR IGNORE INTO guardia (id_guardia, nombre, telefono, id_acceso) VALUES
    (1, 'Pedro Ajú', '4444-1111', 1),
    (2, 'Roberto Cú', '4444-2222', 2),
    (3, 'Alfredo Boc', '4444-3333', 3),
    (4, 'Manuel Sis', '4444-4444', 4),
    (5, 'Diego Tzul', '4444-5555', 5),
    (6, 'Héctor Xol', '4444-6666', 6),
    (7, 'Sergio Yat', '4444-7777', 7),
    (8, 'Ernesto Zet', '4444-8888', 8);

  INSERT OR IGNORE INTO operador (id_operador, nombre, telefono, id_estacion) VALUES
    (1, 'Ana Pérez', '3333-1111', 1),
    (2, 'Beatriz Méndez', '3333-2222', 2),
    (3, 'Clara Torres', '3333-3333', 3),
    (4, 'Diana Ruiz', '3333-4444', 4),
    (5, 'Elena Vásquez', '3333-5555', 5),
    (6, 'Fernanda Castillo', '3333-6666', 6);

  INSERT OR IGNORE INTO distancia (estacion_origen, estacion_destino, kilometros) VALUES
    (1, 2, 3.2), (2, 3, 2.8), (3, 4, 4.1), (2, 5, 5.5), (4, 6, 6.3);

  INSERT OR IGNORE INTO usuario (id_usuario, username, password, rol, nombre) VALUES
    (1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador', 'Administrador SIGETRA'),
    (2, 'operador1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador', 'Operador Principal');
`;
// Nota: password hasheada = "password" para ambos usuarios

module.exports = { schema, seedData };
