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
            iconColor: '#6366f1',
            sound: 'default',
        },
        Haptics: {},
        StatusBar: {
            style: 'DARK',
        },
    },
};

export default config;
