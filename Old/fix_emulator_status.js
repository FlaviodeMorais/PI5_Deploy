/**
 * Script para corrigir o status do emulador e verificar discrepâncias entre a configuração e o ThingSpeak
 */
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

// Obter o caminho atual do diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo de configuração do emulador
const CONFIG_FILE_PATH = path.join(process.cwd(), 'emulator_config.json');

// Chaves de API do ThingSpeak
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY || '5UWNQD21RD2A7QHG';
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '2840207';
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

/**
 * Lê a configuração atual do emulador
 */
function readEmulatorConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(configData);
    } else {
      console.error('Arquivo de configuração não encontrado:', CONFIG_FILE_PATH);
      return null;
    }
  } catch (error) {
    console.error('Erro ao ler arquivo de configuração:', error);
    return null;
  }
}

/**
 * Salva a configuração atualizada
 */
function saveEmulatorConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log('✅ Configuração do emulador atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configuração do emulador:', error);
    return false;
  }
}

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
 * Função principal
 */
async function main() {
  console.log('🔍 Iniciando verificação do estado do emulador...');
  
  // Ler configuração atual do emulador
  const config = readEmulatorConfig();
  if (!config) {
    console.error('❌ Não foi possível ler a configuração do emulador');
    return;
  }
  
  console.log('\n📋 Configuração atual do emulador:');
  console.log(`Modo: ${config.mode}`);
  console.log(`Ativado: ${config.enabled}`);
  console.log(`Intervalo de atualização: ${config.updateInterval}ms`);
  console.log(`Bomba: ${config.controlStates.pumpStatus ? 'ON' : 'OFF'}`);
  console.log(`Aquecedor: ${config.controlStates.heaterStatus ? 'ON' : 'OFF'}`);
  
  // Obter estado atual dos dispositivos no ThingSpeak
  const thingspeakStatus = await getThingspeakDeviceStatus();
  
  // Verificar se há discrepância
  const pumpDiscrepancy = config.controlStates.pumpStatus !== thingspeakStatus.pumpStatus;
  const heaterDiscrepancy = config.controlStates.heaterStatus !== thingspeakStatus.heaterStatus;
  
  if (pumpDiscrepancy || heaterDiscrepancy) {
    console.log('\n⚠️ Detectada discrepância entre a configuração do emulador e ThingSpeak:');
    
    if (pumpDiscrepancy) {
      console.log(`Bomba: Emulador=${config.controlStates.pumpStatus ? 'ON' : 'OFF'}, ThingSpeak=${thingspeakStatus.pumpStatus ? 'ON' : 'OFF'}`);
    }
    
    if (heaterDiscrepancy) {
      console.log(`Aquecedor: Emulador=${config.controlStates.heaterStatus ? 'ON' : 'OFF'}, ThingSpeak=${thingspeakStatus.heaterStatus ? 'ON' : 'OFF'}`);
    }
    
    // Corrigir modo para 'stable'
    if (config.mode !== 'stable') {
      console.log('\n🔨 Corrigindo modo do emulador para "stable"...');
      config.mode = 'stable';
    }
    
    // Atualizar estado dos dispositivos na configuração
    console.log('🔨 Sincronizando estado dos dispositivos com ThingSpeak...');
    config.controlStates.pumpStatus = thingspeakStatus.pumpStatus;
    config.controlStates.heaterStatus = thingspeakStatus.heaterStatus;
    
    // Salvar configuração atualizada
    if (saveEmulatorConfig(config)) {
      console.log('\n✅ Configuração do emulador corrigida com sucesso!');
      console.log('ℹ️ Por favor, reinicie o servidor para aplicar as alterações');
    } else {
      console.log('\n❌ Não foi possível corrigir a configuração do emulador');
    }
  } else {
    console.log('\n✅ Não há discrepância entre a configuração do emulador e ThingSpeak');
  }
}

// Executar função principal
main().catch(error => {
  console.error('❌ Erro não tratado:', error);
});