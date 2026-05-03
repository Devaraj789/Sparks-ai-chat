// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sparks.aichat',
  appName: 'Sparks AI Chat',
  webDir: 'dist',
  server: {
    url: 'https://2wiulvhq.spock.replit.dev', // உங்கள் Replit URL
    cleartext: true
  }
};

export default config;