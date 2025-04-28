import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { BackupPanel } from "@/components/settings/BackupPanel";

export default function Settings() {
  return (
    <div className="space-y-6 pb-8 px-4 sm:px-6">
      <h1 className="text-2xl md:text-3xl font-bold my-6">Configurações do Sistema</h1>
      
      {/* Painel de configurações principal */}
      <div>
        <SettingsPanel />
      </div>
      
      {/* Painel de backup - agora aparece abaixo dos botões de Salvar */}
      <div className="mt-6 mb-10">
        <BackupPanel />
      </div>
    </div>
  );
}
