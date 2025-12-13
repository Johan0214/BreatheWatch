// routes/reports.js
// User Report Routes - KOEN'S FEATURES (5-6)
// Feature 5: User-Submitted Reports
// Feature 6: Report Management & Status Tracking

import { Router } from 'express';
import * as reportsData from '../data/reports.js';
import { readFile } from "fs/promises";
import path from "path";
import airQualityData from "../data/AirQualityData.js"

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
        const userId = req.session.user._id;
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
            req.session.user._id,
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

router.get("/pollution-map", (req, res) => {
  try {
    res.render("reports/map", {
      title: "Air Quality Map",
      isLoggedIn: req.session?.user ? true : false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      title: "Error",
      message: "Unable to load the pollution map page.",
    });
  }
});

// GET /reports/neighborhoods-geojson
router.get("/neighborhoods-geojson", async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "data", "neighborhoods.geojson");
    const geoData = await readFile(filePath, "utf-8");
    return res.json(JSON.parse(geoData));
  } catch (error) {
    console.error("Failed to load neighborhoods geojson:", error);
    return res.status(500).json({ error: "Failed to load neighborhood data" });
  }
});

router.get("/airquality/map-data", async (req, res) => {
  try {
    const geoPath = path.join(process.cwd(), "data", "neighborhoods.geojson");
    const geoRaw = await readFile(geoPath, "utf-8");
    const geojson = JSON.parse(geoRaw);

    const airData = await airQualityData.getAllForMap2023();
    
    const airLookup = {};
    airData.forEach((d) => {
      if (d.neighborhood) {
          airLookup[d.neighborhood.trim().toLowerCase()] = d;
      }
    });

    geojson.features.forEach((feature) => {
      const name = 
        feature.properties.ntaname || 
        feature.properties.neighborhood || 
        feature.properties.name || 
        "";

      const key = name.toLowerCase().trim();

      if (airLookup[key]) {
        feature.properties.airQuality = airLookup[key];
        feature.properties.pollutionScore = airLookup[key].pollutionScore;
      } else {
        feature.properties.airQuality = null;
        feature.properties.pollutionScore = "Unknown";
      }
    });

    return res.json(geojson);
  } catch (error) {
    console.error("Map data error:", error);
    return res.status(500).json({
      error: "Failed to load map air-quality data",
    });
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
