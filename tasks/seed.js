// tasks/seed.js
// Seed database with sample reports data - KOEN'S SAMPLE DATA (ObjectId Version)

import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import { reports } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const seedReports = async () => {
    const reportsCollection = await reports();

    // Clear existing reports
    await reportsCollection.deleteMany({});

    // !!! IMPORTANT !!!
    // Replace these with the real ObjectIds from Rosa's users seed
    const sampleUserId1 = new ObjectId("64f0c1e8e13f1f23dfabcd01");
    const sampleUserId2 = new ObjectId("64f0c1e8e13f1f23dfabcd02");

    const sampleReports = [
        {
            _id: new ObjectId(),
            userId: sampleUserId1,
            neighborhood: 'Harlem',
            borough: 'Manhattan',
            description:
                'Strong smell of smoke near 125th St. for several hours this morning. Visibility was reduced.',
            reportType: 'Smoke',
            severity: 'High',
            createdAt: new Date('2024-02-05T10:12:00Z'),
            status: 'Open'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId1,
            neighborhood: 'Williamsburg',
            borough: 'Brooklyn',
            description:
                'Chemical odor near the waterfront, possibly from nearby industrial facility.',
            reportType: 'Odor',
            severity: 'Medium',
            createdAt: new Date('2024-02-10T14:30:00Z'),
            status: 'Reviewed'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId2,
            neighborhood: 'Long Island City',
            borough: 'Queens',
            description:
                'Heavy dust in the air from construction site on 44th Drive. Has been ongoing for weeks.',
            reportType: 'Dust',
            severity: 'High',
            createdAt: new Date('2024-02-15T09:45:00Z'),
            status: 'Open'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId2,
            neighborhood: 'Astoria',
            borough: 'Queens',
            description:
                'Noticed improved air quality after recent changes to traffic patterns.',
            reportType: 'Other',
            severity: 'Low',
            createdAt: new Date('2024-02-18T16:20:00Z'),
            status: 'Resolved'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId1,
            neighborhood: 'Park Slope',
            borough: 'Brooklyn',
            description:
                'Burning smell from nearby restaurant exhaust systems during evening hours.',
            reportType: 'Smoke',
            severity: 'Low',
            createdAt: new Date('2024-02-20T19:00:00Z'),
            status: 'Reviewed'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId2,
            neighborhood: 'Upper West Side',
            borough: 'Manhattan',
            description:
                'Strong diesel exhaust smell near Columbus Avenue, possibly from delivery trucks idling.',
            reportType: 'Odor',
            severity: 'Medium',
            createdAt: new Date('2024-02-22T11:30:00Z'),
            status: 'Open'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId1,
            neighborhood: 'Flushing',
            borough: 'Queens',
            description:
                'Excessive dust from demolition work on Main Street affecting nearby residents.',
            reportType: 'Dust',
            severity: 'High',
            createdAt: new Date('2024-02-25T08:15:00Z'),
            status: 'Open'
        },
        {
            _id: new ObjectId(),
            userId: sampleUserId2,
            neighborhood: 'DUMBO',
            borough: 'Brooklyn',
            description:
                'Air quality seems much better after the new green space was added.',
            reportType: 'Other',
            severity: 'Low',
            createdAt: new Date('2024-02-28T13:45:00Z'),
            status: 'Resolved'
        }
    ];

    const result = await reportsCollection.insertMany(sampleReports);
    console.log(`✓ Seeded ${result.insertedCount} reports`);
};

const main = async () => {
    try {
        console.log('Starting database seed...');
        await seedReports();
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await closeConnection();
    }
};

main();
