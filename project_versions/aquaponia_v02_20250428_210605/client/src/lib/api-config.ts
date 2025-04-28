/**
 * Configuração da API para diferentes ambientes
 * 
 * Este arquivo gerencia as configurações de URL da API dependendo do ambiente:
 * - Em desenvolvimento: usa o servidor local
 * - Em GitHub Pages: usa acesso direto ao ThingSpeak
 */

// Verifica se estamos no ambiente do GitHub Pages
export const isGitHubPagesEnv = () => {
  // Verifica variável de ambiente durante o build
  if (import.meta.env.VITE_GITHUB_PAGES === 'true') {
    return true;
  }
  
  // Verifica configuração injetada no HTML em runtime
  if (typeof window !== 'undefined' && window.ENV?.USE_THINGSPEAK_DIRECT) {
    return true;
  }
  
  // Verifica se a URL atual é de GitHub Pages
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('github.io') || 
       window.location.hostname.includes('pages.dev'))) {
    return true;
  }
  
  return false;
};

// Configuração do ThingSpeak
export const THINGSPEAK_CONFIG = {
  BASE_URL: 'https://api.thingspeak.com',
  CHANNEL_ID: '2840207',
  READ_API_KEY: '5UWNQD21RD2A7QHG',
  WRITE_API_KEY: '9NG6QLIN8UXLE2AH'
};

// Recursos disponíveis em cada ambiente
export const FEATURES = {
  // Se true, acessa o ThingSpeak diretamente sem backend
  USE_THINGSPEAK_DIRECT: isGitHubPagesEnv(),
  
  // Se true, permite controle direto dos dispositivos no ThingSpeak
  DIRECT_DEVICE_CONTROL: false
};

// Determina a URL base da API dependendo do ambiente
export const getBaseUrl = () => {
  if (isGitHubPagesEnv()) {
    return 'https://api.thingspeak.com';
  }
  
  // Em desenvolvimento, usa o servidor local
  return '';
};

// Obtém o ID do canal do ThingSpeak
export const getThingspeakChannelId = () => {
  if (typeof window !== 'undefined' && window.ENV?.THINGSPEAK_CHANNEL_ID) {
    return window.ENV.THINGSPEAK_CHANNEL_ID;
  }
  
  return import.meta.env.VITE_THINGSPEAK_CHANNEL_ID || '2840207';
};

// Obtém a chave de leitura da API ThingSpeak
export const getThingspeakReadApiKey = () => {
  if (typeof window !== 'undefined' && window.ENV?.THINGSPEAK_READ_API_KEY) {
    return window.ENV.THINGSPEAK_READ_API_KEY;
  }
  
  return import.meta.env.VITE_THINGSPEAK_READ_API_KEY || '5UWNQD21RD2A7QHG';
};

// Obtém a chave de escrita da API ThingSpeak
export const getThingspeakWriteApiKey = () => {
  if (typeof window !== 'undefined' && window.ENV?.THINGSPEAK_WRITE_API_KEY) {
    return window.ENV.THINGSPEAK_WRITE_API_KEY;
  }
  
  return import.meta.env.VITE_THINGSPEAK_WRITE_API_KEY || '9NG6QLIN8UXLE2AH';
};

// Obtém a URL base da API ThingSpeak
export const getThingspeakBaseUrl = () => {
  if (typeof window !== 'undefined' && window.ENV?.THINGSPEAK_BASE_URL) {
    return window.ENV.THINGSPEAK_BASE_URL;
  }
  
  return import.meta.env.VITE_THINGSPEAK_BASE_URL || 'https://api.thingspeak.com';
};

// Verifica se o controle direto de dispositivos está ativado
export const isDirectDeviceControlEnabled = () => {
  if (typeof window !== 'undefined' && window.ENV?.DIRECT_DEVICE_CONTROL !== undefined) {
    return window.ENV.DIRECT_DEVICE_CONTROL;
  }
  
  return import.meta.env.VITE_DIRECT_DEVICE_CONTROL === 'true';
};

// Tipo para window.ENV
declare global {
  interface Window {
    ENV?: {
      USE_THINGSPEAK_DIRECT?: boolean;
      DIRECT_DEVICE_CONTROL?: boolean;
      THINGSPEAK_CHANNEL_ID?: string;
      THINGSPEAK_READ_API_KEY?: string;
      THINGSPEAK_WRITE_API_KEY?: string;
      THINGSPEAK_BASE_URL?: string;
    };
  }
}