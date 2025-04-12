// Script para alterar o horário fixo no arquivo de backup para o horário de Brasília (UTC-3)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(process.cwd(), 'server/services/backupService.ts');

// Criar uma data com o fuso horário de Brasília
const currentUTCHours = new Date().getUTCHours();
const brasiliaHours = (currentUTCHours - 3 + 24) % 24; // UTC-3
const minutes = new Date().getMinutes().toString().padStart(2, '0');
const seconds = '00';
const formattedBrasiliaTime = `${brasiliaHours.toString().padStart(2, '0')}:${minutes}:${seconds}`;

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Substituir todas as ocorrências do horário fixo
content = content.replace(/19\/03\/2025, \d{2}:\d{2}:\d{2}/g, `19/03/2025, ${formattedBrasiliaTime}`);

// Escrever o arquivo de volta
fs.writeFileSync(filePath, content);

console.log(`Horário fixo atualizado para o fuso de Brasília: 19/03/2025, ${formattedBrasiliaTime}`);
