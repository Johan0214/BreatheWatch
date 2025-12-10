// routes/reports.js
// User Report Routes - KOEN'S FEATURES (5-6)
// Feature 5: User-Submitted Reports
// Feature 6: Report Management & Status Tracking

import { Router } from 'express';
const router = Router();
import * as reportsData from '../data/reports.js';

// GET /reports - View all reports
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const reportsResult = await reportsData.getAllReports(page, 20);

        res.render('reports/list', {
            title: 'Air Quality Reports - BreatheWatch',
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

// GET /reports/my - View user's reports
router.get('/my', async (req, res) => {
    try {
        console.log('=== DEBUG /reports/my ===');
        console.log('Session user:', req.session.user);
        console.log('User ID from session:', req.session.user.userId);
        console.log('User ID type:', typeof req.session.user.userId);
        console.log('========================');
        
        const reportsList = await reportsData.getReportsByUser(
            req.session.user.userId
        );
        
        console.log('Reports found:', reportsList.length);
        console.log('========================');

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

// GET /reports/create - Show create report form
router.get('/create', (req, res) => {
    const { neighborhood, borough } = req.query;
    res.render('reports/create', {
        title: 'Submit Report - BreatheWatch',
        neighborhood: neighborhood || '',
        borough: borough || ''
    });
});

// POST /reports/create - AJAX endpoint to create report
router.post('/create', async (req, res) => {
    try {
        const {
            neighborhood,
            borough,
            description,
            reportType,
            severity
        } = req.body;

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

// GET /reports/:id - View specific report
router.get('/:id', async (req, res) => {
    try {
        const report = await reportsData.getReportById(req.params.id);

        res.render('reports/view', {
            title: 'Report Details - BreatheWatch',
            report: report
        });

    } catch (error) {
        res.status(404).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// POST /reports/:id/status - Update report status (AJAX)
router.post('/:id/status', async (req, res) => {
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