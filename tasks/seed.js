// tasks/seed.js
// FIXED - Stores userId as ObjectId

import { MongoClient, ObjectId } from 'mongodb';

const mongoConfig = {
    serverUrl: 'mongodb://localhost:27017/',
    database: 'breathewatch_database'
};

const seedReports = async () => {
    let client;
    
    try {
        console.log('========================================');
        console.log('Starting BreatheWatch Database Seed');
        console.log('========================================');
        
        console.log('Connecting to MongoDB...');
        client = await MongoClient.connect(mongoConfig.serverUrl);
        const db = client.db(mongoConfig.database);
        console.log('✓ Connected to database:', mongoConfig.database);
        
        const reportsCollection = db.collection('Reports');
        const usersCollection = db.collection('Users');

        // Clear existing reports
        const deleteResult = await reportsCollection.deleteMany({});
        console.log(`✓ Cleared ${deleteResult.deletedCount} existing reports`);

        // Get real user IDs from database
        const existingUsers = await usersCollection.find({}).toArray();
        console.log(`✓ Found ${existingUsers.length} users in database`);
        
        if (existingUsers.length === 0) {
            console.error('❌ NO USERS FOUND! Creating test user...');
            
            const testUser = {
                _id: new ObjectId(),
                firstName: "Test",
                lastName: "User",
                email: "test@test.com",
                city: "Brooklyn",
                state: "NY",
                age: 30,
                hashedPassword: "$2a$10$E5h9uX5fRTrqgqeG8dRfCe...",
                userType: "Renter",
                profileDescription: "Test user for reports",
                savedLocations: [],
                submittedReports: []
            };
            
            await usersCollection.insertOne(testUser);
            console.log('✓ Created test user:', testUser._id);
            existingUsers.push(testUser);
        }

        // Use real user ObjectId (NOT string)
        const userId = existingUsers[0]._id;  // This is already ObjectId
        console.log(`✓ Using user: ${existingUsers[0].firstName} ${existingUsers[0].lastName}`);
        console.log(`✓ User ID (ObjectId): ${userId}`);

        const sampleReports = [
            {
                _id: new ObjectId(),
                userId: userId,  // ← STORE AS OBJECTID (not toString())
                neighborhood: 'Harlem',
                borough: 'Manhattan',
                description: 'Strong smell of smoke near 125th St. for several hours this morning. Visibility was reduced.',
                reportType: 'Smoke',
                severity: 'High',
                createdAt: new Date('2024-02-05T10:12:00Z').toISOString(),
                status: 'Open'
            },
            {
                _id: new ObjectId(),
                userId: userId,  // ← OBJECTID
                neighborhood: 'Williamsburg',
                borough: 'Brooklyn',
                description: 'Chemical odor near the waterfront, possibly from nearby industrial facility.',
                reportType: 'Odor',
                severity: 'Medium',
                createdAt: new Date('2024-02-10T14:30:00Z').toISOString(),
                status: 'Reviewed'
            },
            {
                _id: new ObjectId(),
                userId: userId,  // ← OBJECTID
                neighborhood: 'Long Island City',
                borough: 'Queens',
                description: 'Heavy dust in the air from construction site on 44th Drive. Has been ongoing for weeks.',
                reportType: 'Dust',
                severity: 'High',
                createdAt: new Date('2024-02-15T09:45:00Z').toISOString(),
                status: 'Open'
            },
            {
                _id: new ObjectId(),
                userId: userId,  // ← OBJECTID
                neighborhood: 'Astoria',
                borough: 'Queens',
                description: 'Noticed improved air quality after recent changes to traffic patterns.',
                reportType: 'Other',
                severity: 'Low',
                createdAt: new Date('2024-02-18T16:20:00Z').toISOString(),
                status: 'Resolved'
            },
            {
                _id: new ObjectId(),
                userId: userId,  // ← OBJECTID
                neighborhood: 'Park Slope',
                borough: 'Brooklyn',
                description: 'Burning smell from nearby restaurant exhaust systems during evening hours.',
                reportType: 'Smoke',
                severity: 'Low',
                createdAt: new Date('2024-02-20T19:00:00Z').toISOString(),
                status: 'Reviewed'
            }
        ];

        console.log(`Inserting ${sampleReports.length} reports...`);
        const insertResult = await reportsCollection.insertMany(sampleReports);
        console.log(`✓ Seeded ${insertResult.insertedCount} reports`);

        // Update user's submittedReports array
        const reportIds = sampleReports.map(r => r._id);
        await usersCollection.updateOne(
            { _id: userId },
            { $set: { submittedReports: reportIds } }
        );
        console.log(`✓ Updated user's submittedReports (${reportIds.length} reports)`);

        // Verify
        const verifyCount = await reportsCollection.countDocuments({ userId: userId });
        console.log(`✓ Verification: ${verifyCount} reports for user ${userId}`);

        console.log('========================================');
        console.log('✅ SEED COMPLETED SUCCESSFULLY!');
        console.log('========================================');

    } catch (error) {
        console.error('========================================');
        console.error('❌ ERROR DURING SEED:');
        console.error(error);
        console.error('========================================');
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('✓ Connection closed');
        }
    }
};

seedReports()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));