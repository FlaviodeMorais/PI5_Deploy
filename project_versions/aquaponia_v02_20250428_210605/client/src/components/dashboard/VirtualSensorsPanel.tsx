import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VirtualSensorsResponse, getVirtualSensorsData } from "@/lib/thingspeakApi";
import { SensorChart } from "@/components/charts/SensorChart";
import { useToast } from "@/hooks/use-toast";

// Configurações para cada sensor virtual
const sensorConfig = {
  airTemp: { 
    label: 'Temperatura do Ar',
    unit: '°C',
    icon: 'fa-temperature-high',
    color: 'rgb(234, 88, 12)',
    gradient: 'from-[#f97316] to-[#c2410c]',
    minValue: 15,
    maxValue: 35,
    decimals: 1
  },
  waterTemp: { 
    label: 'Temperatura da Água',
    unit: '°C',
    icon: 'fa-temperature-high',
    color: 'rgb(59, 130, 246)',
    gradient: 'from-[#3b82f6] to-[#1d4ed8]',
    minValue: 20,
    maxValue: 28,
    decimals: 1
  },
  waterLevel: { 
    label: 'Nível da Água',
    unit: '%',
    icon: 'fa-water',
    color: 'rgb(14, 165, 233)',
    gradient: 'from-[#0ea5e9] to-[#0284c7]',
    minValue: 60,
    maxValue: 90,
    decimals: 1
  },
  flowRate: { 
    label: 'Vazão',
    unit: 'L/min',
    icon: 'fa-faucet',
    color: 'rgb(2, 132, 199)',
    gradient: 'from-[#0284c7] to-[#075985]',
    minValue: 5,
    maxValue: 15,
    decimals: 1
  },
  humidity: { 
    label: 'Umidade',
    unit: '%',
    icon: 'fa-droplet',
    color: 'rgb(125, 211, 252)',
    gradient: 'from-[#7dd3fc] to-[#0284c7]',
    minValue: 60,
    maxValue: 85,
    decimals: 0
  },
  pumpPressure: { 
    label: 'Pressão da Bomba',
    unit: 'kPa',
    icon: 'fa-gauge-high',
    color: 'rgb(139, 92, 246)',
    gradient: 'from-[#8b5cf6] to-[#6d28d9]',
    minValue: 50,
    maxValue: 120,
    decimals: 0
  },
  phLevel: { 
    label: 'pH',
    unit: '',
    icon: 'fa-flask',
    color: 'rgb(34, 197, 94)',
    gradient: 'from-[#22c55e] to-[#16a34a]',
    minValue: 6.5,
    maxValue: 7.5,
    decimals: 2
  },
  oxygenLevel: { 
    label: 'Nível de Oxigênio',
    unit: 'mg/L',
    icon: 'fa-wind',
    color: 'rgb(45, 212, 191)',
    gradient: 'from-[#2dd4bf] to-[#0d9488]',
    minValue: 5,
    maxValue: 10,
    decimals: 2
  }
};

interface VirtualSensorsPanelProps {
  isEmulatorMode: boolean;
}

export function VirtualSensorsPanel({ isEmulatorMode }: VirtualSensorsPanelProps) {
  const { toast } = useToast();
  const [historicalData, setHistoricalData] = useState<Record<string, Array<{ value: number; timestamp: string }>>>({});
  
  // Consulta para obter dados dos sensores virtuais
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/emulator/virtual-sensors'],
    queryFn: getVirtualSensorsData,
    enabled: isEmulatorMode,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    retry: 1
  });
  
  // Mostrar toast de erro quando a consulta falhar
  useEffect(() => {
    if (error && isEmulatorMode) {
      toast({
        title: "Erro ao obter dados dos sensores",
        description: "Verifique se o emulador está ativo nas configurações",
        variant: "destructive"
      });
    }
  }, [error, isEmulatorMode, toast]);
  
  // Atualiza o histórico quando novos dados chegam
  useEffect(() => {
    if (!data || !data.sensors) return;
    
    // Adicionar novo ponto de dados para cada sensor
    const newHistoricalData = { ...historicalData };
    
    // Para cada sensor, adicionar um novo ponto
    Object.entries(data.sensors).forEach(([key, value]) => {
      // Inicializar o array se não existir
      if (!newHistoricalData[key]) {
        newHistoricalData[key] = [];
      }
      
      // Adicionar novo ponto
      newHistoricalData[key].push({
        value,
        timestamp: data.timestamp
      });
      
      // Limitar a 60 pontos (aproximadamente 5 minutos a 5 segundos por ponto)
      if (newHistoricalData[key].length > 60) {
        newHistoricalData[key] = newHistoricalData[key].slice(-60);
      }
    });
    
    setHistoricalData(newHistoricalData);
  }, [data]);
  
  // Se não estiver no modo emulador, não mostrar nada
  if (!isEmulatorMode) {
    return null;
  }
  
  // Renderizar o painel de sensores
  return (
    <div className="px-6 mb-8">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-lg glow-effect">
            <i className="fas fa-microchip text-white"></i>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-white">Sensores Virtuais</h2>
        </div>
        <p className="text-white/60 text-sm mt-2 ml-12">
          Dados simulados pelo emulador. Atualizados a cada 5 segundos.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(sensorConfig).map(([key, config]) => (
          <div key={key} className="card-aquaponia transition-all duration-300 hover:translate-y-[-3px]">
            <div className="card-aquaponia-header">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center text-lg sm:text-xl glow-effect`}>
                  <i className={`fas ${config.icon} text-white`}></i>
                </div>
                <h3 className="text-lg sm:text-xl font-light">{config.label}</h3>
              </div>
            </div>
            <div className="card-aquaponia-content">
              {isLoading || !historicalData[key] || historicalData[key].length === 0 ? (
                <div className="h-[300px] flex items-center justify-center bg-black/10 rounded-lg">
                  <div className="flex flex-col items-center">
                    <i className="fas fa-circle-notch fa-spin text-2xl text-blue-400 mb-3"></i>
                    <span className="text-white/70 font-light">Carregando dados...</span>
                  </div>
                </div>
              ) : (
                <SensorChart 
                  data={historicalData[key]}
                  minValue={config.minValue}
                  maxValue={config.maxValue}
                  unit={config.unit}
                  color={config.color}
                  decimals={config.decimals}
                />
              )}
              
              {data && data.sensors && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-2xl font-semibold text-white">
                    {data.sensors[key as keyof typeof data.sensors].toFixed(config.decimals)} 
                    <span className="text-white/60 text-sm ml-1">{config.unit}</span>
                  </div>
                  
                  {/* Status do sensor - usamos o valor atual em relação aos limites */}
                  {config.minValue !== undefined && config.maxValue !== undefined && (
                    <div className="flex items-center">
                      {data.sensors[key as keyof typeof data.sensors] < config.minValue ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-900/50 text-blue-300 border border-blue-700">
                          <i className="fas fa-arrow-down mr-1"></i> Abaixo do Min
                        </span>
                      ) : data.sensors[key as keyof typeof data.sensors] > config.maxValue ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-900/50 text-orange-300 border border-orange-700">
                          <i className="fas fa-arrow-up mr-1"></i> Acima do Max
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-300 border border-green-700">
                          <i className="fas fa-check mr-1"></i> Normal
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}