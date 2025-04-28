import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VirtualSensor {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: string;
}

interface VirtualSensorsProps {
  refreshInterval?: number;
}

interface VirtualSensorsResponse {
  success: boolean;
  sensors: {
    waterTemp: number;
    airTemp: number;
    waterLevel: number;
    flowRate: number;
    humidity: number;
    pumpPressure: number;
    phLevel: number;
    oxygenLevel: number;
  };
  controlStates: {
    pumpStatus: boolean;
    heaterStatus: boolean;
    pumpFlow: number;
  };
  timestamp: string;
}

export function VirtualSensors({ refreshInterval = 2000 }: VirtualSensorsProps) {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Buscar dados dos sensores virtuais
  const { data, isLoading, error, refetch } = useQuery<VirtualSensorsResponse>({
    queryKey: ['/api/emulator/virtual-sensors'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/emulator/virtual-sensors', {
          method: 'GET',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message === 'O emulador não está ativo. Ative-o primeiro.') {
            return {
              success: false,
              sensors: {
                waterTemp: 0,
                airTemp: 0,
                waterLevel: 0,
                flowRate: 0,
                humidity: 0,
                pumpPressure: 0,
                phLevel: 0,
                oxygenLevel: 0
              },
              controlStates: {
                pumpStatus: false,
                heaterStatus: false,
                pumpFlow: 0
              },
              timestamp: new Date().toISOString()
            };
          }
          throw new Error(errorData.message || 'Falha ao buscar sensores virtuais');
        }
        
        const data = await response.json();
        setLastUpdated(new Date());
        return data;
      } catch (error) {
        console.error('Erro ao buscar sensores virtuais:', error);
        throw error;
      }
    },
    refetchInterval: refreshInterval,
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Auto-refresh a cada X segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refetch, refreshInterval]);

  const formatSensorValue = (value: number, unit: string, decimals: number = 1) => {
    return `${formatNumber(value, decimals)} ${unit}`;
  };

  // Mapear sensores para exibição
  const getSensors = (): VirtualSensor[] => {
    if (!data?.sensors) return [];
    
    return [
      { 
        label: 'Temperatura da Água', 
        value: data.sensors.waterTemp, 
        unit: '°C',
        color: 'bg-blue-500',
        icon: 'fas fa-temperature-high'
      },
      { 
        label: 'Temperatura do Ar', 
        value: data.sensors.airTemp, 
        unit: '°C',
        color: 'bg-yellow-500',
        icon: 'fas fa-sun'
      },
      { 
        label: 'Nível da Água', 
        value: data.sensors.waterLevel, // Já está em percentual (73.11)
        unit: '%',
        color: 'bg-cyan-500',
        icon: 'fas fa-water'
      },
      { 
        label: 'Vazão', 
        value: data.sensors.flowRate, 
        unit: 'L/min',
        color: 'bg-blue-400',
        icon: 'fas fa-tint'
      },
      { 
        label: 'Umidade', 
        value: data.sensors.humidity, 
        unit: '%',
        color: 'bg-teal-500',
        icon: 'fas fa-cloud'
      },
      { 
        label: 'Pressão da Bomba', 
        value: data.sensors.pumpPressure, 
        unit: 'kPa',
        color: 'bg-red-500',
        icon: 'fas fa-thermometer'
      },
      { 
        label: 'pH', 
        value: data.sensors.phLevel, 
        unit: '',
        color: 'bg-green-500',
        icon: 'fas fa-flask'
      },
      { 
        label: 'Nível de Oxigênio', 
        value: data.sensors.oxygenLevel, 
        unit: 'mg/L',
        color: 'bg-blue-600',
        icon: 'fas fa-wind'
      }
    ];
  };

  // Verificar se o emulador está ativo
  const isEmulatorActive = data?.success !== false;

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-primary">
            <i className="fas fa-microchip mr-2"></i> Sensores Virtuais
          </CardTitle>
          {isEmulatorActive ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <i className="fas fa-check-circle mr-1"></i> Emulador Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
              <i className="fas fa-power-off mr-1"></i> Emulador Inativo
            </Badge>
          )}
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Mensagem quando o emulador está inativo */}
        {!isEmulatorActive && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-md mb-4">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            O emulador não está ativo. Para ver os valores dos sensores virtuais, ative o emulador na página de Fonte de Dados.
          </div>
        )}
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-3 border">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getSensors().map((sensor, index) => (
              <div key={index} className="bg-card rounded-lg p-3 border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`${sensor.color} text-white p-1.5 rounded-full`}>
                    <i className={`${sensor.icon} text-xs`}></i>
                  </div>
                  <Label className="text-sm text-gray-600">{sensor.label}</Label>
                </div>
                <div className="text-lg font-semibold">
                  {formatSensorValue(sensor.value, sensor.unit)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Separador */}
        <Separator className="my-4" />
        
        {/* Status dos Dispositivos */}
        <div className="mt-4">
          <h3 className="text-md font-medium mb-3">Estado dos Dispositivos</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Bomba */}
              <div className="bg-card rounded-lg p-3 border flex flex-col justify-between">
                <Label className="text-sm text-gray-600">Bomba d'água</Label>
                <div className="flex items-center mt-1">
                  <div className={`${data?.controlStates.pumpStatus ? 'bg-green-500' : 'bg-gray-300'} 
                    rounded-full w-3 h-3 mr-2`}></div>
                  <span className="text-lg font-semibold">
                    {data?.controlStates.pumpStatus ? 'Ligada' : 'Desligada'}
                  </span>
                </div>
              </div>
              
              {/* Aquecedor */}
              <div className="bg-card rounded-lg p-3 border flex flex-col justify-between">
                <Label className="text-sm text-gray-600">Aquecedor</Label>
                <div className="flex items-center mt-1">
                  <div className={`${data?.controlStates.heaterStatus ? 'bg-orange-500' : 'bg-gray-300'} 
                    rounded-full w-3 h-3 mr-2`}></div>
                  <span className="text-lg font-semibold">
                    {data?.controlStates.heaterStatus ? 'Ligado' : 'Desligado'}
                  </span>
                </div>
              </div>
              
              {/* Vazão da Bomba */}
              <div className="bg-card rounded-lg p-3 border flex flex-col justify-between">
                <Label className="text-sm text-gray-600">Vazão da Bomba</Label>
                <div className="flex items-center mt-1">
                  <div className="bg-blue-500 rounded-full w-3 h-3 mr-2"></div>
                  <span className="text-lg font-semibold">
                    {formatNumber(data?.controlStates.pumpFlow || 0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}