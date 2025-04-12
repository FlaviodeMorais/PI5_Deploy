import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatTime, formatDateTime } from '@/lib/utils';
import { temperatureChartConfig } from '@/lib/chartConfig';
import { Reading } from '@shared/schema';

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
  is24HourScale?: boolean;
}

export function TemperatureChart({ 
  readings, 
  setpoints, 
  title = 'Variação de Temperatura',
  isHistorical = false,
  is24HourScale = false
}: TemperatureChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const chartId = useRef<string>(`temp-chart-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // Garantir que temos leituras e setpoints válidos
    if (!readings || readings.length === 0 || !setpoints) {
      return;
    }

    // Função para criar ou atualizar o gráfico
    const updateChart = () => {
      if (!chartRef.current) return;

      try {
        // Se o gráfico já existe, destrua-o primeiro
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }

        // Garanta que o canvas está limpo
        const canvas = chartRef.current;
        canvas.id = chartId.current;

        // Crie um novo contexto
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Preparar configuração
        const chartConfig = JSON.parse(JSON.stringify(temperatureChartConfig)); // Clone profundo para evitar problemas de referência
        
        // Definir título (não mostrar se estiver usando escala de 24 horas - é mostrado no cabeçalho)
        if (chartConfig.options && chartConfig.options.plugins && chartConfig.options.plugins.title) {
          chartConfig.options.plugins.title.text = is24HourScale ? '' : title;
          chartConfig.options.plugins.title.display = !is24HourScale;
        }
        
        // Filtrar leituras que têm valores de erro (-127)
        const filteredReadings = is24HourScale 
          ? readings 
          : readings.filter(r => r.temperature !== SENSOR_ERROR_VALUE);
        
        // Formatar etiquetas com base no tipo de exibição (histórico ou tempo real)
        const labels = filteredReadings.map(reading => {
          const date = new Date(reading.timestamp);
          return isHistorical ? formatDateTime(date) : formatTime(date);
        });
        
        // Obter valores de temperatura
        const temperatures = filteredReadings.map(reading => {
          return reading.temperature;
        });
        
        // Criar linhas de setpoint - garantir que são valores numéricos válidos
        const minSetpoints = new Array(filteredReadings.length).fill(setpoints.min || 20);
        const maxSetpoints = new Array(filteredReadings.length).fill(setpoints.max || 28);
        
        // Atualizar dados do gráfico
        chartConfig.data.labels = labels;
        chartConfig.data.datasets[0].data = temperatures;
        chartConfig.data.datasets[1].data = minSetpoints;
        chartConfig.data.datasets[2].data = maxSetpoints;
        
        // Se estiver usando escala de 24 horas, ajustar configurações de tempo e escala
        if (is24HourScale) {
          // Ajustar configuração de eixos para escala de 24 horas
          if (chartConfig.options && chartConfig.options.scales && chartConfig.options.scales.x) {
            chartConfig.options.scales.x.ticks = {
              ...chartConfig.options.scales.x.ticks,
              maxTicksLimit: 12, // Limita o número de marcas de tempo no eixo X
              callback: function(value: any, index: number) {
                // Mostrar apenas algumas horas para não sobrecarregar o eixo
                if (index % 2 === 0 || index === labels.length - 1) {
                  return labels[index];
                }
                return '';
              }
            };
          }
        }
        
        // Criar gráfico
        chartInstance.current = new Chart(ctx, chartConfig);
      } catch (error) {
        console.error("Erro ao renderizar gráfico de temperatura:", error);
      }
    };

    // Criar/atualizar o gráfico
    updateChart();
    
    // Limpar ao desmontar
    return () => {
      try {
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }
      } catch (error) {
        console.error("Erro ao destruir gráfico:", error);
      }
    };
  }, [readings, setpoints, title, isHistorical, is24HourScale]);

  return (
    <div className="h-[300px] relative">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
