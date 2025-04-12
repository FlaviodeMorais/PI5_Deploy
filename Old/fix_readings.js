/**
 * Script temporário para corrigir inconsistências nos estados dos dispositivos
 * Este script força a consistência entre as leituras salvas no banco e o estado atual em memória
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obter o caminho atual do diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constantes
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY || '5UWNQD21RD2A7QHG';
const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY || '9NG6QLIN8UXLE2AH';
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '2840207';
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

/**
 * Obtém o último estado dos dispositivos no ThingSpeak
 */
async function getThingspeakDeviceStatus() {
  try {
    console.log(`📡 Obtendo último estado dos dispositivos do ThingSpeak (canal ${THINGSPEAK_CHANNEL_ID})...`);
    
    const timestamp = new Date().getTime();
    const response = await fetch(
      `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1&t=${timestamp}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.feeds || data.feeds.length === 0) {
      console.log('⚠️ Nenhum dado encontrado no ThingSpeak');
      return { pumpStatus: false, heaterStatus: false };
    }
    
    const latestFeed = data.feeds[0];
    console.log('📊 Dados do ThingSpeak:', latestFeed);
    
    // Verificar valores nulos ou indeterminados
    const field3 = latestFeed.field3;
    const field4 = latestFeed.field4;
    
    const pumpStatus = field3 === '1' || field3 === 1;
    const heaterStatus = field4 === '1' || field4 === 1;
    
    console.log(`📊 ThingSpeak: field3=${field3}, field4=${field4}`);
    console.log(`🔌 Estado dos dispositivos: Bomba=${pumpStatus ? 'ON' : 'OFF'}, Aquecedor=${heaterStatus ? 'ON' : 'OFF'}`);
    
    return { pumpStatus, heaterStatus };
    
  } catch (error) {
    console.error('❌ Erro ao obter estado dos dispositivos do ThingSpeak:', error);
    return { pumpStatus: false, heaterStatus: false };
  }
}

/**
 * Verifica o banco de dados SQLite
 */
async function checkDatabase() {
  try {
    // Abre uma conexão direta com o banco para diagnóstico sem depender do storage.ts
    console.log('🔍 Verificando banco de dados SQLite...');
    
    const response = await fetch('http://localhost:5000/api/readings/latest?limit=1');
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Última leitura no banco:', data);

    return data;
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
    return null;
  }
}

/**
 * Verifica o estado em memória usado para feedback imediato
 */
async function checkMemoryState() {
  try {
    console.log('🔍 Verificando estado em memória...');
    
    const response = await fetch('http://localhost:5000/api/device/status');
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Estado em memória:', data);

    return data;
    
  } catch (error) {
    console.error('❌ Erro ao verificar estado em memória:', error);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Iniciando diagnóstico do sistema...\n');
  
  // Verificar estado dos dispositivos no ThingSpeak
  const thingspeakStatus = await getThingspeakDeviceStatus();
  
  // Verificar banco de dados
  const dbStatus = await checkDatabase();
  
  // Verificar estado em memória
  const memoryStatus = await checkMemoryState();
  
  console.log('\n📋 Resumo do diagnóstico:');
  console.log(`ThingSpeak: Bomba=${thingspeakStatus.pumpStatus ? 'ON' : 'OFF'}, Aquecedor=${thingspeakStatus.heaterStatus ? 'ON' : 'OFF'}`);
  
  if (dbStatus && dbStatus.readings && dbStatus.readings.length > 0) {
    const lastReading = dbStatus.readings[0];
    console.log(`Banco: Bomba=${lastReading.pumpStatus ? 'ON' : 'OFF'}, Aquecedor=${lastReading.heaterStatus ? 'ON' : 'OFF'}`);
  }
  
  if (memoryStatus) {
    console.log(`Memória: Bomba=${memoryStatus.pumpStatus ? 'ON' : 'OFF'}, Aquecedor=${memoryStatus.heaterStatus ? 'ON' : 'OFF'}`);
    console.log(`Pendente sincronização: ${memoryStatus.pendingSync ? 'SIM' : 'NÃO'}`);
  }
  
  console.log('\n🔧 Recomendações:');
  console.log('1. Reinicie o servidor com "npm run dev" para aplicar as mudanças no emulator_config.json');
  console.log('2. Verifique se o sistema continua mostrando alternância nos logs após o reinício');
  console.log('3. Se o problema persistir, considere adicionar um registro de depuração na função generateReading() do emulador');
  
  console.log('\n✅ Diagnóstico concluído!');
}

// Executar função principal
main().catch(error => {
  console.error('❌ Erro não tratado:', error);
});