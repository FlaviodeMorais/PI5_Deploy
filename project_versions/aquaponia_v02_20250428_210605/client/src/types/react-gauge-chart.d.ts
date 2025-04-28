declare module 'react-gauge-chart' {
  import React from 'react';
  
  interface GaugeChartProps {
    id: string;
    nrOfLevels?: number;
    percent?: number;
    arcWidth?: number;
    arcPadding?: number;
    colors?: string[];
    textColor?: string;
    needleColor?: string;
    needleBaseColor?: string;
    hideText?: boolean;
    animate?: boolean;
    animDelay?: number;
    animateDuration?: number;
    style?: React.CSSProperties;
    className?: string;
    formatTextValue?: (value: number) => string;
    marginInPercent?: number;
    cornerRadius?: number;
  }
  
  const GaugeChart: React.FC<GaugeChartProps>;
  
  export default GaugeChart;
}