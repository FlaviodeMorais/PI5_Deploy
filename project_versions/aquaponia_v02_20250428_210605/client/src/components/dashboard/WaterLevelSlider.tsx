import React from 'react';
import { formatNumber } from '@/lib/utils';

interface WaterLevelSliderProps {
  level: number;
  minLevel?: number;
  maxLevel?: number;
}

export function WaterLevelSlider({ 
  level,
  minLevel = 0,
  maxLevel = 100
}: WaterLevelSliderProps) {
  // Normalizar o valor do nível da água para calcular a posição do indicador
  const range = maxLevel - minLevel;
  const percentage = Math.min(Math.max((level - minLevel) / range, 0), 1) * 100;
  
  // Determinar a cor do texto baseado no nível
  const getTextColor = () => {
    if (level < 20) return 'text-red-400'; // Nível crítico
    if (level < 40) return 'text-yellow-400'; // Nível baixo
    return 'text-blue-400'; // Nível normal/alto
  };

  return (
    <div className="rounded-lg bg-[#0f172a] p-5 text-white mt-4">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 2v6m0 0l-3-3m3 3l3-3" />
            <path d="M19 9A7 7 0 1 1 5 9c0 1.3.3 2.6.9 3.7L12 21l6.1-8.3c.6-1.1.9-2.4.9-3.7" />
          </svg>
        </div>
        <span className="text-lg font-medium">Nível da Água</span>
      </div>
      
      <div className="mt-6 space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Valor Atual:</span>
          <span className={`text-5xl font-light ${getTextColor()}`}>
            {formatNumber(level)} <span className="text-2xl">%</span>
          </span>
        </div>
        
        <div className="relative w-full h-8 mt-4">
          {/* Barra de fundo com gradiente */}
          <div className="absolute w-full h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 rounded-full top-3"></div>
          
          {/* Indicador (bolinha) */}
          <div 
            className="absolute w-8 h-8 bg-blue-600 rounded-full -mt-3 flex items-center justify-center shadow-lg shadow-blue-500/50 z-10"
            style={{ left: `calc(${percentage}% - 16px)` }} // 16px é metade da largura para centralizar
          >
            <span className="text-white text-xs font-bold">
              {Math.round(level)}
            </span>
          </div>
          
          {/* Marcas de nível */}
          <div className="absolute top-6 left-0 w-full flex justify-between mt-3 text-xs text-gray-400">
            <span>{minLevel}%</span>
            <span>{Math.round(minLevel + range * 0.33)}%</span>
            <span>{Math.round(minLevel + range * 0.67)}%</span>
            <span>{maxLevel}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}