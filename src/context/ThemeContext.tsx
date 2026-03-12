import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TAMIL } from '@/constants/Tamil';
import { ENGLISH } from '@/constants/English';

type Language = 'English' | 'Tamil';
type Theme = 'light' | 'dark';

interface ThemeContextType {
    language: Language;
    theme: Theme;
    toggleLanguage: () => void;
    toggleTheme: () => void;
    t: any;
    isDark: boolean;
}

const AppThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [language, setLanguage] = useState<Language>('Tamil');
    const [theme, setTheme] = useState<Theme>(systemColorScheme || 'light');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('language');
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedLanguage) setLanguage(savedLanguage as Language);
            if (savedTheme) setTheme(savedTheme as Theme);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const toggleLanguage = async () => {
        const newLang = language === 'English' ? 'Tamil' : 'English';
        setLanguage(newLang);
        await AsyncStorage.setItem('language', newLang);
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        await AsyncStorage.setItem('theme', newTheme);
    };

    const t = language === 'Tamil' ? TAMIL : ENGLISH;
    const isDark = theme === 'dark';

    return (
        <AppThemeContext.Provider value={{ language, theme, toggleLanguage, toggleTheme, t, isDark }}>
            {children}
        </AppThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(AppThemeContext);
    if (context === undefined) {
        throw new Error('useAppTheme must be used within an AppThemeProvider');
    }
    return context;
};
