// frontend/src/config/flags.ts

export const APP_MODE = 'beta';

export const isBeta = true;
export const isHybrid = false;
export const isFull = false;

export const APP_FLAGS = {
  mode: APP_MODE,
  isBeta,
  isHybrid,
  isFull,
};

export const FEATURES = {
  // Beta features (The authentic platform)
  BETA_LANDING: true,
  BETA_MEMBERSHIP: true,
  BETA_ARTICLES: true,
  
  // Always true
  ADMIN: true,
  
  // Corporate platform features - Disabled permanently to align with brief
  COUNTRY_HUBS: false,
  INTELLIGENCE: false,
  MARKET_INTEL: false,
  EVENTS: false,
  TRAVEL: false,
  LIBRARY: false,
  REPORTS: false,
};
