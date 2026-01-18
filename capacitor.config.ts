import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.locatemenow.tracker',
  appName: 'Phone Tracker',
  webDir: 'dist',
  server: {
    url: 'https://035d0db4-29b0-4512-8789-516691b8b090.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      // Enable background location for Android
    }
  }
};

export default config;
