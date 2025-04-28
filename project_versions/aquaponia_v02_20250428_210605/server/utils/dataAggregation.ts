import { Reading } from '../../shared/schema';

// Constante para o valor de erro do sensor (deve corresponder ao mesmo valor usado no cliente)
const SENSOR_ERROR_VALUE = -127;

/**
 * Interface para definir uma leitura agregada
 */
export interface AggregatedReading {
  temperature: number;
  temperatureCount: number; // contador específico para temperatura válida
  level: number;
  levelCount: number; // contador específico para nível válido
  pumpStatus: boolean;
  heaterStatus: boolean;
  timestamp: Date;
  count: number; // número total de leituras agregadas
}

/**
 * Agrupa leituras por minuto e calcula médias
 * @param readings Array de leituras a serem agrupadas
 */
export function aggregateByMinute(readings: Reading[]): Reading[] {
  if (!readings || readings.length === 0) return [];
  
  const minuteGroups: { [key: string]: AggregatedReading } = {};
  
  // Agrupar por minuto
  readings.forEach(reading => {
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
    
    // Acumular valores - ignorar valores de erro do sensor
    const temp = reading.temperature || 0;
    if (temp !== SENSOR_ERROR_VALUE && temp !== -127 && temp > -100) {
      minuteGroups[minuteKey].temperature += temp;
      minuteGroups[minuteKey].temperatureCount++;
    }
    
    const level = reading.level || 0;
    minuteGroups[minuteKey].level += level;
    minuteGroups[minuteKey].levelCount++;
    
    // Para valores booleanos, consideramos o estado mais frequente
    if (reading.pumpStatus) {
      minuteGroups[minuteKey].pumpStatus = true;
    }
    
    if (reading.heaterStatus) {
      minuteGroups[minuteKey].heaterStatus = true;
    }
    
    minuteGroups[minuteKey].count++;
  });
  
  // Converter grupos em leituras com médias
  const aggregatedReadings: Reading[] = Object.values(minuteGroups)
    .map(group => ({
      id: 0, // Será ignorado na exibição
      temperature: group.temperatureCount > 0 ? group.temperature / group.temperatureCount : 0,
      level: group.levelCount > 0 ? group.level / group.levelCount : 0,
      pumpStatus: group.pumpStatus,
      heaterStatus: group.heaterStatus,
      timestamp: group.timestamp
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  console.log(`Agregados ${readings.length} registros em ${aggregatedReadings.length} médias por minuto`);
  
  return aggregatedReadings;
}

/**
 * Agrupa leituras por hora e calcula médias
 * @param readings Array de leituras a serem agrupadas
 */
export function aggregateByHour(readings: Reading[]): Reading[] {
  if (!readings || readings.length === 0) return [];
  
  const hourlyGroups: { [key: string]: AggregatedReading } = {};
  
  // Agrupar por hora
  readings.forEach(reading => {
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
    
    // Acumular valores - ignorar valores de erro do sensor
    const temp = reading.temperature || 0;
    if (temp !== SENSOR_ERROR_VALUE && temp !== -127 && temp > -100) {
      hourlyGroups[hourKey].temperature += temp;
      hourlyGroups[hourKey].temperatureCount++;
    }
    
    const level = reading.level || 0;
    hourlyGroups[hourKey].level += level;
    hourlyGroups[hourKey].levelCount++;
    
    // Para valores booleanos, consideramos o estado mais frequente
    if (reading.pumpStatus) {
      hourlyGroups[hourKey].pumpStatus = true;
    }
    
    if (reading.heaterStatus) {
      hourlyGroups[hourKey].heaterStatus = true;
    }
    
    hourlyGroups[hourKey].count++;
  });
  
  // Converter grupos em leituras com médias
  const aggregatedReadings: Reading[] = Object.values(hourlyGroups)
    .map(group => ({
      id: 0, // Será ignorado na exibição
      temperature: group.temperatureCount > 0 ? group.temperature / group.temperatureCount : 0,
      level: group.levelCount > 0 ? group.level / group.levelCount : 0,
      pumpStatus: group.pumpStatus,
      heaterStatus: group.heaterStatus,
      timestamp: group.timestamp
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  console.log(`Agregados ${readings.length} registros em ${aggregatedReadings.length} médias horárias`);
  
  return aggregatedReadings;
}

/**
 * Agrupa leituras por semana e calcula médias
 * @param readings Array de leituras a serem agrupadas
 */
export function aggregateByWeek(readings: Reading[]): Reading[] {
  if (!readings || readings.length === 0) return [];
  
  const weeklyGroups: { [key: string]: AggregatedReading } = {};
  
  // Agrupar por semana
  readings.forEach(reading => {
    const date = new Date(reading.timestamp);
    // Obter o início da semana (domingo)
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
    
    // Acumular valores - ignorar valores de erro do sensor
    const temp = reading.temperature || 0;
    if (temp !== SENSOR_ERROR_VALUE && temp !== -127 && temp > -100) {
      weeklyGroups[weekKey].temperature += temp;
      weeklyGroups[weekKey].temperatureCount++;
    }
    
    const level = reading.level || 0;
    weeklyGroups[weekKey].level += level;
    weeklyGroups[weekKey].levelCount++;
    
    // Para valores booleanos, consideramos o estado mais frequente
    if (reading.pumpStatus) {
      weeklyGroups[weekKey].pumpStatus = true;
    }
    
    if (reading.heaterStatus) {
      weeklyGroups[weekKey].heaterStatus = true;
    }
    
    weeklyGroups[weekKey].count++;
  });
  
  // Converter grupos em leituras com médias
  const aggregatedReadings: Reading[] = Object.values(weeklyGroups)
    .map(group => ({
      id: 0, // Será ignorado na exibição
      temperature: group.temperatureCount > 0 ? group.temperature / group.temperatureCount : 0,
      level: group.levelCount > 0 ? group.level / group.levelCount : 0,
      pumpStatus: group.pumpStatus,
      heaterStatus: group.heaterStatus,
      timestamp: group.timestamp
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  console.log(`Agregados ${readings.length} registros em ${aggregatedReadings.length} médias semanais`);
  
  return aggregatedReadings;
}

/**
 * Agrega leituras com base no período especificado
 * @param readings Array de leituras
 * @param startDate Data de início do período
 * @param endDate Data de fim do período
 */
export function aggregateReadingsByDateRange(readings: Reading[], startDate: Date, endDate: Date): Reading[] {
  if (!readings || readings.length === 0) return [];
  
  // Calcular a diferença em dias
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  console.log(`Período de consulta: ${diffDays} dias (${diffHours} horas)`);
  
  // Aplicar a estratégia de agregação com base no período
  if (diffDays <= 1) {
    // Exatamente 24 horas: media por minuto
    return aggregateByMinute(readings);
  } else if (diffDays < 7) {
    // Para períodos curtos (1-7 dias): média por hora
    return aggregateByHour(readings);
  } else {
    // Para períodos longos (7+ dias): média por semana
    return aggregateByWeek(readings);
  }
}