import React from 'react';
import { Reading } from '@shared/schema';
import { Skeleton } from "@/components/ui/skeleton";
import { TemperatureSlider } from './TemperatureSlider';
import { WaterLevelSlider } from './WaterLevelSlider';

interface MonitorCardProps {
  latestReading?: Reading;
  isLoading: boolean;
}

export function MonitorCard({ latestReading, isLoading }: MonitorCardProps) {
  // Valores dos sensores
  const temperature = latestReading?.temperature || 0;
  const levelPercentage = latestReading?.level || 0;

  return (
    <div className="monitor-card p-3 mb-4">      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[180px] w-full bg-gray-800 rounded-lg" />
          <Skeleton className="h-[180px] w-full bg-gray-800 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-1">
          <TemperatureSlider 
            temperature={temperature} 
            minTemp={15} 
            maxTemp={40} 
          />
          <WaterLevelSlider 
            level={levelPercentage} 
            minLevel={0} 
            maxLevel={100} 
          />
        </div>
      )}
    </div>
  );
}