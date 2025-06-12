// Client-safe configuration that doesn't use Node.js modules
export interface AppConfig {
  debugMode: boolean;
  enableDashboard: boolean;
  showDashboardLink: boolean;
  enableLeaderboard: boolean;
  showLeaderboardDateFilters: boolean;
  enableResources: boolean;
  enableDataset: boolean;
  showHelpButton: boolean;
  disableAuthentication: boolean;
  showDashboardButton: boolean;
  showSpeedModeToggle: boolean;
  showScoreDisplay: boolean;
}

// Configuration values - these should match your config/app-config.json
// but are inlined here for client-side compatibility
// Updated for hybrid authentication mode: anonymous users can access features, but authentication is enabled
export const config: AppConfig = {
  debugMode: false,
  enableDashboard: true,
  showDashboardLink: true,
  enableLeaderboard: true,
  showLeaderboardDateFilters: false,
  enableResources: true,
  enableDataset: true,
  showHelpButton: true,
  disableAuthentication: false, // Changed from true to enable hybrid authentication mode
  showDashboardButton: false,
  showSpeedModeToggle: false,
  showScoreDisplay: false,
};

export default config;
