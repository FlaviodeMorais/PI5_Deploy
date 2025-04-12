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
      console.log('Operação já em andamento, ignorando clique');
      return; // Evita múltiplos cliques enquanto está processando
    }

    try {
      setIsLoading(true);
      console.log(`Alterando modo de ${mode} para ${mode === 'NODEMCU' ? 'EMULATOR' : 'NODEMCU'}...`);

      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();

      if (mode === 'NODEMCU') {
        // Mudar para modo emulador
        console.log('Enviando requisição para iniciar emulador...');
        const response = await fetch(`/api/emulator/start?t=${timestamp}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
        });

        const responseText = await response.text();
        setLastApiResponse(responseText);
        console.log('Resposta bruta da API (iniciar):', responseText);

        if (!response.ok) {
          throw new Error(`Falha ao iniciar o emulador: ${response.status} - ${responseText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Erro ao processar resposta JSON:', e);
          throw new Error(`Resposta inválida do servidor: ${responseText}`);
        }

        if (data.success) {
          console.log('Emulador iniciado com sucesso:', data);
          setEmulatorStatus({ enabled: true });

          // Invalidar caches de consulta para forçar recarregamento dos dados
          queryClient.invalidateQueries({ queryKey: ['readings'] });
          queryClient.invalidateQueries({ queryKey: ['deviceStatus'] });

          // Atualizar modo na UI
          toggleMode();

          toast({
            title: "Emulador iniciado",
            description: "O modo de emulação foi ativado com sucesso."
          });
        } else {
          throw new Error(data.message || "Erro ao iniciar emulador");
        }
      } 
      else {
        // Mudar para modo NodeMCU
        console.log('Enviando requisição para parar emulador...');
        const response = await fetch(`/api/emulator/stop?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        const responseText = await response.text();
        setLastApiResponse(responseText);
        console.log('Resposta bruta da API (parar):', responseText);

        if (!response.ok) {
          throw new Error(`Falha ao parar o emulador: ${response.status} - ${responseText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Erro ao processar resposta JSON:', e);
          throw new Error(`Resposta inválida do servidor: ${responseText}`);
        }

        if (data.success) {
          console.log('Emulador parado com sucesso:', data);
          setEmulatorStatus({ enabled: false });

          // Invalidar caches de consulta para forçar recarregamento dos dados
          queryClient.invalidateQueries({ queryKey: ['readings'] });
          queryClient.invalidateQueries({ queryKey: ['deviceStatus'] });

          // Atualizar modo na UI
          toggleMode();

          toast({
            title: "Emulador parado",
            description: "O modo de emulação foi desativado com sucesso."
          });
        } else {
          throw new Error(data.message || "Erro ao parar emulador");
        }
      }
    } catch (error) {
      console.error('Erro na alternância de modos:', error);

      toast({
        variant: "destructive",
        title: "Erro na alternância",
        description: `Falha ao alternar o modo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        console.log('Estado de carregamento removido');

        // Verificar status atual após um pequeno atraso
        checkEmulatorStatus();
      }, 1000);
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