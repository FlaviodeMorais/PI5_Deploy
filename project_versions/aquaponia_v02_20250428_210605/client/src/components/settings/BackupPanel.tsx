import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/utils";

interface BackupStatus {
  success: boolean;
  status: string;
  message: string;
  lastSyncId?: number;
  lastSyncDate?: string;
  totalBackupRecords?: number;
}

interface BackupStats {
  success: boolean;
  stats: {
    dailyStats: {
      date: string;
      minTemperature: number;
      maxTemperature: number;
      avgTemperature: number;
      readingCount: number;
    }[];
    alertCount: number;
    criticalAlertsCount: number;
    syncHistory: {
      success: boolean;
      timestamp: string;
      recordCount: number;
    }[];
  };
}

export function BackupPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Consulta para obter o status atual do backup
  const { data: backupStatus, isLoading: isStatusLoading } = useQuery<BackupStatus>({
    queryKey: ['/api/backup/status'],
    queryFn: async () => {
      const response = await fetch('/api/backup/status');
      if (!response.ok) {
        throw new Error('Falha ao obter status do backup');
      }
      return response.json();
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos (300,000ms)
  });

  // Consulta para obter estatísticas do backup
  const { data: backupStats, isLoading: isStatsLoading } = useQuery<BackupStats>({
    queryKey: ['/api/backup/stats'],
    queryFn: async () => {
      const response = await fetch('/api/backup/stats');
      if (!response.ok) {
        throw new Error('Falha ao obter estatísticas do backup');
      }
      return response.json();
    },
    refetchInterval: 300000, // Atualiza a cada 5 minutos (300,000ms)
    enabled: backupStatus?.status === 'online'
  });

  // Mutação para iniciar sincronização manual
  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncInProgress(true);
      const response = await fetch('/api/backup/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha na sincronização');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sincronização concluída",
        description: data.message || "Dados sincronizados com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/backup/stats'] });
      setSyncInProgress(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar os dados",
        variant: "destructive",
      });
      setSyncInProgress(false);
    }
  });

  // Iniciar sincronização manual
  const handleSync = () => {
    syncMutation.mutate();
  };

  // Formatar data para exibição no padrão DD/MM/YYYY HH:mm:ss
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      // Obter objeto de data
      let date: Date;
      
      // Verificar se é um timestamp numérico (em milissegundos)
      if (/^\d+$/.test(dateString)) {
        date = new Date(parseInt(dateString));
      } 
      // Verificar se é uma data ISO 8601 válida
      else if (dateString.includes('T') || dateString.includes('-')) {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString; // Retornar string original se não for uma data válida
        }
      } else {
        return dateString; // Retornar string original para outros formatos
      }
      
      // Usar a função formatDateTime do utils que está configurada com Intl.DateTimeFormat
      // Esta função já está corretamente configurada com o timezone 'America/Sao_Paulo'
      // e retorna a data no formato brasileiro
      
      return formatDateTime(date);
    } catch (e) {
      console.log('Erro ao formatar data:', e);
      return 'Data inválida';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-xl">Backup e Sincronização de Dados</CardTitle>
        <CardDescription>
          Gerenciamento de backup e sincronização com o banco de dados secundário
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="space-y-0.5">
              <h3 className="text-base font-medium">Status do Serviço</h3>
              <p className="text-sm text-muted-foreground">
                Estado atual do serviço de backup
              </p>
            </div>
            {isStatusLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <Badge variant={backupStatus?.status === 'online' ? 'default' : 'destructive'} 
                className={`px-3 py-1 ${backupStatus?.status === 'online' ? 'bg-green-500' : ''}`}>
                <span className="flex items-center gap-1.5">
                  <i className={`fas fa-${backupStatus?.status === 'online' ? 'circle text-white' : 'exclamation-circle'} text-xs`}></i>
                  {backupStatus?.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </Badge>
            )}
          </div>

          {/* Informações de backup */}
          <div className="space-y-3">
            <h3 className="text-base font-medium">Informações do Backup</h3>
            
            {isStatusLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between text-sm">
                  <span className="text-muted-foreground mb-1 sm:mb-0">Última sincronização:</span>
                  <span className="font-medium">{formatDate(backupStatus?.lastSyncDate)}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-sm">
                  <span className="text-muted-foreground mb-1 sm:mb-0">Registros no backup:</span>
                  <span className="font-medium">{backupStatus?.totalBackupRecords || 0}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-sm">
                  <span className="text-muted-foreground mb-1 sm:mb-0">Último ID sincronizado:</span>
                  <span className="font-medium">{backupStatus?.lastSyncId || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Alertas (se houver dados estatísticos) */}
          {!isStatsLoading && backupStats && (
            <div className="space-y-2">
              <h3 className="text-base font-medium">Alertas</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Os alertas são gerados quando os valores de temperatura ou nível de água estão fora dos intervalos seguros definidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 bg-muted rounded-lg text-center shadow-sm">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">{backupStats.stats.alertCount}</p>
                  <p className="text-xs text-muted-foreground">Todos os alertas registrados</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center shadow-sm">
                  <p className="text-xs text-muted-foreground">Críticos</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-500">{backupStats.stats.criticalAlertsCount}</p>
                  <p className="text-xs text-muted-foreground">Desvios extremos dos parâmetros</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Sincronização Automática</h3>
            <p className="text-sm text-muted-foreground">
              O sistema sincroniza automaticamente os dados a cada 30 minutos
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 sm:px-6">
        <Button 
          onClick={handleSync} 
          disabled={syncInProgress || isStatusLoading || backupStatus?.status !== 'online'}
          className="w-full py-2"
        >
          {syncInProgress ? (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-spinner fa-spin text-sm"></i>
              Sincronizando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-sync-alt text-sm"></i>
              Sincronizar Agora
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}