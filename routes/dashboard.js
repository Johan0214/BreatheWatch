import { Router } from 'express';
import * as reportsData from '../data/reports.js';
import * as usersData from '../data/users.js';

const router = Router();

const protectRoute = (req, res, next) => {
    if (!req.session.user) {
        req.session.previousUrl = req.originalUrl;
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
    next();
};

// GET – dashboard
router.get('/', protectRoute, async (req, res) => {
    const isLoggedIn = req.session.user ? true : false;
    const userId = req.session.user._id;

    let currentRisk = 'Data Unavailable';

    try {
        const user = await usersData.getUserById(req.session.user._id); 
        const reports = await reportsData.getReportsByUser(userId);

        res.render('dashboard', {
            title: 'Your Dashboard',
            user: user,
            reports: reports,
            currentRisk: currentRisk,
            isLoggedIn: isLoggedIn 
        });

    } catch (e) {
        console.error("Error loading dashboard data for user ID:", userId, e);
        res.status(500).render('error', { 
            title: 'Server Error', 
            error: 'Failed to load your dashboard data due to a server error. Check server logs.',
            statusCode: 500
        });
    }
});

export default router;