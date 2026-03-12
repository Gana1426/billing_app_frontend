import { sqliteService } from './sqlite';

/**
 * Database Client Initialization
 * This is called at app startup to initialize the SQLite database
 */

export async function initializeDatabase() {
    try {
        await sqliteService.initialize();
        console.log('✓ SQLite Database initialized successfully');
        return true;
    } catch (error) {
        console.error('✗ Failed to initialize database:', error);
        throw error;
    }
}

// Export the SQLite service for direct access if needed
export { sqliteService };

