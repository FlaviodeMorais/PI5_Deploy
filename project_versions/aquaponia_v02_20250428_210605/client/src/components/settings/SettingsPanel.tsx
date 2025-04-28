import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, updateSetpoints } from '@/lib/thingspeakApi';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export function SettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultSettings = {
    systemName: 'Aquaponia',
    updateInterval: 1,
    dataRetention: 30,
    emailAlerts: true,
    pushAlerts: true,
    alertEmail: '',
    tempCriticalMin: 18,
    tempWarningMin: 20,
    tempWarningMax: 28,
    tempCriticalMax: 30,
    levelCriticalMin: 50,
    levelWarningMin: 60,
    levelWarningMax: 85,
    levelCriticalMax: 90,
  };
  
  const [formData, setFormData] = useState(defaultSettings);
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: getSettings,
  });
  
  // Update state when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        systemName: settings.systemName || defaultSettings.systemName,
        updateInterval: settings.updateInterval || defaultSettings.updateInterval,
        dataRetention: settings.dataRetention || defaultSettings.dataRetention,
        emailAlerts: settings.emailAlerts || defaultSettings.emailAlerts,
        pushAlerts: settings.pushAlerts || defaultSettings.pushAlerts,
        alertEmail: settings.alertEmail || defaultSettings.alertEmail,
        tempCriticalMin: settings.tempCriticalMin || defaultSettings.tempCriticalMin,
        tempWarningMin: settings.tempWarningMin || defaultSettings.tempWarningMin,
        tempWarningMax: settings.tempWarningMax || defaultSettings.tempWarningMax,
        tempCriticalMax: settings.tempCriticalMax || defaultSettings.tempCriticalMax,
        levelCriticalMin: settings.levelCriticalMin || defaultSettings.levelCriticalMin,
        levelWarningMin: settings.levelWarningMin || defaultSettings.levelWarningMin,
        levelWarningMax: settings.levelWarningMax || defaultSettings.levelWarningMax,
        levelCriticalMax: settings.levelCriticalMax || defaultSettings.levelCriticalMax,
      });
    }
  }, [settings]);
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      console.error("Error updating settings:", error);
    },
  });
  
  // Update setpoints mutation
  const updateSetpointsMutation = useMutation({
    mutationFn: updateSetpoints,
    onSuccess: () => {
      // Invalidar todas as consultas que podem ser afetadas pelos novos setpoints
      queryClient.invalidateQueries({ queryKey: ['/api/readings/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/thingspeak/history'] });
      
      toast({
        title: "Limites atualizados",
        description: "Os limites de temperatura e nível foram atualizados e serão aplicados a todos os gráficos.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os limites.",
        variant: "destructive",
      });
      console.error("Error updating setpoints:", error);
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [id]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    });
  };
  
  const handleSaveSettings = () => {
    // Primeiro, atualize as configurações completas
    updateSettingsMutation.mutate(formData);
    
    // Em seguida, atualize os setpoints para os gráficos
    // Estes setpoints são usados para visualização nos gráficos
    updateSetpointsMutation.mutate({
      tempMin: formData.tempWarningMin,
      tempMax: formData.tempWarningMax,
      levelMin: formData.levelWarningMin,
      levelMax: formData.levelWarningMax,
    });
    
    toast({
      title: "Configurações atualizadas",
      description: "Todas as configurações do sistema foram atualizadas com sucesso e serão aplicadas imediatamente.",
    });
  };
  
  const handleResetSettings = () => {
    setFormData(defaultSettings);
    
    toast({
      title: "Configurações restauradas",
      description: "As configurações foram restauradas para os valores padrão. Clique em 'Salvar Configurações' para aplicar.",
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="text-lg">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="bg-[#0f172a] p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-white/5">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* System Settings */}
          <div className="bg-[#0f172a] p-4 sm:p-6 rounded-lg border border-white/5">
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <i className="fas fa-cogs text-[#5090d3]"></i>
              Configurações Gerais
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="systemName" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-tag text-[#5090d3]"></i>
                  Nome do Sistema
                </label>
                <input 
                  type="text" 
                  id="systemName" 
                  className="w-full bg-[#1e293b] border border-white/5 rounded-md p-2 text-sm text-white"
                  value={formData.systemName} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="updateInterval" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-clock text-[#5090d3]"></i>
                  Intervalo de Atualização
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="updateInterval" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.updateInterval} 
                    min="1" 
                    max="60" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">minutos</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="dataRetention" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-database text-[#5090d3]"></i>
                  Retenção de Dados
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="dataRetention" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.dataRetention} 
                    min="1" 
                    max="365" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">dias</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Alert Settings */}
          <div className="bg-[#0f172a] p-4 sm:p-6 rounded-lg border border-white/5">
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <i className="fas fa-bell text-[#5090d3]"></i>
              Configurações de Alertas
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="emailAlerts" className="flex items-center gap-2 text-gray-300 text-sm">
                  <i className="fas fa-envelope text-[#5090d3]"></i>
                  Alertas por E-mail
                </label>
                <Switch 
                  id="emailAlerts" 
                  checked={formData.emailAlerts} 
                  onCheckedChange={(checked) => setFormData({...formData, emailAlerts: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="pushAlerts" className="flex items-center gap-2 text-gray-300 text-sm">
                  <i className="fas fa-mobile-alt text-[#5090d3]"></i>
                  Notificações Push
                </label>
                <Switch 
                  id="pushAlerts" 
                  checked={formData.pushAlerts} 
                  onCheckedChange={(checked) => setFormData({...formData, pushAlerts: checked})}
                />
              </div>
              
              <div>
                <label htmlFor="alertEmail" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-at text-[#5090d3]"></i>
                  E-mail para Alertas
                </label>
                <input 
                  type="email" 
                  id="alertEmail" 
                  className="w-full bg-[#1e293b] border border-white/5 rounded-md p-2 text-sm text-white"
                  placeholder="seu@email.com" 
                  value={formData.alertEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          {/* Temperature Thresholds */}
          <div className="bg-[#0f172a] p-4 sm:p-6 rounded-lg border border-white/5">
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <i className="fas fa-temperature-high text-[#5090d3]"></i>
              Limites de Temperatura
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tempCriticalMin" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation-triangle text-[#ef5350]"></i>
                  Crítico Mínimo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="tempCriticalMin" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.tempCriticalMin} 
                    step="0.5" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">°C</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="tempWarningMin" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation text-[#ffc107]"></i>
                  Alerta Mínimo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="tempWarningMin" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.tempWarningMin} 
                    step="0.5" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">°C</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="tempWarningMax" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation text-[#ffc107]"></i>
                  Alerta Máximo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="tempWarningMax" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.tempWarningMax} 
                    step="0.5" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">°C</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="tempCriticalMax" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation-triangle text-[#ef5350]"></i>
                  Crítico Máximo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="tempCriticalMax" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.tempCriticalMax} 
                    step="0.5" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">°C</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Water Level Thresholds */}
          <div className="bg-[#0f172a] p-4 sm:p-6 rounded-lg border border-white/5">
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
              <i className="fas fa-water text-[#5090d3]"></i>
              Limites de Nível
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="levelCriticalMin" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation-triangle text-[#ef5350]"></i>
                  Crítico Mínimo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="levelCriticalMin" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.levelCriticalMin} 
                    min="0" 
                    max="100" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">%</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="levelWarningMin" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation text-[#ffc107]"></i>
                  Alerta Mínimo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="levelWarningMin" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.levelWarningMin} 
                    min="0" 
                    max="100" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">%</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="levelWarningMax" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation text-[#ffc107]"></i>
                  Alerta Máximo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="levelWarningMax" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.levelWarningMax} 
                    min="0" 
                    max="100" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">%</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="levelCriticalMax" className="flex items-center gap-2 mb-2 text-gray-300 text-sm">
                  <i className="fas fa-exclamation-triangle text-[#ef5350]"></i>
                  Crítico Máximo
                </label>
                <div className="flex items-center bg-[#1e293b] border border-white/5 rounded-md pr-3">
                  <input 
                    type="number" 
                    id="levelCriticalMax" 
                    className="w-full bg-transparent border-none p-2 text-sm text-white"
                    value={formData.levelCriticalMax} 
                    min="0" 
                    max="100" 
                    onChange={handleInputChange}
                  />
                  <span className="text-gray-300 text-sm">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
          <Button 
            variant="outline"
            onClick={handleResetSettings}
            disabled={updateSettingsMutation.isPending || updateSetpointsMutation.isPending}
            className="py-2 order-2 sm:order-1"
          >
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-undo-alt text-sm"></i>
              Restaurar Padrões
            </span>
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending || updateSetpointsMutation.isPending}
            className="py-2 order-1 sm:order-2"
          >
            {(updateSettingsMutation.isPending || updateSetpointsMutation.isPending) 
              ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin text-sm"></i>
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-save text-sm"></i>
                  Salvar Configurações
                </span>
              )}
          </Button>
        </div>
      </div>
    </div>
  );
}
