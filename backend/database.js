const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { schema, seedData } = require('./db/schema');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'sigetra.db');

let db;

function getDb() {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    db.exec(schema);
    try { db.exec('ALTER TABLE parqueo ADD COLUMN zona TEXT') } catch {}
    try { db.exec('ALTER TABLE parqueo ADD COLUMN capacidad INTEGER DEFAULT 0') } catch {}
    db.exec(seedData);
    console.log('Base de datos inicializada correctamente');
  }
  return db;
}

module.exports = { getDb };
