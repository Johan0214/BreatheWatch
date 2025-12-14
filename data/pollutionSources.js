// data/pollutionSources.js
// Shows users where pollution comes from (factories, traffic, construction)

import { pollutionSources as pollutionSourcesCollection } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as validation from '../helpers/validation.js';

// Get pollution sources for a specific neighborhood
export const getPollutionSourcesByNeighborhood = async (neighborhood, borough) => {
    neighborhood = validation.validateLocation(neighborhood, 'Neighborhood');
    borough = validation.validateLocation(borough, 'Borough');

    const sourcesCol = await pollutionSourcesCollection();
    
    const sources = await sourcesCol
        .find({ 
            neighborhood: neighborhood, 
            borough: borough 
        })
        .sort({ estimatedContribution: -1 }) // Highest contribution first
        .toArray();

    return sources;
};

// Get all pollution sources (with optional filters)
export const getAllPollutionSources = async (filters = {}) => {
    const sourcesCol = await pollutionSourcesCollection();
    
    let query = {};
    
    // Filter by sourceType if provided
    if (filters.sourceType) {
        const validTypes = ['Traffic', 'Industrial', 'Construction', 'Residential', 'Other'];
        if (!validTypes.includes(filters.sourceType)) {
            throw new Error('Invalid source type');
        }
        query.sourceType = filters.sourceType;
    }
    
    // Filter by borough if provided
    if (filters.borough) {
        query.borough = validation.validateLocation(filters.borough, 'Borough');
    }
    
    // Filter by minimum contribution percentage
    if (filters.minContribution) {
        const minContrib = Number(filters.minContribution);
        if (isNaN(minContrib) || minContrib < 0 || minContrib > 100) {
            throw new Error('Invalid minimum contribution percentage');
        }
        query.estimatedContribution = { $gte: minContrib };
    }

    const sources = await sourcesCol
        .find(query)
        .sort({ estimatedContribution: -1 })
        .toArray();

    return sources;
};

// Get pollution source by ID
export const getPollutionSourceById = async (sourceId) => {
    if (!sourceId || typeof sourceId !== 'string') {
        throw new Error('Source ID must be provided');
    }

    const sourcesCol = await pollutionSourcesCollection();
    const source = await sourcesCol.findOne({ _id: new ObjectId(sourceId) });

    if (!source) {
        throw new Error('Pollution source not found');
    }

    return source;
};

// Get top pollution sources by borough
export const getTopSourcesByBorough = async (borough, limit = 5) => {
    borough = validation.validateLocation(borough, 'Borough');
    
    if (typeof limit !== 'number' || limit < 1 || limit > 20) {
        limit = 5;
    }

    const sourcesCol = await pollutionSourcesCollection();
    
    const topSources = await sourcesCol
        .find({ borough: borough })
        .sort({ estimatedContribution: -1 })
        .limit(limit)
        .toArray();

    return topSources;
};

// Get pollution sources by type across all neighborhoods
export const getSourcesByType = async (sourceType) => {
    const validTypes = ['Traffic', 'Industrial', 'Construction', 'Residential', 'Other'];
    if (!validTypes.includes(sourceType)) {
        throw new Error('Invalid source type');
    }

    const sourcesCol = await pollutionSourcesCollection();
    
    const sources = await sourcesCol
        .find({ sourceType: sourceType })
        .sort({ estimatedContribution: -1 })
        .toArray();

    return sources;
};

// Get summary statistics for a neighborhood
export const getNeighborhoodPollutionSummary = async (neighborhood, borough) => {
    neighborhood = validation.validateLocation(neighborhood, 'Neighborhood');
    borough = validation.validateLocation(borough, 'Borough');

    const sourcesCol = await pollutionSourcesCollection();
    
    const sources = await sourcesCol
        .find({ neighborhood: neighborhood, borough: borough })
        .toArray();

    if (sources.length === 0) {
        return {
            neighborhood: neighborhood,
            borough: borough,
            totalSources: 0,
            primarySource: null,
            sourceBreakdown: {},
            totalContribution: 0
        };
    }

    // Calculate summary statistics
    const sourceBreakdown = {};
    let totalContribution = 0;

    sources.forEach(source => {
        if (!sourceBreakdown[source.sourceType]) {
            sourceBreakdown[source.sourceType] = {
                count: 0,
                totalContribution: 0,
                sources: []
            };
        }
        sourceBreakdown[source.sourceType].count++;
        sourceBreakdown[source.sourceType].totalContribution += source.estimatedContribution;
        sourceBreakdown[source.sourceType].sources.push(source);
        totalContribution += source.estimatedContribution;
    });

    // Find primary source (highest contribution)
    const primarySource = sources.reduce((max, source) => 
        source.estimatedContribution > max.estimatedContribution ? source : max
    );

    return {
        neighborhood: neighborhood,
        borough: borough,
        totalSources: sources.length,
        primarySource: primarySource,
        sourceBreakdown: sourceBreakdown,
        totalContribution: totalContribution,
        allSources: sources
    };
};