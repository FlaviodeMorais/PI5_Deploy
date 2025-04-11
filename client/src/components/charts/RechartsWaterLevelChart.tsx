import { formatTime, formatDateTime } from '@/lib/utils';
import { Reading } from '@shared/schema';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';

interface WaterLevelChartProps {
  readings: Reading[];
  setpoints: {
    min: number;
    max: number;
  };
  title?: string;
  isHistorical?: boolean;
}

export function RechartsWaterLevelChart({ 
  readings, 
  setpoints, 
  title = 'Nível da Água',
  isHistorical = false 
}: WaterLevelChartProps) {
  
  // Garantir que temos leituras e setpoints válidos
  if (!readings || readings.length === 0 || !setpoints) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <span className="text-lg text-gray-400">Dados insuficientes para exibir o gráfico</span>
      </div>
    );
  }

  // Formatar dados para o Recharts
  const chartData = readings.map(reading => {
    const date = new Date(reading.timestamp);
    return {
      name: isHistorical ? formatDateTime(date) : formatTime(date),
      nivel: reading.level,
      min: setpoints.min,
      max: setpoints.max,
      timestamp: reading.timestamp
    };
  });

  // Personalização do tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-[#132f4c] p-3 rounded shadow-lg border border-[#2c4564]">
          <p className="text-sm text-gray-300 mb-1">{`${label}`}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.name === 'nivel') {
              return (
                <p key={index} className="text-[#00B5D8] font-semibold">
                  {`Nível: ${entry.value}%`}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00B5D8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00B5D8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="#8a94a7" 
            fontSize={11}
            tickMargin={10}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          <YAxis 
            stroke="#8a94a7" 
            fontSize={11}
            tickMargin={10}
            domain={[0, 100]} 
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            unit="%"
            ticks={[0, 20, 40, 60, 80, 100]} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          
          {/* Linhas de referência para os limites */}
          <ReferenceLine 
            y={setpoints.min} 
            stroke="#e74c3c" 
            strokeWidth={2}
            strokeDasharray="5 5" 
            label={{ 
              value: `Min: ${setpoints.min}%`, 
              position: 'insideBottomRight',
              fill: '#e74c3c',
              fontSize: 11
            }} 
          />
          <ReferenceLine 
            y={setpoints.max} 
            stroke="#2ecc71" 
            strokeWidth={2}
            strokeDasharray="5 5" 
            label={{ 
              value: `Max: ${setpoints.max}%`, 
              position: 'insideTopRight',
              fill: '#2ecc71',
              fontSize: 11
            }} 
          />
          
          <Area
            type="monotone"
            dataKey="nivel"
            name="Nível da Água"
            stroke="#00B5D8"
            fillOpacity={1}
            fill="url(#colorLevel)"
            strokeWidth={3}
            activeDot={{ r: 6, stroke: '#00B5D8', strokeWidth: 1, fill: '#44C7E4' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}