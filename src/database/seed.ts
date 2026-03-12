import { SOUTHERN_VEGETABLES } from '@/constants/Vegetables';
import { inventoryRepository } from './repositories/inventoryRepository';
import { userRepository } from './repositories/userRepository';
import { vegetableRepository } from './repositories/vegetableRepository';
import { sqliteService } from './sqlite';

/**
 * Seed Data for the Billing Application
 * Add default vegetables, users, and initial inventory
 */

const DEFAULT_USERS = [
    {
        username: 'admin',
        password_hash: 'admin123', // Note: Use bcrypt hashing in production
        role: 'admin' as const
    },
    {
        username: 'shopkeeper',
        password_hash: 'shop123',
        role: 'shopkeeper' as const
    }
];

export const seedVegetables = async () => {
    console.log('🌱 Starting database seeding...');
    try {
        // Check if vegetables already exist
        const existingVegs = await vegetableRepository.getAll();
        if (existingVegs.length > 0) {
            console.log('✓ Vegetables already seeded');
            return true;
        }

        // Seed vegetables from constants
        console.log('Adding vegetables from constants...');
        for (const veg of SOUTHERN_VEGETABLES) {
            await vegetableRepository.create({
                name: veg.name,
                tamil_name: veg.tamilName,
                image_url: veg.image,
                category: veg.origin
            });
            console.log(`✓ Added: ${veg.name}`);
        }
        console.log('✓ Vegetables seeding complete!');
        return true;
    } catch (error) {
        console.error('✗ Vegetable seeding failed:', error);
        return false;
    }
};

export async function seedDatabase() {
    try {
        console.log('🌱 Starting full database seeding...');

        // Seed vegetables
        await seedVegetables();

        // Seed users
        console.log('Adding users...');
        for (const user of DEFAULT_USERS) {
            try {
                // Check if user already exists first to avoid unique constraint error noise
                const existingUser = await userRepository.getByUsername(user.username);
                if (existingUser) {
                    console.log(`User '${user.username}' already exists`);
                    continue;
                }

                await userRepository.create(user);
                console.log(`✓ Created user: ${user.username}`);
            } catch (error: any) {
                console.error(`✗ Error creating user ${user.username}:`, error);
            }
        }

        // Add initial inventory if not exists for today
        console.log('Adding initial inventory...');
        const vegetables = await vegetableRepository.getAll();
        const today = new Date().toISOString().split('T')[0];
        const existingInventory = await inventoryRepository.getByDate(today);

        if (existingInventory.length === 0) {
            for (const veg of vegetables) {
                try {
                    await inventoryRepository.create({
                        vegetable_id: veg.id,
                        price: 20 + Math.random() * 30, // Random price between 20-50
                        stock_quantity: 100,
                        unit: 'kg',
                        date: today
                    });
                } catch (error) {
                    console.warn(`Could not add inventory for ${veg.name}:`, error);
                }
            }
            console.log(`✓ Added initial inventory`);
        } else {
            console.log(`✓ Inventory for today already exists`);
        }

        console.log('✓ Database seeding completed successfully');
        return true;
    } catch (error) {
        console.error('✗ Error seeding database:', error);
        return false;
    }
}

export async function resetAndSeedDatabase() {
    try {
        console.log('🔄 Resetting database...');
        await sqliteService.resetDatabase();
        await seedDatabase();
        console.log('✓ Database reset and reseeded successfully');
        return true;
    } catch (error) {
        console.error('✗ Error resetting database:', error);
        return false;
    }
}
