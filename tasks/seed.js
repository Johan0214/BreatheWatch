// tasks/seed.js 

import { MongoClient, ObjectId } from 'mongodb';
import { readFile } from 'fs/promises';
import { join } from 'path';

const mongoConfig = {
    serverUrl: 'mongodb://localhost:27017/',
    database: 'breathewatch_database'
};

const seedDatabase = async () => {
    let client;

    try {
        console.log('========================================');
        console.log('Starting BreatheWatch Database Seed');
        console.log('========================================');

        console.log('Connecting to MongoDB...');
        client = await MongoClient.connect(mongoConfig.serverUrl);
        const db = client.db(mongoConfig.database);
        console.log('✓ Connected to database:', mongoConfig.database);

        const usersCollection = db.collection('Users');
        const reportsCollection = db.collection('Reports');
        const airQualityCollection = db.collection('AirQualityData');

        // Clear existing reports and air quality data
        await reportsCollection.deleteMany({});
        console.log('✓ Cleared existing reports');

        await airQualityCollection.deleteMany({});
        console.log('✓ Cleared existing AirQualityData');

        // --- Seed Users ---
        const testUsers = [
            {
                _id: new ObjectId(),
                firstName: "Test",
                lastName: "User",
                email: "test@test.com",
                city: "New York",
                borough: "Brooklyn",
                neighborhood: "Williamsburg",
                state: "NY",
                age: 30,
                hashedPassword: "$2a$10$E5h9uX5fRTrqgqeG8dRfCe...",
                userType: "Renter",
                profileDescription: "Test user for reports",
                savedLocations: [],
                submittedReports: []
            },
            {
                _id: new ObjectId(),
                firstName: "Alice",
                lastName: "Smith",
                email: "alice@example.com",
                city: "New York",
                borough: "Brooklyn",
                neighborhood: "Park Slope",
                state: "NY",
                age: 28,
                hashedPassword: "$2a$10$E5h9uX5fRTrqgqeG8dRfCe...",
                userType: "Renter",
                profileDescription: "Alice test user",
                savedLocations: [],
                submittedReports: []
            },
            {
                _id: new ObjectId(),
                firstName: "Bob",
                lastName: "Jones",
                email: "bob@example.com",
                city: "New York",
                borough: "Queens",
                neighborhood: "Astoria",
                state: "NY",
                age: 35,
                hashedPassword: "$2a$10$E5h9uX5fRTrqgqeG8dRfCe...",
                userType: "Renter",
                profileDescription: "Bob test user",
                savedLocations: [],
                submittedReports: []
            }
        ];

        // Insert users if they don't exist
        for (let u of testUsers) {
            const existing = await usersCollection.findOne({ email: u.email });
            if (!existing) {
                await usersCollection.insertOne(u);
                console.log(`✓ Created user: ${u.firstName} ${u.lastName}`);
            } else {
                console.log(`✓ User already exists: ${existing.firstName} ${existing.lastName}`);
                u._id = existing._id; // keep ObjectId
            }
        }

        // --- Seed Reports ---
        const sampleReports = [
            {
                neighborhood: 'Harlem',
                borough: 'Manhattan',
                description: 'Strong smell of smoke near 125th St. Visibility reduced.',
                reportType: 'Smoke',
                severity: 'High',
                createdAt: new Date('2024-02-05T10:12:00Z').toISOString(),
                status: 'Open'
            },
            {
                neighborhood: 'Williamsburg',
                borough: 'Brooklyn',
                description: 'Chemical odor near waterfront from industrial facility.',
                reportType: 'Odor',
                severity: 'Medium',
                createdAt: new Date('2024-02-10T14:30:00Z').toISOString(),
                status: 'Reviewed'
            },
            {
                neighborhood: 'Long Island City',
                borough: 'Queens',
                description: 'Heavy dust from construction site on 44th Drive.',
                reportType: 'Dust',
                severity: 'High',
                createdAt: new Date('2024-02-15T09:45:00Z').toISOString(),
                status: 'Open'
            },
            {
                neighborhood: 'Astoria',
                borough: 'Queens',
                description: 'Improved air quality after traffic changes.',
                reportType: 'Other',
                severity: 'Low',
                createdAt: new Date('2024-02-18T16:20:00Z').toISOString(),
                status: 'Resolved'
            },
            {
                neighborhood: 'Park Slope',
                borough: 'Brooklyn',
                description: 'Burning smell from nearby restaurant exhaust.',
                reportType: 'Smoke',
                severity: 'Low',
                createdAt: new Date('2024-02-20T19:00:00Z').toISOString(),
                status: 'Reviewed'
            }
        ];

        // Assign reports to users in round-robin
        for (let i = 0; i < sampleReports.length; i++) {
            sampleReports[i]._id = new ObjectId();
            sampleReports[i].userId = testUsers[i % testUsers.length]._id;
        }

        // Insert reports
        const insertResult = await reportsCollection.insertMany(sampleReports);
        console.log(`✓ Inserted ${insertResult.insertedCount} reports`);

        // Update each user's submittedReports
        for (let user of testUsers) {
            const userReports = sampleReports.filter(r => r.userId.equals(user._id));
            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { submittedReports: userReports.map(r => r._id) } }
            );
            console.log(`✓ Updated ${user.firstName}'s submittedReports (${userReports.length})`);
        }

        // --- Seed AirQualityData from JSON file ---
        const dataPath = join(process.cwd(), 'data', 'air_quality_2023.json');
        const raw = await readFile(dataPath, 'utf-8');
        const records = JSON.parse(raw);

        const docs = records.map(r => ({
            borough: r.borough,
            neighborhood: r.neighborhood,
            year: 2023,
            pollutants: {
                PM2_5: Number(r.pm25),
                NO2: Number(r.no2),
                Ozone: r.ozone ? Number(r.ozone) : null
            },
            pollutionScore: Number(r.pollutionScore),
            dataSource: r.dataSource,
            lastUpdated: new Date()
        }));

        if (docs.length > 0) {
            await airQualityCollection.insertMany(docs);
            console.log(`✓ Inserted ${docs.length} AirQualityData records`);
        }

        console.log('========================================');
        console.log('✅ SEED COMPLETED SUCCESSFULLY!');
        console.log('========================================');

    } catch (error) {
        console.error('❌ ERROR DURING SEED:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('✓ Connection closed');
        }
    }
};

seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
