import React from 'react';
import { formatNumber } from '@/lib/utils';

interface TemperatureSliderProps {
  temperature: number;
  minTemp?: number;
  maxTemp?: number;
}

export function TemperatureSlider({ 
  temperature,
  minTemp = 15,
  maxTemp = 40
}: TemperatureSliderProps) {
  // Normalizar o valor da temperatura para calcular a posição do indicador
  const range = maxTemp - minTemp;
  const percentage = Math.min(Math.max((temperature - minTemp) / range, 0), 1) * 100;
  
  // Determinar a cor do texto baseado na temperatura
  const getTextColor = () => {
    if (temperature < 25) return 'text-blue-400'; // Frio
    if (temperature > 35) return 'text-red-400'; // Quente
    return 'text-white'; // Normal
  };

  return (
    <div className="rounded-lg bg-[#0f172a] p-5 text-white">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          </svg>
        </div>
        <span className="text-lg font-medium">Temperatura do Ar</span>
      </div>
      
      <div className="mt-6 space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Valor Atual:</span>
          <span className={`text-5xl font-light ${getTextColor()}`}>
            {formatNumber(temperature)} <span className="text-2xl">°C</span>
          </span>
        </div>
        
        <div className="relative w-full h-8 mt-4">
          {/* Barra de fundo com gradiente */}
          <div className="absolute w-full h-2 bg-gradient-to-r from-blue-600 via-green-500 to-red-600 rounded-full top-3"></div>
          
          {/* Indicador (bolinha) */}
          <div 
            className="absolute w-8 h-8 bg-indigo-600 rounded-full -mt-3 flex items-center justify-center shadow-lg shadow-indigo-500/50 z-10"
            style={{ left: `calc(${percentage}% - 16px)` }} // 16px é metade da largura para centralizar
          >
            <span className="text-white text-xs font-bold">
              {Math.round(temperature)}
            </span>
          </div>
          
          {/* Marcas de temperatura */}
          <div className="absolute top-6 left-0 w-full flex justify-between mt-3 text-xs text-gray-400">
            <span>{minTemp}°C</span>
            <span>{Math.round(minTemp + range * 0.33)}°C</span>
            <span>{Math.round(minTemp + range * 0.67)}°C</span>
            <span>{maxTemp}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}