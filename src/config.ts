export interface AppConfig {
  debugMode: boolean;
  enableDashboard: boolean;
  showDashboardLink: boolean;
  enableLeaderboard: boolean;
  enableResources: boolean;
  enableDataset: boolean;
  showHelpButton: boolean;
  disableAuthentication: boolean;
}

export const config: AppConfig = {
  debugMode: false,
  enableDashboard: true,
  showDashboardLink: true,
  enableLeaderboard: true,
  enableResources: true,
  enableDataset: true,
  showHelpButton: true,
  // PRODUCTION SETTING: Authentication disabled by default
  // Users can use the app freely, but can still authenticate via profile button if desired
  // This provides the best UX - no signup friction, but auth available for data persistence
  disableAuthentication: true,
};
