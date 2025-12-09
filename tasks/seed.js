// tasks/seed.js
// Seed database with sample reports data - KOEN'S SAMPLE DATA (FIXED VERSION)

import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { reports, users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const seedReports = async () => {
    const reportsCollection = await reports();
    const usersCollection = await users();

    // Clear existing reports
    await reportsCollection.deleteMany({});
    console.log('✓ Cleared existing reports');

    // Get real user IDs from database
    const existingUsers = await usersCollection.find({}).limit(2).toArray();
    
    if (existingUsers.length === 0) {
        console.error('❌ ERROR: No users found in database!');
        console.error('Please create users first (run Rosa\'s seed) or create a test user:');
        console.error(`
To create a test user, run this in MongoDB shell:
db.Users.insertOne({
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
})
        `);
        return;
    }

    // Use real user IDs
    const sampleUserId1 = existingUsers[0]._id;
    const sampleUserId2 = existingUsers.length > 1 ? existingUsers[1]._id : existingUsers[0]._id;

    console.log(`✓ Using User 1 ID: ${sampleUserId1}`);
    console.log(`✓ Using User 2 ID: ${sampleUserId2}`);

    const sampleReports = [
        {
            _id: new ObjectId(),
            userId: sampleUserId1,
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
            userId: sampleUserId1,
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
            userId: sampleUserId2,
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
            userId: sampleUserId2,
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
            userId: sampleUserId1,
            neighborhood: 'Park Slope',
            borough: 'Brooklyn',
            description: 'Burning smell from nearby restaurant exhaust systems during evening hours.',
            reportType: 'Smoke',
            severity: 'Low',
            createdAt: new Date('2024-02-20T19:00:00Z').toISOString(),
            status: 'Reviewed'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId2,
            neighborhood: 'Upper West Side',
            borough: 'Manhattan',
            description: 'Strong diesel exhaust smell near Columbus Avenue, possibly from delivery trucks idling.',
            reportType: 'Odor',
            severity: 'Medium',
            createdAt: new Date('2024-02-22T11:30:00Z').toISOString(),
            status: 'Open'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId1,
            neighborhood: 'Flushing',
            borough: 'Queens',
            description: 'Excessive dust from demolition work on Main Street affecting nearby residents.',
            reportType: 'Dust',
            severity: 'High',
            createdAt: new Date('2024-02-25T08:15:00Z').toISOString(),
            status: 'Open'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId2,
            neighborhood: 'DUMBO',
            borough: 'Brooklyn',
            description: 'Air quality seems much better after the new green space was added.',
            reportType: 'Other',
            severity: 'Low',
            createdAt: new Date('2024-02-28T13:45:00Z').toISOString(),
            status: 'Resolved'
        }
    ];

    const result = await reportsCollection.insertMany(sampleReports);
    console.log(`✓ Seeded ${result.insertedCount} reports`);

    // Update users' submittedReports arrays
    const user1Reports = sampleReports.filter(r => r.userId.equals(sampleUserId1)).map(r => r._id);
    const user2Reports = sampleReports.filter(r => r.userId.equals(sampleUserId2)).map(r => r._id);

    await usersCollection.updateOne(
        { _id: sampleUserId1 },
        { $set: { submittedReports: user1Reports } }
    );
    console.log(`✓ Updated User 1's submittedReports (${user1Reports.length} reports)`);

    if (!sampleUserId1.equals(sampleUserId2)) {
        await usersCollection.updateOne(
            { _id: sampleUserId2 },
            { $set: { submittedReports: user2Reports } }
        );
        console.log(`✓ Updated User 2's submittedReports (${user2Reports.length} reports)`);
    }
};

const main = async () => {
    try {
        console.log('Starting database seed...');
        await seedReports();
        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await closeConnection();
    }
};

main();