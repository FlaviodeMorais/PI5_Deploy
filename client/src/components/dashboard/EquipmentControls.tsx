import { PumpControl } from './PumpControl';
import { HeaterControl } from './HeaterControl';
import { Reading } from '@shared/schema';

interface EquipmentControlsProps {
  latestReading?: Reading;
  isLoading: boolean;
}

export function EquipmentControls({ 
  latestReading, 
  isLoading
}: EquipmentControlsProps) {
  return (
    <div className="mb-8 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PumpControl 
          latestReading={latestReading} 
          isLoading={isLoading} 
        />
        
        <HeaterControl 
          latestReading={latestReading} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
