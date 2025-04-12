
# Arquitetura do Sistema de Monitoramento Aquapônico

## Visão Geral

O Sistema de Monitoramento Aquapônico é uma solução IoT completa para o gerenciamento e controle de ambientes aquapônicos. Ele integra sensores físicos, atuadores, middleware de comunicação, backend de processamento e frontend para visualização em uma única plataforma coesa.

## Componentes da Arquitetura

### 1. Camada de Hardware (IoT)

- **Dispositivo NodeMCU**: Microcontrolador responsável pela coleta de dados dos sensores e controle dos atuadores
- **Sensores**:
  - Sensor de temperatura (DS18B20)
  - Sensor de nível de água (ultrassônico HC-SR04)
- **Atuadores**:
  - Bomba d'água (controle via relé)
  - Aquecedor (controle via relé)

### 2. Camada de Middleware (Comunicação)

- **ThingSpeak**: Plataforma de IoT que atua como intermediário entre o hardware e o servidor
  - Canal de dados: 2840207
  - Comunicação bidirecional para leitura de sensores e controle de atuadores
  - API RESTful para integração com o backend

### 3. Camada de Backend (Servidor)

- **Tecnologias**:
  - Node.js com Express
  - TypeScript para tipagem estática
  - SQLite para persistência de dados

- **Componentes Principais**:
  - **ThingspeakService**: Interface de comunicação com a API ThingSpeak
  - **EmulatorService**: Simulador de hardware para desenvolvimento/testes
  - **BackupService**: Sistema de backup e recuperação de dados
  - **StorageService**: Abstração para persistência de dados
  - **DataAggregation**: Algoritmos de processamento e agregação de dados históricos

- **Padrões de Design**:
  - Arquitetura em camadas
  - Injeção de dependências
  - Repository pattern para acesso a dados
  - Circuit breaker e retry pattern para resiliência
  - Observer pattern para propagação de eventos

### 4. Camada de Frontend (Cliente)

- **Tecnologias**:
  - React.js com TypeScript
  - TanStack Query para gerenciamento de estado e cache
  - Recharts para visualização de dados
  - TailwindCSS para estilização
  - ShadcnUI para componentes de interface

- **Componentes Principais**:
  - **Dashboard**: Visualização em tempo real dos parâmetros do sistema
  - **EquipmentControls**: Interface para controle de bomba e aquecedor
  - **HistoricalData**: Análise de dados históricos com filtros por período
  - **SettingsPanel**: Configuração de parâmetros operacionais
  - **BackupPanel**: Gestão de backups e sincronização

### 5. Fluxo de Dados

```
┌─────────────┐    ┌───────────┐    ┌─────────────┐    ┌─────────────┐
│  Sensores/  │    │           │    │             │    │             │
│  Atuadores  │<-->│ ThingSpeak │<-->│  Backend    │<-->│  Frontend   │
│  (NodeMCU)  │    │           │    │             │    │             │
└─────────────┘    └───────────┘    └─────────────┘    └─────────────┘
```

### 6. Estrutura do Banco de Dados

- **Tabela Readings**: Armazena leituras dos sensores e estado dos atuadores
  - id (PK)
  - temperature (real)
  - level (real)
  - pumpStatus (boolean)
  - heaterStatus (boolean)
  - timestamp (datetime)

- **Tabela Setpoints**: Armazena limiares de operação do sistema
  - id (PK)
  - tempMin (real)
  - tempMax (real)
  - levelMin (integer)
  - levelMax (integer)
  - updatedAt (datetime)

- **Tabela Settings**: Armazena configurações gerais do sistema
  - id (PK)
  - systemName (text)
  - updateInterval (integer)
  - dataRetention (integer)
  - emailAlerts (boolean)
  - pushAlerts (boolean)
  - alertEmail (text)
  - tempCriticalMin (real)
  - tempWarningMin (real)
  - tempWarningMax (real)
  - tempCriticalMax (real)
  - levelCriticalMin (integer)
  - levelWarningMin (integer)
  - levelWarningMax (integer)
  - levelCriticalMax (integer)
  - updatedAt (datetime)

### 7. Mecanismos de Resiliência

- **Estado Otimista (Optimistic Updates)**: Feedback imediato na interface enquanto aguarda confirmação do hardware
- **Reconciliação Periódica**: Verifica discrepâncias entre estado em memória e estado real
- **Anti-oscilação**: Evita ativações/desativações rápidas e sucessivas de atuadores
- **Detecção e Recuperação de Falhas**: Identificação e correção automática de inconsistências
- **Estado de Emergência**: Ações preventivas em condições críticas

### 8. Agregação de Dados

- **Granularidade por período**:
  - 24 horas: dados por minuto
  - 1-7 dias: dados agregados por hora
  - >7 dias: dados agregados por semana

- **Métricas calculadas**:
  - Média
  - Mínimo/Máximo
  - Desvio padrão
  - Tendências

### 9. Segurança

- **Credenciais**: Armazenadas como variáveis de ambiente
- **Validação de Dados**: Esquemas Zod para validação de entrada
- **Sanitização**: Prevenção de injeção SQL
- **Backup**: Sistema de backup automático e manual

### 10. Escalabilidade

- **Arquitetura modular**: Componentes independentes e substituíveis
- **Abstração de armazenamento**: Facilita migração para outros SGBDs
- **Paginação e limitação de resultados**: Evita sobrecarga em consultas grandes
- **Granularidade adaptativa**: Ajusta nível de detalhe conforme volume de dados

## Diagrama Conceitual

```
┌───────────────────────────────┐     ┌────────────────────────────┐
│           Frontend            │     │           Backend          │
│                               │     │                            │
│  ┌─────────┐    ┌─────────┐   │     │   ┌─────────┐  ┌────────┐  │
│  │Dashboard│    │Settings │   │     │   │ThingSpeak│  │Database│  │
│  │         │<-->│         │   │     │   │Service   │<>│Service │  │
│  └─────────┘    └─────────┘   │     │   └─────────┘  └────────┘  │
│       ∧              ∧        │     │        ∧            ∧      │
│       │              │        │     │        │            │      │
│       v              v        │     │        v            v      │
│  ┌─────────┐    ┌─────────┐   │     │   ┌─────────┐  ┌────────┐  │
│  │Equipment│    │Historical    │     │   │Emulator │  │Backup  │  │
│  │Controls │    │Data      │   │     │   │Service  │  │Service │  │
│  └─────────┘    └─────────┘   │     │   └─────────┘  └────────┘  │
└───────────────────────────────┘     └────────────────────────────┘
             ∧                                      ∧
             │                                      │
             │                                      │
             v                                      v
    ┌─────────────────┐                  ┌───────────────────┐
    │    ThingSpeak   │<---------------->│  NodeMCU Device   │
    │    Platform     │     Internet     │  (Sensors/Actuators)
    └─────────────────┘                  └───────────────────┘
```

## Bibliotecas e Dependências Principais

- **Frontend**:
  - React
  - TanStack Query
  - Recharts
  - TailwindCSS
  - ShadcnUI

- **Backend**:
  - Node.js
  - Express
  - SQLite
  - Drizzle ORM
  - Zod

## Processos Assíncronos e Tarefas Agendadas

- Coleta de dados a cada 5 minutos (configurável)
- Backup automático a cada 30 minutos
- Verificação de consistência periódica
- Sincronização de estado com hardware

## Conclusão

A arquitetura do Sistema de Monitoramento Aquapônico foi projetada com foco em modularidade, resiliência e escalabilidade. A separação clara de responsabilidades entre as camadas permite fácil manutenção e evolução do sistema, enquanto os mecanismos de redundância e recuperação garantem a robustez necessária para um sistema crítico de monitoramento ambiental.
