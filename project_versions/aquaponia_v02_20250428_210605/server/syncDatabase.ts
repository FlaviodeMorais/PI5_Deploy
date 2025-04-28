/**
 * Script para sincronizar dados do ThingSpeak para o banco de dados local
 * Este script importa dados históricos e os salva no banco de dados SQLite
 */
import { fetchHistoricalReadings } from './services/thingspeakService';
import { storage } from './storage';
import { InsertReading } from '@shared/schema';
import { log } from './vite';

export async function syncThingspeakToDatabase(days: number = 7): Promise<number> {
  try {
    log(`🔄 Iniciando importação de ${days} dias de dados do ThingSpeak para o banco local...`, 'sync');
    console.log(`Fetching ${days} days of data directly from ThingSpeak...`);
    
    // Verificar se o banco de dados está pronto
    try {
      // Método auxiliar para garantir que o banco está acessível
      await storage.getLatestReadings(1);
    } catch (dbError) {
      console.error('Erro ao acessar o banco de dados antes da importação:', dbError);
      log('⚠️ Banco de dados não está acessível. Tentando inicializar...', 'sync');
      
      // Forçar inicialização do banco de dados
      if (storage instanceof Object && typeof (storage as any).ensureInitialized === 'function') {
        await (storage as any).ensureInitialized();
      }
    }
    
    // Buscar leituras históricas do ThingSpeak
    const readings = await fetchHistoricalReadings(days);
    
    if (readings.length === 0) {
      log('⚠️ Nenhum dado encontrado no ThingSpeak para o período solicitado', 'sync');
      return 0;
    }
    
    log(`📊 Encontradas ${readings.length} leituras no ThingSpeak`, 'sync');
    
    // Contador de registros importados com sucesso
    let importedCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Importar cada leitura para o banco de dados local
    for (const reading of readings) {
      try {
        // Garantir que a leitura está completa com todos os campos necessários
        const readingToSave: InsertReading = {
          temperature: reading.temperature,
          level: reading.level,
          pumpStatus: typeof reading.pumpStatus === 'boolean' ? reading.pumpStatus : false,
          heaterStatus: typeof reading.heaterStatus === 'boolean' ? reading.heaterStatus : false,
          timestamp: reading.timestamp instanceof Date ? reading.timestamp : new Date()
        };
        
        // Salvar no banco de dados local
        await storage.saveReading(readingToSave);
        importedCount++;
        
        // Feedback periódico para importações grandes
        if (importedCount % 100 === 0) {
          log(`📥 Importados ${importedCount}/${readings.length} registros...`, 'sync');
        }
      } catch (error) {
        // Registro já pode existir no banco de dados, é normal falhar alguns
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
          // Ignorar erros de unicidade (registros duplicados)
          skipCount++;
          continue;
        } else {
          // Logar outros erros mas continuar a importação
          errorCount++;
          console.error('Erro ao importar leitura:', error);
        }
      }
    }
    
    log(`✅ Importação concluída. ${importedCount} registros importados com sucesso.`, 'sync');
    if (skipCount > 0) {
      log(`ℹ️ ${skipCount} registros ignorados (já existiam no banco).`, 'sync');
    }
    if (errorCount > 0) {
      log(`⚠️ ${errorCount} erros encontrados durante a importação.`, 'sync');
    }
    
    return importedCount;
  } catch (error) {
    console.error('❌ Erro durante a sincronização com ThingSpeak:', error);
    log(`❌ Falha na importação: ${error instanceof Error ? error.message : String(error)}`, 'sync');
    throw error;
  }
}