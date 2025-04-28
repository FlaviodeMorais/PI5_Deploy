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

// Constante para o valor de erro do sensor
const SENSOR_ERROR_VALUE = -127;

interface TemperatureChartProps {
  readings: Reading[];
  setpoints: {
    min: number;
    max: number;
  };
  title?: string;
  isHistorical?: boolean;
}

export function RechartsTemperatureChart({ 
  readings, 
  setpoints, 
  title = 'Variação de Temperatura',
  isHistorical = false 
}: TemperatureChartProps) {
  
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
      temperatura: reading.temperature === SENSOR_ERROR_VALUE ? null : reading.temperature,
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
            if (entry.name === 'temperatura' && entry.value !== null) {
              return (
                <p key={index} className="text-[#6C5DD3] font-semibold">
                  {`Temperatura: ${entry.value}°C`}
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

  const getMinYAxis = () => {
    const minValue = Math.min(...readings
      .filter(r => r.temperature !== SENSOR_ERROR_VALUE)
      .map(r => r.temperature));
    return Math.max(0, Math.floor(minValue) - 2);
  };

  const getMaxYAxis = () => {
    const maxValue = Math.max(...readings
      .filter(r => r.temperature !== SENSOR_ERROR_VALUE)
      .map(r => r.temperature));
    return Math.ceil(maxValue) + 2;
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
            <linearGradient id="colorTemperature" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6C5DD3" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6C5DD3" stopOpacity={0} />
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
            domain={[getMinYAxis(), getMaxYAxis()]}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            unit="°C"
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
              value: `Min: ${setpoints.min}°C`, 
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
              value: `Max: ${setpoints.max}°C`, 
              position: 'insideTopRight',
              fill: '#2ecc71',
              fontSize: 11
            }} 
          />
          
          <Area
            type="monotone"
            dataKey="temperatura"
            name="Temperatura"
            stroke="#6C5DD3"
            fillOpacity={1}
            fill="url(#colorTemperature)"
            strokeWidth={3}
            connectNulls={true}
            activeDot={{ r: 6, stroke: '#6C5DD3', strokeWidth: 1, fill: '#8677D9' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}