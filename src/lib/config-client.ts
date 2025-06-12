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
  showDashboardButton: boolean;
  showSpeedModeToggle: boolean;
  showScoreDisplay: boolean;
}

// Default client configuration - these values should match app-config.json defaults
// Updated for hybrid authentication mode: anonymous users can access features, but authentication is enabled
export const clientConfig: ClientConfig = {
  debugMode: true, // Temporarily enable debug mode to diagnose the sign out issue
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

// Legacy export for backward compatibility
export const config = clientConfig;
export default clientConfig; 