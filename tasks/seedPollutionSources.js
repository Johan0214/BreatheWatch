// tasks/seedPollutionSources.js
// Seed pollution sources data - KOEN'S FEATURE 6

import { MongoClient, ObjectId } from 'mongodb';

const mongoConfig = {
    serverUrl: 'mongodb://localhost:27017/',
    database: 'breathewatch_database'
};

const seedPollutionSources = async () => {
    let client;
    
    try {
        console.log('========================================');
        console.log('Seeding Pollution Sources');
        console.log('========================================');
        
        client = await MongoClient.connect(mongoConfig.serverUrl);
        const db = client.db(mongoConfig.database);
        const pollutionSourcesCollection = db.collection('PollutionSources');

        // Clear existing pollution sources
        const deleteResult = await pollutionSourcesCollection.deleteMany({});
        console.log(`✓ Cleared ${deleteResult.deletedCount} existing pollution sources`);

        const pollutionSources = [
            // Manhattan
            {
                _id: new ObjectId(),
                neighborhood: 'Harlem',
                borough: 'Manhattan',
                sourceType: 'Traffic',
                description: 'Heavy traffic on FDR Drive and local streets contributes to elevated NO2 levels.',
                estimatedContribution: 45.5,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Harlem',
                borough: 'Manhattan',
                sourceType: 'Residential',
                description: 'Building heating systems and residential emissions during winter months.',
                estimatedContribution: 28.3,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Upper West Side',
                borough: 'Manhattan',
                sourceType: 'Traffic',
                description: 'Columbus Avenue and Broadway traffic creates localized pollution hotspots.',
                estimatedContribution: 52.1,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Upper West Side',
                borough: 'Manhattan',
                sourceType: 'Construction',
                description: 'Ongoing development projects contribute dust and particulate matter.',
                estimatedContribution: 18.7,
                unit: '%',
                dataYear: 2023
            },

            // Brooklyn
            {
                _id: new ObjectId(),
                neighborhood: 'Williamsburg',
                borough: 'Brooklyn',
                sourceType: 'Industrial',
                description: 'Waterfront industrial facilities and waste processing plants.',
                estimatedContribution: 38.9,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Williamsburg',
                borough: 'Brooklyn',
                sourceType: 'Traffic',
                description: 'BQE and Williamsburg Bridge traffic generates significant emissions.',
                estimatedContribution: 35.2,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Park Slope',
                borough: 'Brooklyn',
                sourceType: 'Traffic',
                description: 'Prospect Expressway and Fourth Avenue corridor traffic.',
                estimatedContribution: 41.3,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Park Slope',
                borough: 'Brooklyn',
                sourceType: 'Residential',
                description: 'Dense residential heating and local restaurant emissions.',
                estimatedContribution: 22.8,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'DUMBO',
                borough: 'Brooklyn',
                sourceType: 'Traffic',
                description: 'Brooklyn and Manhattan Bridge approaches with heavy traffic.',
                estimatedContribution: 48.6,
                unit: '%',
                dataYear: 2023
            },

            // Queens
            {
                _id: new ObjectId(),
                neighborhood: 'Long Island City',
                borough: 'Queens',
                sourceType: 'Traffic',
                description: 'High NO2 concentration from nearby expressway and Queensboro Bridge.',
                estimatedContribution: 42.5,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Long Island City',
                borough: 'Queens',
                sourceType: 'Construction',
                description: 'Rapid development with multiple high-rise construction projects.',
                estimatedContribution: 31.7,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Astoria',
                borough: 'Queens',
                sourceType: 'Traffic',
                description: 'Grand Central Parkway and local street traffic.',
                estimatedContribution: 36.4,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Astoria',
                borough: 'Queens',
                sourceType: 'Industrial',
                description: 'Light industrial operations and commercial facilities.',
                estimatedContribution: 24.1,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Flushing',
                borough: 'Queens',
                sourceType: 'Traffic',
                description: 'Main Street and Northern Boulevard heavy traffic corridors.',
                estimatedContribution: 44.8,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Flushing',
                borough: 'Queens',
                sourceType: 'Construction',
                description: 'Ongoing demolition and construction generates dust pollution.',
                estimatedContribution: 27.3,
                unit: '%',
                dataYear: 2023
            },

            // Bronx
            {
                _id: new ObjectId(),
                neighborhood: 'Mott Haven',
                borough: 'Bronx',
                sourceType: 'Traffic',
                description: 'Major Deegan Expressway and Cross Bronx Expressway proximity.',
                estimatedContribution: 51.2,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Mott Haven',
                borough: 'Bronx',
                sourceType: 'Industrial',
                description: 'Industrial warehousing and distribution centers.',
                estimatedContribution: 29.6,
                unit: '%',
                dataYear: 2023
            },

            // Staten Island
            {
                _id: new ObjectId(),
                neighborhood: 'Port Richmond',
                borough: 'Staten Island',
                sourceType: 'Industrial',
                description: 'Port operations and shipping activities.',
                estimatedContribution: 46.3,
                unit: '%',
                dataYear: 2023
            },
            {
                _id: new ObjectId(),
                neighborhood: 'Port Richmond',
                borough: 'Staten Island',
                sourceType: 'Traffic',
                description: 'Richmond Terrace and commercial truck traffic.',
                estimatedContribution: 32.8,
                unit: '%',
                dataYear: 2023
            }
        ];

        const insertResult = await pollutionSourcesCollection.insertMany(pollutionSources);
        console.log(`✓ Seeded ${insertResult.insertedCount} pollution sources`);

        // Show summary by source type
        const sourceTypes = {};
        pollutionSources.forEach(source => {
            if (!sourceTypes[source.sourceType]) {
                sourceTypes[source.sourceType] = 0;
            }
            sourceTypes[source.sourceType]++;
        });

        console.log('\nSource Type Breakdown:');
        Object.entries(sourceTypes).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count} sources`);
        });

        console.log('========================================');
        console.log('✅ Pollution Sources Seeded Successfully!');
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

seedPollutionSources()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));