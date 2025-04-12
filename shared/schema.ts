import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Model for readings from sensors
export const readings = pgTable("readings", {
  id: serial("id").primaryKey(),
  temperature: real("temperature").notNull(),
  level: real("level").notNull(),
  pumpStatus: boolean("pump_status").default(false).notNull(),
  heaterStatus: boolean("heater_status").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertReadingSchema = createInsertSchema(readings).omit({
  id: true,
});

// Model for system setpoints/thresholds
export const setpoints = pgTable("setpoints", {
  id: serial("id").primaryKey(),
  tempMin: real("temp_min").default(20.0).notNull(),
  tempMax: real("temp_max").default(30.0).notNull(),
  levelMin: integer("level_min").default(60).notNull(),
  levelMax: integer("level_max").default(90).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSetpointSchema = createInsertSchema(setpoints).omit({
  id: true,
  updatedAt: true,
});

// Model for system settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  systemName: text("system_name").default("Aquaponia").notNull(),
  updateInterval: integer("update_interval").default(1).notNull(),
  dataRetention: integer("data_retention").default(30).notNull(),
  emailAlerts: boolean("email_alerts").default(true).notNull(),
  pushAlerts: boolean("push_alerts").default(true).notNull(),
  alertEmail: text("alert_email"),
  tempCriticalMin: real("temp_critical_min").default(18.0).notNull(),
  tempWarningMin: real("temp_warning_min").default(20.0).notNull(),
  tempWarningMax: real("temp_warning_max").default(28.0).notNull(),
  tempCriticalMax: real("temp_critical_max").default(30.0).notNull(),
  levelCriticalMin: integer("level_critical_min").default(50).notNull(),
  levelWarningMin: integer("level_warning_min").default(60).notNull(),
  levelWarningMax: integer("level_warning_max").default(85).notNull(),
  levelCriticalMax: integer("level_critical_max").default(90).notNull(),
  chartType: text("chart_type").default("classic").notNull(),
  darkMode: boolean("dark_mode").default(false).notNull(),
  use24HourTime: boolean("use_24_hour_time").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Export types
export type Reading = typeof readings.$inferSelect;
export type InsertReading = z.infer<typeof insertReadingSchema>;

export type Setpoint = typeof setpoints.$inferSelect;
export type InsertSetpoint = z.infer<typeof insertSetpointSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

// Statistics type for historical data analysis
export type ReadingStats = {
  avg: number;
  min: number;
  max: number;
  stdDev: number;
};
