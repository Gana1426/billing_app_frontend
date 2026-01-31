import { Storage, KEYS } from '../services/storage';
import { billApi } from '../services/api';

// Fallback for network state if expo-network is not yet installed or fails
let Network: any = null;
try {
    Network = require('expo-network');
} catch (e) {
    console.warn('expo-network not found, offline sync might be limited');
}

export const SyncManager = {
    queueBill: async (billData: any) => {
        const pendingBills = (await Storage.getItem(KEYS.PENDING_BILLS)) || [];
        pendingBills.push(billData);
        await Storage.setItem(KEYS.PENDING_BILLS, pendingBills);

        // Try to sync immediately if online
        try {
            if (Network) {
                const networkState = await Network.getNetworkStateAsync();
                if (networkState.isConnected && networkState.isInternetReachable) {
                    await SyncManager.syncPending();
                }
            } else {
                // Fallback: try to sync anyway, if it fails it stays in queue
                await SyncManager.syncPending();
            }
        } catch (error) {
            console.log('Immediate sync failed, bill remains in queue');
        }
    },

    syncPending: async () => {
        const pendingBills = await Storage.getItem(KEYS.PENDING_BILLS);
        if (!pendingBills || pendingBills.length === 0) return;

        const remainingBills = [];
        for (const bill of pendingBills) {
            try {
                await billApi.create(bill);
            } catch (error) {
                remainingBills.push(bill);
            }
        }

        await Storage.setItem(KEYS.PENDING_BILLS, remainingBills);
    }
};
