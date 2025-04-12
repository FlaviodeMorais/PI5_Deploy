import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getHistoricalReadings, 
  HistoricalReadingsResponse 
} from '@/lib/thingspeakApi';
import { RechartsTemperatureChart } from '@/components/charts/RechartsTemperatureChart';
import { RechartsWaterLevelChart } from '@/components/charts/RechartsWaterLevelChart';
import { formatNumber, formatDateForQuery } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function HistoricalData() {
  const today = new Date();
  const [days, setDays] = useState<number>(7);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calcular as datas com base no número de dias selecionado
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query para dados do banco de dados local
  const { data: dbData, isLoading: isDbLoading } = useQuery<HistoricalReadingsResponse>({
    queryKey: ['/api/readings/history', days],
    queryFn: () => {
      // Ajustar a data final para incluir o último momento do dia
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      return getHistoricalReadings(
        formatDateForQuery(startDate), 
        formatDateForQuery(adjustedEndDate)
      );
    },
    // Evitar tentativas automáticas de recarregar que podem causar problemas
    retry: false,
    // Atualizar a cada 5 minutos como padrão
    refetchInterval: 300000, // Atualizar a cada 5 minutos (300,000ms)
    // Evitar manter dados antigos em cache que possam causar problemas de renderização
    staleTime: 240000 // Considerar os dados obsoletos após 4 minutos
  });

  // Proteção adicional para garantir que não tentamos renderizar dados inválidos
  const processedData = (() => {
    try {
      // Verificar se os dados do banco são válidos e completos
      // Limitamos a 100 leituras para evitar sobrecarga no navegador
      if (dbData && dbData.readings && dbData.setpoints && dbData.stats) {
        // Limitar a quantidade de dados para renderização
        const limitedReadings = dbData.readings.slice(0, 100);
        
        // Corrigir as estatísticas para garantir que estão dentro dos limites
        const correctedStats = {
          ...dbData.stats,
          level: {
            ...dbData.stats.level,
            min: Math.max(0, dbData.stats.level.min),
            max: Math.min(100, dbData.stats.level.max),
            avg: Math.min(Math.max(dbData.stats.level.avg, 0), 100)
          }
        };
        
        return {
          ...dbData,
          readings: limitedReadings,
          stats: correctedStats
        };
      }
      return undefined;
    } catch (error) {
      console.error("Erro ao processar dados ativos:", error);
      return undefined;
    }
  })();

  // Mutation para buscar dados históricos do banco de dados
  const databaseHistoricalReadingsMutation = useMutation({
    mutationFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const formattedStartDate = formatDateForQuery(startDate);
      const formattedEndDate = formatDateForQuery(endDate);

      console.log(`Buscando dados do banco de ${days} dias atrás:`, formattedStartDate, "até", formattedEndDate);

      return getHistoricalReadings(formattedStartDate, formattedEndDate);
    },
    onSuccess: (data) => {
      toast({
        title: "Dados carregados com sucesso",
        description: `${data.readings.length} registros recuperados do banco local.`,
      });

      queryClient.setQueryData(['/api/readings/history', days], data);
    },
    onError: (error) => {
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar os dados do banco local.",
        variant: "destructive",
      });
      console.error("Erro ao carregar dados históricos:", error);
    }
  });

  const handleLoadData = () => {
    toast({
      title: "Buscando dados",
      description: `Buscando leituras para o período de ${days} dias...`,
      duration: 3000
    });

    databaseHistoricalReadingsMutation.mutate();
  };

  return (
    <div className="mb-8 px-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#0369a1] to-[#075985] flex items-center justify-center text-sm sm:text-lg glow-effect">
          <i className="fas fa-chart-bar text-white"></i>
        </div>
        <h2 className="text-xl sm:text-2xl font-light text-white">Análise de Dados Históricos</h2>
      </div>

      <div className="bg-[#0f172a] p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8 border border-white/5">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">Configuração da Análise</h3>

        <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
          <div className="w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium mb-1 block text-gray-300">
              Dias de Histórico
            </label>
            <select 
              className="flex h-9 sm:h-10 w-full rounded-md border border-white/5 bg-[#1e293b] px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
            >
              <option value="1">1 dia</option>
              <option value="5">5 dias</option>
              <option value="10">10 dias</option>
              <option value="15">15 dias</option>
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>

          <Button 
            onClick={handleLoadData}
            disabled={isDbLoading || databaseHistoricalReadingsMutation.isPending}
            className="mt-3 sm:mt-0 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
          >
            {databaseHistoricalReadingsMutation.isPending ? (
              <span className="flex items-center gap-1 sm:gap-2">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Carregando...</span>
              </span>
            ) : (
              'Carregar Dados'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        {/* Temperature History Chart */}
        <div className="bg-[#0f172a] rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 border border-white/5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/5">
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <i className="fas fa-chart-line text-[#5090d3]"></i>
              Histórico de Temperatura
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#4caf50]"></span>
                <span className="text-xs text-gray-300">Dentro do limite</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#ef5350]"></span>
                <span className="text-xs text-gray-300">Fora do limite</span>
              </div>
            </div>
          </div>

          {isDbLoading || databaseHistoricalReadingsMutation.isPending ? (
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
              <span className="text-base sm:text-lg flex items-center gap-2">
                <i className="fas fa-circle-notch fa-spin"></i>
                Carregando dados...
              </span>
            </div>
          ) : processedData && processedData.readings ? (
            <RechartsTemperatureChart 
              readings={processedData.readings} 
              setpoints={processedData.setpoints.temp}
              title="Histórico de Temperatura"
              isHistorical={true}
            />
          ) : (
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
              <span className="text-base sm:text-lg flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-400"></i>
                Nenhum dado disponível para o período selecionado
              </span>
            </div>
          )}

          {/* Temperature Statistics */}
          {processedData && processedData.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Média</p>
                <p className="text-base sm:text-xl font-semibold">{formatNumber(processedData.stats.temperature.avg).toFixed(2)}°C</p>
              </div>
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Mínima</p>
                <p className="text-base sm:text-xl font-semibold">{formatNumber(processedData.stats.temperature.min).toFixed(2)}°C</p>
              </div>
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Máxima</p>
                <p className="text-base sm:text-xl font-semibold">{formatNumber(processedData.stats.temperature.max).toFixed(2)}°C</p>
              </div>
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Desvio Padrão</p>
                <p className="text-base sm:text-xl font-semibold">±{(formatNumber(processedData.stats.temperature.stdDev || 0)).toFixed(2)}°C</p>
              </div>
            </div>
          )}
        </div>

        {/* Water Level History Chart */}
        <div className="bg-[#0f172a] rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 border border-white/5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/5">
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <i className="fas fa-chart-line text-[#5090d3]"></i>
              Histórico do Nível da Água
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#4caf50]"></span>
                <span className="text-xs text-gray-300">Dentro do limite</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#ef5350]"></span>
                <span className="text-xs text-gray-300">Fora do limite</span>
              </div>
            </div>
          </div>

          {isDbLoading || databaseHistoricalReadingsMutation.isPending ? (
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
              <span className="text-base sm:text-lg flex items-center gap-2">
                <i className="fas fa-circle-notch fa-spin"></i>
                Carregando dados...
              </span>
            </div>
          ) : processedData && processedData.readings ? (
            <RechartsWaterLevelChart 
              readings={processedData.readings} 
              setpoints={processedData.setpoints.level}
              title="Histórico do Nível da Água"
              isHistorical={true}
            />
          ) : (
            <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
              <span className="text-base sm:text-lg flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-400"></i>
                Nenhum dado disponível para o período selecionado
              </span>
            </div>
          )}

          {/* Water Level Statistics */}
          {processedData && processedData.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Média</p>
                <p className="text-base sm:text-xl font-semibold">{formatNumber(processedData.stats.level.avg).toFixed(2)}%</p>
              </div>
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Mínima</p>
                <p className="text-base sm:text-xl font-semibold">{formatNumber(processedData.stats.level.min).toFixed(2)}%</p>
              </div>
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Máxima</p>
                <p className="text-base sm:text-xl font-semibold">{formatNumber(processedData.stats.level.max).toFixed(2)}%</p>
              </div>
              <div className="bg-[#0f172a] border border-white/5 p-3 sm:p-4 rounded-md">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Desvio Padrão</p>
                <p className="text-base sm:text-xl font-semibold">±{(formatNumber(processedData.stats.level.stdDev || 0)).toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}