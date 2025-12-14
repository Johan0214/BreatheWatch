import { Router } from 'express';
import * as reportsData from '../data/reports.js';
import * as usersData from '../data/users.js';
import airQualityData from '../data/AirQualityData.js';
import xss from 'xss';
import { protectRoute } from '../helpers/validation.js';

const router = Router();

// GET – dashboard
router.get('/', protectRoute, async (req, res) => {
  const isLoggedIn = !!req.session.user;
  const userId = req.session.user._id;

  let currentRisk = 'Data Unavailable';

  try {
    const user = await usersData.getUserById(userId);
    const reports = await reportsData.getReportsByUser(userId);

    const sanitizedUser = {
        ...user,
        username: xss(user.username),
        firstName: xss(user.firstName),
        lastName: xss(user.lastName),
        borough: xss(user.borough),
        neighborhood: xss(user.neighborhood),
        profileDescription: xss(user.profileDescription),
    };

    const neighborhood = user.neighborhood?.trim().toLowerCase();
    const borough = user.borough?.trim().toLowerCase();

    if (neighborhood && borough) {
      const airQuality = await airQualityData.getByNeighborhoodYear(
        borough,
        neighborhood,
        2023
      );
      if (airQuality) currentRisk = xss(airQuality.pollutionScore);
    }

    res.render('dashboard', {
      title: 'Your Dashboard',
      user: sanitizedUser,
      reports,
      currentRisk,
      isLoggedIn,
      query: req.query  // pass query for success message
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
