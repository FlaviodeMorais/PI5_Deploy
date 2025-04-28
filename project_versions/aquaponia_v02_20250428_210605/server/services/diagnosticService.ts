
/**
 * Serviço de diagnóstico para verificar e corrigir problemas de sincronização
 */
import { storage } from '../storage';
import { getCurrentDeviceStatus } from './thingspeakService';

// Armazenar o histórico de diagnósticos
const diagnosticHistory: Array<{
  timestamp: Date;
  type: string;
  description: string;
  resolved: boolean;
}> = [];

/**
 * Executa um diagnóstico completo do sistema
 */
export async function runDiagnostics() {
  console.log('🔍 Iniciando diagnóstico do sistema...');
  
  try {
    // 1. Verificar conexão com o banco de dados
    const dbStatus = await checkDatabaseConnection();
    
    // 2. Verificar consistência do estado dos dispositivos
    const deviceConsistency = await checkDeviceStateConsistency();
    
    // 3. Verificar integridade dos dados
    const dataIntegrity = await checkDataIntegrity();
    
    return {
      timestamp: new Date(),
      dbStatus,
      deviceConsistency,
      dataIntegrity,
      history: diagnosticHistory
    };
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
    return {
      timestamp: new Date(),
      error: String(error),
      history: diagnosticHistory
    };
  }
}

/**
 * Verifica a conexão com o banco de dados
 */
async function checkDatabaseConnection() {
  try {
    // Tentar buscar uma leitura do banco para testar conexão
    const readings = await storage.getLatestReadings(1);
    const status = readings && readings.length > 0;
    
    addDiagnosticRecord('db_connection', 
      status ? 'Conexão com banco de dados OK' : 'Falha na conexão com banco de dados',
      status);
    
    return { success: status };
  } catch (error) {
    addDiagnosticRecord('db_connection', `Erro ao conectar ao banco: ${error}`, false);
    return { success: false, error: String(error) };
  }
}

/**
 * Verifica a consistência do estado dos dispositivos
 */
async function checkDeviceStateConsistency() {
  try {
    // Obter estado atual dos dispositivos em memória
    const memoryState = getCurrentDeviceStatus();
    
    // Obter último estado conhecido do banco
    const readings = await storage.getLatestReadings(1);
    
    if (!readings || readings.length === 0) {
      addDiagnosticRecord('device_consistency', 'Sem leituras no banco para comparar', false);
      return { success: false, details: 'No database readings' };
    }
    
    const dbState = {
      pumpStatus: Boolean(readings[0].pump_status),
      heaterStatus: Boolean(readings[0].heater_status)
    };
    
    // Verificar consistência
    const isPumpConsistent = memoryState.pumpStatus === dbState.pumpStatus;
    const isHeaterConsistent = memoryState.heaterStatus === dbState.heaterStatus;
    const isConsistent = isPumpConsistent && isHeaterConsistent;
    
    const details = {
      memory: memoryState,
      database: dbState,
      isPumpConsistent,
      isHeaterConsistent
    };
    
    addDiagnosticRecord('device_consistency', 
      isConsistent ? 'Estado dos dispositivos consistente' : 'Inconsistência detectada no estado dos dispositivos',
      isConsistent);
    
    return { success: isConsistent, details };
  } catch (error) {
    addDiagnosticRecord('device_consistency', `Erro ao verificar consistência: ${error}`, false);
    return { success: false, error: String(error) };
  }
}

/**
 * Verifica a integridade dos dados
 */
async function checkDataIntegrity() {
  try {
    // Verificar se há buracos de tempo significativos nos dados
    const lastHourReadings = await storage.getLatestReadings(60);
    
    if (!lastHourReadings || lastHourReadings.length < 2) {
      addDiagnosticRecord('data_integrity', 'Não há dados suficientes para análise', false);
      return { success: false, details: 'Insufficient data' };
    }
    
    // Calcular intervalos entre leituras
    const intervals: number[] = [];
    for (let i = 1; i < lastHourReadings.length; i++) {
      const current = new Date(lastHourReadings[i-1].timestamp).getTime();
      const previous = new Date(lastHourReadings[i].timestamp).getTime();
      intervals.push(current - previous);
    }
    
    // Calcular média e desvio padrão
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const maxInterval = Math.max(...intervals);
    
    // Se o intervalo máximo for maior que 3x a média, há um buraco nos dados
    const hasGaps = maxInterval > (avgInterval * 3);
    
    addDiagnosticRecord('data_integrity', 
      hasGaps ? `Detectados buracos nos dados (máx ${maxInterval}ms vs média ${avgInterval.toFixed(0)}ms)` : 'Integridade dos dados OK',
      !hasGaps);
    
    return { 
      success: !hasGaps, 
      details: { 
        averageInterval: avgInterval, 
        maxInterval, 
        readingsCount: lastHourReadings.length 
      } 
    };
  } catch (error) {
    addDiagnosticRecord('data_integrity', `Erro ao verificar integridade: ${error}`, false);
    return { success: false, error: String(error) };
  }
}

/**
 * Adiciona um registro ao histórico de diagnósticos
 */
function addDiagnosticRecord(type: string, description: string, resolved: boolean) {
  diagnosticHistory.push({
    timestamp: new Date(),
    type,
    description,
    resolved
  });
  
  // Limitar o tamanho do histórico para os últimos 100 registros
  if (diagnosticHistory.length > 100) {
    diagnosticHistory.shift();
  }
  
  // Logar o diagnóstico
  if (resolved) {
    console.log(`✅ Diagnóstico [${type}]: ${description}`);
  } else {
    console.log(`⚠️ Diagnóstico [${type}]: ${description}`);
  }
}
