
// Script para testar a comunicação com o ThingSpeak
const fetch = require('node-fetch');

// Configurações do ThingSpeak (mesmas do seu projeto)
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY || '5UWNQD21RD2A7QHG';
const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY || '9NG6QLIN8UXLE2AH';
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || '2840207';
const THINGSPEAK_BASE_URL = 'https://api.thingspeak.com';

// Função para buscar dados do ThingSpeak
async function testReadFromThingspeak() {
  try {
    console.log('🔍 Testando leitura do ThingSpeak...');
    const timestamp = new Date().getTime();
    const url = `${THINGSPEAK_BASE_URL}/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1&t=${timestamp}`;
    
    console.log(`URL de leitura: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Resposta do ThingSpeak (leitura):', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao ler do ThingSpeak:', error);
    return false;
  }
}

// Função para escrever no ThingSpeak (teste de campo aleatório para não afetar seus dados reais)
async function testWriteToThingspeak() {
  try {
    console.log('✏️ Testando escrita no ThingSpeak...');
    // Vamos usar field8 como campo de teste para não interferir nos principais
    const testValue = Math.floor(Math.random() * 100);
    const timestamp = new Date().getTime();
    
    const url = new URL(`${THINGSPEAK_BASE_URL}/update`);
    url.searchParams.append('api_key', THINGSPEAK_WRITE_API_KEY);
    url.searchParams.append('field8', testValue.toString());  // Campo de teste
    url.searchParams.append('t', timestamp.toString());
    
    console.log(`URL de escrita: ${url.toString()}`);
    console.log(`Valor de teste: ${testValue}`);
    
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
    console.log(`✅ Resultado da escrita: ${updateResult}`);
    // ThingSpeak retorna o número da entrada, se for 0 é erro
    return updateResult !== '0';
  } catch (error) {
    console.error('❌ Erro ao escrever no ThingSpeak:', error);
    return false;
  }
}

// Verificar conexão de rede geral
async function checkNetworkConnectivity() {
  try {
    console.log('🌐 Verificando conectividade de rede...');
    const response = await fetch('https://api.thingspeak.com', {
      timeout: 5000
    });
    console.log(`✅ Resposta do servidor ThingSpeak: ${response.status} ${response.statusText}`);
    return true;
  } catch (error) {
    console.error('❌ Erro de conectividade:', error);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🧪 Iniciando testes de comunicação com ThingSpeak...');
  console.log('Timestamp atual:', new Date().toISOString());
  
  // Verificar conectividade básica
  const networkOk = await checkNetworkConnectivity();
  if (!networkOk) {
    console.error('❌ Problema de conectividade de rede detectado!');
  }
  
  // Testar leitura
  const readResult = await testReadFromThingspeak();
  
  // Testar escrita
  const writeResult = await testWriteToThingspeak();
  
  // Relatório final
  console.log('\n📋 Resultado dos testes:');
  console.log(`Conectividade de rede: ${networkOk ? '✅ OK' : '❌ Falha'}`);
  console.log(`Leitura do ThingSpeak: ${readResult ? '✅ OK' : '❌ Falha'}`);
  console.log(`Escrita no ThingSpeak: ${writeResult ? '✅ OK' : '❌ Falha'}`);
  
  if (networkOk && readResult && writeResult) {
    console.log('🎉 Todos os testes de comunicação com ThingSpeak foram bem-sucedidos!');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os detalhes acima.');
  }
}

// Executar os testes
runAllTests();
