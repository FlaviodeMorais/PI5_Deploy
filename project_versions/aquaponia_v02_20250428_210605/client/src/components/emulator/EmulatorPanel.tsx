import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Definição da interface para configuração do emulador
interface SensorRange {
  min: number;
  max: number;
  current: number;
  fluctuation: number;
}

interface EmulatorConfig {
  enabled: boolean;
  updateInterval: number;
  sensorRanges: {
    waterTemp: SensorRange;
    airTemp: SensorRange;
    waterLevel: SensorRange;
    flowRate: SensorRange;
    humidity: SensorRange;
    pumpPressure: SensorRange;
  };
  controlStates: {
    pumpStatus: boolean;
    heaterStatus: boolean;
  };
  mode: 'stable' | 'fluctuating' | 'random' | 'scenario';
  scenarioName?: string;
}

interface EmulatorStatus {
  enabled: boolean;
  config: EmulatorConfig;
  lastReading: {
    field1?: string | number | null;
    field2?: string | number | null;
    field3?: string | number | null;
    field4?: string | number | null;
    field5?: string | number | null;
    field6?: string | number | null;
    field7?: string | number | null;
    field8?: string | number | null;
    created_at?: string;
    entry_id?: number;
  } | null;
}

// Função utilitária para formatar nomes de cenários para exibição em português do Brasil
const formatScenarioName = (scenario: string): string => {
  const nameMap: Record<string, string> = {
    'normal': 'Normal',
    'aquecimentoNecessario': 'Aquecimento Necessário',
    'nivelBaixoAgua': 'Nível Baixo de Água',
    'temperaturaAlta': 'Temperatura Alta',
    'falhaNaBomba': 'Falha na Bomba',
    'falhaSensor': 'Falha nos Sensores',
    'baixaQualidadeAgua': 'Baixa Qualidade da Água',
    'condicoesOtimas': 'Condições Ótimas'
  };
  
  return nameMap[scenario] || scenario.charAt(0).toUpperCase() + scenario.slice(1);
};

export function EmulatorPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<EmulatorConfig>>({
    updateInterval: 5000,
    mode: 'fluctuating',
  });

  // Buscar status atual do emulador
  const { data: emulatorStatus, isLoading } = useQuery<EmulatorStatus>({
    queryKey: ['/api/emulator/status'],
    queryFn: async () => {
      return await apiRequest<EmulatorStatus>('/api/emulator/status');
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Buscar cenários disponíveis
  const { data: scenariosData, isLoading: isLoadingScenarios } = useQuery<{ success: boolean; scenarios: string[] }>({
    queryKey: ['/api/emulator/scenarios'],
    queryFn: async () => {
      return await apiRequest<{ success: boolean; scenarios: string[] }>('/api/emulator/scenarios');
    },
    staleTime: 300000, // 5 minutos
    retry: 3,
  });

  // Iniciar/parar emulador
  const startEmulatorMutation = useMutation({
    mutationFn: async (config: Partial<EmulatorConfig>) => {
      return await apiRequest('/api/emulator/start', { 
        method: 'POST', 
        body: config
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
      toast({
        title: 'Emulador iniciado',
        description: 'O modo de emulação NodeMCU foi iniciado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao iniciar emulador',
        description: `Ocorreu um erro: ${error.toString()}`,
        variant: 'destructive',
      });
    }
  });

  const stopEmulatorMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/emulator/stop', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
      toast({
        title: 'Emulador parado',
        description: 'O modo de emulação NodeMCU foi parado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao parar emulador',
        description: `Ocorreu um erro: ${error.toString()}`,
        variant: 'destructive',
      });
    }
  });

  // Atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<EmulatorConfig>) => {
      return await apiRequest('/api/emulator/config', { 
        method: 'POST', 
        body: config
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações do emulador foram atualizadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar configuração',
        description: `Ocorreu um erro: ${error.toString()}`,
        variant: 'destructive',
      });
    }
  });

  // Carregar cenário
  const loadScenarioMutation = useMutation({
    mutationFn: async (scenarioName: string) => {
      return await apiRequest('/api/emulator/scenario', { 
        method: 'POST',
        body: { name: scenarioName }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
      toast({
        title: 'Cenário carregado',
        description: `O cenário ${selectedScenario} foi carregado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao carregar cenário',
        description: `Ocorreu um erro: ${error.toString()}`,
        variant: 'destructive',
      });
    }
  });

  // Controlar bomba
  const controlPumpMutation = useMutation({
    mutationFn: async (status: boolean) => {
      return await apiRequest('/api/emulator/pump', { 
        method: 'POST', 
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
    }
  });

  // Controlar aquecedor
  const controlHeaterMutation = useMutation({
    mutationFn: async (status: boolean) => {
      return await apiRequest('/api/emulator/heater', { 
        method: 'POST', 
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emulator/status'] });
    }
  });

  // Atualizar formulário quando o status mudar
  useEffect(() => {
    if (emulatorStatus?.config) {
      setConfigForm({
        updateInterval: emulatorStatus.config.updateInterval,
        mode: emulatorStatus.config.mode,
      });
      
      if (emulatorStatus.config.scenarioName) {
        setSelectedScenario(emulatorStatus.config.scenarioName);
      }
    }
  }, [emulatorStatus]);

  // Manipuladores de eventos
  const handleStartEmulator = () => {
    startEmulatorMutation.mutate({ 
      ...configForm,
      scenarioName: selectedScenario 
    });
  };

  const handleStopEmulator = () => {
    stopEmulatorMutation.mutate();
  };

  const handleUpdateInterval = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setConfigForm({ ...configForm, updateInterval: value });
    }
  };

  const handleModeChange = (mode: string) => {
    setConfigForm({ ...configForm, mode: mode as 'stable' | 'fluctuating' | 'random' | 'scenario' });
  };

  const handleLoadScenario = () => {
    loadScenarioMutation.mutate(selectedScenario);
  };

  const handlePumpToggle = (checked: boolean) => {
    controlPumpMutation.mutate(checked);
  };

  const handleHeaterToggle = (checked: boolean) => {
    controlHeaterMutation.mutate(checked);
  };

  const handleApplyConfig = () => {
    updateConfigMutation.mutate(configForm);
  };

  // Renderizar componente
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-microchip text-blue-500"></i>
          Emulador NodeMCU
        </CardTitle>
        <CardDescription>
          Simule um NodeMCU com sensores de temperatura, nível de água, vazão, temperatura do ar, umidade e pressão da bomba.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status e controles principais */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${emulatorStatus?.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Status: {emulatorStatus?.enabled ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex gap-2">
              {!emulatorStatus?.enabled ? (
                <Button onClick={handleStartEmulator} disabled={startEmulatorMutation.isPending}>
                  <i className="fas fa-play mr-2"></i>
                  Iniciar
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleStopEmulator} disabled={stopEmulatorMutation.isPending}>
                  <i className="fas fa-stop mr-2"></i>
                  Parar
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Tabs para diferentes tipos de configuração */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="scenarios">Cenários</TabsTrigger>
              <TabsTrigger value="manual">Controle Manual</TabsTrigger>
            </TabsList>

            {/* Configurações básicas */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="updateInterval">Intervalo de Atualização (ms)</Label>
                  <Input 
                    id="updateInterval" 
                    type="number" 
                    value={configForm.updateInterval} 
                    onChange={handleUpdateInterval}
                    min={1000}
                    max={60000}
                  />
                  <p className="text-xs text-gray-500">Tempo entre cada atualização de leitura (1000-60000ms)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Modo de Operação</Label>
                  <Select value={configForm.mode} onValueChange={handleModeChange}>
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Selecione o modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stable">Estável (valores fixos)</SelectItem>
                      <SelectItem value="fluctuating">Flutuante (variações pequenas)</SelectItem>
                      <SelectItem value="random">Aleatório (falhas ocasionais)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Como os valores dos sensores vão se comportar</p>
                </div>
              </div>

              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full mt-2">
                    {isAdvancedOpen ? "Ocultar configurações avançadas" : "Mostrar configurações avançadas"}
                    <i className={`fas fa-chevron-${isAdvancedOpen ? 'up' : 'down'} ml-2`}></i>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4">
                  <p className="text-sm font-medium mb-2">Configurações avançadas em desenvolvimento...</p>
                </CollapsibleContent>
              </Collapsible>

              <Button className="w-full" onClick={handleApplyConfig} disabled={updateConfigMutation.isPending}>
                Aplicar Configurações
              </Button>
            </TabsContent>

            {/* Cenários */}
            <TabsContent value="scenarios" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenario">Selecione um Cenário</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger id="scenario">
                    <SelectValue placeholder={isLoadingScenarios ? "Carregando cenários..." : "Selecione um cenário"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingScenarios ? (
                      <SelectItem value="loading" disabled>Carregando cenários...</SelectItem>
                    ) : scenariosData?.scenarios && scenariosData.scenarios.length > 0 ? (
                      scenariosData.scenarios.map((scenario) => (
                        <SelectItem key={scenario} value={scenario}>
                          {formatScenarioName(scenario)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="normal">Normal</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <h4 className="font-medium mb-2">Descrição do Cenário</h4>
                  <p className="text-sm">
                    {selectedScenario === 'normal' && 'Operação normal com flutuações suaves nos sensores, simulando um dia típico.'}
                    {selectedScenario === 'aquecimentoNecessario' && 'Temperatura baixa que requer ativação do aquecedor.'}
                    {selectedScenario === 'nivelBaixoAgua' && 'Nível de água baixo que requer atenção e intervenção.'}
                    {selectedScenario === 'temperaturaAlta' && 'Temperatura elevada que pode ser crítica para o sistema.'}
                    {selectedScenario === 'falhaNaBomba' && 'Falha na bomba com baixa vazão e pressão.'}
                    {selectedScenario === 'falhaSensor' && 'Falhas ocasionais nos sensores, simulando problemas de leitura.'}
                    {selectedScenario === 'baixaQualidadeAgua' && 'Baixa qualidade da água com pH e níveis de oxigênio inadequados.'}
                    {selectedScenario === 'condicoesOtimas' && 'Condições ideais para o funcionamento do sistema aquapônico.'}
                  </p>
                </div>

                <Button className="w-full mt-4" onClick={handleLoadScenario} disabled={loadScenarioMutation.isPending}>
                  Carregar Cenário
                </Button>
              </div>
            </TabsContent>

            {/* Controle manual */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Controle de Dispositivos</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-water text-blue-500"></i>
                      <span>Bomba</span>
                    </div>
                    <Switch 
                      checked={emulatorStatus?.config.controlStates.pumpStatus || false} 
                      onCheckedChange={handlePumpToggle} 
                      disabled={!emulatorStatus?.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-fire text-orange-500"></i>
                      <span>Aquecedor</span>
                    </div>
                    <Switch 
                      checked={emulatorStatus?.config.controlStates.heaterStatus || false} 
                      onCheckedChange={handleHeaterToggle} 
                      disabled={!emulatorStatus?.enabled}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-gray-500">
        <div>
          {emulatorStatus?.lastReading && (
            <>
              <span>Última leitura: {new Date(emulatorStatus.lastReading.created_at || Date.now()).toLocaleString()}</span>
            </>
          )}
        </div>
        <div>
          Modo: <span className="font-medium">{emulatorStatus?.config.mode}</span>
        </div>
      </CardFooter>
    </Card>
  );
}