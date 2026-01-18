import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.locatemenow.tracker',
  appName: 'Phone Tracker',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      // Enable background location for Android
    }
  }
};

export default config;
