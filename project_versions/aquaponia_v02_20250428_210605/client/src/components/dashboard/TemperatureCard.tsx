import React from 'react';
import { Reading } from '@shared/schema';
import { Skeleton } from "@/components/ui/skeleton";
import { TemperatureGauge } from './TemperatureGauge';
import { formatNumber } from '@/lib/utils';

interface TemperatureCardProps {
  latestReading?: Reading;
  isLoading: boolean;
  minTemp?: number;
  maxTemp?: number;
}

export function TemperatureCard({ 
  latestReading, 
  isLoading, 
  minTemp = 24, 
  maxTemp = 28
}: TemperatureCardProps) {
  // Temperatura atual para exibição
  const temperature = latestReading?.temperature || 0;
  
  // Determinar a cor do texto baseado na temperatura
  const getTextColor = () => {
    if (temperature < minTemp) return 'text-blue-400 glow-text'; // Azul para baixo
    if (temperature > maxTemp) return 'text-red-400 glow-text'; // Vermelho para alto
    return 'text-green-400 glow-text'; // Verde para ok
  };
  
  return (
    <div className="monitor-card p-5 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4191ff] to-[#3163ad] flex items-center justify-center text-xl glow-effect">
          <i className="fas fa-thermometer-half text-white"></i>
        </div>
        <div className="flex-1">
          <h4 className="text-white/70 text-sm font-light">Temperatura</h4>
          <div className="text-sm font-light text-green-400">
            {isLoading ? 'Carregando...' : 'Monitorando'}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col">
        {isLoading ? (
          <Skeleton className="h-24 w-full bg-gray-800" />
        ) : (
          <TemperatureGauge 
            temperature={temperature}
            minTemp={minTemp}
            maxTemp={maxTemp}
          />
        )}
      </div>
    </div>
  );
}