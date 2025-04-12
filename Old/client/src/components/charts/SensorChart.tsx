import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SensorChartProps {
  data: Array<{ value: number; timestamp: string }>;
  minValue?: number;
  maxValue?: number;
  unit: string;
  color: string;
  decimals?: number;
}

export function SensorChart({ 
  data, 
  minValue, 
  maxValue, 
  unit, 
  color, 
  decimals = 1 
}: SensorChartProps) {
  const [formattedData, setFormattedData] = useState<any[]>([]);

  useEffect(() => {
    if (!data) return;
    
    const formatted = data.map(item => ({
      value: item.value,
      time: new Date(item.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
    
    setFormattedData(formatted);
  }, [data]);

  // Definir domínio do eixo Y com base nos valores min e max, se fornecidos
  const getYDomain = () => {
    if (minValue !== undefined && maxValue !== undefined) {
      // Adicionar margens para melhor visualização
      const range = maxValue - minValue;
      const padding = range * 0.2; // 20% de padding
      
      return [
        Math.max(0, minValue - padding), // Não permitir valores negativos para sensores como nível
        maxValue + padding
      ];
    }
    return undefined; // Deixar o Recharts calcular automaticamente
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
          />
          <YAxis 
            domain={getYDomain()} 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            tickFormatter={(value) => `${value.toFixed(decimals)}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value.toFixed(decimals)} ${unit}`, '']}
            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          />
          
          {/* Linhas de referência para valores mínimos e máximos */}
          {minValue !== undefined && (
            <ReferenceLine 
              y={minValue} 
              stroke="rgba(59, 130, 246, 0.7)" 
              strokeDasharray="3 3"
              label={{ 
                value: `Min: ${minValue.toFixed(decimals)}`, 
                fill: 'rgba(59, 130, 246, 0.9)',
                position: 'insideBottomLeft'
              }} 
            />
          )}
          
          {maxValue !== undefined && (
            <ReferenceLine 
              y={maxValue} 
              stroke="rgba(249, 115, 22, 0.7)" 
              strokeDasharray="3 3"
              label={{ 
                value: `Max: ${maxValue.toFixed(decimals)}`, 
                fill: 'rgba(249, 115, 22, 0.9)',
                position: 'insideTopLeft'
              }} 
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={{ stroke: color, strokeWidth: 2, r: 4, fill: 'rgba(0,0,0,0.8)' }}
            activeDot={{ stroke: 'white', strokeWidth: 2, r: 6, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}