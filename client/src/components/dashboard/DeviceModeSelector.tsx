import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDeviceMode } from '@/contexts/DeviceModeContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

export function DeviceModeSelector() {
  const { mode, toggleMode, isEmulatorEnabled } = useDeviceMode();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emulatorStatus, setEmulatorStatus] = useState<{enabled: boolean}>({enabled: false});
  const [lastApiResponse, setLastApiResponse] = useState(''); // Adiciona estado para resposta da API
  const queryClient = useQueryClient();

  // Verificar status do emulador ao carregar o componente
  useEffect(() => {
    // Verificar status do emulador na inicialização
    checkEmulatorStatus();

    // Configurar intervalo de verificação (reduzido para 3s para resposta mais rápida)
    const interval = setInterval(checkEmulatorStatus, 3000);

    // Limpar intervalo ao desmontar componente
    return () => clearInterval(interval);
  }, [mode, toggleMode]);

  const checkEmulatorStatus = async () => {
    try {
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/emulator/status?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Status do emulador recebido:', data);
        setEmulatorStatus(data);

        // Verificar se estado do emulador está sincronizado com o modo atual
        // Somente mudar o modo se não estivermos em processo de carregamento
        if (!isLoading) {
          if (data.enabled && mode !== 'EMULATOR') {
            console.log('Modo emulador detectado, atualizando interface...');
            toggleMode(); // Atualiza o modo para EMULATOR se o emulador estiver ativo
          } else if (!data.enabled && mode !== 'NODEMCU') {
            console.log('Modo hardware detectado, atualizando interface...');
            toggleMode(); // Atualiza o modo para NODEMCU se o emulador estiver inativo
          }
        }
      } else {
        console.error('Erro ao verificar status do emulador - status:', response.status);
        const errorText = await response.text();
        console.error('Erro ao verificar status do emulador - resposta:', errorText);
      }
    } catch (error) {
      console.error('Erro ao verificar status do emulador:', error);
    }
  };

  const handleModeChange = async () => {
    if (isLoading) {
      console.log("Operação já em andamento, ignorando clique");
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Alterando modo de ${mode} para ${mode === 'NODEMCU' ? 'EMULATOR' : 'NODEMCU'}...`);

      // Se estamos no modo NODEMCU, queremos mudar para EMULATOR (iniciar emulador)
      if (mode === 'NODEMCU') {
        console.log("Iniciando emulador...");
        const response = await fetch('/api/emulator/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            updateInterval: 5000,
            mode: 'fluctuating',
            scenarioName: "normal"
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Falha ao iniciar o emulador (${response.status}): ${errorText}`);
        }

        // Importante: mude o modo APÓS receber resposta de sucesso
        toggleMode();

        toast({
          title: "Emulador iniciado",
          description: "Modo de emulação ativado com sucesso."
        });
      } 
      // Se estamos no modo EMULATOR, queremos mudar para NODEMCU (parar emulador)
      else if (mode === 'EMULATOR') {
        console.log("Parando emulador...");
        const response = await fetch('/api/emulator/stop', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Falha ao parar o emulador (${response.status}): ${errorText}`);
        }

        // Importante: mude o modo APÓS receber resposta de sucesso
        toggleMode();

        toast({
          title: "Emulador parado",
          description: "Voltando para modo hardware físico."
        });
      }

      // Verifica o status do emulador após a operação
      await checkEmulatorStatus();

    } catch (error) {
      console.error('Erro na alternância de modos:', error);
      toast({
        title: "Erro ao alternar modos",
        description: `${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2 p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Fonte de Dados</h3>
        <Badge variant={mode === 'EMULATOR' ? 'secondary' : 'default'}>
          {mode === 'EMULATOR' ? 'Emulador' : 'Hardware Real'}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${mode === 'NODEMCU' ? 'font-medium' : 'text-muted-foreground'}`}>
            <i className="fas fa-microchip mr-1.5"></i> NodeMCU
          </span>
          <Switch 
            checked={mode === 'EMULATOR'} 
            onCheckedChange={handleModeChange}
            className="data-[state=checked]:bg-blue-600"
            disabled={isLoading}
          />
          <span className={`text-sm ${mode === 'EMULATOR' ? 'font-medium' : 'text-muted-foreground'}`}>
            <i className="fas fa-laptop-code mr-1.5"></i> Emulador
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="text-xs text-center mt-1 text-muted-foreground">
          <i className="fas fa-circle-notch fa-spin mr-1"></i> Alternando modos...
        </div>
      )}

      <div className="mt-1 text-xs text-muted-foreground">
        {mode === 'NODEMCU' 
          ? 'Usando dados do hardware físico NodeMCU'
          : 'Usando dados simulados do emulador'
        }
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {emulatorStatus.enabled ? 
            'Status do emulador: Ativo' : 
            'Status do emulador: Inativo'}
        </p>
        <div className="text-xs text-muted-foreground mt-4">
          <p>Modo atual: {mode}</p>
          <p>API pronta: {isLoading ? 'Não' : 'Sim'}</p>
        </div>
      </div>
    </div>
  );
}