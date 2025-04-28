import React from 'react';
import GaugeChart from 'react-gauge-chart';
import { formatNumber } from '@/lib/utils';

interface TemperatureGaugeProps {
  temperature: number;
  minTemp: number;
  maxTemp: number;
}

export function TemperatureGauge({ temperature, minTemp, maxTemp }: TemperatureGaugeProps) {
  // Normalizar o valor da temperatura para o range [0,1] para o gauge
  const tempRange = maxTemp - minTemp;
  // Garantir que não dividimos por zero
  const normalizedValue = tempRange > 0 
    ? Math.min(Math.max((temperature - minTemp) / tempRange, 0), 1) 
    : 0.5;
  
  // Cores para os segmentos do gauge (azul -> verde -> vermelho)
  // Cores vibrantes em modo escuro para os segmentos do gauge
  const colors = ['#60a5fa', '#4ade80', '#f87171'];
  
  // Ajustar valor da temperatura para garantir que não é negativo
  const displayTemp = isNaN(temperature) || temperature === null ? 0 : temperature;
  
  // Determinar a cor do texto baseado na temperatura
  const getTextColor = () => {
    if (temperature < minTemp) return 'text-blue-400 glow-text'; // Azul para baixo
    if (temperature > maxTemp) return 'text-red-400 glow-text'; // Vermelho para alto
    return 'text-green-400 glow-text'; // Verde para ok
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <GaugeChart 
        id="temperature-gauge"
        nrOfLevels={3}
        colors={colors}
        arcWidth={0.35}
        percent={normalizedValue}
        needleColor={'#e2e8f0'}
        needleBaseColor={'#94a3b8'}
        hideText={true}
        animate={true}
        animateDuration={800}
        cornerRadius={5}
        className="w-full"
      />
      {/* Temperatura atual com valor grande e os limites em tamanho menor */}
      <div className="flex flex-col items-center -mt-4">
        <div className={`text-4xl font-light ${getTextColor()}`}>
          {formatNumber(displayTemp)}°C
        </div>
        <div className="flex justify-between w-full px-6 text-xs text-white/60 mt-2">
          <span className="bg-black/20 px-2 py-1 rounded-md">{formatNumber(minTemp)}°C</span>
          <span className="bg-black/20 px-2 py-1 rounded-md">{formatNumber(maxTemp)}°C</span>
        </div>
      </div>
    </div>
  );
}