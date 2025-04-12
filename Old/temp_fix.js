// Script para alterar o horário fixo no arquivo de backup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(process.cwd(), 'server/services/backupService.ts');
const currentTime = new Date();
const hours = currentTime.getHours().toString().padStart(2, '0');
const minutes = currentTime.getMinutes().toString().padStart(2, '0');
const seconds = '00';
const formattedTime = `${hours}:${minutes}:${seconds}`;

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Substituir todas as ocorrências do horário fixo
content = content.replace(/19\/03\/2025, 03:15:00/g, `19/03/2025, ${formattedTime}`);

// Escrever o arquivo de volta
fs.writeFileSync(filePath, content);

console.log(`Horário fixo atualizado para 19/03/2025, ${formattedTime}`);
