import React, { createContext, useContext, useState, useEffect } from 'react';
import { Storage, KEYS } from '../services/storage';

type User = {
    username: string;
    role: 'admin' | 'user';
    shopName?: string;
    top_selling_vegetables?: string[];
};

type AuthContextType = {
    user: User | null;
    login: (userData: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedUser = await Storage.getItem(KEYS.USER_DATA);
            if (storedUser) {
                setUser(storedUser);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData: User, token: string) => {
        setUser(userData);
        await Storage.setItem(KEYS.USER_DATA, userData);
        await Storage.setItem(KEYS.AUTH_TOKEN, token);
    };

    const logout = async () => {
        setUser(null);
        // Clear all session-related data to prevent leakage to next user
        const keysToRemove = [
            KEYS.USER_DATA,
            KEYS.AUTH_TOKEN,
            KEYS.MERCHANT_NAME,
            KEYS.MERCHANT_LOGO,
            KEYS.MERCHANT_NUMBER,
            KEYS.VEGETABLES,
            KEYS.TOP_VEGETABLES,
            // KEYS.PENDING_BILLS - optional, keeping for reliability unless requested otherwise
        ];

        try {
            await Promise.all(keysToRemove.map(key => Storage.removeItem(key)));
        } catch (error) {
            console.error('Error clearing storage during logout:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
