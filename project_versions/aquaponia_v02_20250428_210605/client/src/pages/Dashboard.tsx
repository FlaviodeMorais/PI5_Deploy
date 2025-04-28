import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLatestReadings, getHistoricalReadings } from "@/lib/thingspeakApi";
import { EquipmentControls } from "@/components/dashboard/EquipmentControls";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { HistoricalData } from "@/components/historical/HistoricalData";
import { formatDateForQuery } from "@/lib/utils";

export default function Dashboard() {
  // Calcular o período para mostrar exatamente as últimas 24 horas
  const getLastDay = () => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1); // Exatamente 24 horas atrás
    
    return {
      startDate: formatDateForQuery(startDate),
      endDate: formatDateForQuery(endDate)
    };
  };

  // Buscar leituras das últimas 24 horas do banco de dados local para performance
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/readings/history'],
    queryFn: () => {
      const { startDate, endDate } = getLastDay();
      return getHistoricalReadings(startDate, endDate); // Usa banco de dados local
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos conforme solicitado
    staleTime: 15000, // Dados são considerados atualizados por 15 segundos
  });

  // Get the latest reading
  const latestReading = data?.readings.length ? data.readings[data.readings.length - 1] : undefined;

  return (
    <div className="py-8 relative">
      {/* Área para conteúdo principal */}
      
      {/* Barra de status animada */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-900 via-blue-600 to-blue-900"
          style={{
            width: '100%',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3s infinite linear',
          }}
        />
      </div>
    
      {/* Equipment Controls Section */}
      <EquipmentControls 
        latestReading={latestReading} 
        isLoading={isLoading}
      />
      
      {/* Charts Section - cabeçalho */}
      <div className="px-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#4191ff] to-[#3163ad] flex items-center justify-center text-lg glow-effect">
            <i className="fas fa-chart-line text-white"></i>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-white">Dashboard de Monitoramento</h2>
        </div>
      </div>
      
      {/* Charts Section */}
      <DashboardCharts 
        data={data} 
        isLoading={isLoading}
        is24HourScale={true}
      />
      
      {/* Historical Data Section */}
      <HistoricalData />
    </div>
  );
}
