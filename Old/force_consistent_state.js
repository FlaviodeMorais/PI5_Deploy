/**
 * Script para forçar consistência nos estados dos dispositivos no ThingSpeak e no emulador
 * Isso ajudará a resolver o problema de alternância no status da bomba e do aquecedor
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obter o caminho atual do diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constantes
const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY || '9NG6QLIN8UXLE2AH';
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

// Caminho para o arquivo de configuração do emulador
const CONFIG_FILE_PATH = path.join(process.cwd(), 'emulator_config.json');

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
 * Atualiza o estado de um dispositivo no ThingSpeak
 */
async function updateThingspeakDeviceState(field, value) {
  try {
    console.log(`📡 Atualizando ${field} para "${value}" no ThingSpeak...`);
    
    const timestamp = new Date().getTime();
    const url = new URL(`${THINGSPEAK_BASE_URL}/update`);
    url.searchParams.append('api_key', THINGSPEAK_WRITE_API_KEY);
    url.searchParams.append(field, value.toString());
    url.searchParams.append('t', timestamp.toString());
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    const updateResult = await response.text();
    console.log(`✅ Resultado da atualização do ThingSpeak: ${updateResult}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${field} no ThingSpeak:`, error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔧 Iniciando correção de estado dos dispositivos...');
  
  // Definir estado desejado (sempre OFF para resolver inconsistências)
  const desiredState = {
    pumpStatus: false,
    heaterStatus: false
  };
  
  // Ler configuração atual do emulador
  const config = readEmulatorConfig();
  if (!config) {
    console.error('❌ Não foi possível ler a configuração do emulador');
    return;
  }
  
  console.log('\n📋 Configuração atual do emulador:');
  console.log(`Modo: ${config.mode}`);
  console.log(`Ativado: ${config.enabled}`);
  console.log(`Bomba: ${config.controlStates.pumpStatus ? 'ON' : 'OFF'}`);
  console.log(`Aquecedor: ${config.controlStates.heaterStatus ? 'ON' : 'OFF'}`);
  
  // Atualizar configuração do emulador
  let configChanged = false;
  
  if (config.controlStates.pumpStatus !== desiredState.pumpStatus) {
    console.log(`🔄 Alterando estado da bomba de ${config.controlStates.pumpStatus ? 'ON' : 'OFF'} para ${desiredState.pumpStatus ? 'ON' : 'OFF'}`);
    config.controlStates.pumpStatus = desiredState.pumpStatus;
    configChanged = true;
  }
  
  if (config.controlStates.heaterStatus !== desiredState.heaterStatus) {
    console.log(`🔄 Alterando estado do aquecedor de ${config.controlStates.heaterStatus ? 'ON' : 'OFF'} para ${desiredState.heaterStatus ? 'ON' : 'OFF'}`);
    config.controlStates.heaterStatus = desiredState.heaterStatus;
    configChanged = true;
  }
  
  if (config.mode !== 'stable') {
    console.log(`🔄 Alterando modo do emulador de ${config.mode} para stable`);
    config.mode = 'stable';
    configChanged = true;
  }
  
  // Salvar configuração se houve alterações
  if (configChanged) {
    if (!saveEmulatorConfig(config)) {
      console.log('❌ Não foi possível salvar a configuração do emulador');
      return;
    }
  } else {
    console.log('ℹ️ Configuração do emulador já está correta');
  }
  
  // Atualizar ThingSpeak
  console.log('\n🔄 Atualizando estado dos dispositivos no ThingSpeak...');
  
  const field3Success = await updateThingspeakDeviceState('field3', desiredState.pumpStatus ? '1' : '0');
  const field4Success = await updateThingspeakDeviceState('field4', desiredState.heaterStatus ? '1' : '0');
  
  if (field3Success && field4Success) {
    console.log('✅ Estado dos dispositivos atualizado com sucesso no ThingSpeak!');
  } else {
    console.log('⚠️ Houve problemas ao atualizar o estado dos dispositivos no ThingSpeak');
  }
  
  console.log('\n🔧 Recomendações:');
  console.log('1. Reinicie o servidor com "npm run dev" para aplicar as mudanças');
  console.log('2. Verifique se a inconsistência nos logs foi resolvida');
  
  console.log('\n✅ Correção de estado concluída!');
}

// Executar função principal
main().catch(error => {
  console.error('❌ Erro não tratado:', error);
});