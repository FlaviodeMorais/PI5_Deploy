import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Corrigido para usar o caminho atual do projeto em vez de tentar usar caminhos relativos complexos
const DB_PATH = path.resolve(process.cwd(), 'aquaponia.db');

export async function createDb() {
  // Primeiro vamos verificar se o arquivo existe e tem conteúdo
  let needsInit = false;
  
  if (!fs.existsSync(DB_PATH)) {
    needsInit = true;
    // Criamos o diretório pai se necessário
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } else {
    // Se o arquivo existe mas está vazio
    const stats = fs.statSync(DB_PATH);
    if (stats.size === 0) {
      needsInit = true;
    }
  }
  
  if (needsInit) {
    console.log('📁 Criando ou recriando banco de dados:', DB_PATH);
    // Removemos o arquivo se existir
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  }

  // Open database connection
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  console.log('🔄 Connected to database');

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL NOT NULL,
      level REAL NOT NULL,
      pump_status INTEGER DEFAULT 0,
      heater_status INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS setpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temp_min REAL DEFAULT 20.0 NOT NULL,
      temp_max REAL DEFAULT 30.0 NOT NULL,
      level_min INTEGER DEFAULT 60 NOT NULL,
      level_max INTEGER DEFAULT 90 NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      system_name TEXT DEFAULT 'Aquaponia' NOT NULL,
      update_interval INTEGER DEFAULT 1 NOT NULL,
      data_retention INTEGER DEFAULT 30 NOT NULL,
      email_alerts INTEGER DEFAULT 1 NOT NULL,
      push_alerts INTEGER DEFAULT 1 NOT NULL,
      alert_email TEXT,
      temp_critical_min REAL DEFAULT 18.0 NOT NULL,
      temp_warning_min REAL DEFAULT 20.0 NOT NULL,
      temp_warning_max REAL DEFAULT 28.0 NOT NULL,
      temp_critical_max REAL DEFAULT 30.0 NOT NULL,
      level_critical_min INTEGER DEFAULT 50 NOT NULL,
      level_warning_min INTEGER DEFAULT 60 NOT NULL,
      level_warning_max INTEGER DEFAULT 85 NOT NULL,
      level_critical_max INTEGER DEFAULT 90 NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
  `);

  console.log('✅ Database tables created successfully');

  // Insert default setpoints if they don't exist
  await db.run(`
    INSERT INTO setpoints (id, temp_min, temp_max, level_min, level_max)
    SELECT 1, 20.0, 30.0, 60, 90
    WHERE NOT EXISTS (SELECT 1 FROM setpoints WHERE id = 1);
  `);

  // Insert default settings if they don't exist
  await db.run(`
    INSERT INTO settings (id)
    SELECT 1
    WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
  `);

  console.log('✅ Database initialized with default values');

  return db;
}
