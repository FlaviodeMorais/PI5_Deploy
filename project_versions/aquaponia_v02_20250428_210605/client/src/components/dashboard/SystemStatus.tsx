import { useEffect, useState } from 'react';
import { formatDateTime, calculateUptimeDays } from '@/lib/utils';
import { Reading } from '@shared/schema';
import { getSystemUptime } from '@/lib/thingspeakApi';

// Constante para o valor de erro do sensor
const SENSOR_ERROR_VALUE = -127;

interface SystemStatusProps {
  latestReading?: Reading;
  isLoading: boolean;
}

export function SystemStatus({ latestReading, isLoading }: SystemStatusProps) {
  const [uptime, setUptime] = useState<string>('0 dias');
  const [lastReadingTime, setLastReadingTime] = useState<string>('-');
  const [connectionStatus, setConnectionStatus] = useState<'stable' | 'unstable' | 'disconnected'>('stable');
  const [isLoadingUptime, setIsLoadingUptime] = useState<boolean>(true);

  // Buscar o uptime do sistema a partir da primeira leitura
  useEffect(() => {
    async function fetchSystemUptime() {
      try {
        setIsLoadingUptime(true);
        const response = await getSystemUptime();
        
        if (response.success && response.firstReadingDate) {
          const firstReadingDate = new Date(response.firstReadingDate);
          const days = calculateUptimeDays(firstReadingDate);
          setUptime(`${days} dias`);
        } else {
          setUptime('N/D');
        }
      } catch (error) {
        console.error('Failed to fetch system uptime:', error);
        setUptime('N/D');
      } finally {
        setIsLoadingUptime(false);
      }
    }
    
    fetchSystemUptime();
  }, []);

  // Update last reading time when latestReading changes
  useEffect(() => {
    if (latestReading) {
      setLastReadingTime(formatDateTime(new Date(latestReading.timestamp)));
      
      // Se a temperatura for o valor de erro do sensor, marcar a conexão como instável
      if (latestReading.temperature === SENSOR_ERROR_VALUE) {
        setConnectionStatus('unstable');
      } else {
        setConnectionStatus('stable');
      }
    } else if (!isLoading) {
      setConnectionStatus('disconnected');
    }
  }, [latestReading, isLoading]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center text-lg glow-effect">
          <i className="fas fa-microchip text-white"></i>
        </div>
        <div className="flex-1">
          <h4 className="text-white/70 text-sm font-light mb-1">Status do Sistema</h4>
          <div className={`text-sm font-light ${
            isLoading 
              ? 'text-yellow-400 glow-text' 
              : 'text-green-400 glow-text'
          }`}>
            {isLoading ? 'Carregando...' : 'Ativo'}
          </div>
          <span className="text-xs mt-1 inline-block font-light bg-white/5 px-2 py-1 rounded-md text-white/80 border border-white/10">
            {isLoadingUptime ? 'Calculando uptime...' : `Online há ${uptime}`}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 font-light">
        <div className="flex items-center justify-between p-2 bg-black/20 rounded-md">
          <span className="text-white/70 text-xs">Última leitura</span>
          <span className="text-white text-xs">{lastReadingTime}</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-black/20 rounded-md">
          <span className="text-white/70 text-xs">Conexão ThingSpeak</span>
          <span className="flex items-center gap-2 text-xs">
            <i className={`fas fa-circle ${
              connectionStatus === 'stable' 
                ? 'text-green-400 glow-text' 
                : connectionStatus === 'unstable' 
                  ? 'text-yellow-400 glow-text' 
                  : 'text-red-400 glow-text'
            }`}></i>
            <span className={
              connectionStatus === 'stable' 
                ? 'text-green-400' 
                : connectionStatus === 'unstable' 
                  ? 'text-yellow-400' 
                  : 'text-red-400'
            }>
              {connectionStatus === 'stable' 
                ? 'Estável' 
                : connectionStatus === 'unstable' 
                  ? 'Instável' 
                  : 'Desconectado'}
            </span>
          </span>
        </div>
        
        {/* Alerta de erro do sensor */}
        {latestReading && latestReading.temperature === SENSOR_ERROR_VALUE && (
          <div className="mt-2 bg-red-500/20 rounded-md p-3 text-xs text-red-300 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-exclamation-triangle text-red-400 glow-text"></i>
              <strong className="text-red-300">Erro de leitura do sensor</strong>
            </div>
            <p className="text-white/80">Sensor de temperatura reportando erro (-127°C). Verifique a conexão física do sensor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

