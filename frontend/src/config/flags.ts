// frontend/src/config/flags.ts

export const APP_MODE = import.meta.env.VITE_APP_MODE || 'beta';

export const isBeta = APP_MODE === 'beta';
export const isHybrid = APP_MODE === 'hybrid';
export const isFull = APP_MODE === 'full';

export const APP_FLAGS = {
  mode: APP_MODE,
  isBeta,
  isHybrid,
  isFull,
};

export const FEATURES = {
  // Beta features
  BETA_LANDING: isBeta || isHybrid || isFull,
  BETA_MEMBERSHIP: isBeta || isHybrid || isFull,
  BETA_ARTICLES: isBeta || isHybrid || isFull,
  
  // Always true
  ADMIN: true,
  
  // Full platform features (true in full or hybrid)
  COUNTRY_HUBS: isFull || isHybrid,
  INTELLIGENCE: isFull || isHybrid,
  MARKET_INTEL: isFull || isHybrid,
  EVENTS: isFull || isHybrid,
  TRAVEL: isFull || isHybrid,
  LIBRARY: isFull || isHybrid,
  REPORTS: isFull || isHybrid,
};
