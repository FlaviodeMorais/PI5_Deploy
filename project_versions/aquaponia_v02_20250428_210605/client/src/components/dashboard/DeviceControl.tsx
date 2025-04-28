import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Reading, Setpoint } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import { DeviceResponse, ReadingsResponse } from '@/lib/thingspeakApi';

// Constante para o valor de erro do sensor
const SENSOR_ERROR_VALUE = -127;

// Interface estendida que combina valores de leitura com os setpoints
export interface ReadingWithSetpoints extends Reading {
  tempMin?: number;
  tempMax?: number;
  levelMin?: number;
  levelMax?: number;
}

interface DeviceControlProps {
  type: 'pump' | 'heater';
  label: string;
  icon: string;
  activeGradientClass: string; // Classe CSS para o gradiente quando ativo (ex: 'gradient-green')
  activeTextClass: string;     // Classe CSS para o texto quando ativo (ex: 'text-green-400')
  iconBackgroundClass: string; // Classe CSS para o background do ícone quando ativo
  latestReading?: ReadingWithSetpoints;
  isLoading: boolean;
  updateFn: (status: boolean) => Promise<DeviceResponse>;
  getStatus: (reading?: Reading) => boolean;
  getStatusText: (isActive: boolean) => string;
}

export function DeviceControl({
  type,
  label,
  icon,
  activeGradientClass,
  activeTextClass,
  iconBackgroundClass,
  latestReading,
  isLoading,
  updateFn,
  getStatus,
  getStatusText
}: DeviceControlProps) {
  const [mode, setMode] = useState<string>('manual'); // Iniciar com modo manual para evitar automação inesperada
  const [isOn, setIsOn] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Desconectado');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoModeStatus, setAutoModeStatus] = useState<string>('');
  const queryClient = useQueryClient();

  // Chave para o status no objeto de resposta da API (pumpStatus ou heaterStatus)
  const statusKey = type === 'pump' ? 'pumpStatus' : 'heaterStatus';

  const toggleMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: (data) => {
      // Atualização imediata do estado local
      const newStatus = data[statusKey as keyof DeviceResponse] as boolean || false;
      setIsOn(newStatus);
      setStatusText(getStatusText(newStatus));

      // Registrar hora da atualização
      setLastUpdate(formatTime(new Date()));

      // Invalidação da query para atualizar o cache
      queryClient.invalidateQueries({ queryKey: ['/api/readings/latest'] });
    },
  });

  // Update UI based on latest reading  - with safety check for undefined values.
  useEffect(() => {
    if (latestReading && !toggleMutation.isPending) {
      const currentStatus = getStatus(latestReading);
      if(currentStatus !== undefined && currentStatus !== null){
        setIsOn(currentStatus);
        setStatusText(getStatusText(currentStatus));
      }

      // Atualizar timestamp da última leitura
      if (latestReading.timestamp) {
        setLastUpdate(formatTime(new Date(latestReading.timestamp)));
      }
    }
  }, [latestReading, toggleMutation.isPending, getStatus, getStatusText]);

  // Lógica do modo automático
  useEffect(() => {
    if (mode === 'auto' && latestReading) {
      let shouldBeOn = false;
      let reasonText = '';

      // Obter setpoints da API (presentes na mesma resposta que os readings)
      const minTemp = latestReading.tempMin ?? 25;
      const maxTemp = latestReading.tempMax ?? 30;
      const minLevel = latestReading.levelMin ?? 20;
      const maxLevel = latestReading.levelMax ?? 80;

      if (type === 'heater') {
        // Lógica para aquecedor: ligar se temperatura abaixo do mínimo
        if (latestReading.temperature < minTemp && 
            latestReading.temperature !== SENSOR_ERROR_VALUE) {
          shouldBeOn = true;
          reasonText = `Temp ${latestReading.temperature.toFixed(1)}°C < ${minTemp}°C`;
        } else {
          shouldBeOn = false;
          reasonText = `Temp ${latestReading.temperature.toFixed(1)}°C ≥ ${minTemp}°C`;
        }
      } else if (type === 'pump') {
        // Lógica para bomba: ligar se nível abaixo do mínimo
        if (latestReading.level < minLevel) {
          shouldBeOn = true;
          reasonText = `Nível ${latestReading.level.toFixed(1)}% < ${minLevel}%`;
        } else if (latestReading.level > maxLevel) {
          shouldBeOn = false;
          reasonText = `Nível ${latestReading.level.toFixed(1)}% > ${maxLevel}%`;
        } else {
          shouldBeOn = isOn; // Manter estado atual em zona segura
          reasonText = `Nível ${latestReading.level.toFixed(1)}% OK`;
        }
      }

      setAutoModeStatus(reasonText);

      // Atualizar dispositivo se o status for diferente do atual
      if (shouldBeOn !== isOn && !toggleMutation.isPending && 
          latestReading.temperature !== SENSOR_ERROR_VALUE) {
        toggleMutation.mutate(shouldBeOn);
      }
    }
  }, [mode, latestReading, type, isOn, toggleMutation]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);

    // Ao mudar para modo manual, mantenha o estado atual
    // Ao mudar para modo automático, o efeito acima vai cuidar da lógica
  };

  const handleDeviceToggle = (newStatus: boolean) => {
    // Atualização otimista imediata
    setIsOn(newStatus);
    setStatusText('Atualizando...');
    // Enviar para o servidor
    toggleMutation.mutate(newStatus);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg shadow-xl p-5 relative overflow-hidden min-h-[200px] flex flex-col">
      {/* Status indicator - absolute positioned mini dot */}
      <div className={`absolute right-4 top-4 w-2 h-2 rounded-full ${isOn ? `${activeTextClass} animate-pulse` : 'bg-gray-500'}`}></div>

      {/* Device icon and info - modernized header */}
      <div className="flex items-center mb-3 relative">
        <div className={`w-10 h-10 rounded-lg ${isOn ? iconBackgroundClass : 'bg-gray-800'} flex items-center justify-center text-lg transition-all duration-300 mr-3`}>
          <i className={`fas fa-${icon} ${isOn ? 'text-white' : 'text-gray-400'}`}></i>
        </div>
        <div>
          <h4 className="text-white/70 text-sm font-medium">{label}</h4>
          <div className={`text-base font-medium ${isOn ? activeTextClass : 'text-gray-400'}`}>
            {isLoading ? 'Carregando...' : statusText}
          </div>
        </div>
        {lastUpdate && (
          <Badge variant="outline" className="absolute right-0 text-[10px] text-white/60 border-white/10">
            <i className="fas fa-clock mr-1 text-[10px]"></i> {lastUpdate}
          </Badge>
        )}
      </div>

      {/* Auto mode status - elegant information display */}
      {mode === 'auto' && autoModeStatus && (
        <div className="bg-gray-800/50 text-xs text-white/60 p-2 rounded mb-3 border border-gray-700/50">
          <i className="fas fa-robot mr-1"></i> {autoModeStatus}
        </div>
      )}

      <div className="mt-auto">
        {/* Mode toggle - minimalist pill */}
        <div className="flex w-full rounded-full bg-gray-800/50 mb-4 p-1 h-8">
          <button 
            className={`flex-1 rounded-full text-xs flex items-center justify-center transition-all ${mode === 'manual' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}
            onClick={() => handleModeChange('manual')}
          >
            <i className="fas fa-hand mr-1"></i> Manual
          </button>
          <button 
            className={`flex-1 rounded-full text-xs flex items-center justify-center transition-all ${mode === 'auto' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}
            onClick={() => handleModeChange('auto')}
          >
            <i className="fas fa-robot mr-1"></i> Auto
          </button>
        </div>

        {/* Power button - minimalist design, high contrast */}
        <button
          className={`w-full p-2 rounded-lg flex items-center justify-center transition-all ${isOn 
            ? 'bg-gradient-to-r ' + activeGradientClass + ' text-white shadow-lg border border-white/10' 
            : 'bg-gray-800 text-gray-400 border border-gray-700/50'} 
            ${mode === 'auto' ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'}`}
          onClick={() => handleDeviceToggle(!isOn)}
          disabled={mode === 'auto' || toggleMutation.isPending || (latestReading?.temperature === SENSOR_ERROR_VALUE)}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${isOn ? 'bg-white/20' : 'bg-gray-700'} flex items-center justify-center`}>
              <i className="fas fa-power-off"></i>
            </div>
            <span className="text-sm font-medium">
              {isOn ? 'DESLIGAR' : 'LIGAR'}
            </span>
          </div>
        </button>

        {toggleMutation.isPending && (
          <div className="text-xs text-center mt-2 text-gray-400">
            <i className="fas fa-circle-notch fa-spin mr-1"></i> Atualizando...
          </div>
        )}
      </div>
    </div>
  );
}