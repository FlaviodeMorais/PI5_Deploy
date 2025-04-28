// ThingSpeak configuration and types
import dotenv from 'dotenv';

dotenv.config();

// ThingSpeak API keys and settings
export const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY || '5UWNQD21RD2A7QHG';
export const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY || '9NG6QLIN8UXLE2AH';
export const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '2840207';
export const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

// Field mappings for ThingSpeak fields
export const THINGSPEAK_FIELD_MAPPINGS = {
  temperature: 'field1',
  level: 'field2',
  pumpStatus: 'field3',
  heaterStatus: 'field4'
};

// Default values when ThingSpeak data is missing
export const DEFAULT_READING = {
  temperature: 25.0,
  level: 75.0,
  pumpStatus: false,
  heaterStatus: false,
  timestamp: new Date()
};

// Helper function to parse numbers from ThingSpeak
export function parseThingspeakNumber(value: any): number {
  // Se valor nulo ou indefinido, retorna 0
  if (value === null || value === undefined) return 0;
  
  // Lida com valores do tipo string
  if (typeof value === 'string') {
    const parsedValue = parseFloat(value.replace(',', '.'));
    return !isNaN(parsedValue) ? parsedValue : 0;
  }
  
  // Processa valores numéricos 
  const parsedValue = parseFloat(String(value));
  return !isNaN(parsedValue) ? parsedValue : 0;
}

// Helper to parse boolean values (0/1) from ThingSpeak
export function parseThingspeakBoolean(value: any): boolean {
  // Valores nulos, indefinidos ou vazios são sempre FALSE
  if (value === null || value === undefined || value === '') return false;
  
  // Valores de string específicos '0', 'false' são FALSE
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === '0' || normalizedValue === 'false') {
      return false;
    }
    return normalizedValue === '1' || normalizedValue === 'true';
  }
  
  // Para zero numérico retornamos FALSE, para outros números como 1 retornamos TRUE
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  // Para qualquer outro tipo, convertemos para booleano
  return !!value;
}

// Type for ThingSpeak response
export interface ThingspeakResponse {
  created_at?: string;
  entry_id?: number;
  field1?: string | number | null;
  field2?: string | number | null;
  field3?: string | number | null;
  field4?: string | number | null;
  field5?: string | number | null;
  field6?: string | number | null;
  field7?: string | number | null;
  field8?: string | number | null;
}

// Type for ThingSpeak feeds response (historical data)
export interface ThingspeakFeedsResponse {
  channel?: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  feeds?: ThingspeakResponse[];
}