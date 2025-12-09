// data/reports.js
// User Reports Data Functions - KOEN'S FEATURES (5-6)
// Feature 5: User-Submitted Reports
// Feature 6: Report Management & Status Tracking

// data/reports.js
// User Reports Data Functions - Koen's Feature

import { dbConnection } from '../config/mongoConnection.js';
import { ObjectId } from 'mongodb';
import * as validation from '../helpers/validation.js';

const getCollection = async () => {
    const db = await dbConnection();
    return db.collection('reports');
};

const getUsersCollection = async () => {
    const db = await dbConnection();
    return db.collection('users');
};

// Create a new report
export const createReport = async (
    userId,
    neighborhood,
    borough,
    description,
    reportType,
    severity
) => {
    // Validate userId
    if (!userId || typeof userId !== 'string') {
        throw new Error('User ID must be provided');
    }
    if (!ObjectId.isValid(userId)) {
        throw new Error('User ID is not a valid ObjectId');
    }
    const userIdObj = new ObjectId(userId);

    // Validate other fields
    neighborhood = validation.validateLocation(neighborhood, 'Neighborhood');
    borough = validation.validateLocation(borough, 'Borough');
    description = validation.sanitizeString(description);

    if (description.length < 10) {
        throw new Error('Description must be at least 10 characters long');
    }

    reportType = validation.validateReportType(reportType);
    severity = validation.validateSeverity(severity);

    const reportsCollection = await getCollection();
    const usersCollection = await getUsersCollection();

    // Ensure user exists
    const user = await usersCollection.findOne({ _id: userIdObj });
    if (!user) {
        throw new Error('User not found');
    }

    const newReport = {
        _id: new ObjectId(), // Use ObjectId
        userId: userIdObj,
        neighborhood,
        borough,
        description,
        reportType,
        severity,
        createdAt: new Date(),
        status: 'Open'
    };

    const result = await reportsCollection.insertOne(newReport);
    if (!result.acknowledged) {
        throw new Error('Could not create report');
    }

    // Append to user's report list
    await usersCollection.updateOne(
        { _id: userIdObj },
        { $push: { submittedReports: newReport._id } }
    );

    return newReport;
};

// Get report by ID
export const getReportById = async (reportId) => {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('Report ID must be provided');
    }
    if (!ObjectId.isValid(reportId)) {
        throw new Error('Invalid report ID');
    }

    const reportsCollection = await getCollection();
    const report = await reportsCollection.findOne({
        _id: new ObjectId(reportId)
    });

    if (!report) {
        throw new Error('Report not found');
    }

    return report;
};

// Get reports by neighborhood + borough
export const getReportsByNeighborhood = async (neighborhood, borough) => {
    neighborhood = validation.validateLocation(neighborhood, 'Neighborhood');
    borough = validation.validateLocation(borough, 'Borough');

    const reportsCollection = await getCollection();

    const reports = await reportsCollection
        .find({ neighborhood, borough })
        .sort({ createdAt: -1 })
        .toArray();

    return reports;
};

// Get reports by user
export const getReportsByUser = async (userId) => {
    if (!userId || typeof userId !== 'string') {
        throw new Error('User ID must be provided');
    }
    if (!ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }

    const reportsCollection = await getCollection();

    const reports = await reportsCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();

    return reports;
};

// Update report status
export const updateReportStatus = async (reportId, newStatus) => {
    if (!reportId || typeof reportId !== 'string') {
        throw new Error('Report ID must be provided');
    }
    if (!ObjectId.isValid(reportId)) {
        throw new Error('Invalid report ID');
    }

    const validStatuses = ['Open', 'Reviewed', 'Resolved'];
    if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid status');
    }

    const reportsCollection = await getCollection();

    const result = await reportsCollection.updateOne(
        { _id: new ObjectId(reportId) },
        { $set: { status: newStatus } }
    );

    if (result.matchedCount === 0) {
        throw new Error('Report not found');
    }

    return await getReportById(reportId);
};

// Get all reports (pagination)
export const getAllReports = async (page = 1, limit = 20) => {
    const reportsCollection = await getCollection();
    const skip = (page - 1) * limit;

    const reports = await reportsCollection
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    const total = await reportsCollection.countDocuments();

    return {
        reports,
        page,
        totalPages: Math.ceil(total / limit),
        totalReports: total
    };
};
