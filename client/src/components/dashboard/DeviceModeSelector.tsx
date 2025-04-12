
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDeviceMode } from '@/contexts/DeviceModeContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function DeviceModeSelector() {
  const { mode, toggleMode, isEmulatorEnabled, applySystemSettings } = useDeviceMode();
  const { toast } = useToast();

  const handleModeChange = async () => {
    // Se estamos mudando para modo emulador e ele não está ativo, precisamos ativá-lo
    if (mode === 'NODEMCU' && !isEmulatorEnabled) {
      try {
        const response = await fetch('/api/emulator/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateInterval: 5000,
            mode: 'fluctuating'
          })
        });
        
        if (!response.ok) {
          throw new Error('Falha ao iniciar o emulador');
        }
        
        toast({
          title: "Emulador iniciado",
          description: "O modo de emulação foi ativado com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: `Falha ao iniciar o emulador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
        return;
      }
    }
    
    // Se estamos mudando para NodeMCU e o emulador está ativo, vamos desativá-lo
    if (mode === 'EMULATOR' && isEmulatorEnabled) {
      try {
        const response = await fetch('/api/emulator/stop', {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao parar o emulador');
        }
        
        toast({
          title: "Emulador parado",
          description: "O modo de emulação foi desativado com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: `Falha ao parar o emulador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
        return;
      }
    }
    
    // Alterna o modo de operação
    toggleMode();
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
          />
          <span className={`text-sm ${mode === 'EMULATOR' ? 'font-medium' : 'text-muted-foreground'}`}>
            <i className="fas fa-laptop-code mr-1.5"></i> Emulador
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {mode === 'NODEMCU' 
          ? 'Usando dados do hardware físico NodeMCU'
          : 'Usando dados simulados do emulador'
        }
      </div>
    </div>
  );
}
