
#!/bin/bash

# Script de Deploy para o Projeto Aquaponia
# Desenvolvido para o Projeto Integrador V - UNIVESP
# DRP04-PJI510-SALA-001GRUPO-012

echo "======================================"
echo "  INICIANDO DEPLOY DO AQUAPONIA PI5"
echo "======================================"

# Definir variáveis de ambiente para produção
export NODE_ENV=production
export PORT=5000

# Verifica se o ambiente está configurado
if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado! Criando arquivo com configurações padrão..."
  cat > .env << EOL
# Configurações ThingSpeak
THINGSPEAK_READ_API_KEY=5UWNQD21RD2A7QHG
THINGSPEAK_WRITE_API_KEY=9NG6QLIN8UXLE2AH
THINGSPEAK_CHANNEL_ID=2840207

# Configurações do sistema
NODE_ENV=production
PORT=5000

# Intervalo de atualização (em milissegundos)
REFRESH_INTERVAL=30000

# Configurações de timezone
TZ=America/Sao_Paulo
EOL
  echo "✅ Arquivo .env criado com sucesso!"
fi

# Instala dependências
echo "📦 Instalando dependências..."
npm install
echo "✅ Dependências instaladas com sucesso!"

# Compila a aplicação
echo "🔨 Compilando o projeto..."
npm run build
echo "✅ Projeto compilado com sucesso!"

# Verifica se a compilação foi bem-sucedida
if [ ! -d dist ]; then
  echo "❌ Erro durante a compilação! Diretório 'dist' não encontrado."
  exit 1
fi

# Inicia a aplicação
echo "🚀 Iniciando a aplicação em modo de produção..."
echo "======================================"
NODE_ENV=production node dist/index.js
