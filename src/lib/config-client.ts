// Client-safe configuration
// This file avoids server-side imports (fs, path) to work in browser environments

export interface ClientConfig {
  debugMode: boolean;
  enableDashboard: boolean;
  showDashboardLink: boolean;
  enableLeaderboard: boolean;
  showLeaderboardDateFilters: boolean;
  enableResources: boolean;
  enableDataset: boolean;
  showHelpButton: boolean;
  disableAuthentication: boolean;
}

// Default client configuration - these values should match app-config.json defaults
export const clientConfig: ClientConfig = {
  debugMode: false,
  enableDashboard: true,
  showDashboardLink: true,
  enableLeaderboard: true,
  showLeaderboardDateFilters: false,
  enableResources: true,
  enableDataset: true,
  showHelpButton: true,
  disableAuthentication: true,
};

// Legacy export for backward compatibility
export const config = clientConfig;
export default clientConfig; 