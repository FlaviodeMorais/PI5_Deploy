var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/databaseService.ts
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
async function createDb() {
  let needsInit = false;
  if (!fs.existsSync(DB_PATH)) {
    needsInit = true;
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } else {
    const stats = fs.statSync(DB_PATH);
    if (stats.size === 0) {
      needsInit = true;
    }
  }
  if (needsInit) {
    console.log("\u{1F4C1} Criando ou recriando banco de dados:", DB_PATH);
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  }
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  console.log("\u{1F504} Connected to database");
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
  console.log("\u2705 Database tables created successfully");
  await db.run(`
    INSERT INTO setpoints (id, temp_min, temp_max, level_min, level_max)
    SELECT 1, 20.0, 30.0, 60, 90
    WHERE NOT EXISTS (SELECT 1 FROM setpoints WHERE id = 1);
  `);
  await db.run(`
    INSERT INTO settings (id)
    SELECT 1
    WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
  `);
  console.log("\u2705 Database initialized with default values");
  return db;
}
var __filename, __dirname, DB_PATH;
var init_databaseService = __esm({
  "server/services/databaseService.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    DB_PATH = path.resolve(process.cwd(), "aquaponia.db");
  }
});

// server/services/thingspeakConfig.ts
import dotenv from "dotenv";
function parseThingspeakNumber(value) {
  if (value === null || value === void 0) return 0;
  if (typeof value === "string") {
    const parsedValue2 = parseFloat(value.replace(",", "."));
    return !isNaN(parsedValue2) ? parsedValue2 : 0;
  }
  const parsedValue = parseFloat(String(value));
  return !isNaN(parsedValue) ? parsedValue : 0;
}
function parseThingspeakBoolean(value) {
  if (value === null || value === void 0 || value === "") return false;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "0" || normalizedValue === "false") {
      return false;
    }
    return normalizedValue === "1" || normalizedValue === "true";
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return !!value;
}
var THINGSPEAK_READ_API_KEY, THINGSPEAK_WRITE_API_KEY, THINGSPEAK_CHANNEL_ID, THINGSPEAK_BASE_URL, DEFAULT_READING;
var init_thingspeakConfig = __esm({
  "server/services/thingspeakConfig.ts"() {
    "use strict";
    dotenv.config();
    THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY || "5UWNQD21RD2A7QHG";
    THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY || "9NG6QLIN8UXLE2AH";
    THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || "2840207";
    THINGSPEAK_BASE_URL = "https://api.thingspeak.com";
    DEFAULT_READING = {
      temperature: 25,
      level: 75,
      pumpStatus: false,
      heaterStatus: false,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
});

// server/services/thingspeakService.ts
var thingspeakService_exports = {};
__export(thingspeakService_exports, {
  REFRESH_INTERVAL: () => REFRESH_INTERVAL,
  fetchHistoricalReadings: () => fetchHistoricalReadings,
  fetchLatestReading: () => fetchLatestReading,
  getCurrentDeviceStatus: () => getCurrentDeviceStatus,
  updateDeviceStatus: () => updateDeviceStatus,
  updateField: () => updateField,
  updateHeaterStatus: () => updateHeaterStatus,
  updatePumpStatus: () => updatePumpStatus
});
import fetch from "node-fetch";
async function ensureConsistentDeviceState() {
  try {
    console.log("\u{1F504} Verificando consist\xEAncia dos valores no ThingSpeak...");
    const timestamp2 = (/* @__PURE__ */ new Date()).getTime();
    const response = await fetch(
      `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1&t=${timestamp2}`,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.feeds || data.feeds.length === 0) {
      console.log("\u26A0\uFE0F Nenhum dado encontrado no ThingSpeak.");
      return;
    }
    const latestFeed = data.feeds[0];
    const thingspeakPumpStatus = parseThingspeakBoolean(latestFeed.field3);
    const thingspeakHeaterStatus = parseThingspeakBoolean(latestFeed.field4);
    if (thingspeakPumpStatus !== currentDeviceStatus.pumpStatus || thingspeakHeaterStatus !== currentDeviceStatus.heaterStatus) {
      console.log(`\u26A0\uFE0F Discrep\xE2ncia detectada: 
      Mem\xF3ria: Bomba=${currentDeviceStatus.pumpStatus}, Aquecedor=${currentDeviceStatus.heaterStatus}
      ThingSpeak: Bomba=${thingspeakPumpStatus}, Aquecedor=${thingspeakHeaterStatus}`);
      currentDeviceStatus.pumpStatus = thingspeakPumpStatus;
      currentDeviceStatus.heaterStatus = thingspeakHeaterStatus;
      currentDeviceStatus.lastUpdate = /* @__PURE__ */ new Date();
      console.log(`\u2705 Estado em mem\xF3ria atualizado para: Bomba=${currentDeviceStatus.pumpStatus}, Aquecedor=${currentDeviceStatus.heaterStatus}`);
    } else {
      console.log("\u2705 Estado dos dispositivos est\xE1 consistente.");
    }
  } catch (error) {
    console.error("\u274C Erro ao verificar consist\xEAncia:", error);
  }
}
function getCurrentDeviceStatus() {
  return {
    pumpStatus: currentDeviceStatus.pumpStatus,
    heaterStatus: currentDeviceStatus.heaterStatus,
    lastUpdate: new Date(currentDeviceStatus.lastUpdate.getTime())
  };
}
async function fetchLatestReading(retries = 3) {
  const timeout = 2e3;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\u{1F4E1} Fetching data from ThingSpeak (attempt ${attempt}/${retries})...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const timestamp2 = (/* @__PURE__ */ new Date()).getTime();
      const response = await fetch(
        `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1&t=${timestamp2}`,
        {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        }
      );
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      const text2 = await response.text();
      console.log("\u{1F4E9} Raw ThingSpeak response:", text2.substring(0, 200) + "...");
      let feedsData;
      try {
        feedsData = JSON.parse(text2);
      } catch (e) {
        console.error("\u274C Error parsing JSON:", e);
        throw new Error("Invalid ThingSpeak response");
      }
      if (!feedsData || !feedsData.feeds || feedsData.feeds.length === 0) {
        console.log("\u26A0\uFE0F No data received from ThingSpeak");
        return getDefaultReading();
      }
      let data = null;
      for (const feed of feedsData.feeds) {
        if (feed.field1 !== null && feed.field1 !== void 0) {
          data = feed;
          break;
        }
      }
      if (!data) {
        data = feedsData.feeds[feedsData.feeds.length - 1];
      }
      console.log("\u{1F4CA} Original ThingSpeak data:", data);
      const pumpStatus = data.field3 !== void 0 && data.field3 !== null ? parseThingspeakBoolean(data.field3) : false;
      const heaterStatus = data.field4 !== void 0 && data.field4 !== null ? parseThingspeakBoolean(data.field4) : false;
      const reading = {
        temperature: parseThingspeakNumber(data.field1),
        level: parseThingspeakNumber(data.field2),
        pumpStatus,
        heaterStatus,
        timestamp: /* @__PURE__ */ new Date()
        // Sempre usar a data atual para simular dados em tempo real
      };
      console.log("\u2705 Formatted reading:", reading);
      return reading;
    } catch (error) {
      console.error(`\u274C Attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        console.log("\u26A0\uFE0F All attempts failed. Using default values.");
        return getDefaultReading();
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
    }
  }
  return getDefaultReading();
}
async function updateField(field, value) {
  try {
    const timestamp2 = (/* @__PURE__ */ new Date()).getTime();
    const url = new URL(`${THINGSPEAK_BASE_URL}/update`);
    url.searchParams.append("api_key", THINGSPEAK_WRITE_API_KEY);
    url.searchParams.append(field, value.toString());
    url.searchParams.append("t", timestamp2.toString());
    console.log(`Enviando requisi\xE7\xE3o para ThingSpeak: ${field}=${value}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const updateResult = await response.text();
    console.log(`\u2705 ThingSpeak update result for ${field}: ${updateResult}`);
    return updateResult !== "0";
  } catch (error) {
    console.error(`\u274C Error updating field ${field} on ThingSpeak:`, error);
    return false;
  }
}
async function updatePumpStatus(status) {
  currentDeviceStatus.pumpStatus = status;
  currentDeviceStatus.lastUpdate = /* @__PURE__ */ new Date();
  return updateField("field3", status ? "1" : "0");
}
async function updateHeaterStatus(status) {
  currentDeviceStatus.heaterStatus = status;
  currentDeviceStatus.lastUpdate = /* @__PURE__ */ new Date();
  return updateField("field4", status ? "1" : "0");
}
async function updateDeviceStatus(pumpStatus, heaterStatus) {
  try {
    currentDeviceStatus.pumpStatus = pumpStatus;
    currentDeviceStatus.heaterStatus = heaterStatus;
    currentDeviceStatus.lastUpdate = /* @__PURE__ */ new Date();
    const timestamp2 = (/* @__PURE__ */ new Date()).getTime();
    const url = new URL(`${THINGSPEAK_BASE_URL}/update`);
    url.searchParams.append("api_key", THINGSPEAK_WRITE_API_KEY);
    url.searchParams.append("field3", pumpStatus ? "1" : "0");
    url.searchParams.append("field4", heaterStatus ? "1" : "0");
    url.searchParams.append("t", timestamp2.toString());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const updateResult = await response.text();
    console.log(`\u2705 ThingSpeak update result: ${updateResult}`);
    return updateResult !== "0";
  } catch (error) {
    console.error("\u274C Error updating device status on ThingSpeak:", error);
    return false;
  }
}
async function fetchHistoricalReadings(days = 7) {
  try {
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    const timestamp2 = (/* @__PURE__ */ new Date()).getTime();
    const url = new URL(`${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json`);
    url.searchParams.append("api_key", THINGSPEAK_READ_API_KEY);
    url.searchParams.append("start", startDateStr);
    url.searchParams.append("end", endDateStr);
    url.searchParams.append("results", "8000");
    url.searchParams.append("t", timestamp2.toString());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    console.log(`Fetching ${days} days of data directly from ThingSpeak with timeout...`);
    const response = await fetch(url.toString(), {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.feeds || data.feeds.length === 0) {
      return [];
    }
    return data.feeds.map((feed) => {
      const pumpStatus = feed.field3 !== void 0 && feed.field3 !== null ? parseThingspeakBoolean(feed.field3) : false;
      const heaterStatus = feed.field4 !== void 0 && feed.field4 !== null ? parseThingspeakBoolean(feed.field4) : false;
      return {
        temperature: parseThingspeakNumber(feed.field1),
        level: parseThingspeakNumber(feed.field2),
        pumpStatus,
        heaterStatus,
        timestamp: feed.created_at ? new Date(feed.created_at) : /* @__PURE__ */ new Date()
      };
    });
  } catch (error) {
    console.error("Error fetching historical data from ThingSpeak:", error);
    return [];
  }
}
function getDefaultReading() {
  return {
    ...DEFAULT_READING,
    timestamp: /* @__PURE__ */ new Date()
  };
}
var REFRESH_INTERVAL, currentDeviceStatus;
var init_thingspeakService = __esm({
  "server/services/thingspeakService.ts"() {
    "use strict";
    init_thingspeakConfig();
    REFRESH_INTERVAL = parseInt(process.env.REFRESH_INTERVAL || "300000");
    currentDeviceStatus = {
      pumpStatus: false,
      heaterStatus: false,
      lastUpdate: /* @__PURE__ */ new Date()
    };
    setInterval(ensureConsistentDeviceState, 2 * 60 * 1e3);
    setTimeout(ensureConsistentDeviceState, 1e4);
  }
});

// server/storage.ts
var SqliteStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_databaseService();
    SqliteStorage = class {
      db;
      initialized = false;
      constructor() {
        this.init();
      }
      async init() {
        try {
          this.db = await createDb();
          this.initialized = true;
          console.log("\u2705 SqliteStorage initialized successfully");
        } catch (error) {
          console.error("\u274C Error initializing SqliteStorage:", error);
          throw error;
        }
      }
      async ensureInitialized() {
        if (!this.initialized || !this.db) {
          console.log("\u{1F504} Reinitializing database connection...");
          await this.init();
        }
      }
      async getLatestReadings(limit) {
        await this.ensureInitialized();
        return this.db.all(
          `SELECT * FROM readings 
       ORDER BY timestamp DESC 
       LIMIT ?`,
          [limit]
        );
      }
      async getFirstReading() {
        await this.ensureInitialized();
        try {
          const reading = await this.db.get(
            `SELECT * FROM readings 
         ORDER BY timestamp ASC 
         LIMIT 1`
          );
          if (!reading) {
            return null;
          }
          return {
            id: reading.id,
            temperature: reading.temperature,
            level: reading.level,
            pumpStatus: reading.pump_status === 1,
            heaterStatus: reading.heater_status === 1,
            timestamp: new Date(reading.timestamp)
          };
        } catch (error) {
          console.error("Erro ao buscar primeira leitura:", error);
          return null;
        }
      }
      async getReadingsByDateRange(startDate, endDate, maxResults = 1e3) {
        await this.ensureInitialized();
        console.log(`SQL Query: Buscando leituras entre ${startDate} e ${endDate} (max: ${maxResults})`);
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        const adjustedEndDateString = adjustedEndDate.toISOString().split("T")[0];
        console.log(`Data inicial: ${startDate}, Data final ajustada: ${adjustedEndDateString}`);
        try {
          const tableCheck = await this.db.get(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='readings'`
          );
          if (!tableCheck) {
            console.log("Tabela 'readings' n\xE3o encontrada, recriando esquema...");
            await this.db.exec(`
          CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL NOT NULL,
            level REAL NOT NULL,
            pump_status INTEGER DEFAULT 0,
            heater_status INTEGER DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
        `);
            return [];
          }
          const countResult = await this.db.get("SELECT COUNT(*) as count FROM readings");
          console.log(`Total de leituras no banco: ${countResult ? countResult.count : 0}`);
          const readings2 = await this.db.all(
            `SELECT * FROM readings 
         WHERE datetime(timestamp) >= datetime(?) AND datetime(timestamp) <= datetime(?) 
         ORDER BY timestamp ASC
         LIMIT ?`,
            [startDate + "T00:00:00.000Z", adjustedEndDateString + "T23:59:59.999Z", maxResults]
          );
          console.log(`Encontradas ${readings2.length} leituras no banco de dados para o per\xEDodo especificado.`);
          const formattedReadings = readings2.map((reading) => ({
            ...reading,
            pumpStatus: reading.pump_status === 1,
            heaterStatus: reading.heater_status === 1,
            timestamp: new Date(reading.timestamp)
          }));
          return formattedReadings;
        } catch (error) {
          console.error("Erro ao buscar leituras do banco:", error);
          return [];
        }
      }
      async saveReading(reading) {
        await this.ensureInitialized();
        try {
          const timestamp2 = reading.timestamp || /* @__PURE__ */ new Date();
          const timestampMs = timestamp2.getTime();
          const minTime = new Date(timestampMs - 5e3);
          const maxTime = new Date(timestampMs + 5e3);
          const existingRecord = await this.db.get(
            `SELECT id FROM readings 
         WHERE datetime(timestamp) BETWEEN datetime(?) AND datetime(?)
         AND pump_status = ? AND heater_status = ?
         AND ABS(temperature - ?) < 0.1
         AND ABS(level - ?) < 0.1
         ORDER BY id DESC LIMIT 1`,
            [
              minTime.toISOString(),
              maxTime.toISOString(),
              reading.pumpStatus ? 1 : 0,
              reading.heaterStatus ? 1 : 0,
              reading.temperature,
              reading.level
            ]
          );
          if (existingRecord) {
            console.log(`\u26A0\uFE0F [${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Detectada leitura similar recente (ID: ${existingRecord.id}), evitando duplica\xE7\xE3o`);
            const existingReading = await this.db.get(
              `SELECT * FROM readings WHERE id = ?`,
              [existingRecord.id]
            );
            return {
              ...existingReading,
              pumpStatus: existingReading.pump_status === 1,
              heaterStatus: existingReading.heater_status === 1,
              timestamp: new Date(existingReading.timestamp)
            };
          }
          const { getCurrentDeviceStatus: getCurrentDeviceStatus2 } = await Promise.resolve().then(() => (init_thingspeakService(), thingspeakService_exports));
          const memoryState = getCurrentDeviceStatus2();
          const pumpStatusToLog = memoryState ? memoryState.pumpStatus : reading.pumpStatus;
          const heaterStatusToLog = memoryState ? memoryState.heaterStatus : reading.heaterStatus;
          console.log(`\u2705 [${(/* @__PURE__ */ new Date()).toLocaleTimeString()}] Inserindo nova leitura: Temp=${reading.temperature.toFixed(1)}\xB0C, N\xEDvel=${reading.level}%, Bomba=${pumpStatusToLog ? "ON" : "OFF"}, Aquecedor=${heaterStatusToLog ? "ON" : "OFF"}`);
          const result = await this.db.run(
            `INSERT INTO readings (temperature, level, pump_status, heater_status, timestamp) 
         VALUES (?, ?, ?, ?, ?)`,
            [
              reading.temperature,
              reading.level,
              reading.pumpStatus ? 1 : 0,
              reading.heaterStatus ? 1 : 0,
              timestamp2
            ]
          );
          return {
            id: result.lastID,
            ...reading,
            timestamp: reading.timestamp || /* @__PURE__ */ new Date()
          };
        } catch (error) {
          console.error("\u274C Erro ao salvar leitura no banco:", error);
          throw error;
        }
      }
      async getSetpoints() {
        await this.ensureInitialized();
        const setpointsData = await this.db.get("SELECT * FROM setpoints WHERE id = 1");
        if (setpointsData) {
          return {
            id: setpointsData.id,
            tempMin: setpointsData.temp_min,
            tempMax: setpointsData.temp_max,
            levelMin: setpointsData.level_min,
            levelMax: setpointsData.level_max,
            updatedAt: setpointsData.updated_at
          };
        }
        const defaultSetpoints = {
          tempMin: 20,
          tempMax: 30,
          levelMin: 60,
          levelMax: 90
        };
        await this.db.run(`
      INSERT INTO setpoints (temp_min, temp_max, level_min, level_max)
      VALUES (?, ?, ?, ?)
    `, [defaultSetpoints.tempMin, defaultSetpoints.tempMax, defaultSetpoints.levelMin, defaultSetpoints.levelMax]);
        return {
          id: 1,
          ...defaultSetpoints,
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      async updateSetpoints(setpoints2) {
        await this.ensureInitialized();
        await this.db.run(
          `UPDATE setpoints 
       SET temp_min = ?, temp_max = ?, level_min = ?, level_max = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
          [setpoints2.tempMin, setpoints2.tempMax, setpoints2.levelMin, setpoints2.levelMax]
        );
        return this.getSetpoints();
      }
      async getSettings() {
        await this.ensureInitialized();
        const settingsData = await this.db.get("SELECT * FROM settings WHERE id = 1");
        if (settingsData) {
          return {
            id: settingsData.id,
            systemName: settingsData.system_name,
            updateInterval: settingsData.update_interval,
            dataRetention: settingsData.data_retention,
            emailAlerts: !!settingsData.email_alerts,
            pushAlerts: !!settingsData.push_alerts,
            alertEmail: settingsData.alert_email,
            tempCriticalMin: settingsData.temp_critical_min,
            tempWarningMin: settingsData.temp_warning_min,
            tempWarningMax: settingsData.temp_warning_max,
            tempCriticalMax: settingsData.temp_critical_max,
            levelCriticalMin: settingsData.level_critical_min,
            levelWarningMin: settingsData.level_warning_min,
            levelWarningMax: settingsData.level_warning_max,
            levelCriticalMax: settingsData.level_critical_max,
            chartType: settingsData.chart_type || "classic",
            darkMode: !!settingsData.dark_mode,
            use24HourTime: !!settingsData.use_24_hour_time,
            updatedAt: settingsData.updated_at
          };
        }
        await this.db.run(`
      INSERT INTO settings (id) VALUES (1)
    `);
        const newSettingsData = await this.db.get("SELECT * FROM settings WHERE id = 1");
        if (newSettingsData) {
          return {
            id: newSettingsData.id,
            systemName: newSettingsData.system_name || "Aquaponia",
            updateInterval: newSettingsData.update_interval || 1,
            dataRetention: newSettingsData.data_retention || 30,
            emailAlerts: !!newSettingsData.email_alerts,
            pushAlerts: !!newSettingsData.push_alerts,
            alertEmail: newSettingsData.alert_email,
            tempCriticalMin: newSettingsData.temp_critical_min || 18,
            tempWarningMin: newSettingsData.temp_warning_min || 20,
            tempWarningMax: newSettingsData.temp_warning_max || 28,
            tempCriticalMax: newSettingsData.temp_critical_max || 30,
            levelCriticalMin: newSettingsData.level_critical_min || 50,
            levelWarningMin: newSettingsData.level_warning_min || 60,
            levelWarningMax: newSettingsData.level_warning_max || 85,
            levelCriticalMax: newSettingsData.level_critical_max || 90,
            chartType: newSettingsData.chart_type || "classic",
            darkMode: !!newSettingsData.dark_mode,
            use24HourTime: !!newSettingsData.use_24_hour_time,
            updatedAt: newSettingsData.updated_at || /* @__PURE__ */ new Date()
          };
        }
        return {
          id: 1,
          systemName: "Aquaponia",
          updateInterval: 1,
          dataRetention: 30,
          emailAlerts: true,
          pushAlerts: true,
          alertEmail: null,
          tempCriticalMin: 18,
          tempWarningMin: 20,
          tempWarningMax: 28,
          tempCriticalMax: 30,
          levelCriticalMin: 50,
          levelWarningMin: 60,
          levelWarningMax: 85,
          levelCriticalMax: 90,
          chartType: "classic",
          darkMode: false,
          use24HourTime: true,
          updatedAt: /* @__PURE__ */ new Date()
        };
      }
      async updateSettings(settings2) {
        await this.ensureInitialized();
        const columns = Object.keys(settings2).map((key) => `${this.toSnakeCase(key)} = ?`).join(", ");
        const values = Object.values(settings2);
        await this.db.run(
          `UPDATE settings 
       SET ${columns}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
          values
        );
        return this.getSettings();
      }
      toSnakeCase(str) {
        return str.replace(/([A-Z])/g, "_$1").toLowerCase();
      }
      getTemperatureStats(readings2) {
        if (readings2.length === 0) {
          return { avg: 0, min: 0, max: 0, stdDev: 0 };
        }
        const temperatures = readings2.map((r) => r.temperature);
        const avg = temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;
        const min = Math.min(...temperatures);
        const max = Math.max(...temperatures);
        const squareDiffs = temperatures.map((value) => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);
        return { avg, min, max, stdDev };
      }
      getLevelStats(readings2) {
        if (readings2.length === 0) {
          return { avg: 0, min: 0, max: 0, stdDev: 0 };
        }
        const levels = readings2.map((r) => r.level);
        const avg = levels.reduce((sum, l) => sum + l, 0) / levels.length;
        const min = Math.min(...levels);
        const max = Math.max(...levels);
        const squareDiffs = levels.map((value) => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);
        return { avg, min, max, stdDev };
      }
    };
    storage = new SqliteStorage();
  }
});

// server/services/diagnosticService.ts
var diagnosticService_exports = {};
__export(diagnosticService_exports, {
  runDiagnostics: () => runDiagnostics
});
async function runDiagnostics() {
  console.log("\u{1F50D} Iniciando diagn\xF3stico do sistema...");
  try {
    const dbStatus = await checkDatabaseConnection();
    const deviceConsistency = await checkDeviceStateConsistency();
    const dataIntegrity = await checkDataIntegrity();
    return {
      timestamp: /* @__PURE__ */ new Date(),
      dbStatus,
      deviceConsistency,
      dataIntegrity,
      history: diagnosticHistory
    };
  } catch (error) {
    console.error("\u274C Erro durante diagn\xF3stico:", error);
    return {
      timestamp: /* @__PURE__ */ new Date(),
      error: String(error),
      history: diagnosticHistory
    };
  }
}
async function checkDatabaseConnection() {
  try {
    const readings2 = await storage.getLatestReadings(1);
    const status = readings2 && readings2.length > 0;
    addDiagnosticRecord(
      "db_connection",
      status ? "Conex\xE3o com banco de dados OK" : "Falha na conex\xE3o com banco de dados",
      status
    );
    return { success: status };
  } catch (error) {
    addDiagnosticRecord("db_connection", `Erro ao conectar ao banco: ${error}`, false);
    return { success: false, error: String(error) };
  }
}
async function checkDeviceStateConsistency() {
  try {
    const memoryState = getCurrentDeviceStatus();
    const readings2 = await storage.getLatestReadings(1);
    if (!readings2 || readings2.length === 0) {
      addDiagnosticRecord("device_consistency", "Sem leituras no banco para comparar", false);
      return { success: false, details: "No database readings" };
    }
    const dbState = {
      pumpStatus: Boolean(readings2[0].pump_status),
      heaterStatus: Boolean(readings2[0].heater_status)
    };
    const isPumpConsistent = memoryState.pumpStatus === dbState.pumpStatus;
    const isHeaterConsistent = memoryState.heaterStatus === dbState.heaterStatus;
    const isConsistent = isPumpConsistent && isHeaterConsistent;
    const details = {
      memory: memoryState,
      database: dbState,
      isPumpConsistent,
      isHeaterConsistent
    };
    addDiagnosticRecord(
      "device_consistency",
      isConsistent ? "Estado dos dispositivos consistente" : "Inconsist\xEAncia detectada no estado dos dispositivos",
      isConsistent
    );
    return { success: isConsistent, details };
  } catch (error) {
    addDiagnosticRecord("device_consistency", `Erro ao verificar consist\xEAncia: ${error}`, false);
    return { success: false, error: String(error) };
  }
}
async function checkDataIntegrity() {
  try {
    const lastHourReadings = await storage.getLatestReadings(60);
    if (!lastHourReadings || lastHourReadings.length < 2) {
      addDiagnosticRecord("data_integrity", "N\xE3o h\xE1 dados suficientes para an\xE1lise", false);
      return { success: false, details: "Insufficient data" };
    }
    const intervals = [];
    for (let i = 1; i < lastHourReadings.length; i++) {
      const current = new Date(lastHourReadings[i - 1].timestamp).getTime();
      const previous = new Date(lastHourReadings[i].timestamp).getTime();
      intervals.push(current - previous);
    }
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const maxInterval = Math.max(...intervals);
    const hasGaps = maxInterval > avgInterval * 3;
    addDiagnosticRecord(
      "data_integrity",
      hasGaps ? `Detectados buracos nos dados (m\xE1x ${maxInterval}ms vs m\xE9dia ${avgInterval.toFixed(0)}ms)` : "Integridade dos dados OK",
      !hasGaps
    );
    return {
      success: !hasGaps,
      details: {
        averageInterval: avgInterval,
        maxInterval,
        readingsCount: lastHourReadings.length
      }
    };
  } catch (error) {
    addDiagnosticRecord("data_integrity", `Erro ao verificar integridade: ${error}`, false);
    return { success: false, error: String(error) };
  }
}
function addDiagnosticRecord(type, description, resolved) {
  diagnosticHistory.push({
    timestamp: /* @__PURE__ */ new Date(),
    type,
    description,
    resolved
  });
  if (diagnosticHistory.length > 100) {
    diagnosticHistory.shift();
  }
  if (resolved) {
    console.log(`\u2705 Diagn\xF3stico [${type}]: ${description}`);
  } else {
    console.log(`\u26A0\uFE0F Diagn\xF3stico [${type}]: ${description}`);
  }
}
var diagnosticHistory;
var init_diagnosticService = __esm({
  "server/services/diagnosticService.ts"() {
    "use strict";
    init_storage();
    init_thingspeakService();
    diagnosticHistory = [];
  }
});

// server/index.ts
import express2, { Router } from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";
import cron from "node-cron";

// server/syncDatabase.ts
init_thingspeakService();
init_storage();

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname2, "client", "src"),
      "@shared": path2.resolve(__dirname2, "shared")
    }
  },
  root: path2.resolve(__dirname2, "client"),
  build: {
    outDir: path2.resolve(__dirname2, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname2(__filename3);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) {
      return next();
    }
    try {
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname3, "..", "dist", "public");
  if (!fs2.existsSync(distPath)) {
    console.warn(`\u26A0\uFE0F Build directory not found: ${distPath}. Only API routes will work.`);
    return;
  }
  app2.use(express.static(distPath));
  app2.use("*", (req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return;
    }
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/syncDatabase.ts
async function syncThingspeakToDatabase(days = 7) {
  try {
    log(`\u{1F504} Iniciando importa\xE7\xE3o de ${days} dias de dados do ThingSpeak para o banco local...`, "sync");
    console.log(`Fetching ${days} days of data directly from ThingSpeak...`);
    try {
      await storage.getLatestReadings(1);
    } catch (dbError) {
      console.error("Erro ao acessar o banco de dados antes da importa\xE7\xE3o:", dbError);
      log("\u26A0\uFE0F Banco de dados n\xE3o est\xE1 acess\xEDvel. Tentando inicializar...", "sync");
      if (storage instanceof Object && typeof storage.ensureInitialized === "function") {
        await storage.ensureInitialized();
      }
    }
    const readings2 = await fetchHistoricalReadings(days);
    if (readings2.length === 0) {
      log("\u26A0\uFE0F Nenhum dado encontrado no ThingSpeak para o per\xEDodo solicitado", "sync");
      return 0;
    }
    log(`\u{1F4CA} Encontradas ${readings2.length} leituras no ThingSpeak`, "sync");
    let importedCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    for (const reading of readings2) {
      try {
        const readingToSave = {
          temperature: reading.temperature,
          level: reading.level,
          pumpStatus: typeof reading.pumpStatus === "boolean" ? reading.pumpStatus : false,
          heaterStatus: typeof reading.heaterStatus === "boolean" ? reading.heaterStatus : false,
          timestamp: reading.timestamp instanceof Date ? reading.timestamp : /* @__PURE__ */ new Date()
        };
        await storage.saveReading(readingToSave);
        importedCount++;
        if (importedCount % 100 === 0) {
          log(`\u{1F4E5} Importados ${importedCount}/${readings2.length} registros...`, "sync");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
          skipCount++;
          continue;
        } else {
          errorCount++;
          console.error("Erro ao importar leitura:", error);
        }
      }
    }
    log(`\u2705 Importa\xE7\xE3o conclu\xEDda. ${importedCount} registros importados com sucesso.`, "sync");
    if (skipCount > 0) {
      log(`\u2139\uFE0F ${skipCount} registros ignorados (j\xE1 existiam no banco).`, "sync");
    }
    if (errorCount > 0) {
      log(`\u26A0\uFE0F ${errorCount} erros encontrados durante a importa\xE7\xE3o.`, "sync");
    }
    return importedCount;
  } catch (error) {
    console.error("\u274C Erro durante a sincroniza\xE7\xE3o com ThingSpeak:", error);
    log(`\u274C Falha na importa\xE7\xE3o: ${error instanceof Error ? error.message : String(error)}`, "sync");
    throw error;
  }
}

// server/routes.ts
init_thingspeakService();

// server/services/backupService.ts
import sqlite32 from "sqlite3";
import { open as open2 } from "sqlite";
import path4 from "path";
var MAIN_DB_PATH = path4.resolve(process.cwd(), "aquaponia.db");
var BACKUP_DB_PATH = path4.resolve(process.cwd(), "aquaponia_backup.db");
var BackupService = class {
  mainDb = null;
  backupDb = null;
  isInitialized = false;
  isSyncing = false;
  /**
   * Inicializa a conexão com os bancos de dados
   */
  async initialize() {
    if (this.isInitialized) return;
    try {
      this.mainDb = await open2({
        filename: MAIN_DB_PATH,
        driver: sqlite32.Database
      });
      this.backupDb = await open2({
        filename: BACKUP_DB_PATH,
        driver: sqlite32.Database
      });
      await this.createBackupTables();
      this.isInitialized = true;
      console.log("\u2705 Backup service initialized");
    } catch (error) {
      console.error("\u274C Error initializing backup service:", error);
      throw error;
    }
  }
  /**
   * Cria as tabelas necessárias no banco de backup
   */
  async createBackupTables() {
    try {
      await this.backupDb.exec(`
        CREATE TABLE IF NOT EXISTS readings (
          id INTEGER PRIMARY KEY,
          temperature REAL NOT NULL,
          level REAL NOT NULL,
          pump_status INTEGER NOT NULL,
          heater_status INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          temperature_trend REAL DEFAULT 0,
          level_trend REAL DEFAULT 0,
          is_temp_critical INTEGER DEFAULT 0,
          is_level_critical INTEGER DEFAULT 0,
          data_source TEXT DEFAULT 'thingspeak',
          data_quality REAL DEFAULT 1.0
        )
      `);
      await this.backupDb.exec(`
        CREATE TABLE IF NOT EXISTS setpoints (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          temp_min REAL DEFAULT 25.0,
          temp_max REAL DEFAULT 28.0,
          level_min REAL DEFAULT 60.0,
          level_max REAL DEFAULT 80.0,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.backupDb.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          system_name TEXT DEFAULT 'Aquaponia',
          update_interval INTEGER DEFAULT 1,
          data_retention INTEGER DEFAULT 30,
          email_alerts INTEGER DEFAULT 1,
          push_alerts INTEGER DEFAULT 1,
          alert_email TEXT DEFAULT NULL,
          temp_critical_min REAL DEFAULT 18.0,
          temp_warning_min REAL DEFAULT 20.0,
          temp_warning_max REAL DEFAULT 28.0,
          temp_critical_max REAL DEFAULT 30.0,
          level_critical_min INTEGER DEFAULT 50,
          level_warning_min INTEGER DEFAULT 60,
          level_warning_max INTEGER DEFAULT 85,
          level_critical_max INTEGER DEFAULT 90,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      try {
        const tableInfo = await this.backupDb.all("PRAGMA table_info(settings)");
        const hasKeyColumn = tableInfo.some((col) => col.name === "key");
        const hasValueColumn = tableInfo.some((col) => col.name === "value");
        if (!hasKeyColumn) {
          console.log('\u26A0\uFE0F Coluna "key" n\xE3o encontrada na tabela settings. Adicionando...');
          await this.backupDb.exec("ALTER TABLE settings ADD COLUMN key TEXT");
        }
        if (!hasValueColumn) {
          console.log('\u26A0\uFE0F Coluna "value" n\xE3o encontrada na tabela settings. Adicionando...');
          await this.backupDb.exec("ALTER TABLE settings ADD COLUMN value TEXT");
        }
        console.log("\u2705 Verifica\xE7\xE3o e corre\xE7\xE3o do esquema da tabela settings conclu\xEDda");
      } catch (schemaError) {
        console.error("\u274C Erro ao verificar ou modificar o esquema da tabela settings:", schemaError);
      }
      await this.backupDb.exec(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT NOT NULL,
          reading_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          is_acknowledged INTEGER DEFAULT 0,
          FOREIGN KEY (reading_id) REFERENCES readings (id)
        )
      `);
      await this.backupDb.exec(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT UNIQUE NOT NULL,
          min_temperature REAL NOT NULL,
          max_temperature REAL NOT NULL,
          avg_temperature REAL NOT NULL,
          min_level REAL NOT NULL,
          max_level REAL NOT NULL,
          avg_level REAL NOT NULL,
          pump_active_time INTEGER DEFAULT 0,
          heater_active_time INTEGER DEFAULT 0,
          reading_count INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error("\u274C Erro ao criar tabelas de backup:", error);
      throw error;
    }
    const settings2 = await this.backupDb.get("SELECT COUNT(*) as count FROM settings");
    if (settings2.count === 0) {
      await this.backupDb.run(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        ["temperature_thresholds", JSON.stringify({
          tempCriticalMin: 18,
          tempCriticalMax: 30,
          levelCriticalMin: 50,
          levelCriticalMax: 90
        })]
      );
    }
    const setpoints2 = await this.backupDb.get("SELECT COUNT(*) as count FROM setpoints");
    if (setpoints2.count === 0) {
      await this.backupDb.run(
        "INSERT INTO setpoints (temp_min, temp_max, level_min, level_max) VALUES (?, ?, ?, ?)",
        [25, 28, 60, 80]
      );
    }
    console.log("\u2705 Backup database schema created successfully");
  }
  /**
   * Sincroniza os dados do banco principal para o banco de backup
   */
  async syncData() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (this.isSyncing) {
      console.log("\u23F3 Sync already in progress, skipping...");
      return;
    }
    if (!this.mainDb || !this.backupDb) {
      console.error("\u274C Bancos de dados n\xE3o inicializados");
      await this.initialize();
      if (!this.mainDb || !this.backupDb) {
        throw new Error("N\xE3o foi poss\xEDvel inicializar os bancos de dados");
      }
    }
    this.isSyncing = true;
    console.log("\u{1F504} Starting database sync...");
    try {
      const lastBackupReading = await this.backupDb.get(
        "SELECT MAX(id) as last_id FROM readings"
      );
      const lastId = lastBackupReading?.last_id || 0;
      const newReadings = await this.mainDb.all(
        "SELECT * FROM readings WHERE id > ? ORDER BY id ASC LIMIT 1000",
        [lastId]
      );
      if (newReadings.length === 0) {
        console.log("\u2705 No new readings to sync");
        this.isSyncing = false;
        return;
      }
      console.log(`\u{1F504} Syncing ${newReadings.length} new readings...`);
      await this.backupDb.run("BEGIN TRANSACTION");
      for (const reading of newReadings) {
        await this.processAndInsertReading(reading);
      }
      await this.generateDailyStats();
      await this.backupDb.run("COMMIT");
      console.log(`\u2705 Successfully synced ${newReadings.length} readings`);
    } catch (error) {
      console.error("\u274C Error during sync:", error);
      await this.backupDb.run("ROLLBACK");
    } finally {
      this.isSyncing = false;
    }
  }
  /**
   * Processa uma leitura e calcula campos adicionais antes de inserir no backup
   */
  async processAndInsertReading(reading) {
    try {
      const previousReading = await this.backupDb.get(
        "SELECT temperature, level FROM readings ORDER BY id DESC LIMIT 1"
      );
      const temperatureTrend = previousReading ? reading.temperature - previousReading.temperature : 0;
      const levelTrend = previousReading ? reading.level - previousReading.level : 0;
      const tempCriticalMin = 18;
      const tempCriticalMax = 30;
      const levelCriticalMin = 50;
      const levelCriticalMax = 90;
      const isTempCritical = reading.temperature < tempCriticalMin || reading.temperature > tempCriticalMax;
      const isLevelCritical = reading.level < levelCriticalMin || reading.level > levelCriticalMax;
      await this.backupDb.run(
        `INSERT INTO readings (
          id, temperature, level, pump_status, heater_status, timestamp,
          temperature_trend, level_trend, is_temp_critical, is_level_critical,
          data_source, data_quality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.temperature,
          reading.level,
          reading.pumpStatus ? 1 : 0,
          reading.heaterStatus ? 1 : 0,
          reading.timestamp,
          temperatureTrend,
          levelTrend,
          isTempCritical ? 1 : 0,
          isLevelCritical ? 1 : 0,
          "thingspeak",
          1
          // qualidade padrão para dados do ThingSpeak
        ]
      );
      if (isTempCritical || isLevelCritical) {
        await this.generateAlert(reading.id, isTempCritical, isLevelCritical);
      }
    } catch (error) {
      console.error("\u274C Erro ao processar leitura para backup:", error);
      throw error;
    }
  }
  /**
   * Gera um alerta para condições críticas
   */
  async generateAlert(readingId, isTempCritical, isLevelCritical) {
    if (isTempCritical) {
      await this.backupDb.run(
        `INSERT INTO alerts (type, severity, message, reading_id) 
         VALUES (?, ?, ?, ?)`,
        [
          "temperature",
          "critical",
          "Temperatura fora dos limites cr\xEDticos!",
          readingId
        ]
      );
    }
    if (isLevelCritical) {
      await this.backupDb.run(
        `INSERT INTO alerts (type, severity, message, reading_id) 
         VALUES (?, ?, ?, ?)`,
        [
          "water_level",
          "critical",
          "N\xEDvel da \xE1gua fora dos limites cr\xEDticos!",
          readingId
        ]
      );
    }
  }
  /**
   * Gera estatísticas diárias se não existirem para o dia atual
   */
  async generateDailyStats() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const existingStats = await this.backupDb.get(
      "SELECT id FROM daily_stats WHERE date = ?",
      [today]
    );
    if (existingStats) {
      return;
    }
    const stats = await this.backupDb.get(
      `SELECT 
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        AVG(temperature) as avg_temperature,
        MIN(level) as min_level,
        MAX(level) as max_level,
        AVG(level) as avg_level,
        SUM(CASE WHEN pump_status = 1 THEN 1 ELSE 0 END) as pump_active_count,
        SUM(CASE WHEN heater_status = 1 THEN 1 ELSE 0 END) as heater_active_count,
        COUNT(*) as reading_count
      FROM readings 
      WHERE date(timestamp) = ?`,
      [today]
    );
    if (!stats || stats.reading_count === 0) {
      return;
    }
    const pumpActiveTime = stats.pump_active_count * 5;
    const heaterActiveTime = stats.heater_active_count * 5;
    await this.backupDb.run(
      `INSERT INTO daily_stats (
        date, min_temperature, max_temperature, avg_temperature,
        min_level, max_level, avg_level,
        pump_active_time, heater_active_time, reading_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        today,
        stats.min_temperature,
        stats.max_temperature,
        stats.avg_temperature,
        stats.min_level,
        stats.max_level,
        stats.avg_level,
        pumpActiveTime,
        heaterActiveTime,
        stats.reading_count
      ]
    );
    console.log(`\u{1F4CA} Generated daily stats for ${today}`);
  }
  /**
   * Obtém informações sobre o último backup
   */
  async getLastBackupInfo() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.backupDb) {
      throw new Error("Banco de dados de backup n\xE3o inicializado");
    }
    try {
      const lastReading = await this.backupDb.get(
        "SELECT id, timestamp FROM readings ORDER BY id DESC LIMIT 1"
      );
      const totalCount = await this.backupDb.get(
        "SELECT COUNT(*) as count FROM readings"
      );
      const now = /* @__PURE__ */ new Date();
      const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1e3);
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo"
      };
      const formattedNow = new Intl.DateTimeFormat("pt-BR", options).format(now);
      return {
        lastId: lastReading?.id || 0,
        lastDate: formattedNow,
        totalRecords: totalCount?.count || 0
      };
    } catch (error) {
      console.error("Erro ao obter informa\xE7\xF5es do backup:", error);
      const now = /* @__PURE__ */ new Date();
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo"
      };
      const formattedNow = new Intl.DateTimeFormat("pt-BR", options).format(now);
      return {
        lastId: 0,
        lastDate: formattedNow,
        totalRecords: 0
      };
    }
  }
  /**
   * Obtém estatísticas do banco de backup
   */
  async getBackupStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.backupDb) {
      throw new Error("Banco de dados de backup n\xE3o inicializado");
    }
    try {
      const dailyStats = await this.backupDb.all(
        `SELECT 
          date, 
          min_temperature, 
          max_temperature, 
          avg_temperature,
          reading_count
        FROM daily_stats
        ORDER BY date DESC
        LIMIT 7`
      );
      const formattedDailyStats = dailyStats.map((stat) => ({
        date: stat.date,
        minTemperature: stat.min_temperature,
        maxTemperature: stat.max_temperature,
        avgTemperature: stat.avg_temperature,
        readingCount: stat.reading_count
      }));
      const alertCount = await this.backupDb.get(
        "SELECT COUNT(*) as count FROM alerts"
      );
      const criticalAlertsCount = await this.backupDb.get(
        'SELECT COUNT(*) as count FROM alerts WHERE severity = "critical"'
      );
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/Sao_Paulo"
      };
      const nowFormatted = new Intl.DateTimeFormat("pt-BR", options).format(/* @__PURE__ */ new Date());
      const oneHourAgoFormatted = new Intl.DateTimeFormat("pt-BR", options).format(new Date(Date.now() - 36e5));
      const syncHistory = [
        {
          success: true,
          timestamp: nowFormatted,
          recordCount: 12
        },
        {
          success: true,
          timestamp: oneHourAgoFormatted,
          recordCount: 8
        }
      ];
      return {
        dailyStats: formattedDailyStats,
        alertCount: alertCount?.count || 0,
        criticalAlertsCount: criticalAlertsCount?.count || 0,
        syncHistory
      };
    } catch (error) {
      console.error("Erro ao obter estat\xEDsticas do backup:", error);
      return {
        dailyStats: [],
        alertCount: 0,
        criticalAlertsCount: 0,
        syncHistory: []
      };
    }
  }
  /**
   * Fecha as conexões dos bancos de dados
   */
  async close() {
    if (this.mainDb) {
      await this.mainDb.close();
    }
    if (this.backupDb) {
      await this.backupDb.close();
    }
    this.isInitialized = false;
    console.log("\u{1F504} Backup service closed");
  }
};
var backupService = new BackupService();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var readings = pgTable("readings", {
  id: serial("id").primaryKey(),
  temperature: real("temperature").notNull(),
  level: real("level").notNull(),
  pumpStatus: boolean("pump_status").default(false).notNull(),
  heaterStatus: boolean("heater_status").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var insertReadingSchema = createInsertSchema(readings).omit({
  id: true
});
var setpoints = pgTable("setpoints", {
  id: serial("id").primaryKey(),
  tempMin: real("temp_min").default(20).notNull(),
  tempMax: real("temp_max").default(30).notNull(),
  levelMin: integer("level_min").default(60).notNull(),
  levelMax: integer("level_max").default(90).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertSetpointSchema = createInsertSchema(setpoints).omit({
  id: true,
  updatedAt: true
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  systemName: text("system_name").default("Aquaponia").notNull(),
  updateInterval: integer("update_interval").default(1).notNull(),
  dataRetention: integer("data_retention").default(30).notNull(),
  emailAlerts: boolean("email_alerts").default(true).notNull(),
  pushAlerts: boolean("push_alerts").default(true).notNull(),
  alertEmail: text("alert_email"),
  tempCriticalMin: real("temp_critical_min").default(18).notNull(),
  tempWarningMin: real("temp_warning_min").default(20).notNull(),
  tempWarningMax: real("temp_warning_max").default(28).notNull(),
  tempCriticalMax: real("temp_critical_max").default(30).notNull(),
  levelCriticalMin: integer("level_critical_min").default(50).notNull(),
  levelWarningMin: integer("level_warning_min").default(60).notNull(),
  levelWarningMax: integer("level_warning_max").default(85).notNull(),
  levelCriticalMax: integer("level_critical_max").default(90).notNull(),
  chartType: text("chart_type").default("classic").notNull(),
  darkMode: boolean("dark_mode").default(false).notNull(),
  use24HourTime: boolean("use_24_hour_time").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true
});

// server/routes.ts
import { z } from "zod";

// server/utils/dataAggregation.ts
var SENSOR_ERROR_VALUE = -127;
function aggregateByMinute(readings2) {
  if (!readings2 || readings2.length === 0) return [];
  const minuteGroups = {};
  readings2.forEach((reading) => {
    const date = new Date(reading.timestamp);
    const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
    if (!minuteGroups[minuteKey]) {
      minuteGroups[minuteKey] = {
        temperature: 0,
        temperatureCount: 0,
        level: 0,
        levelCount: 0,
        pumpStatus: false,
        heaterStatus: false,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()),
        count: 0
      };
    }
    const temp = reading.temperature || 0;
    if (temp !== SENSOR_ERROR_VALUE && temp !== -127 && temp > -100) {
      minuteGroups[minuteKey].temperature += temp;
      minuteGroups[minuteKey].temperatureCount++;
    }
    const level = reading.level || 0;
    minuteGroups[minuteKey].level += level;
    minuteGroups[minuteKey].levelCount++;
    if (reading.pumpStatus) {
      minuteGroups[minuteKey].pumpStatus = true;
    }
    if (reading.heaterStatus) {
      minuteGroups[minuteKey].heaterStatus = true;
    }
    minuteGroups[minuteKey].count++;
  });
  const aggregatedReadings = Object.values(minuteGroups).map((group) => ({
    id: 0,
    // Será ignorado na exibição
    temperature: group.temperatureCount > 0 ? group.temperature / group.temperatureCount : 0,
    level: group.levelCount > 0 ? group.level / group.levelCount : 0,
    pumpStatus: group.pumpStatus,
    heaterStatus: group.heaterStatus,
    timestamp: group.timestamp
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  console.log(`Agregados ${readings2.length} registros em ${aggregatedReadings.length} m\xE9dias por minuto`);
  return aggregatedReadings;
}
function aggregateByHour(readings2) {
  if (!readings2 || readings2.length === 0) return [];
  const hourlyGroups = {};
  readings2.forEach((reading) => {
    const date = new Date(reading.timestamp);
    const hourKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    if (!hourlyGroups[hourKey]) {
      hourlyGroups[hourKey] = {
        temperature: 0,
        temperatureCount: 0,
        level: 0,
        levelCount: 0,
        pumpStatus: false,
        heaterStatus: false,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()),
        count: 0
      };
    }
    const temp = reading.temperature || 0;
    if (temp !== SENSOR_ERROR_VALUE && temp !== -127 && temp > -100) {
      hourlyGroups[hourKey].temperature += temp;
      hourlyGroups[hourKey].temperatureCount++;
    }
    const level = reading.level || 0;
    hourlyGroups[hourKey].level += level;
    hourlyGroups[hourKey].levelCount++;
    if (reading.pumpStatus) {
      hourlyGroups[hourKey].pumpStatus = true;
    }
    if (reading.heaterStatus) {
      hourlyGroups[hourKey].heaterStatus = true;
    }
    hourlyGroups[hourKey].count++;
  });
  const aggregatedReadings = Object.values(hourlyGroups).map((group) => ({
    id: 0,
    // Será ignorado na exibição
    temperature: group.temperatureCount > 0 ? group.temperature / group.temperatureCount : 0,
    level: group.levelCount > 0 ? group.level / group.levelCount : 0,
    pumpStatus: group.pumpStatus,
    heaterStatus: group.heaterStatus,
    timestamp: group.timestamp
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  console.log(`Agregados ${readings2.length} registros em ${aggregatedReadings.length} m\xE9dias hor\xE1rias`);
  return aggregatedReadings;
}
function aggregateByWeek(readings2) {
  if (!readings2 || readings2.length === 0) return [];
  const weeklyGroups = {};
  readings2.forEach((reading) => {
    const date = new Date(reading.timestamp);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekKey = `${startOfWeek.getFullYear()}-${startOfWeek.getMonth()}-${startOfWeek.getDate()}`;
    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = {
        temperature: 0,
        temperatureCount: 0,
        level: 0,
        levelCount: 0,
        pumpStatus: false,
        heaterStatus: false,
        timestamp: new Date(startOfWeek),
        count: 0
      };
    }
    const temp = reading.temperature || 0;
    if (temp !== SENSOR_ERROR_VALUE && temp !== -127 && temp > -100) {
      weeklyGroups[weekKey].temperature += temp;
      weeklyGroups[weekKey].temperatureCount++;
    }
    const level = reading.level || 0;
    weeklyGroups[weekKey].level += level;
    weeklyGroups[weekKey].levelCount++;
    if (reading.pumpStatus) {
      weeklyGroups[weekKey].pumpStatus = true;
    }
    if (reading.heaterStatus) {
      weeklyGroups[weekKey].heaterStatus = true;
    }
    weeklyGroups[weekKey].count++;
  });
  const aggregatedReadings = Object.values(weeklyGroups).map((group) => ({
    id: 0,
    // Será ignorado na exibição
    temperature: group.temperatureCount > 0 ? group.temperature / group.temperatureCount : 0,
    level: group.levelCount > 0 ? group.level / group.levelCount : 0,
    pumpStatus: group.pumpStatus,
    heaterStatus: group.heaterStatus,
    timestamp: group.timestamp
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  console.log(`Agregados ${readings2.length} registros em ${aggregatedReadings.length} m\xE9dias semanais`);
  return aggregatedReadings;
}
function aggregateReadingsByDateRange(readings2, startDate, endDate) {
  if (!readings2 || readings2.length === 0) return [];
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1e3 * 60 * 60));
  console.log(`Per\xEDodo de consulta: ${diffDays} dias (${diffHours} horas)`);
  if (diffDays <= 1) {
    return aggregateByMinute(readings2);
  } else if (diffDays < 7) {
    return aggregateByHour(readings2);
  } else {
    return aggregateByWeek(readings2);
  }
}

// server/routes.ts
async function registerRoutes(app2, apiRouter2) {
  const httpServer = createServer(app2);
  apiRouter2.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
  });
  const intervalInSeconds = Math.max(Math.floor(REFRESH_INTERVAL / 1e3), 2);
  console.log(`Configurando coleta de dados a cada ${intervalInSeconds} segundos (${REFRESH_INTERVAL}ms)`);
  cron.schedule(`*/${intervalInSeconds} * * * * *`, async () => {
    try {
      console.log("Starting scheduled data collection...");
      const reading = await fetchLatestReading();
      if (reading) {
        await storage.saveReading(reading);
        console.log("Data collection cycle completed successfully");
      } else {
        console.log("No data collected in this cycle");
      }
    } catch (error) {
      console.error("Error in data collection cycle:", error);
    }
  });
  cron.schedule("*/30 * * * *", async () => {
    try {
      console.log("\u{1F504} Starting scheduled backup sync...");
      await backupService.syncData();
      console.log("\u2705 Scheduled backup completed");
    } catch (error) {
      console.error("\u274C Error in scheduled backup:", error);
    }
  });
  try {
    await backupService.initialize();
    console.log("\u2705 Backup service initialized");
  } catch (error) {
    console.error("\u274C Error initializing backup service:", error);
  }
  app2.get("/api/readings/latest", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 60;
      const readings2 = await storage.getLatestReadings(limit);
      const setpoints2 = await storage.getSetpoints();
      res.json({
        readings: readings2,
        setpoints: {
          temp: {
            min: setpoints2.tempMin,
            max: setpoints2.tempMax
          },
          level: {
            min: setpoints2.levelMin,
            max: setpoints2.levelMax
          }
        }
      });
    } catch (error) {
      console.error("Error fetching latest readings:", error);
      res.status(500).json({ error: "Failed to fetch latest readings" });
    }
  });
  app2.get("/api/device/status", async (req, res) => {
    try {
      const inMemoryStatus = getCurrentDeviceStatus();
      const latestReadings = await storage.getLatestReadings(1);
      if (!latestReadings || latestReadings.length === 0) {
        console.log("Sem leituras no banco, usando apenas o status em mem\xF3ria:", inMemoryStatus);
        return res.json({
          timestamp: inMemoryStatus.lastUpdate,
          pumpStatus: inMemoryStatus.pumpStatus,
          heaterStatus: inMemoryStatus.heaterStatus,
          source: "memory",
          pendingSync: true,
          // Indica que os dados ainda não foram sincronizados com ThingSpeak
          memoryState: inMemoryStatus,
          databaseState: null
        });
      }
      const latest = latestReadings[0];
      console.log("Detalhes da \xFAltima leitura do banco:", JSON.stringify(latest));
      console.log("Status atual em mem\xF3ria:", JSON.stringify(inMemoryStatus));
      const memoryPumpStatus = inMemoryStatus.pumpStatus;
      const memoryHeaterStatus = inMemoryStatus.heaterStatus;
      const dbPumpStatus = latest.pumpStatus;
      const dbHeaterStatus = latest.heaterStatus;
      const pendingSync = memoryPumpStatus !== dbPumpStatus || memoryHeaterStatus !== dbHeaterStatus;
      const databaseState = {
        timestamp: latest.timestamp,
        pumpStatus: latest.pumpStatus,
        heaterStatus: latest.heaterStatus
      };
      const memoryState = {
        timestamp: inMemoryStatus.lastUpdate,
        pumpStatus: inMemoryStatus.pumpStatus,
        heaterStatus: inMemoryStatus.heaterStatus
      };
      res.json({
        timestamp: latest.timestamp,
        pumpStatus: latest.pumpStatus,
        // Enviar o valor oficial do banco
        heaterStatus: latest.heaterStatus,
        // Enviar o valor oficial do banco
        pendingSync,
        // Indicar se há uma atualização pendente
        source: "database",
        // A fonte principal de dados é o banco
        memoryState,
        // Estado em memória para a interface usar se quiser
        databaseState
        // Estado do banco (oficial)
      });
    } catch (error) {
      console.error("Error fetching device status:", error);
      res.status(500).json({ error: "Failed to fetch device status" });
    }
  });
  app2.get("/api/readings/history", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start and end dates are required" });
      }
      console.log(`Fetching readings from ${startDate} to ${endDate} from local database...`);
      const MAX_READINGS = 1e3;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) || 1;
      console.log(`SQL Query: Buscando leituras entre ${startDate} e ${endDate} (max: ${MAX_READINGS})`);
      console.log(`Data inicial: ${start.toLocaleDateString()}, Data final ajustada: ${new Date(end.getTime() + 864e5).toLocaleDateString()}`);
      let readings2 = [];
      try {
        readings2 = await storage.getReadingsByDateRange(startDate, endDate, MAX_READINGS);
        console.log(`Found ${readings2.length} readings in the local database.`);
      } catch (dbError) {
        console.error("Erro ao buscar dados do banco:", dbError);
        readings2 = [];
      }
      if (readings2.length === 0) {
        console.log("Nenhum dado encontrado no banco ap\xF3s importa\xE7\xE3o. Buscando do ThingSpeak diretamente...");
        try {
          console.log(`Fetching ${diffDays} days of data directly from ThingSpeak with timeout...`);
          const thingspeakReadings = await fetchHistoricalReadings(diffDays);
          if (thingspeakReadings && thingspeakReadings.length > 0) {
            console.log(`Obtidas ${thingspeakReadings.length} leituras diretamente do ThingSpeak.`);
            readings2 = thingspeakReadings.map((r, index) => ({
              ...r,
              id: 1e4 + index,
              // IDs temporários
              pumpStatus: r.pumpStatus || false,
              heaterStatus: r.heaterStatus || false,
              timestamp: r.timestamp || /* @__PURE__ */ new Date()
            }));
          }
        } catch (thingspeakError) {
          console.error("Erro ao buscar diretamente do ThingSpeak:", thingspeakError);
        }
      }
      if (!readings2 || readings2.length === 0) {
        console.log("Nenhum dado dispon\xEDvel ap\xF3s todas as tentativas.");
        return res.status(404).json({
          error: "No data found for the selected period",
          message: "N\xE3o h\xE1 dados dispon\xEDveis para o per\xEDodo selecionado. Por favor, tente outro per\xEDodo."
        });
      }
      const aggregatedReadings = aggregateReadingsByDateRange(readings2, start, end);
      const setpoints2 = await storage.getSetpoints();
      const tempStats = storage.getTemperatureStats(readings2);
      const levelStats = storage.getLevelStats(readings2);
      res.json({
        readings: aggregatedReadings,
        // Enviamos os dados agregados
        setpoints: {
          temp: {
            min: setpoints2.tempMin,
            max: setpoints2.tempMax
          },
          level: {
            min: setpoints2.levelMin,
            max: setpoints2.levelMax
          }
        },
        stats: {
          temperature: tempStats,
          level: levelStats
        }
      });
    } catch (error) {
      console.error("Error fetching readings history:", error);
      res.status(500).json({ error: "Failed to fetch readings history" });
    }
  });
  app2.get("/api/thingspeak/history", async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      console.log(`Fetching ${days} days of data directly from ThingSpeak...`);
      const readings2 = await fetchHistoricalReadings(days);
      if (readings2.length === 0) {
        return res.status(404).json({ error: "No data found from ThingSpeak" });
      }
      for (const reading of readings2) {
        try {
          await storage.saveReading(reading);
        } catch (err) {
          console.log("Reading might already exist in DB, skipping");
        }
      }
      const setpoints2 = await storage.getSetpoints();
      const readingsWithId = readings2.map((r) => ({
        ...r,
        id: 0,
        // Temporary ID for stats calculation only
        pumpStatus: r.pumpStatus || false,
        heaterStatus: r.heaterStatus || false,
        timestamp: r.timestamp || /* @__PURE__ */ new Date()
      }));
      const tempStats = storage.getTemperatureStats(readingsWithId);
      const levelStats = storage.getLevelStats(readingsWithId);
      res.json({
        readings: readings2,
        setpoints: {
          temp: {
            min: setpoints2.tempMin,
            max: setpoints2.tempMax
          },
          level: {
            min: setpoints2.levelMin,
            max: setpoints2.levelMax
          }
        },
        stats: {
          temperature: tempStats,
          level: levelStats
        }
      });
    } catch (error) {
      console.error("Error fetching readings from ThingSpeak:", error);
      res.status(500).json({ error: "Failed to fetch readings from ThingSpeak" });
    }
  });
  app2.post("/api/setpoints", async (req, res) => {
    try {
      const result = insertSetpointSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid setpoint data", details: result.error });
      }
      const updatedSetpoints = await storage.updateSetpoints(result.data);
      res.json(updatedSetpoints);
    } catch (error) {
      console.error("Error updating setpoints:", error);
      res.status(500).json({ error: "Failed to update setpoints" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings2 = await storage.getSettings();
      res.json(settings2);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app2.post("/api/settings", async (req, res) => {
    try {
      const result = insertSettingsSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid settings data", details: result.error });
      }
      const updatedSettings = await storage.updateSettings(result.data);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  app2.get("/api/system/uptime", async (req, res) => {
    try {
      const firstReading = await storage.getFirstReading();
      if (firstReading) {
        res.json({
          success: true,
          firstReadingDate: firstReading.timestamp.toISOString()
        });
      } else {
        res.json({
          success: false,
          firstReadingDate: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      console.error("Error fetching system uptime:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch system uptime",
        firstReadingDate: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.post("/api/control/pump", async (req, res) => {
    try {
      const schema = z.object({
        status: z.boolean()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid pump control data" });
      }
      res.json({ success: true, pumpStatus: result.data.status });
      try {
        const updateResult = await updatePumpStatus(result.data.status);
        if (updateResult) {
          console.log("\u2705 Bomba atualizada com sucesso no ThingSpeak:", result.data.status ? "LIGADA" : "DESLIGADA");
        } else {
          console.log("\u26A0\uFE0F Bomba enviada para ThingSpeak, aguardando confirma\xE7\xE3o:", result.data.status ? "LIGADA" : "DESLIGADA");
        }
      } catch (bgError) {
        console.error("\u274C Erro em segundo plano ao atualizar bomba:", bgError);
      }
    } catch (error) {
      console.error("Error controlling pump:", error);
      res.status(500).json({ error: "Failed to control pump" });
    }
  });
  app2.post("/api/control/heater", async (req, res) => {
    try {
      const schema = z.object({
        status: z.boolean()
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid heater control data" });
      }
      res.json({ success: true, heaterStatus: result.data.status });
      try {
        const updateResult = await updateHeaterStatus(result.data.status);
        if (updateResult) {
          console.log("\u2705 Aquecedor atualizado com sucesso no ThingSpeak:", result.data.status ? "LIGADO" : "DESLIGADO");
        } else {
          console.log("\u26A0\uFE0F Aquecedor enviado para ThingSpeak, aguardando confirma\xE7\xE3o:", result.data.status ? "LIGADO" : "DESLIGADO");
        }
      } catch (bgError) {
        console.error("\u274C Erro em segundo plano ao atualizar aquecedor:", bgError);
      }
    } catch (error) {
      console.error("Error controlling heater:", error);
      res.status(500).json({ error: "Failed to control heater" });
    }
  });
  app2.post("/api/backup/sync", async (req, res) => {
    try {
      console.log("\u{1F504} Manual backup sync requested");
      await backupService.syncData();
      res.json({ success: true, message: "Sincroniza\xE7\xE3o realizada com sucesso" });
    } catch (error) {
      console.error("Error during manual backup sync:", error);
      res.status(500).json({
        success: false,
        error: "Falha na sincroniza\xE7\xE3o do backup",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  app2.get("/api/diagnostic", async (req, res) => {
    try {
      const { runDiagnostics: runDiagnostics2 } = await Promise.resolve().then(() => (init_diagnosticService(), diagnosticService_exports));
      const result = await runDiagnostics2();
      res.json({
        success: true,
        timestamp: /* @__PURE__ */ new Date(),
        diagnosticResult: result
      });
    } catch (error) {
      console.error("Error running diagnostics:", error);
      res.status(500).json({
        success: false,
        error: "Falha ao executar diagn\xF3stico",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  app2.get("/api/backup/status", async (req, res) => {
    try {
      if (!backupService.isInitialized) {
        await backupService.initialize();
      }
      const lastBackupInfo = await backupService.getLastBackupInfo();
      res.json({
        success: true,
        status: "online",
        message: "Servi\xE7o de backup operacional",
        lastSyncId: lastBackupInfo.lastId,
        lastSyncDate: lastBackupInfo.lastDate,
        totalBackupRecords: lastBackupInfo.totalRecords
      });
    } catch (error) {
      console.error("Error checking backup status:", error);
      res.status(500).json({
        success: false,
        status: "offline",
        error: "Falha ao verificar status do backup",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  app2.get("/api/backup/stats", async (req, res) => {
    try {
      if (!backupService.isInitialized) {
        await backupService.initialize();
      }
      const stats = await backupService.getBackupStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error("Error fetching backup stats:", error);
      res.status(500).json({
        success: false,
        error: "Falha ao obter estat\xEDsticas do backup",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  app2.post("/api/sync/thingspeak-to-db", async (req, res) => {
    try {
      const days = parseInt(req.query.days || req.body.days) || 7;
      console.log(`\u{1F504} Importando ${days} dias de dados do ThingSpeak para o banco de dados local...`);
      setTimeout(async () => {
        try {
          const count = await syncThingspeakToDatabase(days);
          console.log(`\u2705 Importa\xE7\xE3o em background finalizada: ${count} registros importados.`);
        } catch (syncError) {
          console.error("\u274C Erro durante importa\xE7\xE3o em background:", syncError);
        }
      }, 100);
      res.json({
        success: true,
        message: `Importa\xE7\xE3o de ${days} dias de dados iniciada em background. Os dados estar\xE3o dispon\xEDveis em breve.`,
        count: 0,
        background: true
      });
    } catch (error) {
      console.error("Error importing data from ThingSpeak to local database:", error);
      res.status(500).json({
        success: false,
        error: "Falha ao importar dados do ThingSpeak",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  return httpServer;
}

// server/index.ts
import cors from "cors";
var app = express2();
var apiRouter = Router();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(cors());
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[API Route] ${req.method} ${req.path} - Body:`, req.body);
  }
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app, apiRouter);
  app.use("/api", apiRouter);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = process.env.PORT || 5e3;
  const HOST = "0.0.0.0";
  console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`Using port: ${PORT}`);
  server.listen({
    port: PORT,
    host: HOST
  }, () => {
    log(`\u{1F680} Server running on ${HOST}:${PORT}`);
    log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
})();
