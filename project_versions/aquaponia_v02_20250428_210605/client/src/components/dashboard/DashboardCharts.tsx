import { RechartsTemperatureChart } from "@/components/charts/RechartsTemperatureChart";
import { RechartsWaterLevelChart } from "@/components/charts/RechartsWaterLevelChart";
import { ReadingsResponse } from "@/lib/thingspeakApi";
import { formatNumber, formatTime } from "@/lib/utils";

interface DashboardChartsProps {
  data?: ReadingsResponse;
  isLoading: boolean;
  is24HourScale?: boolean;
}

export function DashboardCharts({ 
  data, 
  isLoading, 
  is24HourScale = false
}: DashboardChartsProps) {
  // Determinar se há dados suficientes e obter a data mais recente para o título
  const hasData = data && data.readings && data.readings.length > 0;
  const lastUpdate = hasData 
    ? new Date(data.readings[data.readings.length - 1].timestamp)
    : new Date();

  // Calcular o período mostrado para exibir como subtítulo
  const getTimeRangeLabel = () => {
    if (!hasData || data.readings.length < 2) return "Período: N/A";
    
    const firstReading = new Date(data.readings[0].timestamp);
    const lastReading = new Date(data.readings[data.readings.length - 1].timestamp);
    
    return `Período: ${formatTime(firstReading)} - ${formatTime(lastReading)}`;
  };
  
  // Calcular min/max para temperatura e nível
  const calcTempMinMax = () => {
    if (!hasData || data.readings.length < 2) return { min: 0, max: 0 };
    
    // Filtra valores válidos (não zero)
    const validTemps = data.readings
      .map(reading => reading.temperature)
      .filter(temp => temp > 0);
    
    if (validTemps.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...validTemps),
      max: Math.max(...validTemps)
    };
  };
  
  const calcLevelMinMax = () => {
    if (!hasData || data.readings.length < 2) return { min: 0, max: 0 };
    
    // Filtra valores válidos (não zero)
    const validLevels = data.readings
      .map(reading => reading.level)
      .filter(level => level > 0);
    
    if (validLevels.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...validLevels),
      max: Math.max(...validLevels)
    };
  };
  
  // Calcula estatísticas dos dados
  const tempStats = calcTempMinMax();
  const levelStats = calcLevelMinMax();

  return (
    <div className="px-6 mb-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Temperature Chart */}
        <div className="card-aquaponia transition-all duration-300 hover:translate-y-[-3px]">
          <div className="card-aquaponia-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#4191ff] to-[#3163ad] flex items-center justify-center text-lg sm:text-xl glow-effect">
                <i className="fas fa-temperature-high text-white"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-light">Temperatura</h3>
            </div>
            {hasData && (
              <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="bg-black/20 px-2 py-1 rounded-md">
                  <span className="text-white/60">Min</span>
                  <span className="ml-1 text-blue-400">{formatNumber(tempStats.min)}°C</span>
                </div>
                <div className="bg-black/20 px-2 py-1 rounded-md">
                  <span className="text-white/60">Max</span>
                  <span className="ml-1 text-red-400">{formatNumber(tempStats.max)}°C</span>
                </div>
              </div>
            )}
          </div>
          <div className="card-aquaponia-content">
            {is24HourScale && (
              <div className="text-xs text-white/60 mb-4 bg-white/5 px-3 py-2 rounded-md inline-block">
                {getTimeRangeLabel()}
              </div>
            )}
            
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center bg-black/10 rounded-lg">
                <div className="flex flex-col items-center">
                  <i className="fas fa-circle-notch fa-spin text-2xl text-blue-400 mb-3"></i>
                  <span className="text-white/70 font-light">Carregando dados...</span>
                </div>
              </div>
            ) : data && data.readings ? (
              <RechartsTemperatureChart 
                readings={data.readings} 
                setpoints={data.setpoints.temp}
                title="Temperatura"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-black/10 rounded-lg">
                <span className="text-white/70 font-light">Nenhum dado disponível</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Water Level Chart */}
        <div className="card-aquaponia transition-all duration-300 hover:translate-y-[-3px]">
          <div className="card-aquaponia-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-lg sm:text-xl glow-effect">
                <i className="fas fa-water text-white"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-light">Nível da Água</h3>
            </div>
            {hasData && (
              <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="bg-black/20 px-2 py-1 rounded-md">
                  <span className="text-white/60">Min</span>
                  <span className="ml-1 text-blue-400">{formatNumber(levelStats.min)}%</span>
                </div>
                <div className="bg-black/20 px-2 py-1 rounded-md">
                  <span className="text-white/60">Max</span>
                  <span className="ml-1 text-cyan-400">{formatNumber(levelStats.max)}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="card-aquaponia-content">
            {is24HourScale && (
              <div className="text-xs text-white/60 mb-4 bg-white/5 px-3 py-2 rounded-md inline-block">
                {getTimeRangeLabel()}
              </div>
            )}
            
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center bg-black/10 rounded-lg">
                <div className="flex flex-col items-center">
                  <i className="fas fa-circle-notch fa-spin text-2xl text-blue-400 mb-3"></i>
                  <span className="text-white/70 font-light">Carregando dados...</span>
                </div>
              </div>
            ) : data && data.readings ? (
              <RechartsWaterLevelChart 
                readings={data.readings} 
                setpoints={data.setpoints.level}
                title="Nível da Água"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-black/10 rounded-lg">
                <span className="text-white/70 font-light">Nenhum dado disponível</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}