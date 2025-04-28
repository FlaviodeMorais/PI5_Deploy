import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updatePumpStatus, getDeviceStatus, DeviceStatusResponse } from '@/lib/thingspeakApi';
import { Reading } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Constante para o valor de erro do sensor
const SENSOR_ERROR_VALUE = -127;

interface PumpControlProps {
  latestReading?: Reading;
  isLoading: boolean;
}

export function PumpControl({ latestReading, isLoading }: PumpControlProps) {
  const [isOn, setIsOn] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Desconectado');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [pendingSync, setPendingSync] = useState<boolean>(false);
  // Estado para controlar operações muito frequentes (anti-oscilação)
  const [lastToggleTime, setLastToggleTime] = useState<number>(0);
  const queryClient = useQueryClient();

  // Consulta para o status atual dos dispositivos (incluindo o estado em memória)
  const deviceStatusQuery = useQuery({
    queryKey: ['/api/device/status'],
    queryFn: getDeviceStatus,
    refetchInterval: 2000,  // Atualiza a cada 2 segundos
    refetchIntervalInBackground: true
  });

  const togglePumpMutation = useMutation({
    mutationFn: updatePumpStatus,
    onSuccess: (data) => {
      // Atualização imediata do estado local
      setIsOn(data.pumpStatus);
      setStatusText(data.pumpStatus ? 'Ligada' : 'Desligada');
      setPendingSync(true); // Indica que há uma sincronização pendente
      
      // Registrar hora da atualização
      const now = new Date();
      setLastUpdate(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      
      // Invalidar ambos os caches
      queryClient.invalidateQueries({ queryKey: ['/api/readings/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/device/status'] });
    },
  });

  // Atualizar com base no status do dispositivo (nova API)
  useEffect(() => {
    if (deviceStatusQuery.data && !togglePumpMutation.isPending) {
      const statusData = deviceStatusQuery.data;
      
      // SEMPRE priorizar o estado em memória para feedback imediato
      if (statusData.memoryState) {
        setIsOn(statusData.memoryState.pumpStatus);
        setStatusText(statusData.memoryState.pumpStatus ? 'Ligada' : 'Desligada');
        
        // Verificar se há sincronização pendente comparando os estados
        const memoryState = statusData.memoryState.pumpStatus;
        const dbState = statusData.pumpStatus;
        
        // Se os estados são diferentes, então há uma sincronização pendente
        setPendingSync(memoryState !== dbState);
      } else {
        // Fallback para o valor do banco se por algum motivo não temos estado em memória
        setIsOn(statusData.pumpStatus);
        setStatusText(statusData.pumpStatus ? 'Ligada' : 'Desligada');
        setPendingSync(false);
      }
      
      // Atualizar timestamp - sempre usar o timestamp mais recente disponível
      const timestamp = statusData.memoryState?.timestamp || statusData.timestamp;
      if (timestamp) {
        const date = new Date(timestamp);
        setLastUpdate(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`);
      }
    }
  }, [deviceStatusQuery.data, togglePumpMutation.isPending]);
  
  // Manter compatibilidade com o componente original
  useEffect(() => {
    if (latestReading && !deviceStatusQuery.data && !togglePumpMutation.isPending) {
      setIsOn(latestReading.pumpStatus);
      setStatusText(latestReading.pumpStatus ? 'Ligada' : 'Desligada');
      
      // Atualizar timestamp da última leitura
      if (latestReading.timestamp) {
        const date = new Date(latestReading.timestamp);
        setLastUpdate(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`);
      }
    }
  }, [latestReading, deviceStatusQuery.data, togglePumpMutation.isPending]);

  const handlePumpToggle = (newStatus: boolean) => {
    // Verificar se já passou tempo suficiente desde a última atualização (3 segundos mínimo)
    const now = Date.now();
    const timeSinceLastToggle = now - lastToggleTime;
    const MIN_TOGGLE_INTERVAL = 3000; // 3 segundos para evitar oscilações
    
    if (timeSinceLastToggle < MIN_TOGGLE_INTERVAL) {
      console.log(`Ação ignorada: muito rápido (${timeSinceLastToggle}ms desde a última ação)`);
      return; // Ignorar comando muito frequente
    }
    
    // Atualizar timestamp do último toggle
    setLastToggleTime(now);
    
    // Atualização otimista imediata
    setIsOn(newStatus);
    setStatusText('Atualizando...');
    
    // Enviar para o servidor
    togglePumpMutation.mutate(newStatus);
  };

  return (
    <div className={`${isOn ? 'control-card-active' : 'control-card'} flex flex-col justify-between min-h-[220px]`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${isOn ? 'bg-gradient-to-r from-[#4caf50] to-[#2e7d32]' : 'bg-gradient-to-r from-[#1e293b] to-[#111827]'} flex items-center justify-center text-xl sm:text-2xl transition-all duration-300 glow-effect`}>
          <i className={`fas fa-wind ${isOn ? 'text-white glow-text' : 'text-gray-400'}`}></i>
        </div>
        <div className="flex-1">
          <h4 className="text-white text-2xl font-semibold mb-1">Bomba d'água</h4>
          <div className={`text-base sm:text-lg font-light ${isOn ? 'text-green-400 glow-text' : 'text-gray-400'} mb-1`}>
            {isLoading ? 'Carregando...' : statusText}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-light bg-white/5 px-2 py-1 rounded-md text-white/80 border border-white/10">
              Controle Manual
            </span>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs text-white/60 border-white/10">
                <i className="fas fa-clock mr-1 text-xs"></i> {lastUpdate}
              </Badge>
            )}
            {pendingSync && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs text-amber-400 border-amber-800/30 bg-amber-500/10">
                      <i className="fas fa-sync-alt fa-spin mr-1 text-xs"></i> Sincronizando
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Aguardando confirmação do ThingSpeak</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-xs text-white/40">
            Status: {togglePumpMutation.isPending ? 'Enviando...' : (pendingSync ? 'Sincronizando...' : 'Pronto')}
            {deviceStatusQuery.isLoading && !deviceStatusQuery.data && <span> (Conectando...)</span>}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="mt-1">
          <Button
            variant={isOn ? "default" : "outline"}
            className={`w-full py-4 sm:py-6 ${isOn ? 'gradient-green' : 'border-white/10'} rounded-lg shadow-lg transition-all duration-300`}
            onClick={() => handlePumpToggle(!isOn)}
            disabled={togglePumpMutation.isPending || (latestReading?.temperature === SENSOR_ERROR_VALUE)}
          >
            <i className="fas fa-power-off mr-2"></i>
            <span className="text-sm sm:text-base">{isOn ? 'Desligar' : 'Ligar'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
