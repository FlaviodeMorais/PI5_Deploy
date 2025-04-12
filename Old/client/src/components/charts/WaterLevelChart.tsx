import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatTime, formatDateTime } from '@/lib/utils';
import { waterLevelChartConfig } from '@/lib/chartConfig';
import { Reading } from '@shared/schema';

interface WaterLevelChartProps {
  readings: Reading[];
  setpoints: {
    min: number;
    max: number;
  };
  title?: string;
  isHistorical?: boolean;
  is24HourScale?: boolean;
}

export function WaterLevelChart({ 
  readings, 
  setpoints, 
  title = 'Nível da Água',
  isHistorical = false,
  is24HourScale = false
}: WaterLevelChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const chartId = useRef<string>(`water-chart-${Math.random().toString(36).substring(2, 9)}`);

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
        const chartConfig = JSON.parse(JSON.stringify(waterLevelChartConfig)); // Clone profundo para evitar problemas de referência
        
        // Definir título (não mostrar se estiver usando escala de 24 horas - é mostrado no cabeçalho)
        if (chartConfig.options && chartConfig.options.plugins && chartConfig.options.plugins.title) {
          chartConfig.options.plugins.title.text = is24HourScale ? '' : title;
          chartConfig.options.plugins.title.display = !is24HourScale;
        }
        
        // Formatar etiquetas com base no tipo de exibição (histórico ou tempo real)
        const labels = readings.map(reading => {
          const date = new Date(reading.timestamp);
          return isHistorical ? formatDateTime(date) : formatTime(date);
        });
        
        // Obter valores de nível
        const levels = readings.map(reading => reading.level);
        
        // Criar linhas de setpoint - garantir que são valores numéricos válidos
        const minSetpoints = new Array(readings.length).fill(setpoints.min || 60);
        const maxSetpoints = new Array(readings.length).fill(setpoints.max || 85);
        
        // Atualizar dados do gráfico
        chartConfig.data.labels = labels;
        chartConfig.data.datasets[0].data = levels;
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
        console.error("Erro ao renderizar gráfico de nível da água:", error);
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
