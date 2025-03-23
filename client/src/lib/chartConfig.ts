import { ChartOptions } from 'chart.js';

// Base chart configuration
export const baseChartConfig: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 5,
      bottom: 5,
      left: 5,
      right: 5
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#ffffff',
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          family: "'Inter', sans-serif",
          size: 11,
          weight: 'normal'
        },
        boxWidth: 8,
        boxHeight: 8,
        filter: (item) => !item.text.includes('SetPoint')
      }
    },
    title: {
      display: true,
      color: '#ffffff',
      font: {
        family: "'Inter', sans-serif",
        size: 14,
        weight: 'normal'
      },
      padding: {
        top: 10,
        bottom: 15
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      displayColors: true,
      cornerRadius: 8,
      padding: 12,
      boxWidth: 8,
      boxHeight: 8,
      titleFont: {
        weight: 'bold'
      },
      bodyFont: {
        weight: 'normal'
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
        tickLength: 0,
        lineWidth: 0.3
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        padding: 10,
        font: {
          family: "'Inter', sans-serif", 
          size: 9,
          weight: 'normal'
        }
      },
      border: {
        display: false
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.03)',
        tickLength: 0,
        lineWidth: 0.3
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)',
        padding: 10,
        font: {
          family: "'Inter', sans-serif",
          size: 9,
          weight: 'normal'
        }
      },
      border: {
        display: false
      }
    }
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 1.5,
      borderCapStyle: 'round'
    },
    point: {
      radius: 1,
      hoverRadius: 5,
      hitRadius: 5,
      borderWidth: 0
    }
  }
};

// Temperature chart configuration
export const temperatureChartConfig = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: [],
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointBorderWidth: 0,
        pointBorderColor: 'rgba(0, 0, 0, 0)',
        pointHoverBorderWidth: 0,
        lineWidth: 2,
        shadowColor: 'rgba(255, 255, 255, 0.5)', // Efeito de brilho sutil
        shadowBlur: 10
      },
      {
        label: 'SetPoint Mínimo',
        data: [],
        borderColor: 'rgba(239, 68, 68, 0.7)',
        backgroundColor: 'rgba(239, 68, 68, 0)',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      },
      {
        label: 'SetPoint Máximo',
        data: [],
        borderColor: 'rgba(34, 197, 94, 0.7)',
        backgroundColor: 'rgba(34, 197, 94, 0)',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  },
  options: {
    ...baseChartConfig,
    plugins: {
      ...baseChartConfig.plugins,
      title: {
        ...baseChartConfig.plugins?.title,
        text: 'Variação de Temperatura'
      }
    }
  }
};

// Water level chart configuration
export const waterLevelChartConfig = {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Nível (%)',
        data: [],
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointBorderWidth: 0,
        pointBorderColor: 'rgba(0, 0, 0, 0)',
        pointHoverBorderWidth: 0,
        lineWidth: 2
      },
      {
        label: 'SetPoint Mínimo',
        data: [],
        borderColor: 'rgba(239, 68, 68, 0.7)',
        backgroundColor: 'rgba(239, 68, 68, 0)',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      },
      {
        label: 'SetPoint Máximo',
        data: [],
        borderColor: 'rgba(34, 197, 94, 0.7)',
        backgroundColor: 'rgba(34, 197, 94, 0)',
        borderWidth: 1,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  },
  options: {
    ...baseChartConfig,
    plugins: {
      ...baseChartConfig.plugins,
      title: {
        ...baseChartConfig.plugins?.title,
        text: 'Nível da Água'
      }
    },
    scales: {
      ...baseChartConfig.scales,
      y: {
        ...baseChartConfig.scales?.y,
        min: 0,
        max: 100
      }
    }
  }
};
