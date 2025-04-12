// Script para verificar e atualizar o status dos dispositivos no ThingSpeak
import fetch from 'node-fetch';

// Configurações do ThingSpeak
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY || '5UWNQD21RD2A7QHG';
const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY || '9NG6QLIN8UXLE2AH';
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '2840207';
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

/**
 * Lê o estado atual dos dispositivos no ThingSpeak
 */
async function getCurrentDeviceStatus() {
  try {
    console.log("Verificando status atual no ThingSpeak...");
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
      console.log("Nenhum dado encontrado no ThingSpeak.");
      return null;
    }

    const latestFeed = data.feeds[0];
    console.log("Dados brutos do ThingSpeak:", JSON.stringify(latestFeed, null, 2));
    
    // Extrair valores de estado dos dispositivos
    const pumpStatus = parseBooleanValue(latestFeed.field3);
    const heaterStatus = parseBooleanValue(latestFeed.field4);
    
    console.log(`Status atual: Bomba = ${pumpStatus ? "LIGADA" : "DESLIGADA"}, Aquecedor = ${heaterStatus ? "LIGADO" : "DESLIGADO"}`);
    
    return { pumpStatus, heaterStatus };
  } catch (error) {
    console.error("Erro ao buscar status:", error.message);
    return null;
  }
}

/**
 * Converte valores de string/number para boolean
 */
function parseBooleanValue(value) {
  if (value === null || value === undefined || value === '') return false;
  
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === '0' || normalizedValue === 'false') {
      return false;
    }
    return normalizedValue === '1' || normalizedValue === 'true';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
}

/**
 * Atualiza o status dos dispositivos no ThingSpeak
 */
async function updateDeviceStatus(pumpStatus, heaterStatus) {
  try {
    console.log(`Atualizando status para: Bomba = ${pumpStatus ? "LIGADA" : "DESLIGADA"}, Aquecedor = ${heaterStatus ? "LIGADO" : "DESLIGADO"}`);
    
    const timestamp = new Date().getTime();
    const url = new URL(`${THINGSPEAK_BASE_URL}/update`);
    url.searchParams.append('api_key', THINGSPEAK_WRITE_API_KEY);
    url.searchParams.append('field3', pumpStatus ? '1' : '0');
    url.searchParams.append('field4', heaterStatus ? '1' : '0');
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
    console.log(`Resultado da atualização: ${updateResult}`);
    
    return updateResult !== '0';
  } catch (error) {
    console.error("Erro ao atualizar status:", error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    // Obter status atual
    const currentStatus = await getCurrentDeviceStatus();
    
    if (!currentStatus) {
      console.log("Não foi possível obter o status atual.");
      return;
    }
    
    // Verificar se algum dos dispositivos está ligado
    if (currentStatus.pumpStatus || currentStatus.heaterStatus) {
      console.log("Detectados dispositivos ligados. Corrigindo para desligados...");
      
      // Atualizar ambos os dispositivos para desligados
      const success = await updateDeviceStatus(false, false);
      
      if (success) {
        console.log("Status dos dispositivos corrigido com sucesso!");
      } else {
        console.log("Falha ao corrigir status dos dispositivos.");
      }
    } else {
      console.log("Todos os dispositivos já estão desligados. Nenhuma ação necessária.");
    }
  } catch (error) {
    console.error("Erro na execução:", error.message);
  }
}

// Executar script
main().then(() => console.log("Script concluído."));