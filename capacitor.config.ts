import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.cashruler.app',
    appName: 'CASHRULER',
    webDir: 'out',
    server: {
        androidScheme: 'https',
    },
    plugins: {
        LocalNotifications: {
            smallIcon: 'ic_stat_icon',
            iconColor: '#10b981',
            sound: 'default',
        },
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#0a1f1a',
            androidScaleType: 'CENTER',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
        Haptics: {},
        StatusBar: {
            style: 'DARK',
            overlaysWebView: true,
            backgroundColor: '#00000000',
        },
    },
};

export default config;
