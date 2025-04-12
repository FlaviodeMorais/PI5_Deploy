import { PumpControl } from './PumpControl';
import { HeaterControl } from './HeaterControl';
import { Reading } from '@shared/schema';
import { updateHeaterStatus, updatePumpStatus, getDeviceStatus } from '@/lib/thingspeakApi';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface EquipmentControlsProps {
  latestReading?: Reading;
  isLoading: boolean;
}

export function EquipmentControls({ 
  latestReading, 
  isLoading
}: EquipmentControlsProps) {

  const [heaterStatus, setHeaterStatus] = useState(false);
  const [isHeaterLoading, setIsHeaterLoading] = useState(false);
  const [pumpStatus, setPumpStatus] = useState(false);
  const [isPumpLoading, setIsPumpLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(null); // Added state for device status
  const [localPumpStatus, setLocalPumpStatus] = useState(false); // Added local pump status
  const [localHeaterStatus, setLocalHeaterStatus] = useState(false); // Added local heater status


  const checkActualStatus = async () => {
    try {
      // Verificar o status real dos dispositivos
      const deviceStatusData = await getDeviceStatus();
      setDeviceStatus(deviceStatusData); // Update deviceStatus state
      console.log('Status atual dos dispositivos:', deviceStatusData);

      // Atualizar estado local se diferente do status real - removed as this is now handled in useEffect
      // if (deviceStatus.pumpStatus !== pumpStatus) {
      //   console.log(`Atualizando status da bomba na UI: ${pumpStatus} → ${deviceStatus.pumpStatus}`);
      //   setPumpStatus(deviceStatus.pumpStatus);
      // }

      // if (deviceStatus.heaterStatus !== heaterStatus) {
      //   console.log(`Atualizando status do aquecedor na UI: ${heaterStatus} → ${deviceStatus.heaterStatus}`);
      //   setHeaterStatus(deviceStatus.heaterStatus);
      // }
    } catch (error) {
      console.error('Erro ao verificar status atual dos dispositivos:', error);
    }
  };

  const handleHeaterToggle = async () => {
    if (isHeaterLoading) {
      console.log('Operação de aquecedor em andamento, ignorando');
      return;
    }

    try {
      setIsHeaterLoading(true);

      // Otimista: Atualiza UI imediatamente
      const newStatus = !heaterStatus;
      console.log(`Alterando status do aquecedor: ${heaterStatus} → ${newStatus}`);
      setHeaterStatus(newStatus);

      // Envia atualização para API com timestamp para evitar cache
      const timestamp = new Date().getTime();
      console.log(`Enviando atualização para API com timestamp ${timestamp}...`);
      const result = await updateHeaterStatus(newStatus); 

      console.log('Resposta da API para alteração do aquecedor:', result);

      if (!result.success) {
        // Reverte UI se falhar
        console.error('Falha na atualização do aquecedor:', result);
        setHeaterStatus(!newStatus);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível atualizar o status do aquecedor. Tente novamente."
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Aquecedor ${newStatus ? "ligado" : "desligado"} com sucesso`
        });
      }
    } catch (error) {
      console.error('Erro ao alternar aquecedor:', error);
      // Reverte UI em caso de erro
      setHeaterStatus(!heaterStatus);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha na comunicação com o servidor. Tente novamente."
      });
    } finally {
      setTimeout(() => {
        setIsHeaterLoading(false);
      }, 1000);
      // Verificar status real após um segundo
      setTimeout(checkActualStatus, 1000);
    }
  };

  const handlePumpToggle = async () => {
    if (isPumpLoading) {
      console.log('Operação de bomba em andamento, ignorando');
      return;
    }

    try {
      setIsPumpLoading(true);

      // Otimista: Atualiza UI imediatamente
      const newStatus = !pumpStatus;
      console.log(`Alterando status da bomba: ${pumpStatus} → ${newStatus}`);
      setPumpStatus(newStatus);

      // Envia atualização para API com timestamp para evitar cache
      const timestamp = new Date().getTime();
      console.log(`Enviando atualização para API com timestamp ${timestamp}...`);
      const result = await updatePumpStatus(newStatus); 

      console.log('Resposta da API para alteração da bomba:', result);

      if (!result.success) {
        // Reverte UI se falhar
        console.error('Falha na atualização da bomba:', result);
        setPumpStatus(!newStatus);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível atualizar o status da bomba. Tente novamente."
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Bomba ${newStatus ? "ligada" : "desligada"} com sucesso`
        });
      }
    } catch (error) {
      console.error('Erro ao alternar bomba:', error);
      // Reverte UI em caso de erro
      setPumpStatus(!pumpStatus);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha na comunicação com o servidor. Tente novamente."
      });
    } finally {
      setTimeout(() => {
        setIsPumpLoading(false);
      }, 1000);
      // Verificar status real após um segundo
      setTimeout(checkActualStatus, 1000);
    }
  };

  // Verificar status atual periodicamente
  useEffect(() => {
    checkActualStatus();
    const interval = setInterval(checkActualStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update pump status when API data changes with safe checks
  useEffect(() => {
    if (deviceStatus) {
      // Usar a fonte de dados mais confiável
      // Primeira opção: valor do banco de dados (mais confiável)
      // Segunda opção: valor da memória (mais recente, mas pode estar pendente)
      if (deviceStatus.source === 'database' && deviceStatus.databaseState) {
        // Priorizar o valor do banco se disponível
        const dbPumpStatus = typeof deviceStatus.pumpStatus === 'boolean' ? deviceStatus.pumpStatus : false;
        const dbHeaterStatus = typeof deviceStatus.heaterStatus === 'boolean' ? deviceStatus.heaterStatus : false;

        console.log("Atualizando status da bomba na UI:", localPumpStatus, "→", dbPumpStatus);
        console.log("Atualizando status do aquecedor na UI:", localHeaterStatus, "→", dbHeaterStatus);

        setLocalPumpStatus(dbPumpStatus);
        setLocalHeaterStatus(dbHeaterStatus);
        setPumpStatus(dbPumpStatus);
        setHeaterStatus(dbHeaterStatus);
      } 
      // Se o estado do banco não estiver disponível, usar memória
      else if (deviceStatus.memoryState) {
        const memPumpStatus = typeof deviceStatus.memoryState.pumpStatus === 'boolean' ? deviceStatus.memoryState.pumpStatus : false;
        const memHeaterStatus = typeof deviceStatus.memoryState.heaterStatus === 'boolean' ? deviceStatus.memoryState.heaterStatus : false;

        console.log("Atualizando status da bomba na UI (memória):", localPumpStatus, "→", memPumpStatus);
        console.log("Atualizando status do aquecedor na UI (memória):", localHeaterStatus, "→", memHeaterStatus);

        setLocalPumpStatus(memPumpStatus);
        setLocalHeaterStatus(memHeaterStatus);
        setPumpStatus(memPumpStatus);
        setHeaterStatus(memHeaterStatus);
      }
    }
  }, [deviceStatus]);

  return (
    <div className="mb-8 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PumpControl 
          latestReading={latestReading} 
          isLoading={isLoading} 
          pumpStatus={pumpStatus}
          handlePumpToggle={handlePumpToggle}
          isPumpLoading={isPumpLoading}
        />

        <HeaterControl 
          latestReading={latestReading} 
          isLoading={isLoading} 
          heaterStatus={heaterStatus}
          handleHeaterToggle={handleHeaterToggle}
          isHeaterLoading={isHeaterLoading}
        />
      </div>
    </div>
  );
}