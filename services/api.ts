import axios from 'axios';
import { Storage, KEYS } from './storage';

export const API_BASE_URL = 'http://192.168.1.166:5000/api/v1'; // Use 10.0.2.2 for Android Emulator, or your LAN IP for physical device

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

api.interceptors.request.use(async (config) => {
    const token = await Storage.getItem(KEYS.AUTH_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.message);
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (credentials: any) => {
        const params = new URLSearchParams();
        params.append('username', credentials.username);
        params.append('password', credentials.password);
        if (credentials.grant_type) params.append('grant_type', credentials.grant_type);
        else params.append('grant_type', 'password'); // Default grant_type

        if (credentials.scope) params.append('scope', credentials.scope);
        if (credentials.client_id) params.append('client_id', credentials.client_id);
        if (credentials.client_secret) params.append('client_secret', credentials.client_secret);

        return api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    },
    signup: (userData: any) => api.post('/auth/signup', userData),
};

export const adminApi = {
    createUser: (userData: any) => api.post('/admin/create-user', userData),
};

export const inventoryApi = {
    setup: (data: any) => api.post('/inventory/setup', data),
    getAll: () => api.get('/inventory/'),
    update: (vegId: string, data: any) => api.post(`/inventory/update/${vegId}`, data),
};

export const vegApi = {
    getAll: () => api.get('/vegetables/'),
    getTop15: () => api.get('/vegetables/top15'),
};

export const billApi = {
    create: (billData: any) => api.post('/billing/create', billData),
    getHistory: () => api.get('/billing/history'),
    getPdf: (billId: string) => api.get(`/billing/${billId}/pdf`, { responseType: 'blob' }),
};

export default api;
