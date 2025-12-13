import { Router } from 'express';
import * as reportsData from '../data/reports.js';
import * as usersData from '../data/users.js';
import airQualityData from '../data/AirQualityData.js';

const router = Router();

// Middleware to protect routes
const protectRoute = (req, res, next) => {
  if (!req.session.user) {
    req.session.previousUrl = req.originalUrl;
    return res.redirect('/login');
  }
  next();
};

// Utility to normalize strings
const normalizeString = (str) => (str ? str.trim() : '');

// GET – dashboard
router.get('/', protectRoute, async (req, res) => {
  const isLoggedIn = !!req.session.user;
  const userId = req.session.user._id;

  let currentRisk = 'Data Unavailable';

  try {
    const user = await usersData.getUserById(userId);
    const reports = await reportsData.getReportsByUser(userId);

    const neighborhood = user.neighborhood?.trim().toLowerCase();
    const borough = user.borough?.trim().toLowerCase();

    if (neighborhood && borough) {
      const airQuality = await airQualityData.getByNeighborhoodYear(
        borough,
        neighborhood,
        2023
      );
      if (airQuality) currentRisk = airQuality.pollutionScore;
    }

    res.render('dashboard', {
      title: 'Your Dashboard',
      user,
      reports,
      currentRisk,
      isLoggedIn,
    });
  } catch (e) {
    console.error('Error loading dashboard data for user ID:', userId, e);
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Failed to load your dashboard data due to a server error. Check server logs.',
      statusCode: 500,
    });
  }
});


export default router;
