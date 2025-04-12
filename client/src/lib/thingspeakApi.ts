import { apiRequest } from "./queryClient";
import { Reading } from "@shared/schema";
import { 
  getBaseUrl, 
  getThingspeakChannelId, 
  getThingspeakReadApiKey,
  getThingspeakWriteApiKey,
  getThingspeakBaseUrl, 
  isDirectDeviceControlEnabled,
  isGitHubPagesEnv
} from "./api-config";

export type ReadingsResponse = {
  readings: Reading[];
  setpoints: {
    temp: {
      min: number;
      max: number;
    };
    level: {
      min: number;
      max: number;
    };
  };
};

/**
 * Interface que representa o estado atual dos dispositivos
 * Inclui o estado oficial do banco de dados e o estado em memória (mais recente)
 * Também indica se há uma sincronização pendente entre eles
 */
export type DeviceStatusResponse = {
  // Estado principal que a interface exibe por padrão (normalmente do banco)
  timestamp: string | number;
  pumpStatus: boolean;
  heaterStatus: boolean;
  
  // Metadados sobre o estado
  pendingSync?: boolean;
  source: 'memory' | 'database' | 'hybrid';
  
  // Estado em memória (atualizações mais recentes que podem não estar no banco ainda)
  memoryState?: {
    timestamp: string | number;
    pumpStatus: boolean;
    heaterStatus: boolean;
  };
  
  // Estado do banco (oficial, confirmado pelo ThingSpeak)
  databaseState?: {
    timestamp: string | number;
    pumpStatus?: boolean;
    heaterStatus?: boolean;
  } | null;
};

export type HistoricalReadingsResponse = ReadingsResponse & {
  stats: {
    temperature: {
      avg: number;
      min: number;
      max: number;
      stdDev: number;
    };
    level: {
      avg: number;
      min: number;
      max: number;
      stdDev: number;
    };
  };
};

// Função auxiliar para acessar diretamente o ThingSpeak quando no GitHub Pages
async function fetchFromThingspeak(endpoint: string): Promise<any> {
  const baseUrl = getBaseUrl();
  const readApiKey = getThingspeakReadApiKey();
  const url = `${baseUrl}${endpoint}&api_key=${readApiKey}`;
  const response = await fetch(url);
  return response.json();
}

// Get latest readings - with GitHub Pages support
export async function getLatestReadings(limit = 60): Promise<ReadingsResponse> {
  // Adicionar timestamp para evitar cache e melhorar desempenho
  const timestamp = new Date().getTime();
  
  console.log('Iniciando busca de leituras com timestamp:', timestamp);
  
  // Se estamos no GitHub Pages, usar API do ThingSpeak diretamente
  if (isGitHubPagesEnv()) {
    try {
      // Buscar a última leitura do ThingSpeak
      const data = await fetchFromThingspeak(
        `/channels/${getThingspeakChannelId()}/feeds.json?results=10`
      );
      
      console.log('Dados recebidos do ThingSpeak (GitHub Pages):', data);
      
      // Valores padrão para setpoints
      const defaultSetpoints = {
        temp: { min: 25, max: 30 },
        level: { min: 40, max: 80 }
      };
      
      // Transformar resposta do ThingSpeak no formato esperado
      const readings: Reading[] = (data.feeds || []).map((feed: any, index: number) => ({
        id: index,
        temperature: parseFloat(feed.field1) || 0,
        level: parseFloat(feed.field2) || 0,
        pumpStatus: feed.field3 === '1' || feed.field3 === 1,
        heaterStatus: feed.field4 === '1' || feed.field4 === 1,
        timestamp: new Date(feed.created_at).getTime()
      })).reverse();
      
      console.log(`Processados ${readings.length} registros de leituras`);
      
      return {
        readings,
        setpoints: defaultSetpoints
      };
      
    } catch (error) {
      console.error('Erro ao buscar dados do ThingSpeak:', error);
      // Fallback com dados vazios
      return {
        readings: [],
        setpoints: {
          temp: { min: 25, max: 30 },
          level: { min: 40, max: 80 }
        }
      };
    }
  }
  
  try {
    // Comportamento normal usando a API local
    console.log('Buscando dados da API local...');
    
    const res = await apiRequest("GET", `/api/readings/latest?limit=${limit}&t=${timestamp}`, undefined, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!res.ok) {
      console.error(`Resposta da API não OK: ${res.status} ${res.statusText}`);
      throw new Error(`Erro ao buscar leituras: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Dados recebidos da API local:', data);
    
    // Verificar se temos leituras válidas
    if (!data.readings || data.readings.length === 0) {
      console.warn('Nenhuma leitura encontrada, tentando buscar do ThingSpeak diretamente');
      // Tentar buscar diretamente do ThingSpeak como fallback
      return await fetchThingspeakReadingsFallback();
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar leituras da API local:', error);
    // Tentar ThingSpeak como fallback
    return await fetchThingspeakReadingsFallback();
  }
}

// Função auxiliar para buscar dados diretamente do ThingSpeak como fallback
async function fetchThingspeakReadingsFallback(): Promise<ReadingsResponse> {
  try {
    console.log('Iniciando fallback direto do ThingSpeak...');
    
    const channelId = getThingspeakChannelId();
    const readApiKey = getThingspeakReadApiKey();
    const url = `${getThingspeakBaseUrl()}/channels/${channelId}/feeds/last.json?api_key=${readApiKey}`;
    
    console.log(`Buscando dados de: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Resposta não OK do ThingSpeak: ${response.status} ${response.statusText}`);
      throw new Error(`Erro ao buscar do ThingSpeak: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Dados brutos do ThingSpeak:', data);
    
    // Verificar se temos dados válidos
    if (!data || !data.created_at) {
      console.error('Dados inválidos do ThingSpeak:', data);
      throw new Error('Dados inválidos do ThingSpeak');
    }
    
    // Usar valores padrão se os campos estiverem vazios ou nulos
    // field1 = temperatura, field2 = nível
    const DEFAULT_TEMP = 25.5;
    const DEFAULT_LEVEL = 74.2;
    
    // Extrair valores com fallback para valores padrão se forem nulos ou inválidos
    const temperature = data.field1 !== null && data.field1 !== undefined ? 
      parseFloat(data.field1) || DEFAULT_TEMP : DEFAULT_TEMP;
      
    const level = data.field2 !== null && data.field2 !== undefined ? 
      parseFloat(data.field2) || DEFAULT_LEVEL : DEFAULT_LEVEL;
      
    const pumpStatus = data.field3 === '1' || data.field3 === 1;
    const heaterStatus = data.field4 === '1' || data.field4 === 1;
    
    console.log(`Valores processados: temp=${temperature}, level=${level}, pump=${pumpStatus}, heater=${heaterStatus}`);
    
    return {
      readings: [{
        id: 1,
        temperature,
        level,
        pumpStatus,
        heaterStatus,
        timestamp: new Date(data.created_at).getTime()
      }],
      setpoints: {
        temp: { min: 25, max: 30 },
        level: { min: 40, max: 80 }
      }
    };
  } catch (error) {
    console.error('Erro no fallback do ThingSpeak:', error);
    
    // Retornar um conjunto de dados simulados quando tudo falhar
    const now = new Date();
    console.log('Retornando dados simulados devido a erro');
    
    return {
      readings: [{
        id: 1,
        temperature: 25.5, // Valor simulado
        level: 74.2,       // Valor simulado
        pumpStatus: false,
        heaterStatus: false,
        timestamp: now.getTime()
      }],
      setpoints: {
        temp: { min: 25, max: 30 },
        level: { min: 40, max: 80 }
      }
    };
  }
}

// Get historical readings from database or ThingSpeak
export async function getHistoricalReadings(
  startDate: string,
  endDate: string
): Promise<HistoricalReadingsResponse> {
  // Se estamos no GitHub Pages, usar ThingSpeak diretamente
  if (isGitHubPagesEnv()) {
    try {
      // Calcular o número de dias entre as datas
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Buscar dados do ThingSpeak
      return await getThingspeakDataDirect(diffDays || 7);
    } catch (error) {
      console.error('Erro ao buscar dados históricos do ThingSpeak:', error);
      return getEmptyHistoricalData();
    }
  }
  
  // Comportamento normal usando a API local
  const res = await apiRequest(
    "GET",
    `/api/readings/history?startDate=${startDate}&endDate=${endDate}`
  );
  return res.json();
}

// Função auxiliar para obter dados históricos diretamente do ThingSpeak
async function getThingspeakDataDirect(days: number = 7): Promise<HistoricalReadingsResponse> {
  try {
    // Buscar dados históricos do ThingSpeak
    const data = await fetchFromThingspeak(
      `/channels/${getThingspeakChannelId()}/feeds.json?days=${days}`
    );
    
    // Valores padrão para setpoints
    const defaultSetpoints = {
      temp: { min: 25, max: 30 },
      level: { min: 40, max: 80 }
    };
    
    // Transformar resposta do ThingSpeak no formato esperado
    const readings: Reading[] = (data.feeds || []).map((feed: any, index: number) => ({
      id: index,
      temperature: parseFloat(feed.field1) || 0,
      level: parseFloat(feed.field2) || 0,
      pumpStatus: feed.field3 === '1' || feed.field3 === 1,
      heaterStatus: feed.field4 === '1' || feed.field4 === 1,
      timestamp: new Date(feed.created_at).getTime()
    }));
    
    // Calcular estatísticas básicas
    const temps = readings.map(r => r.temperature).filter(t => t > 0);
    const levels = readings.map(r => r.level).filter(l => l > 0);
    
    const stats = {
      temperature: {
        avg: calculateAverage(temps),
        min: Math.min(...temps, 0),
        max: Math.max(...temps, 0),
        stdDev: calculateStdDev(temps)
      },
      level: {
        avg: calculateAverage(levels),
        min: Math.min(...levels, 0),
        max: Math.max(...levels, 0),
        stdDev: calculateStdDev(levels)
      }
    };
    
    return {
      readings,
      setpoints: defaultSetpoints,
      stats
    };
  } catch (error) {
    console.error('Erro ao buscar dados históricos do ThingSpeak:', error);
    return getEmptyHistoricalData();
  }
}

// Funções auxiliares para cálculos estatísticos
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = calculateAverage(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// Retorna dados históricos vazios com valores padrão
function getEmptyHistoricalData(): HistoricalReadingsResponse {
  return {
    readings: [],
    setpoints: {
      temp: { min: 25, max: 30 },
      level: { min: 40, max: 80 }
    },
    stats: {
      temperature: { avg: 0, min: 0, max: 0, stdDev: 0 },
      level: { avg: 0, min: 0, max: 0, stdDev: 0 }
    }
  };
}

// Get historical readings directly from ThingSpeak via backend
export async function getThingspeakHistoricalReadings(
  days: number = 7,
  startDate?: string,
  endDate?: string
): Promise<HistoricalReadingsResponse> {
  // Se estamos no GitHub Pages, usar ThingSpeak diretamente
  if (isGitHubPagesEnv()) {
    return getThingspeakDataDirect(days);
  }
  
  // Comportamento normal usando a API local
  let url = `/api/thingspeak/history?days=${days}`;
  
  // Se datas específicas forem fornecidas, adicionar à URL
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  
  const res = await apiRequest("GET", url);
  return res.json();
}

// Update pump status
export async function updatePumpStatus(status: boolean): Promise<{ success: boolean; pumpStatus: boolean }> {
  // Se estamos no GitHub Pages, usar ThingSpeak diretamente se permitido
  if (isGitHubPagesEnv()) {
    // Verificar se o controle direto está habilitado
    if (!isDirectDeviceControlEnabled()) {
      return { 
        success: false, 
        pumpStatus: status // Retornar o status que foi solicitado para melhor UX
      };
    }
    
    const success = await updateThingspeakDirectly(3, status ? 1 : 0);
    return {
      success,
      pumpStatus: status // Assumimos o estado solicitado
    };
  }
  
  // Comportamento normal usando a API local
  const timestamp = new Date().getTime();
  const res = await apiRequest("POST", `/api/control/pump?t=${timestamp}`, { status }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return res.json();
}

// Update heater status
export async function updateHeaterStatus(status: boolean): Promise<{ success: boolean; heaterStatus: boolean }> {
  // Se estamos no GitHub Pages, usar ThingSpeak diretamente se permitido
  if (isGitHubPagesEnv()) {
    // Verificar se o controle direto está habilitado
    if (!isDirectDeviceControlEnabled()) {
      return { 
        success: false, 
        heaterStatus: status // Retornar o status que foi solicitado para melhor UX
      };
    }
    
    const success = await updateThingspeakDirectly(4, status ? 1 : 0);
    return {
      success,
      heaterStatus: status // Assumimos o estado solicitado
    };
  }
  
  // Comportamento normal usando a API local
  const timestamp = new Date().getTime();
  const res = await apiRequest("POST", `/api/control/heater?t=${timestamp}`, { status }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return res.json();
}

// Update setpoints
export async function updateSetpoints(data: {
  tempMin: number;
  tempMax: number;
  levelMin: number;
  levelMax: number;
}) {
  // No GitHub Pages, apenas simulamos a atualização
  if (isGitHubPagesEnv()) {
    return {
      id: 1,
      temp_min: data.tempMin,
      temp_max: data.tempMax,
      level_min: data.levelMin,
      level_max: data.levelMax,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // Comportamento normal
  const res = await apiRequest("POST", "/api/setpoints", data);
  return res.json();
}

// Get settings
export async function getSettings() {
  // No GitHub Pages, retornamos configurações padrão
  if (isGitHubPagesEnv()) {
    return {
      id: 1,
      theme: "light",
      language: "pt-BR",
      notifications_enabled: true,
      chart_style: "modern",
      date_format: "dd/MM/yyyy",
      time_format: "24h",
      temperature_unit: "C",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // Comportamento normal
  const res = await apiRequest("GET", "/api/settings");
  return res.json();
}

// Update settings
export async function updateSettings(data: any) {
  // No GitHub Pages, apenas simulamos a atualização
  if (isGitHubPagesEnv()) {
    return {
      ...data,
      id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  // Comportamento normal
  const res = await apiRequest("POST", "/api/settings", data);
  return res.json();
}

// Import data from ThingSpeak to local database
export async function importThingspeakToDatabase(days: number = 7): Promise<{ 
  success: boolean; 
  message: string; 
  count: number;
  background?: boolean;
}> {
  // No GitHub Pages, simulamos a operação
  if (isGitHubPagesEnv()) {
    return {
      success: true,
      message: "Dados são carregados diretamente do ThingSpeak no GitHub Pages",
      count: 0,
      background: false
    };
  }
  
  // Comportamento normal
  const res = await apiRequest("POST", `/api/sync/thingspeak-to-db?days=${days}`);
  return res.json();
}

// Get system uptime based on first reading
export async function getSystemUptime(): Promise<{
  success: boolean;
  firstReadingDate: string;
}> {
  // Se estamos no GitHub Pages, retornar uma data fixa para testes
  if (isGitHubPagesEnv()) {
    // Data de 30 dias atrás para demonstração
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return {
      success: true,
      firstReadingDate: thirtyDaysAgo.toISOString()
    };
  }
  
  try {
    const res = await apiRequest("GET", '/api/system/uptime');
    return res.json();
  } catch (error) {
    console.error('Failed to get system uptime:', error);
    // Em caso de erro, retornar a data atual como fallback
    return {
      success: false,
      firstReadingDate: new Date().toISOString()
    };
  }
}

// Get current device status (includes memory state and database state)
export async function getDeviceStatus(): Promise<DeviceStatusResponse> {
  // Se estamos no GitHub Pages, usar ThingSpeak diretamente
  if (isGitHubPagesEnv()) {
    try {
      // Buscar a última leitura do ThingSpeak
      const data = await fetchFromThingspeak(
        `/channels/${getThingspeakChannelId()}/feeds/last.json?results=1`
      );
      
      // Status dos dispositivos baseado na última leitura
      const pumpStatus = data.field3 === '1' || data.field3 === 1;
      const heaterStatus = data.field4 === '1' || data.field4 === 1;
      const timestamp = new Date(data.created_at).getTime();
      
      return {
        timestamp,
        pumpStatus,
        heaterStatus,
        source: 'database',
        pendingSync: false,
        databaseState: {
          timestamp,
          pumpStatus,
          heaterStatus
        },
        memoryState: {
          timestamp,
          pumpStatus,
          heaterStatus
        }
      };
    } catch (error) {
      console.error('Erro ao buscar status dos dispositivos do ThingSpeak:', error);
      // Valores padrão em caso de erro
      return {
        timestamp: Date.now(),
        pumpStatus: false,
        heaterStatus: false,
        source: 'database',
        pendingSync: false
      };
    }
  }
  
  // Comportamento normal usando a API local
  const timestamp = new Date().getTime();
  const res = await apiRequest("GET", `/api/device/status?t=${timestamp}`, undefined, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return res.json();
}

// Função auxiliar para enviar status para o ThingSpeak diretamente
async function updateThingspeakDirectly(field: number, value: 0 | 1): Promise<boolean> {
  if (!isDirectDeviceControlEnabled()) {
    console.warn('Controle direto de dispositivos não disponível no GitHub Pages');
    return false;
  }
  
  try {
    const url = `${getThingspeakBaseUrl()}/update?api_key=${getThingspeakWriteApiKey()}&field${field}=${value}`;
    const response = await fetch(url);
    const data = await response.text();
    
    // ThingSpeak retorna o entry_id se bem sucedido
    return !isNaN(parseInt(data));
  } catch (error) {
    console.error(`Erro ao atualizar campo ${field} no ThingSpeak:`, error);
    return false;
  }
}
