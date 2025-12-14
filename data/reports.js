// data/reports.js

import { reports as reportsCollection } from '../config/mongoCollections.js';
import { users as usersCollection } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as validation from '../helpers/validation.js';

// Create a new report
export const createReport = async (
    userId,
    neighborhood,
    borough,
    description,
    reportType,
    severity
) => {
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
        throw new Error('User ID must be provided');
    }
    neighborhood = validation.validateLocation(neighborhood, 'Neighborhood');
    borough = validation.validateLocation(borough, 'Borough');
    description = validation.sanitizeString(description);
    if (description.length < 10) {
        throw new Error('Description must be at least 10 characters long');
    }
    reportType = validation.validateReportType(reportType);
    severity = validation.validateSeverity(severity);

    const reportsCol = await reportsCollection();
    const usersCol = await usersCollection();

    // Convert string userId to ObjectId
    const userObjectId = new ObjectId(userId);

    // Verify user exists
    const user = await usersCol.findOne({ _id: userObjectId });
    if (!user) {
        throw new Error('User not found');
    }

    const newReport = {
        _id: new ObjectId(),
        userId: userObjectId,  // ← STORE AS OBJECTID
        neighborhood: neighborhood,
        borough: borough,
        description: description,
        reportType: reportType,
        severity: severity,
        createdAt: new Date().toISOString(),
        status: 'Open'
    };

    const result = await reportsCol.insertOne(newReport);
    if (!result.acknowledged) {
        throw new Error('Could not create report');
    }

    // Add report ID to user's submittedReports
    await usersCol.updateOne(
        { _id: userObjectId },
        { $push: { submittedReports: newReport._id } }
    );

    return newReport;
};

// Get report by ID
export const getReportById = async (reportId) => {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('Report ID must be provided');
    }

    const reportsCol = await reportsCollection();
    const report = await reportsCol.findOne({ _id: new ObjectId(reportId) });

    if (!report) {
        throw new Error('Report not found');
    }

    return report;
};

// Get reports by neighborhood
export const getReportsByNeighborhood = async (neighborhood, borough) => {
    neighborhood = validation.validateLocation(neighborhood, 'Neighborhood');
    borough = validation.validateLocation(borough, 'Borough');

    const reportsCol = await reportsCollection();
    const reportsList = await reportsCol
        .find({ neighborhood: neighborhood, borough: borough })
        .sort({ createdAt: -1 })
        .toArray();

    return reportsList;
};

// Get reports by user - FIXED TO USE OBJECTID
export const getReportsByUser = async (userId) => {
    if (!userId || typeof userId !== 'string') {
        throw new Error('User ID must be provided');
    }

    const reportsCol = await reportsCollection();
    
    // Convert string to ObjectId for query
    const userObjectId = new ObjectId(userId);
    
    const reportsList = await reportsCol
        .find({ userId: userObjectId })  // ← QUERY WITH OBJECTID
        .sort({ createdAt: -1 })
        .toArray();

    return reportsList;
};

// Update report status
export const updateReportStatus = async (reportId, newStatus) => {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('Report ID must be provided');
    }

    const validStatuses = ['Open', 'Reviewed', 'Resolved'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
    }

    const reportsCol = await reportsCollection();
    const result = await reportsCol.updateOne(
        { _id: new ObjectId(reportId) },
        { $set: { status: newStatus } }
    );

    if (result.matchedCount === 0) {
        throw new Error('Report not found');
    }

    return await getReportById(reportId);
};

// Get all reports (with pagination)
export const getAllReports = async (page = 1, limit = 20) => {
    const reportsCol = await reportsCollection();
    const skip = (page - 1) * limit;

    const reportsList = await reportsCol
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    const total = await reportsCol.countDocuments({});

    return {
        reports: reportsList,
        page: page,
        totalPages: Math.ceil(total / limit),
        totalReports: total
    };
};