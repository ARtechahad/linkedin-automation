import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agencyops.app',
  appName: 'AgencyOps',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
