import React, { createContext, useState, useContext, useEffect } from 'react';

type DeviceMode = 'NODEMCU' | 'EMULATOR';

// Interface para o modo atual e controles do dispositivo
interface DeviceModeContextType {
  mode: DeviceMode;
  setMode: (mode: DeviceMode) => void;
  toggleMode: () => void;
  isEmulatorEnabled: boolean;
  emulatorConfig: EmulatorConfig | null;
  applySystemSettings: (config: Partial<EmulatorConfig>) => Promise<boolean>;
}

// Interface do estado da configuração do emulador
export interface SensorConfig {
  min: number;
  max: number;
  current: number;
  fluctuation: number;
}

export interface EmulatorConfig {
  enabled: boolean;
  updateInterval: number;
  sensorRanges: {
    waterTemp: SensorConfig;
    airTemp: SensorConfig;
    waterLevel: SensorConfig;
    flowRate: SensorConfig;
    humidity: SensorConfig;
    pumpPressure: SensorConfig;
    phLevel: SensorConfig;
    oxygenLevel: SensorConfig;
  };
  controlStates: {
    pumpStatus: boolean;
    heaterStatus: boolean;
    pumpFlow: number;
  };
  mode: 'stable' | 'fluctuating' | 'random' | 'scenario';
  scenarioName?: string;
}

// Valor inicial do contexto
const DeviceModeContext = createContext<DeviceModeContextType>({
  mode: 'NODEMCU',
  setMode: () => {},
  toggleMode: () => {},
  isEmulatorEnabled: false,
  emulatorConfig: null,
  applySystemSettings: async () => false,
});

export function DeviceModeProvider({ children }: { children: React.ReactNode }) {
  // Modo fixo como NODEMCU
  const [mode] = useState<DeviceMode>('NODEMCU');
  const [isEmulatorEnabled] = useState<boolean>(false);
  const [emulatorConfig, setEmulatorConfig] = useState<EmulatorConfig | null>(null);

  // Efeito para parar o emulador se estiver em execução
  useEffect(() => {
    const stopEmulator = async () => {
      try {
        await fetch('/api/emulator/stop', { method: 'POST' });
        console.log('Emulador desativado permanentemente');
      } catch (error) {
        console.error('Erro ao desativar emulador:', error);
      }
    };
    
    // Parar emulador ao iniciar o aplicativo
    stopEmulator();
    
  }, []);
  
  // Função toggle que não faz nada (mantida para compatibilidade)
  const toggleMode = () => {
    console.log('Alternância de modo desativada');
    return;
  };
  
  // Função setMode que não faz nada (mantida para compatibilidade)
  const setMode = () => {
    console.log('Definição de modo desativada');
    return;
  };

  // Aplicar configurações do sistema (emulador e nodeMCU) e salvar no localStorage
  const applySystemSettings = async (config: Partial<EmulatorConfig>): Promise<boolean> => {
    try {
      // Atualizar configuração do emulador
      const response = await fetch('/api/emulator/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao aplicar configurações do sistema');
      }
      
      const result = await response.json();
      
      // Atualizar estado local e salvar no localStorage
      if (result.success) {
        setEmulatorConfig(result.config);
        
        // Salvar configurações do emulador no localStorage
        localStorage.setItem('aquaponia_emulator_config', JSON.stringify(result.config));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao aplicar configurações do sistema:', error);
      return false;
    }
  };

  return (
    <DeviceModeContext.Provider 
      value={{ 
        mode, 
        setMode, 
        toggleMode,
        isEmulatorEnabled,
        emulatorConfig,
        applySystemSettings
      }}
    >
      {children}
    </DeviceModeContext.Provider>
  );
}

export function useDeviceMode() {
  return useContext(DeviceModeContext);
}