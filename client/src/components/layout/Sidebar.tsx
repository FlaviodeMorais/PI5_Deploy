import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useQuery } from "@tanstack/react-query";
import { getLatestReadings } from "@/lib/thingspeakApi";
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: 'fas fa-tachometer-alt'
  },
  {
    href: '/settings',
    label: 'Configurações',
    icon: 'fas fa-cogs'
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousTemp, setPreviousTemp] = useState<number | null>(null);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);

  // Buscar dados para o status do sistema e valores monitorados
  const { data, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['/api/readings/latest/sidebar'],
    queryFn: () => getLatestReadings(1),
    refetchInterval: 60000, // Atualizar a cada 1 minuto (60,000ms)
    refetchOnWindowFocus: true,
    staleTime: 30000, // Considerar os dados obsoletos após 30 segundos
    retry: 3, // Tentar 3 vezes em caso de falha
    retryDelay: 3000, // Esperar 3 segundos entre as tentativas
  });

  // Pegar a leitura mais recente
  const latestReading = data?.readings.length ? data.readings[data.readings.length - 1] : undefined;

  // Efeito para mostrar animação de atualização quando os dados mudam
  useEffect(() => {
    if (!latestReading) return;

    // Verificar se os valores mudaram
    const currentTemp = latestReading.temperature;
    const currentLevel = latestReading.level;

    const tempChanged = previousTemp !== null && previousTemp !== currentTemp;
    const levelChanged = previousLevel !== null && previousLevel !== currentLevel;

    // Se algum valor mudou, mostrar animação de atualização
    if (tempChanged || levelChanged) {
      setIsUpdating(true);

      // Remover a animação após 1 segundo
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Atualizar valores anteriores
    setPreviousTemp(currentTemp);
    setPreviousLevel(currentLevel);
  }, [dataUpdatedAt, latestReading]);

  return (
    <div className="w-64 bg-[#0f172a] border-r border-white/5 hidden lg:block">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
            <i className="fas fa-water text-2xl text-blue-500"></i>
            <h1 className="text-xl font-semibold">Aquaponia</h1>
          </div>

          {/* Valores monitorados integrados ao card Aquaponia */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Temperatura */}
              <div className="flex items-center gap-3">
                <div className={cn("text-blue-500 text-xl", isUpdating && "animate-pulse")}>
                  <i className="fas fa-thermometer-half"></i>
                </div>
                <span className={cn("text-xl font-semibold text-white transition-all duration-300", 
                  isUpdating && previousTemp !== latestReading?.temperature && "text-blue-300 animate-pulse font-bold")}>
                  {latestReading?.temperature !== undefined && latestReading?.temperature !== null
                    ? formatNumber(latestReading.temperature) + " °C" 
                    : isLoading ? "Carregando..." : "0 °C"} {/* Display 0 instead of "Sem dados" */}
                </span>
                {latestReading?.temperature === 0 && !isLoading && (
                  <span className="text-xs text-amber-400 ml-1" title="Clique para recarregar" onClick={() => refetch()}>
                    <i className="fas fa-sync-alt"></i>
                  </span>
                )}
              </div>

              {/* Nível d'água */}
              <div className="flex items-center gap-3">
                <div className={cn("text-blue-400 text-xl", isUpdating && "animate-pulse")}>
                  <i className="fas fa-tint"></i>
                </div>
                <span className={cn("text-xl font-semibold text-white transition-all duration-300", 
                  isUpdating && previousLevel !== latestReading?.level && "text-blue-300 animate-pulse font-bold")}>
                  {latestReading?.level !== undefined && latestReading?.level !== null
                    ? formatNumber(latestReading.level) + " %" 
                    : isLoading ? "Carregando..." : "0 %"} {/* Display 0 instead of "Sem dados" */}
                </span>
                {(latestReading?.level === 0 || latestReading?.level === undefined) && !isLoading && (
                  <span className="text-xs text-amber-400 ml-1" title="Clique para recarregar" onClick={() => refetch()}>
                    <i className="fas fa-sync-alt"></i>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status do Sistema */}
        <div className="mb-4 mt-5 border-t border-white/5 pt-4">
          <SystemStatus 
            latestReading={latestReading} 
            isLoading={isLoading} 
          />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <div key={item.href} className="w-full">
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md cursor-pointer", 
                    location === item.href 
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  )}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
              </Link>
            </div>
          ))}
        </nav>

        

      </div>
    </div>
  );
}