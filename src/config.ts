export interface AppConfig {
  debugMode: boolean;
  enableDashboard: boolean;
  showDashboardLink: boolean;
  enableLeaderboard: boolean;
  enableResources: boolean;
  enableDataset: boolean;
  showHelpButton: boolean;
}

export const config: AppConfig = {
  debugMode: false,
  enableDashboard: true,
  showDashboardLink: true,
  enableLeaderboard: true,
  enableResources: true,
  enableDataset: true,
  showHelpButton: true,
};
