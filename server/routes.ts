import type { Express } from "express";
import { createServer, type Server } from "http";
import cron from "node-cron";
import { zodResolver } from '@hookform/resolvers/zod';
import { storage } from "./storage";
import { syncThingspeakToDatabase } from './syncDatabase';
import { 
  fetchLatestReading, 
  fetchHistoricalReadings, 
  updateDeviceStatus,
  updatePumpStatus,
  updateHeaterStatus,
  getCurrentDeviceStatus,
  REFRESH_INTERVAL 
} from "./services/thingspeakService";
import { Reading } from "@shared/schema";
import { backupService } from "./services/backupService";
import { insertSetpointSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { aggregateReadingsByDateRange } from "./utils/dataAggregation";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Schedule data collection using the configured REFRESH_INTERVAL (5 minutes)
  // Calcular o intervalo em segundos para o cron a partir do REFRESH_INTERVAL em ms
  const intervalInSeconds = Math.max(Math.floor(REFRESH_INTERVAL / 1000), 2);
  console.log(`Configurando coleta de dados a cada ${intervalInSeconds} segundos (${REFRESH_INTERVAL}ms)`);

  cron.schedule(`*/${intervalInSeconds} * * * * *`, async () => {
    try {
      console.log('Starting scheduled data collection...');
      const reading = await fetchLatestReading();
      if (reading) {
        await storage.saveReading(reading);
        console.log('Data collection cycle completed successfully');
      } else {
        console.log('No data collected in this cycle');
      }
    } catch (error) {
      console.error('Error in data collection cycle:', error);
    }
  });

  // Agenda sincronização do backup a cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('🔄 Starting scheduled backup sync...');
      await backupService.syncData();
      console.log('✅ Scheduled backup completed');
    } catch (error) {
      console.error('❌ Error in scheduled backup:', error);
    }
  });

  // Inicializar o serviço de backup
  try {
    await backupService.initialize();
    console.log('✅ Backup service initialized');
  } catch (error) {
    console.error('❌ Error initializing backup service:', error);
  }

  // API Routes

  // Get latest readings
  app.get('/api/readings/latest', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 60;
      const readings = await storage.getLatestReadings(limit);
      const setpoints = await storage.getSetpoints();

      res.json({
        readings,
        setpoints: {
          temp: {
            min: setpoints.tempMin,
            max: setpoints.tempMax
          },
          level: {
            min: setpoints.levelMin,
            max: setpoints.levelMax
          }
        }
      });
    } catch (error) {
      console.error('Error fetching latest readings:', error);
      res.status(500).json({ error: 'Failed to fetch latest readings' });
    }
  });

  // Endpoint específico para verificar o status atual dos dispositivos
  app.get('/api/device/status', async (req, res) => {
    try {
      // Obter o estado atual em memória (atualizações mais recentes)
      const inMemoryStatus = getCurrentDeviceStatus();

      // Buscar também a leitura mais recente do banco de dados
      const latestReadings = await storage.getLatestReadings(1);

      // Verificar se há dados no banco
      if (!latestReadings || latestReadings.length === 0) {
        // Se não há dados no banco, retornar apenas o status em memória com aviso
        console.log('Sem leituras no banco, usando apenas o status em memória:', inMemoryStatus);
        return res.json({
          timestamp: inMemoryStatus.lastUpdate,
          pumpStatus: inMemoryStatus.pumpStatus,
          heaterStatus: inMemoryStatus.heaterStatus,
          source: 'memory',
          pendingSync: true, // Indica que os dados ainda não foram sincronizados com ThingSpeak
          memoryState: inMemoryStatus,
          databaseState: null
        });
      }

      // Se temos dados do banco, mostrar ambas as fontes
      const latest = latestReadings[0];
      console.log('Detalhes da última leitura do banco:', JSON.stringify(latest));
      console.log('Status atual em memória:', JSON.stringify(inMemoryStatus));

      // Verificar se os estados são diferentes entre a memória e o banco de dados
      const memoryPumpStatus = inMemoryStatus.pumpStatus;
      const memoryHeaterStatus = inMemoryStatus.heaterStatus;
      const dbPumpStatus = latest.pumpStatus;
      const dbHeaterStatus = latest.heaterStatus;

      // Se os estados forem diferentes, considera que há sincronização pendente
      const pendingSync = (memoryPumpStatus !== dbPumpStatus) || (memoryHeaterStatus !== dbHeaterStatus);

      // Preferimos o valor do banco se ele for mais recente que a memória (indicando que o ThingSpeak já confirmou)
      // Caso contrário, informamos ambos os valores e deixamos o cliente decidir o que exibir
      const databaseState = {
        timestamp: latest.timestamp,
        pumpStatus: latest.pumpStatus,
        heaterStatus: latest.heaterStatus
      };

      const memoryState = {
        timestamp: inMemoryStatus.lastUpdate,
        pumpStatus: inMemoryStatus.pumpStatus,
        heaterStatus: inMemoryStatus.heaterStatus
      };

      // Transparentemente enviar ambos os estados
      res.json({
        timestamp: latest.timestamp,
        pumpStatus: latest.pumpStatus, // Enviar o valor oficial do banco
        heaterStatus: latest.heaterStatus, // Enviar o valor oficial do banco
        pendingSync: pendingSync, // Indicar se há uma atualização pendente
        source: 'database', // A fonte principal de dados é o banco
        memoryState: memoryState, // Estado em memória para a interface usar se quiser
        databaseState: databaseState // Estado do banco (oficial)
      });
    } catch (error) {
      console.error('Error fetching device status:', error);
      res.status(500).json({ error: 'Failed to fetch device status' });
    }
  });

  // Get readings by date range from local database
  app.get('/api/readings/history', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start and end dates are required' });
      }

      console.log(`Fetching readings from ${startDate} to ${endDate} from local database...`);

      // Limitar o número máximo de leituras retornadas para evitar sobrecarga
      const MAX_READINGS = 1000;

      // A função de agregação já está importada no topo do arquivo

      // Calcular a diferença em dias para diagnóstico
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      console.log(`SQL Query: Buscando leituras entre ${startDate} e ${endDate} (max: ${MAX_READINGS})`);
      console.log(`Data inicial: ${start.toLocaleDateString()}, Data final ajustada: ${new Date(end.getTime() + 86400000).toLocaleDateString()}`);

      // Agora tentar buscar os dados do banco local
      let readings: Reading[] = [];
      try {
        readings = await storage.getReadingsByDateRange(startDate as string, endDate as string, MAX_READINGS);
        console.log(`Found ${readings.length} readings in the local database.`);
      } catch (dbError) {
        console.error("Erro ao buscar dados do banco:", dbError);
        readings = [];
      }

      // Se mesmo após a importação ainda não temos dados, usar o ThingSpeak diretamente
      if (readings.length === 0) {
        console.log('Nenhum dado encontrado no banco após importação. Buscando do ThingSpeak diretamente...');

        try {
          // Buscar diretamente do ThingSpeak
          console.log(`Fetching ${diffDays} days of data directly from ThingSpeak with timeout...`);
          const thingspeakReadings = await fetchHistoricalReadings(diffDays);

          if (thingspeakReadings && thingspeakReadings.length > 0) {
            console.log(`Obtidas ${thingspeakReadings.length} leituras diretamente do ThingSpeak.`);

            // Converter para o formato esperado - adicionar IDs para compatibilidade
            readings = thingspeakReadings.map((r, index) => ({
              ...r,
              id: 10000 + index, // IDs temporários
              pumpStatus: r.pumpStatus || false,
              heaterStatus: r.heaterStatus || false,
              timestamp: r.timestamp || new Date()
            }));
          }
        } catch (thingspeakError) {
          console.error("Erro ao buscar diretamente do ThingSpeak:", thingspeakError);
        }
      }

      // Se ainda não temos dados, retorne erro
      if (!readings || readings.length === 0) {
        console.log('Nenhum dado disponível após todas as tentativas.');
        return res.status(404).json({ 
          error: 'No data found for the selected period', 
          message: 'Não há dados disponíveis para o período selecionado. Por favor, tente outro período.'
        });
      }

      // Aplicar a agregação com base no período selecionado
      const aggregatedReadings = aggregateReadingsByDateRange(readings, start, end);

      const setpoints = await storage.getSetpoints();
      const tempStats = storage.getTemperatureStats(readings); // Usamos os dados originais para estatísticas precisas
      const levelStats = storage.getLevelStats(readings);

      res.json({
        readings: aggregatedReadings, // Enviamos os dados agregados
        setpoints: {
          temp: {
            min: setpoints.tempMin,
            max: setpoints.tempMax
          },
          level: {
            min: setpoints.levelMin,
            max: setpoints.levelMax
          }
        },
        stats: {
          temperature: tempStats,
          level: levelStats
        }
      });
    } catch (error) {
      console.error('Error fetching readings history:', error);
      res.status(500).json({ error: 'Failed to fetch readings history' });
    }
  });

  // Get readings directly from ThingSpeak
  app.get('/api/thingspeak/history', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;

      console.log(`Fetching ${days} days of data directly from ThingSpeak...`);
      const readings = await fetchHistoricalReadings(days);

      if (readings.length === 0) {
        return res.status(404).json({ error: 'No data found from ThingSpeak' });
      }

      // Save readings to database if they don't already exist
      for (const reading of readings) {
        try {
          await storage.saveReading(reading);
        } catch (err) {
          console.log('Reading might already exist in DB, skipping');
        }
      }

      const setpoints = await storage.getSetpoints();

      // Convert the readings to the format expected by the stats functions
      // This is a temporary fix for the type error
      const readingsWithId = readings.map(r => ({
        ...r,
        id: 0, // Temporary ID for stats calculation only
        pumpStatus: r.pumpStatus || false,
        heaterStatus: r.heaterStatus || false,
        timestamp: r.timestamp || new Date(),
      }));

      const tempStats = storage.getTemperatureStats(readingsWithId);
      const levelStats = storage.getLevelStats(readingsWithId);

      res.json({
        readings,
        setpoints: {
          temp: {
            min: setpoints.tempMin,
            max: setpoints.tempMax
          },
          level: {
            min: setpoints.levelMin,
            max: setpoints.levelMax
          }
        },
        stats: {
          temperature: tempStats,
          level: levelStats
        }
      });
    } catch (error) {
      console.error('Error fetching readings from ThingSpeak:', error);
      res.status(500).json({ error: 'Failed to fetch readings from ThingSpeak' });
    }
  });

  // Update setpoints
  app.post('/api/setpoints', async (req, res) => {
    try {
      const result = insertSetpointSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: 'Invalid setpoint data', details: result.error });
      }

      const updatedSetpoints = await storage.updateSetpoints(result.data);
      res.json(updatedSetpoints);
    } catch (error) {
      console.error('Error updating setpoints:', error);
      res.status(500).json({ error: 'Failed to update setpoints' });
    }
  });

  // Get settings
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update settings
  app.post('/api/settings', async (req, res) => {
    try {
      const result = insertSettingsSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: 'Invalid settings data', details: result.error });
      }

      const updatedSettings = await storage.updateSettings(result.data);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Get system uptime (first reading date)
  app.get('/api/system/uptime', async (req, res) => {
    try {
      const firstReading = await storage.getFirstReading();
      if (firstReading) {
        res.json({
          success: true,
          firstReadingDate: firstReading.timestamp.toISOString()
        });
      } else {
        // Caso não haja leituras, retornar a data atual
        res.json({
          success: false,
          firstReadingDate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching system uptime:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch system uptime',
        firstReadingDate: new Date().toISOString()
      });
    }
  });

  // Control pump - otimizado para resposta rápida sem persistência de histórico
  app.post('/api/control/pump', async (req, res) => {
    try {
      const schema = z.object({
        status: z.boolean()
      });

      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: 'Invalid pump control data' });
      }

      // Responder imediatamente para fornecer feedback rápido na interface
      res.json({ success: true, pumpStatus: result.data.status });

      // Processar atualização em segundo plano sem bloquear a resposta
      try {
        // Update ThingSpeak - usando o método individual da bomba
        const updateResult = await updatePumpStatus(result.data.status);

        if (updateResult) {
          console.log('✅ Bomba atualizada com sucesso no ThingSpeak:', result.data.status ? 'LIGADA' : 'DESLIGADA');
        } else {
          console.log('⚠️ Bomba enviada para ThingSpeak, aguardando confirmação:', result.data.status ? 'LIGADA' : 'DESLIGADA');
        }
      } catch (bgError) {
        console.error('❌ Erro em segundo plano ao atualizar bomba:', bgError);
      }
    } catch (error) {
      console.error('Error controlling pump:', error);
      res.status(500).json({ error: 'Failed to control pump' });
    }
  });

  // Control heater - otimizado para resposta rápida sem persistência de histórico
  app.post('/api/control/heater', async (req, res) => {
    try {
      const schema = z.object({
        status: z.boolean()
      });

      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: 'Invalid heater control data' });
      }

      // Responder imediatamente para fornecer feedback rápido na interface
      res.json({ success: true, heaterStatus: result.data.status });

      // Processar atualização em segundo plano sem bloquear a resposta
      try {
        // Update ThingSpeak - usando o método individual do aquecedor
        const updateResult = await updateHeaterStatus(result.data.status);

        if (updateResult) {
          console.log('✅ Aquecedor atualizado com sucesso no ThingSpeak:', result.data.status ? 'LIGADO' : 'DESLIGADO');
        } else {
          console.log('⚠️ Aquecedor enviado para ThingSpeak, aguardando confirmação:', result.data.status ? 'LIGADO' : 'DESLIGADO');
        }
      } catch (bgError) {
        console.error('❌ Erro em segundo plano ao atualizar aquecedor:', bgError);
      }
    } catch (error) {
      console.error('Error controlling heater:', error);
      res.status(500).json({ error: 'Failed to control heater' });
    }
  });

  // Rota para sincronização manual do backup
  app.post('/api/backup/sync', async (req, res) => {
    try {
      console.log('🔄 Manual backup sync requested');
      await backupService.syncData();
      res.json({ success: true, message: 'Sincronização realizada com sucesso' });
    } catch (error) {
      console.error('Error during manual backup sync:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Falha na sincronização do backup',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Rota para executar diagnóstico do sistema
  app.get('/api/diagnostic', async (req, res) => {
    try {
      const { runDiagnostics } = await import('./services/diagnosticService');
      const result = await runDiagnostics();
      res.json({ 
        success: true,
        timestamp: new Date(),
        diagnosticResult: result
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Falha ao executar diagnóstico',
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  });

  // Rota para obter informações sobre o backup
  app.get('/api/backup/status', async (req, res) => {
    try {
      // Inicializar o serviço de backup se necessário
      if (!backupService.isInitialized) {
        await backupService.initialize();
      }

      // Obter o último ID sincronizado
      const lastBackupInfo = await backupService.getLastBackupInfo();

      res.json({ 
        success: true,
        status: 'online',
        message: 'Serviço de backup operacional',
        lastSyncId: lastBackupInfo.lastId,
        lastSyncDate: lastBackupInfo.lastDate,
        totalBackupRecords: lastBackupInfo.totalRecords
      });
    } catch (error) {
      console.error('Error checking backup status:', error);
      res.status(500).json({ 
        success: false, 
        status: 'offline',
        error: 'Falha ao verificar status do backup',
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  });

  // Rota para obter estatísticas do backup
  app.get('/api/backup/stats', async (req, res) => {
    try {
      if (!backupService.isInitialized) {
        await backupService.initialize();
      }

      const stats = await backupService.getBackupStats();
      res.json({ 
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error fetching backup stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Falha ao obter estatísticas do backup',
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  });

  // Rota para obter informações de uptime do sistema
  app.get('/api/system/uptime', async (req, res) => {
    try {
      // Buscar a primeira (mais antiga) leitura no banco
      const readings = await storage.getFirstReading();
      const firstTimestamp = readings?.timestamp || new Date().toISOString();

      res.json({ 
        success: true, 
        firstReadingDate: firstTimestamp
      });
    } catch (error) {
      console.error('Erro ao buscar informações de uptime:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar informações de uptime',
        firstReadingDate: new Date().toISOString()
      });
    }
  });

  // Rota para importar dados históricos do ThingSpeak para o banco de dados local
  app.post('/api/sync/thingspeak-to-db', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string || req.body.days as string) || 7;

      console.log(`🔄 Importando ${days} dias de dados do ThingSpeak para o banco de dados local...`);

      // Evitando bloqueio do banco de dados durante longos processos assíncronos
      // Programamos o processo para ser executado em background
      setTimeout(async () => {
        try {
          const count = await syncThingspeakToDatabase(days);
          console.log(`✅ Importação em background finalizada: ${count} registros importados.`);
        } catch (syncError) {
          console.error('❌ Erro durante importação em background:', syncError);
        }
      }, 100);

      // Retorna imediatamente para evitar timeout do cliente
      res.json({ 
        success: true, 
        message: `Importação de ${days} dias de dados iniciada em background. Os dados estarão disponíveis em breve.`,
        count: 0,
        background: true
      });
    } catch (error) {
      console.error('Error importing data from ThingSpeak to local database:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Falha ao importar dados do ThingSpeak',
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  });

  return httpServer;
}