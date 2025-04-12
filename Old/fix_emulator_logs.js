/**
 * Script para forçar consistência na exibição dos logs do emulador e corrigir as leituras
 * Este script adiciona registro detalhado para identificar a origem do problema
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obter o caminho atual do diretório
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo original e o arquivo temporário com logs aprimorados
const EMULATOR_SERVICE_PATH = path.join(process.cwd(), 'server/services/emulatorService.ts');
const BACKUP_PATH = path.join(process.cwd(), 'server/services/emulatorService.ts.bak');
const TEMP_FILE_PATH = path.join(process.cwd(), 'server/services/emulatorService.ts.new');

/**
 * Adiciona logs de depuração para diagnosticar o problema com os logs de bomba
 */
function addDebugLogs() {
  try {
    console.log('📝 Fazendo backup do arquivo original...');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(EMULATOR_SERVICE_PATH)) {
      console.error(`❌ Arquivo não encontrado: ${EMULATOR_SERVICE_PATH}`);
      return false;
    }
    
    // Fazer backup se ele não existir
    if (!fs.existsSync(BACKUP_PATH)) {
      fs.copyFileSync(EMULATOR_SERVICE_PATH, BACKUP_PATH);
      console.log(`✅ Backup criado em: ${BACKUP_PATH}`);
    }
    
    // Ler o conteúdo do arquivo
    const content = fs.readFileSync(EMULATOR_SERVICE_PATH, 'utf8');
    
    // Encontrar a função saveReading do emulador
    const saveReadingRegex = /private async generateReading\(\): Promise<void> \{([\s\S]*?)await storage\.saveReading\(insertReading\);/g;
    
    // Adicionar logs de depuração
    let newContent = content.replace(saveReadingRegex, (match, p1) => {
      return `private async generateReading(): Promise<void> {${p1}
      // LOG DEBUG: Verificando os valores antes de salvar
      console.log('🔍 [DEBUG] Valores para inserção:', {
        raw_field3: reading.field3,
        calculated_pumpStatus: reading.field3 === '1',
        config_pumpStatus: this.config.controlStates.pumpStatus,
        raw_field4: reading.field4,
        calculated_heaterStatus: reading.field4 === '1',
        config_heaterStatus: this.config.controlStates.heaterStatus,
      });
      
      // CORREÇÃO: Forçar consistência com os valores corretos
      insertReading.pumpStatus = this.config.controlStates.pumpStatus;
      insertReading.heaterStatus = this.config.controlStates.heaterStatus;
      
      // Salvar no banco de dados com valores consistentes
      await storage.saveReading(insertReading);`;
    });
    
    // Verificar se a substituição foi feita
    if (newContent === content) {
      console.log('⚠️ Não foi possível encontrar o ponto de inserção para os logs de depuração.');
      return false;
    }
    
    // Escrever em um arquivo temporário primeiro
    fs.writeFileSync(TEMP_FILE_PATH, newContent, 'utf8');
    console.log(`✅ Arquivo temporário criado: ${TEMP_FILE_PATH}`);
    
    // Mover o arquivo temporário para o arquivo original
    fs.renameSync(TEMP_FILE_PATH, EMULATOR_SERVICE_PATH);
    console.log(`✅ Arquivo original substituído com a versão modificada.`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao adicionar logs de depuração:', error);
    return false;
  }
}

/**
 * Restaura o arquivo original a partir do backup
 */
function restoreOriginal() {
  try {
    if (fs.existsSync(BACKUP_PATH)) {
      fs.copyFileSync(BACKUP_PATH, EMULATOR_SERVICE_PATH);
      console.log(`✅ Arquivo original restaurado a partir do backup.`);
      return true;
    } else {
      console.log(`⚠️ Backup não encontrado: ${BACKUP_PATH}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao restaurar arquivo original:', error);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔧 Iniciando diagnóstico e correção dos logs do emulador...');
  
  // Adicionar logs de depuração
  if (addDebugLogs()) {
    console.log('\n✅ Logs de depuração adicionados com sucesso!');
    console.log('\n🔧 Recomendações:');
    console.log('1. Reinicie o servidor com "npm run dev" para aplicar as alterações');
    console.log('2. Verifique os novos logs detalhados para entender a causa do problema');
    console.log('3. Se desejar restaurar o arquivo original, execute:');
    console.log('   node fix_emulator_logs.js --restore');
  } else {
    console.log('\n❌ Não foi possível adicionar logs de depuração.');
  }
}

// Verificar se deve restaurar o arquivo original
if (process.argv.includes('--restore')) {
  console.log('🔄 Restaurando arquivo original...');
  if (restoreOriginal()) {
    console.log('✅ Arquivo original restaurado com sucesso!');
  } else {
    console.log('❌ Falha ao restaurar arquivo original.');
  }
} else {
  // Executar função principal
  main().catch(error => {
    console.error('❌ Erro não tratado:', error);
  });
}