import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDeviceMode } from '@/contexts/DeviceModeContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VirtualSensors } from '@/components/emulator/VirtualSensors';
import { PumpFlowControl } from '@/components/emulator/PumpFlowControl';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interface para configuração do sensor
interface SensorConfig {
  min: number;
  max: number;
  current: number;
  fluctuation: number;
}

// Interface para configuração do emulador
interface EmulatorConfig {
  enabled: boolean;
  updateInterval: number;
  sensorRanges: {
    waterTemp: SensorConfig;
    airTemp: SensorConfig;
    waterLevel: SensorConfig;
    flowRate: SensorConfig;
    humidity: SensorConfig;
    pumpPressure: SensorConfig;
    phLevel: SensorConfig;
    oxygenLevel: SensorConfig;
  };
  controlStates: {
    pumpStatus: boolean;
    heaterStatus: boolean;
    pumpFlow: number;
  };
  mode: 'stable' | 'fluctuating' | 'random' | 'scenario';
  scenarioName?: string;
}

// Interface para status do emulador
interface EmulatorStatus {
  enabled: boolean;
  config: EmulatorConfig;
  lastReading: any;
}

export default function DataSource() {
  const { toast } = useToast();
  const { mode, setMode } = useDeviceMode();
  const [currentTab, setCurrentTab] = useState('overview');
  const [emulatorConfig, setEmulatorConfig] = useState<EmulatorConfig>({
    enabled: false,
    updateInterval: 5000,
    mode: 'stable',
    sensorRanges: {
      waterTemp: { min: 20, max: 30, current: 25, fluctuation: 0.2 },
      airTemp: { min: 18, max: 35, current: 22, fluctuation: 0.3 },
      waterLevel: { min: 0, max: 100, current: 80, fluctuation: 1 },
      flowRate: { min: 0, max: 10, current: 5, fluctuation: 0.5 },
      humidity: { min: 40, max: 90, current: 60, fluctuation: 2 },
      pumpPressure: { min: 0, max: 10, current: 5, fluctuation: 0.2 },
      phLevel: { min: 6, max: 8.5, current: 7.2, fluctuation: 0.2 },
      oxygenLevel: { min: 5, max: 15, current: 8.5, fluctuation: 0.5 }
    },
    controlStates: {
      pumpStatus: false,
      heaterStatus: false,
      pumpFlow: 70
    }
  });
  const [configModified, setConfigModified] = useState(false);
  
  // Buscar status atual do emulador
  const { data: emulatorStatus, isLoading: isLoadingStatus, refetch: refetchEmulatorStatus } = useQuery({
    queryKey: ['/api/emulator/status'],
    queryFn: async () => {
      const response = await fetch('/api/emulator/status', {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Falha ao obter status do emulador');
      return await response.json();
    },
    refetchInterval: 5000,
    staleTime: 2000,
  });
  
  // Buscar cenários disponíveis
  const { data: scenariosData } = useQuery({
    queryKey: ['/api/emulator/scenarios'],
    queryFn: async () => {
      const response = await fetch('/api/emulator/scenarios', {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Falha ao obter cenários');
      return await response.json();
    },
  });
  
  // Atualizar configuração quando os dados do emulador forem carregados
  useEffect(() => {
    if (emulatorStatus && emulatorStatus.config) {
      // Atualizar completamente a configuração com todos os valores do servidor
      setEmulatorConfig(emulatorStatus.config);
      // Reset the modified flag after successful load
      setConfigModified(false);
    }
  }, [emulatorStatus]);
  
  // Iniciar o emulador
  const startEmulator = async () => {
    try {
      const response = await fetch('/api/emulator/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emulatorConfig)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Emulador iniciado",
            description: "O emulador foi iniciado com sucesso.",
          });
          
          // Atualizar modo para EMULATOR
          setMode('EMULATOR');
          
          // Recarregar status
          refetchEmulatorStatus();
        }
      } else {
        throw new Error("Falha ao iniciar o emulador");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao iniciar o emulador: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  // Parar o emulador
  const stopEmulator = async () => {
    try {
      const response = await fetch('/api/emulator/stop', {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Emulador parado",
          description: "O emulador foi parado com sucesso.",
        });
        
        // Atualizar modo para NODEMCU
        setMode('NODEMCU');
        
        // Recarregar status
        refetchEmulatorStatus();
      } else {
        throw new Error("Falha ao parar o emulador");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao parar o emulador: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  // Atualizar configuração de sensores
  const updateSensorConfig = (sensorKey: keyof EmulatorConfig['sensorRanges'], property: keyof SensorConfig, value: number) => {
    setEmulatorConfig(prev => {
      // Criar uma nova cópia profunda para garantir que todas as propriedades sejam mantidas
      const newConfig = { ...prev };
      
      // Garantir que sensorRanges exista
      if (!newConfig.sensorRanges) {
        newConfig.sensorRanges = { ...emulatorConfig.sensorRanges };
      }
      
      // Garantir que o sensor específico exista
      if (!newConfig.sensorRanges[sensorKey]) {
        newConfig.sensorRanges[sensorKey] = { ...emulatorConfig.sensorRanges[sensorKey] };
      }
      
      // Atualizar a propriedade específica
      newConfig.sensorRanges[sensorKey] = {
        ...newConfig.sensorRanges[sensorKey],
        [property]: value
      };
      
      return newConfig;
    });
    
    // Marcar que a configuração foi modificada
    setConfigModified(true);
  };
  
  // Atualizar configuração de controle
  const updateControlState = (controlKey: keyof EmulatorConfig['controlStates'], value: boolean | number) => {
    setEmulatorConfig(prev => {
      // Criar uma nova cópia profunda
      const newConfig = { ...prev };
      
      // Garantir que controlStates exista
      if (!newConfig.controlStates) {
        newConfig.controlStates = { ...emulatorConfig.controlStates };
      }
      
      // Atualizar o estado específico
      newConfig.controlStates = {
        ...newConfig.controlStates,
        [controlKey]: value
      };
      
      return newConfig;
    });
    
    // Marcar que a configuração foi modificada
    setConfigModified(true);
  };
  
  // Atualizar configuração do emulador
  const updateEmulatorConfig = async () => {
    try {
      const response = await fetch('/api/emulator/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emulatorConfig)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Configuração atualizada",
            description: "A configuração do emulador foi atualizada com sucesso.",
          });
          
          // Reset the modified flag after successful save
          setConfigModified(false);
          
          // Recarregar status
          refetchEmulatorStatus();
        } else {
          throw new Error(data.message || "Erro desconhecido ao atualizar configuração");
        }
      } else {
        throw new Error("Falha ao atualizar configuração");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao atualizar configuração: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  // Carregar cenário específico
  const loadScenario = async (scenarioName: string) => {
    try {
      const response = await fetch(`/api/emulator/scenarios/${scenarioName}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Cenário carregado",
            description: `O cenário "${scenarioName}" foi carregado com sucesso.`,
          });
          
          // Atualizar configuração local completamente
          if (data.config) {
            setEmulatorConfig(data.config);
          }
          
          // Recarregar status após um breve intervalo
          setTimeout(() => {
            refetchEmulatorStatus();
          }, 1000);
        } else {
          throw new Error(data.error || "Cenário não encontrado");
        }
      } else {
        throw new Error("Falha ao carregar cenário");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao carregar cenário: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  // Verificar se o emulador está ativo
  const isEmulatorActive = emulatorStatus && emulatorStatus.enabled;
  
  // Função para alternar entre modos NODEMCU e EMULADOR
  const toggleDeviceMode = () => {
    if (mode === 'NODEMCU') {
      if (!isEmulatorActive) {
        // Se o emulador não estiver ativo, iniciá-lo primeiro
        startEmulator();
      } else {
        // Apenas mudar o modo se o emulador já estiver ativo
        setMode('EMULATOR');
      }
    } else {
      // Desligar o emulador e mudar para modo NODEMCU
      stopEmulator();
    }
  };
  
  // Sensores com seus rótulos
  const sensorLabels: Record<string, string> = {
    waterTemp: 'Temperatura da Água (°C)',
    airTemp: 'Temperatura do Ar (°C)',
    waterLevel: 'Nível da Água (%)',
    flowRate: 'Vazão (L/min)',
    humidity: 'Umidade (%)',
    pumpPressure: 'Pressão da Bomba (kPa)',
    phLevel: 'pH',
    oxygenLevel: 'Nível de Oxigênio (mg/L)'
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Fonte de Dados</h1>
          <p className="text-gray-500">Gerenciar fontes de dados e simulador de sensores</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg">
            <Badge variant={mode === 'NODEMCU' ? 'default' : 'outline'} className="text-sm font-medium py-1.5 px-3">
              <i className="fas fa-microchip mr-1.5"></i> NodeMCU
            </Badge>
            <Badge variant={mode === 'EMULATOR' ? 'default' : 'outline'} className="text-sm font-medium py-1.5 px-3">
              <i className="fas fa-laptop-code mr-1.5"></i> Emulador
            </Badge>
          </div>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emulator">Emulador</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>
        
        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Status do Emulador */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Status da Fonte de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <Label className="font-medium">Fonte de Dados:</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                    <span className={`text-sm px-2 py-1 transition-colors duration-200 ${mode === 'NODEMCU' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      <i className="fas fa-microchip mr-1.5"></i> NodeMCU
                    </span>
                    <Switch 
                      checked={mode === 'EMULATOR'} 
                      onCheckedChange={toggleDeviceMode}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className={`text-sm px-2 py-1 transition-colors duration-200 ${mode === 'EMULATOR' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      <i className="fas fa-laptop-code mr-1.5"></i> Emulador
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Fonte Atual:</Label>
                  <Badge variant="outline" className={`px-3 py-1 text-sm ${mode === 'EMULATOR' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                    <i className={`mr-1.5 ${mode === 'EMULATOR' ? 'fas fa-laptop-code' : 'fas fa-microchip'}`}></i>
                    {mode === 'EMULATOR' ? 'Emulador Virtual' : 'Hardware NodeMCU'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Status do Emulador:</Label>
                  <Badge 
                    variant="outline" 
                    className={`px-3 py-1 text-sm ${isEmulatorActive 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                  >
                    <i className={`mr-1.5 fas ${isEmulatorActive ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {isEmulatorActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                {isEmulatorActive && (
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Modo do Emulador:</Label>
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 border-blue-300"
                    >
                      <i className="mr-1.5 fas fa-sliders-h"></i>
                      {emulatorConfig.mode === 'stable' && 'Estável'}
                      {emulatorConfig.mode === 'fluctuating' && 'Flutuante'}
                      {emulatorConfig.mode === 'random' && 'Aleatório'}
                      {emulatorConfig.mode === 'scenario' && 'Cenário'}
                      {emulatorConfig.scenarioName && `: ${emulatorConfig.scenarioName}`}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <Label className="font-medium">Intervalo de Atualização:</Label>
                  <span className="text-sm">
                    {isEmulatorActive 
                      ? `${emulatorConfig.updateInterval / 1000} segundos` 
                      : '5 minutos (ThingSpeak)'}
                  </span>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-center gap-3">
                  {isEmulatorActive ? (
                    <Button 
                      variant="outline" 
                      onClick={stopEmulator} 
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                    >
                      <i className="fas fa-stop-circle mr-2"></i>
                      Parar Emulador
                    </Button>
                  ) : (
                    <Button onClick={startEmulator}>
                      <i className="fas fa-play-circle mr-2"></i>
                      Iniciar Emulador
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sensores Virtuais - Mostrar apenas quando o emulador estiver ativo */}
          <VirtualSensors refreshInterval={5000} />
          
          {/* Controle de Vazão da Bomba - Mostrar apenas quando o emulador estiver ativo */}
          {isEmulatorActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PumpFlowControl 
                currentFlow={emulatorConfig.controlStates?.pumpFlow || 0}
                onFlowChange={(flow) => updateControlState('pumpFlow', flow)}
              />
            </div>
          )}
        </TabsContent>
        
        {/* Tab: Emulador */}
        <TabsContent value="emulator" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Controle do Emulador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* Status do Emulador e Botão para Ligar/Desligar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium">Status do Emulador</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {isEmulatorActive 
                        ? "O emulador está em execução e gerando dados de sensores" 
                        : "O emulador está desligado, ative-o para simular sensores"}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    {isEmulatorActive ? (
                      <Button 
                        variant="outline" 
                        onClick={stopEmulator} 
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                      >
                        <i className="fas fa-stop-circle mr-2"></i>
                        Parar Emulador
                      </Button>
                    ) : (
                      <Button onClick={startEmulator}>
                        <i className="fas fa-play-circle mr-2"></i>
                        Iniciar Emulador
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Modo de Operação */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Modo de Operação</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Modo do Emulador</Label>
                        <Select 
                          value={emulatorConfig.mode} 
                          onValueChange={(value: any) => {
                            setEmulatorConfig({
                              ...emulatorConfig,
                              mode: value as 'stable' | 'fluctuating' | 'random' | 'scenario'
                            });
                            setConfigModified(true);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stable">Estável</SelectItem>
                            <SelectItem value="fluctuating">Flutuante</SelectItem>
                            <SelectItem value="random">Aleatório</SelectItem>
                            <SelectItem value="scenario">Cenário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Intervalo de Atualização</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            value={[emulatorConfig.updateInterval / 1000]} 
                            min={1} 
                            max={30} 
                            step={1} 
                            onValueChange={(values) => {
                              setEmulatorConfig({
                                ...emulatorConfig,
                                updateInterval: values[0] * 1000
                              });
                              setConfigModified(true);
                            }}
                          />
                          <span className="min-w-[3rem] text-sm">{emulatorConfig.updateInterval / 1000}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Cenários Pré-definidos */}
                {scenariosData && scenariosData.scenarios && scenariosData.scenarios.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Cenários Pré-definidos</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Selecione um cenário pré-configurado para o emulador.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {scenariosData?.scenarios?.map((scenario: string) => (
                        <Button 
                          key={scenario} 
                          variant="outline" 
                          className={`justify-start ${emulatorConfig.scenarioName === scenario 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : ''}`}
                          onClick={() => loadScenario(scenario)}
                        >
                          <i className={`mr-2 fas ${emulatorConfig.scenarioName === scenario 
                            ? 'fa-check-circle text-blue-500' 
                            : 'fa-play-circle'}`}
                          ></i>
                          {scenario}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={updateEmulatorConfig} 
                    disabled={!configModified}
                    className={configModified ? 'bg-blue-600 hover:bg-blue-700' : 'opacity-70'}
                  >
                    {configModified ? 'Salvar Alterações' : 'Configuração Atualizada'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Configurações Avançadas */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Configuração dos Sensores */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Configuração dos Sensores</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Defina os limites e a flutuação para cada sensor virtual.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {Object.entries(emulatorConfig.sensorRanges).map(([key, sensor]) => {
                      const sensorKey = key as keyof EmulatorConfig['sensorRanges'];
                      
                      return (
                        <div key={key} className="border rounded-md p-4">
                          <h4 className="font-medium mb-3">{sensorLabels[key] || key}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Min e Max */}
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`${key}-min`} className="text-sm">
                                  Valor Mínimo: {sensor.min}
                                </Label>
                                <Slider 
                                  id={`${key}-min`}
                                  min={0} 
                                  max={100} 
                                  step={1} 
                                  value={[sensor.min]} 
                                  onValueChange={(values) => updateSensorConfig(sensorKey, 'min', values[0])}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`${key}-max`} className="text-sm">
                                  Valor Máximo: {sensor.max}
                                </Label>
                                <Slider 
                                  id={`${key}-max`}
                                  min={0} 
                                  max={100} 
                                  step={1} 
                                  value={[sensor.max]} 
                                  onValueChange={(values) => updateSensorConfig(sensorKey, 'max', values[0])}
                                />
                              </div>
                            </div>
                            
                            {/* Current e Fluctuation */}
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`${key}-current`} className="text-sm">
                                  Valor Atual: {sensor.current}
                                </Label>
                                <Slider 
                                  id={`${key}-current`}
                                  min={sensor.min} 
                                  max={sensor.max} 
                                  step={0.1} 
                                  value={[sensor.current]} 
                                  onValueChange={(values) => updateSensorConfig(sensorKey, 'current', values[0])}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`${key}-fluctuation`} className="text-sm">
                                  Flutuação: {sensor.fluctuation}
                                </Label>
                                <Slider 
                                  id={`${key}-fluctuation`}
                                  min={0} 
                                  max={5} 
                                  step={0.1} 
                                  value={[sensor.fluctuation]} 
                                  onValueChange={(values) => updateSensorConfig(sensorKey, 'fluctuation', values[0])}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Estados de Controle */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Estados de Controle Iniciais</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Defina o estado inicial dos dispositivos no emulador.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {/* Bomba */}
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-3">Bomba d'água</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pump-status">Estado Inicial</Label>
                        <Switch 
                          id="pump-status" 
                          checked={emulatorConfig.controlStates?.pumpStatus || false}
                          onCheckedChange={(checked) => updateControlState('pumpStatus', checked)}
                        />
                      </div>
                    </div>
                    
                    {/* Aquecedor */}
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-3">Aquecedor</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="heater-status">Estado Inicial</Label>
                        <Switch 
                          id="heater-status" 
                          checked={emulatorConfig.controlStates?.heaterStatus || false}
                          onCheckedChange={(checked) => updateControlState('heaterStatus', checked)}
                        />
                      </div>
                    </div>
                    
                    {/* Vazão da Bomba */}
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-3">Vazão da Bomba</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pump-flow">Valor Inicial: {emulatorConfig.controlStates?.pumpFlow || 0}%</Label>
                        </div>
                        <Slider 
                          id="pump-flow"
                          min={0} 
                          max={100} 
                          step={5} 
                          value={[emulatorConfig.controlStates?.pumpFlow || 0]} 
                          onValueChange={(values) => updateControlState('pumpFlow', values[0])}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-8">
                  <Button 
                    variant="outline" 
                    className="mr-2" 
                    onClick={() => {
                      // Recarregar os dados do servidor para descartar alterações
                      if (emulatorStatus && emulatorStatus.config) {
                        setEmulatorConfig(emulatorStatus.config);
                        setConfigModified(false);
                      }
                    }}
                    disabled={!configModified}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={updateEmulatorConfig}
                    disabled={!configModified}
                    className={configModified ? 'bg-blue-600 hover:bg-blue-700' : 'opacity-70'}
                  >
                    {configModified ? 'Salvar Alterações' : 'Configuração Atualizada'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}