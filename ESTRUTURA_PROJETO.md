
# Estrutura Detalhada do Projeto

## Visão Geral da Organização

O Sistema de Monitoramento Aquapônico segue uma arquitetura moderna de aplicação web com separação clara entre frontend, backend e serviços compartilhados. A estrutura de diretórios foi organizada para maximizar a manutenibilidade, modularidade e escalabilidade do código.

## Estrutura de Diretórios Principal

```
├── client/               # Frontend React com TypeScript
├── server/               # Backend Node.js com Express
├── shared/               # Tipos e schemas compartilhados
├── dist/                 # Código compilado para produção
├── public/               # Arquivos estáticos públicos
└── scripts/              # Scripts utilitários de manutenção
```

## Detalhamento do Frontend (client/)

```
client/
├── public/                        # Recursos estáticos públicos
│   └── assets/                    # Imagens, ícones e recursos visuais
│       ├── aquaponics-icon.svg    # Ícone principal da aplicação
│       └── univesp-logo.svg       # Logo institucional
│
├── src/                           # Código-fonte do frontend
│   ├── components/                # Componentes React reutilizáveis
│   │   ├── charts/                # Componentes de visualização de dados
│   │   │   ├── SensorChart.tsx    # Componente base para gráficos de sensores
│   │   │   ├── TemperatureChart.tsx  # Gráfico específico para temperatura
│   │   │   └── WaterLevelChart.tsx   # Gráfico específico para nível de água
│   │   │
│   │   ├── dashboard/             # Componentes da tela principal
│   │   │   ├── EquipmentControls.tsx  # Controles dos equipamentos
│   │   │   ├── HeaterControl.tsx      # Controle específico do aquecedor
│   │   │   ├── PumpControl.tsx        # Controle específico da bomba
│   │   │   ├── SystemStatus.tsx       # Painel de status do sistema
│   │   │   └── TemperatureGauge.tsx   # Medidor visual de temperatura
│   │   │
│   │   ├── emulator/              # Componentes do emulador de hardware
│   │   │   ├── EmulatorPanel.tsx      # Painel principal do emulador
│   │   │   └── VirtualSensors.tsx     # Simulador de sensores virtuais
│   │   │
│   │   ├── historical/            # Componentes de análise histórica
│   │   │   └── HistoricalData.tsx     # Visualização de dados históricos
│   │   │
│   │   ├── layout/                # Componentes estruturais da aplicação
│   │   │   ├── Header.tsx            # Cabeçalho da aplicação
│   │   │   ├── Layout.tsx            # Layout principal
│   │   │   └── Sidebar.tsx           # Barra lateral navegável
│   │   │
│   │   ├── settings/              # Componentes de configuração
│   │   │   ├── BackupPanel.tsx       # Interface de gerenciamento de backups
│   │   │   └── SettingsPanel.tsx     # Painel principal de configurações
│   │   │
│   │   └── ui/                    # Componentes de UI primitivos (shadcn/ui)
│   │       ├── button.tsx            # Botões personalizados
│   │       ├── card.tsx              # Componente de cartão
│   │       ├── dialog.tsx            # Componente de diálogo/modal
│   │       └── ...                   # Outros componentes da biblioteca UI
│   │
│   ├── contexts/                  # Contextos React para estado global
│   │   └── DeviceModeContext.tsx  # Contexto para modo de dispositivo (real/emulador)
│   │
│   ├── hooks/                     # Hooks React personalizados
│   │   ├── use-mobile.tsx         # Hook para detecção de dispositivos móveis
│   │   └── use-toast.ts           # Hook para sistema de notificações toast
│   │
│   ├── lib/                       # Bibliotecas e utilidades
│   │   ├── api-config.ts          # Configuração de APIs
│   │   ├── chartConfig.ts         # Configurações para gráficos
│   │   ├── queryClient.ts         # Configuração do TanStack Query
│   │   ├── thingspeakApi.ts       # Cliente API para ThingSpeak
│   │   └── utils.ts               # Funções utilitárias diversas
│   │
│   ├── pages/                     # Componentes de página principais
│   │   ├── Dashboard.tsx          # Página principal do dashboard
│   │   ├── Settings.tsx           # Página de configurações
│   │   └── not-found.tsx          # Página de erro 404
│   │
│   ├── types/                     # Definições de tipos TypeScript
│   │   └── react-gauge-chart.d.ts # Tipos para biblioteca de gráficos gauge
│   │
│   ├── App.tsx                    # Componente raiz da aplicação
│   ├── index.css                  # Estilos globais (TailwindCSS)
│   └── main.tsx                   # Ponto de entrada da aplicação
│
└── index.html                     # Template HTML principal
```

## Detalhamento do Backend (server/)

```
server/
├── services/                      # Serviços modulares
│   ├── backupService.ts           # Serviço de backup de dados
│   ├── databaseService.ts         # Abstração para acesso ao banco de dados
│   ├── emulatorService.ts         # Emulador de hardware para desenvolvimento
│   ├── thingspeakConfig.ts        # Configurações da integração ThingSpeak
│   └── thingspeakService.ts       # Cliente de integração com API ThingSpeak
│
├── types/                         # Definições de tipos TypeScript
│   └── node-cron.d.ts             # Tipos para biblioteca de agendamento
│
├── utils/                         # Utilitários e helpers
│   └── dataAggregation.ts         # Algoritmos de agregação de dados
│
├── index.ts                       # Ponto de entrada do servidor
├── routes.ts                      # Definições de rotas da API REST
├── storage.ts                     # Interface de abstração para armazenamento
└── syncDatabase.ts                # Sincronização entre ThingSpeak e banco local
```

## Módulos Compartilhados (shared/)

```
shared/
└── schema.ts                      # Schemas Zod compartilhados entre frontend e backend
```

## Arquivos de Configuração

```
├── .gitignore                     # Arquivos ignorados pelo Git
├── .replit                        # Configuração do ambiente Replit
├── ARQUITETURA.md                 # Documentação da arquitetura do sistema
├── README.md                      # Documentação principal do projeto
├── drizzle.config.ts              # Configuração do ORM Drizzle
├── emulator_config.json           # Configurações do emulador de hardware
├── package.json                   # Dependências e scripts npm
├── postcss.config.js              # Configuração do PostCSS para TailwindCSS
├── tailwind.config.ts             # Configuração do TailwindCSS
├── tsconfig.json                  # Configuração do TypeScript
└── vite.config.ts                 # Configuração do bundler Vite
```

## Scripts Utilitários

```
├── backup_project.sh              # Script de backup do projeto
├── deploy.sh                      # Script de implantação
├── fix_emulator_logs.js           # Utilitário para corrigir logs do emulador
├── fix_emulator_status.js         # Correção de estado do emulador
├── fix_readings.js                # Correção de leituras inconsistentes
├── fix_thingspeak_status.js       # Sincronização com estado do ThingSpeak
├── force_consistent_state.js      # Forçar consistência de estado entre sistemas
├── temp_fix.js                    # Correções temporárias
└── temp_fix_brazil.js             # Ajustes para fuso horário brasileiro
```

## Fluxos de Dados Principais

### 1. Fluxo de Dados de Sensores (Hardware Real)

```
NodeMCU → ThingSpeak API → thingspeakService.ts → databaseService.ts → Componentes React → UI
```

### 2. Fluxo de Dados do Emulador (Desenvolvimento)

```
emulatorService.ts → databaseService.ts → Componentes React → UI
```

### 3. Fluxo de Controle de Atuadores

```
UI → Componentes React → API Backend → thingspeakService.ts → ThingSpeak API → NodeMCU → Relés
```

### 4. Fluxo de Dados Históricos

```
databaseService.ts → dataAggregation.ts → API Backend → TanStack Query → Componentes de Gráfico → UI
```

## Padrões de Design Implementados

### 1. Padrão Repository
Implementado no `databaseService.ts` para abstrair o acesso ao banco de dados.

### 2. Padrão Singleton
Utilizado nos serviços principais para garantir uma única instância.

### 3. Padrão Observer
Implementado para propagação de eventos de mudança de estado.

### 4. Padrão Strategy
Utilizado para alternar entre modo real e emulador.

### 5. Padrão Circuit Breaker
Implementado no `thingspeakService.ts` para lidar com falhas na API externa.

## Tecnologias e Bibliotecas Específicas

### Frontend
- **React 18**: Framework de UI baseado em componentes
- **TypeScript**: Linguagem tipada que compila para JavaScript
- **TanStack Query (React Query)**: Gerenciamento de estado assíncrono e cache
- **TailwindCSS**: Framework CSS utilitário
- **ShadcnUI**: Biblioteca de componentes de UI baseada em Radix UI
- **Recharts**: Biblioteca de visualização de dados

### Backend
- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web para Node.js
- **Drizzle ORM**: ORM SQL leve e tipado
- **SQLite**: Banco de dados SQL embarcado
- **Zod**: Biblioteca de validação de esquemas

### DevOps
- **Vite**: Bundler e servidor de desenvolvimento
- **ESBuild**: Compilador JavaScript/TypeScript de alta performance
- **Node-Cron**: Agendador de tarefas baseado em cron

## Estratégias de Otimização

### 1. Otimização de Consultas
- Uso de índices em colunas frequentemente consultadas
- Paginação de resultados para conjuntos de dados grandes
- Agregação temporal para reduzir volume de dados

### 2. Otimização de Frontend
- Lazy-loading de componentes
- Memoização de componentes React com `React.memo`
- Uso de `useMemo` e `useCallback` para computações caras

### 3. Otimização de Rede
- Cache inteligente com TanStack Query
- Estado otimista para feedback imediato
- Polling ajustável baseado em condições operacionais

## Estratégias de Teste

- **Testes Unitários**: Para funções e utilidades críticas
- **Testes de Integração**: Para interações entre serviços
- **Testes End-to-End**: Fluxos completos com Cypress
- **Modo Emulador**: Para desenvolvimento e teste sem hardware

Esta documentação fornece uma visão detalhada e técnica da estrutura do projeto, facilitando a compreensão, manutenção e evolução do Sistema de Monitoramento Aquapônico por desenvolvedores atuais e futuros.
