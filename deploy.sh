
#!/bin/bash

echo "🌱 Deploy do Sistema de Monitoramento e Controle Aquapônico para o Render"
echo "=====================================================================\n"

# Definir variáveis de ambiente para produção
export NODE_ENV=production
export PORT=${PORT:-10000}

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado! Criando arquivo com configurações padrão..."
  cat > .env << EOL
NODE_ENV=production
PORT=10000
THINGSPEAK_READ_API_KEY=5UWNQD21RD2A7QHG
THINGSPEAK_WRITE_API_KEY=9NG6QLIN8UXLE2AH
THINGSPEAK_CHANNEL_ID=2840207
REFRESH_INTERVAL=30000
TZ=America/Sao_Paulo
EOL
  echo "✅ Arquivo .env criado com sucesso!"
else
  echo "✅ Arquivo .env encontrado!"
fi

# Instalar dependências
echo "\n📦 Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Erro ao instalar dependências!"
  exit 1
fi
echo "✅ Dependências instaladas com sucesso!"

# Construir o projeto
echo "\n🏗️ Construindo o projeto..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir o projeto!"
  exit 1
fi
echo "✅ Projeto construído com sucesso!"

# Verificar se o processo já está em execução
PID=$(pgrep -f "node dist/index.js")
if [ ! -z "$PID" ]; then
  echo "\n🛑 Parando a instância anterior (PID: $PID)..."
  kill -15 $PID
  sleep 2
  
  # Verificar se ainda está em execução
  if ps -p $PID > /dev/null; then
    echo "⚠️ Força parando o processo..."
    kill -9 $PID
  fi
  
  echo "✅ Instância anterior finalizada!"
fi

# Iniciar o servidor em background
echo "\n🚀 Iniciando o servidor em produção..."
nohup node dist/index.js > server.log 2>&1 &
NEW_PID=$!

echo "✅ Servidor iniciado com sucesso (PID: $NEW_PID)!"
echo "\n🎉 Deploy concluído! O servidor está rodando em http://localhost:$PORT"
echo "\n📄 Confira os logs em server.log"
echo "\n👉 Para parar o servidor: kill -15 $NEW_PID"
