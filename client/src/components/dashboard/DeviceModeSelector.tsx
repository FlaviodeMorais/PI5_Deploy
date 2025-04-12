import * as React from 'react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useDeviceMode } from '@/contexts/DeviceModeContext';

export function DeviceModeSelector() {
  const { mode } = useDeviceMode();

  return (
    <div className="flex flex-col space-y-2 p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Fonte de Dados</h3>
        <Badge variant="default">
          Hardware Real
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            <i className="fas fa-microchip mr-1.5"></i> NodeMCU
          </span>
        </div>
      </div>

      <div className="mt-1 text-xs text-muted-foreground">
        Usando dados do hardware físico NodeMCU
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Conectado ao hardware físico
        </p>
        <div className="text-xs text-muted-foreground mt-4">
          <p>Modo atual: NODEMCU</p>
        </div>
      </div>
    </div>
  );
}