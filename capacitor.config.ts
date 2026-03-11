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
        Haptics: {},
        StatusBar: {
            style: 'DARK',
            overlaysWebView: true,
            backgroundColor: '#00000000',
        },
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#0a0f0d',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
        },
    },
};

export default config;
