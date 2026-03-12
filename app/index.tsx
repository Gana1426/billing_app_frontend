import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export default function Index() {
    const { isDark } = useAppTheme();

    return <Redirect href="/shop/dashboard" />;
}
