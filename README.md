
# Sistema de Monitoramento Aquapônico

Projeto Integrador V - UNIVESP - DRP04-PJI510-SALA-001GRUPO-012

## Resumo

O presente trabalho apresenta o desenvolvimento e implementação de um sistema de monitoramento aquapônico baseado em tecnologia IoT (Internet das Coisas), em conformidade com os requisitos propostos para o Projeto Integrador. O sistema implementado contempla os três pilares fundamentais exigidos: captura, análise e processamento de dados provenientes de sensores ambientais, oferecendo uma interface web responsiva para visualização e controle. 

A solução desenvolvida captura dados de temperatura e nível de água através de sensores conectados a um dispositivo NodeMCU, transmitindo-os via middleware ThingSpeak para processamento. O sistema realiza análise dos dados por meio de algoritmos de agregação temporal e cálculos estatísticos, identificando tendências e anomalias. O processamento implementado permite tomada de decisões automatizadas para controle de atuadores (bomba e aquecedor), incluindo mecanismos anti-oscilação e estados de emergência.

A arquitetura modular do sistema, implementada com TypeScript, Node.js, React e SQLite, fornece uma base robusta e extensível para evolução futura. Destaca-se a implementação de mecanismos inovadores como o "estado otimista" para contornar limitações de latência da plataforma ThingSpeak, e o modo de emulação para desenvolvimento e testes sem hardware físico. O sistema se destaca por sua autonomia operacional, incorporando rotinas periódicas de verificação e sincronização, bem como mecanismos de detecção e recuperação automática de falhas.

Esta implementação representa uma solução completa para monitoramento e controle de sistemas aquapônicos, demonstrando aplicação prática de conceitos de IoT, análise de dados e desenvolvimento web em um contexto de produção sustentável de alimentos.

## Descrição do Projeto

O presente trabalho apresenta a implementação de um sistema avançado de monitoramento aquapônico baseado em tecnologia IoT (Internet das Coisas), desenvolvido como parte do Projeto Integrador V da UNIVESP. O sistema proposto oferece uma solução integrada para o gerenciamento de ecossistemas aquapônicos em tempo real, combinando hardware microcontrolado (NodeMCU) e uma plataforma web para visualização e controle dos parâmetros ambientais críticos.

## Arquitetura da Solução

A arquitetura do sistema foi estruturada seguindo o padrão de desenvolvimento em camadas, utilizando o modelo cliente-servidor para proporcionar uma clara separação de responsabilidades. O frontend foi implementado com React.js e TypeScript, enquanto o backend foi desenvolvido com Node.js e Express. Para a persistência de dados, optou-se pelo SQLite, uma solução de banco de dados relacional embarcada que oferece desempenho satisfatório para as necessidades do projeto.

### Componentes Principais

#### Módulo de Integração IoT

O módulo de integração IoT utiliza a plataforma ThingSpeak como middleware para comunicação com o dispositivo NodeMCU, responsável pela coleta de dados dos sensores. Este módulo implementa os seguintes componentes:

1. **ThingspeakService**: Responsável pela comunicação bidirecional com a API ThingSpeak, efetuando requisições HTTP para leitura e escrita de dados nos canais configurados. Este serviço implementa padrões de resiliência como retry pattern e circuit breaker para lidar com falhas de comunicação.

2. **EmulatorService**: Implementa um emulador de sensores que simula o comportamento do hardware real, permitindo o desenvolvimento e testes do sistema sem a necessidade do equipamento físico. O emulador gera dados sintéticos que seguem padrões estatísticos realistas, considerando flutuações e correlações entre os diferentes parâmetros ambientais.

#### Sistema de Armazenamento e Persistência

O sistema de armazenamento foi projetado com uma abstração que permite a utilização de diferentes backends de persistência:

1. **StorageInterface**: Interface genérica que define operações CRUD (Create, Read, Update, Delete) para os diferentes tipos de dados manipulados pelo sistema.

2. **SqliteStorage**: Implementação da interface de armazenamento utilizando SQLite, com otimizações para consultas frequentes e mecanismos de cache para reduzir o tempo de resposta.

3. **BackupService**: Serviço responsável por realizar cópias de segurança periódicas dos dados, garantindo a integridade e disponibilidade das informações mesmo em caso de falhas no sistema principal.

#### Camada de Apresentação (Frontend)

A camada de apresentação foi implementada seguindo princípios de design responsivo e acessibilidade:

1. **Dashboard**: Apresenta visualizações em tempo real dos parâmetros monitorados (temperatura e nível de água), utilizando gráficos interativos desenvolvidos com a biblioteca Recharts.

2. **EquipmentControls**: Componentes que permitem o controle remoto dos atuadores (bomba d'água e aquecedor), com feedback visual imediato para o usuário mesmo antes da confirmação pelo hardware.

3. **SettingsPanel**: Interface para configuração de parâmetros do sistema, incluindo definição de limiares (setpoints) para alertas de temperatura e nível de água.

## Aspectos Técnicos de Implementação

### Linguagens de Programação e Tecnologias Adotadas

A seleção das linguagens de programação e tecnologias para este projeto foi realizada considerando diversos fatores, incluindo adequação ao domínio do problema, ecossistema de bibliotecas disponíveis, produtividade de desenvolvimento e desempenho de execução. A seguir, apresenta-se uma análise detalhada das principais escolhas tecnológicas:

#### TypeScript

O TypeScript foi adotado como linguagem primária para o desenvolvimento tanto do frontend quanto do backend do sistema, pelas seguintes razões:

1. **Tipagem Estática**: A tipagem estática do TypeScript permite a detecção precoce de erros durante o desenvolvimento, reduzindo significativamente o número de falhas em tempo de execução. Isso é particularmente relevante para um sistema crítico de monitoramento ambiental, onde falhas podem comprometer o ecossistema aquapônico.

2. **Orientação a Objetos e Programação Funcional**: TypeScript suporta paradigmas de programação orientada a objetos e funcional, permitindo a adoção de padrões de design adequados para diferentes componentes do sistema. Esta flexibilidade foi essencial para implementar desde estruturas de dados complexas até operações de transformação e agregação de dados de sensores.

3. **Unificação de Tecnologia**: A utilização da mesma linguagem no frontend e backend permitiu a reutilização de tipos e interfaces, garantindo consistência na representação de dados em toda a aplicação. Isso resultou em maior produtividade e menor probabilidade de erros de integração.

4. **Ecossistema e Ferramentas**: O ecossistema do TypeScript oferece excelente suporte a ferramentas de desenvolvimento, incluindo editores com recursos avançados de autocompleção, refatoração e depuração, acelerando o ciclo de desenvolvimento.

#### Node.js e Express (Backend)

O ambiente de execução Node.js, combinado com o framework Express, foi selecionado para implementação do backend pelos seguintes motivos:

1. **Modelo de E/S Não-Bloqueante**: O modelo de entrada/saída não-bloqueante do Node.js é ideal para aplicações com alta concorrência e operações de E/S frequentes, como a coleta e processamento de dados de sensores IoT. Esta característica permitiu que o sistema mantivesse alta responsividade mesmo durante picos de requisições.

2. **Desempenho para Operações em Tempo Real**: Node.js apresenta excelente desempenho para aplicações em tempo real que requerem baixa latência, como o monitoramento contínuo de parâmetros ambientais.

3. **Ecossistema de Pacotes**: O vasto ecossistema de pacotes disponíveis através do NPM (Node Package Manager) facilitou a integração com serviços externos e a implementação de funcionalidades complexas com reduzido esforço de desenvolvimento.

#### React.js (Frontend)

A biblioteca React.js foi escolhida para o desenvolvimento da interface de usuário pelas seguintes razões:

1. **Arquitetura Baseada em Componentes**: A arquitetura de componentes reutilizáveis do React permitiu o desenvolvimento de uma interface modular e manutenível, facilitando a evolução incremental do sistema.

2. **Renderização Eficiente**: O algoritmo de reconciliação do React (Virtual DOM) proporciona atualizações eficientes da interface, essenciais para a exibição em tempo real de dados de sensores que mudam constantemente.

3. **Reatividade**: O modelo de programação reativo do React se alinha naturalmente com os requisitos de uma aplicação de monitoramento, onde os componentes precisam reagir a mudanças nos dados dos sensores.

4. **Hooks e Estado Global**: Os Hooks do React, combinados com bibliotecas como React Query, simplificaram o gerenciamento de estado e a sincronização com dados remotos, resultando em um código mais limpo e manutenível.

#### SQLite (Persistência)

O sistema de gerenciamento de banco de dados SQLite foi selecionado para persistência de dados pelos seguintes motivos:

1. **Simplicidade Operacional**: SQLite não requer um servidor separado, reduzindo a complexidade de implantação e manutenção do sistema.

2. **Confiabilidade**: SQLite é conhecido por sua robustez e confiabilidade, características essenciais para um sistema que monitora parâmetros ambientais críticos.

3. **Desempenho para Carga de Trabalho Específica**: O padrão de acesso a dados do sistema (predominantemente leituras com escritas incrementais) alinha-se bem com o modelo de desempenho do SQLite.

4. **Portabilidade**: A natureza embarcada do SQLite facilita a portabilidade do sistema para diferentes ambientes de implantação.

A combinação dessas tecnologias resultou em uma arquitetura coerente e eficiente, capaz de atender aos requisitos funcionais e não-funcionais do sistema de monitoramento aquapônico, enquanto mantém a complexidade de desenvolvimento e operação em níveis gerenciáveis.

### Sincronização de Estado

Um dos desafios técnicos significativos no desenvolvimento deste sistema foi a sincronização de estado entre o frontend e os dispositivos físicos, considerando a latência inerente à comunicação com a plataforma ThingSpeak. Para solucionar este problema, foi implementado um mecanismo de "estado otimista" (optimistic updates) que funciona da seguinte forma:

1. O sistema mantém um estado em memória que reflete a última ação solicitada pelo usuário, proporcionando feedback imediato na interface.

2. Paralelamente, a solicitação é enviada ao ThingSpeak e o sistema aguarda a confirmação da mudança de estado.

3. Um processo de reconciliação periódico verifica a consistência entre o estado em memória e o estado real reportado pelo dispositivo, corrigindo discrepâncias quando necessário.

### Agregação e Processamento de Dados

O sistema implementa algoritmos de agregação temporal para otimizar a visualização de dados históricos:

1. Para períodos de 24 horas, os dados são apresentados com granularidade de minuto, permitindo análise detalhada de tendências recentes.

2. Para períodos de 1 a 7 dias, os dados são agregados por hora, equilibrando precisão e desempenho.

3. Para períodos superiores a 7 dias, os dados são agregados por semana, possibilitando a análise de tendências de longo prazo sem comprometer o desempenho do sistema.

Os algoritmos de agregação utilizam técnicas estatísticas para calcular médias, mínimos, máximos e desvios padrão, fornecendo um panorama completo do comportamento do sistema aquapônico ao longo do tempo.

### Mecanismos de Resiliência

Considerando a natureza crítica do sistema para a manutenção do ecossistema aquapônico, foram implementados diversos mecanismos de resiliência:

1. **Anti-oscilação**: Algoritmos que previnem a ativação e desativação rápida e sucessiva de atuadores (bomba e aquecedor) quando a temperatura ou nível de água oscila próximo aos limiares configurados.

2. **Detecção e Recuperação de Falhas**: Rotinas periódicas que verificam inconsistências nos dados e estado do sistema, aplicando correções automáticas quando possível.

3. **Estado de Emergência**: Lógica que identifica condições críticas e implementa medidas preventivas para preservar o ecossistema até intervenção humana.

## Considerações sobre Segurança e Escalabilidade

O sistema foi projetado considerando aspectos de segurança e escalabilidade:

1. As credenciais de acesso à API ThingSpeak são armazenadas como variáveis de ambiente, seguindo boas práticas de segurança.

2. A arquitetura modular permite a substituição de componentes individuais sem afetar o sistema como um todo, facilitando manutenção e evolução.

3. O uso de TypeScript proporciona maior segurança de tipos e detecção precoce de erros, aumentando a robustez do código.

4. Implementação de testes automatizados para validar a funcionalidade dos componentes críticos do sistema.

## Estrutura Detalhada do Projeto

### Visão Geral da Organização

O Sistema de Monitoramento Aquapônico segue uma arquitetura moderna de aplicação web com separação clara entre frontend, backend e serviços compartilhados. A estrutura de diretórios foi organizada para maximizar a manutenibilidade, modularidade e escalabilidade do código.

### Estrutura de Diretórios Principal

```
├── client/               # Frontend React com TypeScript
├── server/               # Backend Node.js com Express
├── shared/               # Tipos e schemas compartilhados
├── dist/                 # Código compilado para produção
├── public/               # Arquivos estáticos públicos
└── scripts/              # Scripts utilitários de manutenção
```

### Detalhamento do Frontend (client/)

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

### Detalhamento do Backend (server/)

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

### Módulos Compartilhados (shared/)

```
shared/
└── schema.ts                      # Schemas Zod compartilhados entre frontend e backend
```

### Fluxos de Dados Principais

#### 1. Fluxo de Dados de Sensores (Hardware Real)

```
NodeMCU → ThingSpeak API → thingspeakService.ts → databaseService.ts → Componentes React → UI
```

#### 2. Fluxo de Dados do Emulador (Desenvolvimento)

```
emulatorService.ts → databaseService.ts → Componentes React → UI
```

#### 3. Fluxo de Controle de Atuadores

```
UI → Componentes React → API Backend → thingspeakService.ts → ThingSpeak API → NodeMCU → Relés
```

#### 4. Fluxo de Dados Históricos

```
databaseService.ts → dataAggregation.ts → API Backend → TanStack Query → Componentes de Gráfico → UI
```

### Padrões de Design Implementados

#### 1. Padrão Repository
Implementado no `databaseService.ts` para abstrair o acesso ao banco de dados.

#### 2. Padrão Singleton
Utilizado nos serviços principais para garantir uma única instância.

#### 3. Padrão Observer
Implementado para propagação de eventos de mudança de estado.

#### 4. Padrão Strategy
Utilizado para alternar entre modo real e emulador.

#### 5. Padrão Circuit Breaker
Implementado no `thingspeakService.ts` para lidar com falhas na API externa.

### Tecnologias e Bibliotecas Específicas

#### Frontend
- **React 18**: Framework de UI baseado em componentes
- **TypeScript**: Linguagem tipada que compila para JavaScript
- **TanStack Query (React Query)**: Gerenciamento de estado assíncrono e cache
- **TailwindCSS**: Framework CSS utilitário
- **ShadcnUI**: Biblioteca de componentes de UI baseada em Radix UI
- **Recharts**: Biblioteca de visualização de dados

#### Backend
- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web para Node.js
- **Drizzle ORM**: ORM SQL leve e tipado
- **SQLite**: Banco de dados SQL embarcado
- **Zod**: Biblioteca de validação de esquemas

#### DevOps
- **Vite**: Bundler e servidor de desenvolvimento
- **ESBuild**: Compilador JavaScript/TypeScript de alta performance
- **Node-Cron**: Agendador de tarefas baseado em cron

### Estratégias de Otimização

#### 1. Otimização de Consultas
- Uso de índices em colunas frequentemente consultadas
- Paginação de resultados para conjuntos de dados grandes
- Agregação temporal para reduzir volume de dados

#### 2. Otimização de Frontend
- Lazy-loading de componentes
- Memoização de componentes React com `React.memo`
- Uso de `useMemo` e `useCallback` para computações caras

#### 3. Otimização de Rede
- Cache inteligente com TanStack Query
- Estado otimista para feedback imediato
- Polling ajustável baseado em condições operacionais

### Estratégias de Teste

- **Testes Unitários**: Para funções e utilidades críticas
- **Testes de Integração**: Para interações entre serviços
- **Testes End-to-End**: Fluxos completos com Cypress
- **Modo Emulador**: Para desenvolvimento e teste sem hardware

## Integrantes do Projeto

- Edison Cizotto Junior - RA: 2104307 - Polo Socorro
- Evandro Silva e Sousa - RA: 2105237 - Polo Valinhos
- Flavio de Morais - RA: 2110349 - Polo Cosmópolis
- Gustavo Arantes Guidetti - RA: 21100293 - Polo Rio Claro
- Kleyton Henrique Niza dos Santos - RA: 2008071 - Polo Artur Nogueira
- Pedro Otávio Sampaio Torres - RA: 2100007 - Polo Cosmópolis

## Instalação e Execução

1. Instale as dependências:
   ```
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

3. Para deploy em produção:
   ```
   npm run deploy
   ```

O processo de deploy inclui:
- Compilação do frontend React
- Empacotamento do backend Node.js
- Configuração do ambiente de produção
- Inicialização do servidor otimizado

## Deploy em Produção

O sistema pode ser implantado de duas formas diferentes:

### 1. Deploy Local

Execute o script de deploy incluído no projeto:
```
./deploy.sh
```

Este script configura o ambiente, instala dependências, compila a aplicação e inicia o servidor em modo de produção.

### 2. Deploy no Render.com (Hospedagem na Nuvem)

O sistema está atualmente hospedado no Render.com e disponível em: [https://drp04-pji510-pi-v.onrender.com/](https://drp04-pji510-pi-v.onrender.com/)

Para replicar este processo de deploy:

1. Crie uma conta no [Render.com](https://render.com/)
2. Conecte sua conta GitHub ao Render
3. Crie um novo Web Service no dashboard do Render
4. Selecione o repositório GitHub: `https://github.com/FlaviodeMorais/PI5_Deploy`
5. Configure as seguintes opções:
   - **Nome**: Escolha um nome para o serviço (ex: drp04-pji510-pi-v)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
   - **Variáveis de Ambiente**:
     - `NODE_ENV`: production
     - `PORT`: 10000
     - `THINGSPEAK_READ_API_KEY`: 5UWNQD21RD2A7QHG
     - `THINGSPEAK_WRITE_API_KEY`: 9NG6QLIN8UXLE2AH
     - `THINGSPEAK_CHANNEL_ID`: 2840207
     - `REFRESH_INTERVAL`: 30000
     - `TZ`: America/Sao_Paulo

6. Clique em "Create Web Service" para iniciar o processo de deploy
7. O Render.com automatizará o processo de build e deploy da aplicação
8. Após a conclusão, o sistema estará disponível na URL fornecida pelo Render

O deploy no Render.com oferece vantagens como escalonamento automático, SSL gratuito, CI/CD integrado com o GitHub, e monitoramento de saúde do aplicativo.

## Credenciais ThingSpeak

- **Canal**: 2840207
- **Chave de Leitura**: 5UWNQD21RD2A7QHG
- **Chave de Escrita**: 9NG6QLIN8UXLE2AH
