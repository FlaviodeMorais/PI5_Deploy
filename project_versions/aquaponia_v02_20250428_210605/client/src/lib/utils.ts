import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Função que formata a data/hora para exibição no formato oficial do Brasil
 * Não é necessário converter o fuso horário, apenas formatar corretamente
 */
export function toBrasiliaDateFormat(date: Date | string): Date {
  // Apenas retorna o objeto Date sem fazer conversões
  return typeof date === 'string' ? new Date(date) : new Date(date.getTime());
}

// Format date for API queries (YYYY-MM-DD)
export function formatDateForQuery(date?: Date): string {
  return date ? date.toISOString().split('T')[0] : '';
}

// Format date to display as "Weekday, Day Month Year"
export function formatFullDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Sao_Paulo'
  };

  return date.toLocaleDateString('pt-BR', options);
}

// Format time to display as "HH:MM:SS"
export function formatTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo'
  };

  return date.toLocaleTimeString('pt-BR', options);
}

// Format datetime to display as "DD/MM/YYYY HH:MM:SS"
export function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo'
  };

  return date.toLocaleString('pt-BR', options);
}

// Format number to fixed decimal places
export function formatNumber(value: number | null | undefined, decimals = 1): string {
  // Verificar valores nulos, undefined ou NaN
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.00';
  }
  
  try {
    // Converter para número e garantir que é um valor numérico válido
    const numValue = Number(value);
    return numValue.toFixed(decimals);
  } catch (error) {
    console.error("Erro ao formatar número:", error);
    return '0.00';
  }
}

// Get the last N days date range
export function getLastNDaysRange(days = 7): { startDate: string, endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

// Calculate uptime in days from a date
export function calculateUptimeDays(startDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}