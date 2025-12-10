// routes/reports.js
// User Report Routes - KOEN'S FEATURES (5-6)
// Feature 5: User-Submitted Reports
// Feature 6: Report Management & Status Tracking

import { Router } from 'express';
import * as reportsData from '../data/reports.js';

const router = Router();

// Middleware to protect authenticated routes
const protectRoute = (req, res, next) => {
    if (!req.session.user) {
        req.session.previousUrl = req.originalUrl;
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
    next();
};

// GET /reports - View all reports (optional: public)
// GET /reports - landing page + all reports
router.get('/', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');

        const page = parseInt(req.query.page) || 1;
        const reportsResult = await reportsData.getAllReports(page, 20);

        res.render('reports/index', {
            title: 'Air Quality Reports - BreatheWatch',
            isReportsPage: true,
            reports: reportsResult.reports,
            currentPage: reportsResult.page,
            totalPages: reportsResult.totalPages
        });

    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});


// GET /reports/my - View user's reports (protected)
router.get('/my', protectRoute, async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const reportsList = await reportsData.getReportsByUser(userId);

        res.render('reports/myReports', {
            title: 'My Reports - BreatheWatch',
            reports: reportsList
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// GET /reports/create - Show create report form (protected)
router.get('/create', protectRoute, (req, res) => {
    const { neighborhood, borough } = req.query;
    res.render('reports/create', {
        title: 'Submit Report - BreatheWatch',
        neighborhood: neighborhood || '',
        borough: borough || ''
    });
});

// POST /reports/create - AJAX endpoint to create report (protected)
router.post('/create', protectRoute, async (req, res) => {
    try {
        const { neighborhood, borough, description, reportType, severity } = req.body;

        const newReport = await reportsData.createReport(
            req.session.user.userId,
            neighborhood,
            borough,
            description,
            reportType,
            severity
        );

        res.json({ 
            success: true, 
            message: 'Report submitted successfully',
            reportId: newReport._id
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /reports/:id - View specific report (optional: public)
router.get('/:id', async (req, res) => {
    try {
        const report = await reportsData.getReportById(req.params.id);

        res.render('reports/view', {
            title: 'Report Details - BreatheWatch',
            report
        });
    } catch (error) {
        res.status(404).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// POST /reports/:id/status - Update report status (AJAX, protected)
router.post('/:id/status', protectRoute, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updatedReport = await reportsData.updateReportStatus(
            req.params.id,
            status
        );

        res.json({ 
            success: true, 
            message: 'Report status updated',
            report: updatedReport
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
