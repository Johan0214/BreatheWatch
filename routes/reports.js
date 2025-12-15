// routes/reports.js
import { Router } from 'express';
import * as reportsData from '../data/reports.js';
import { readFile } from "fs/promises";
import path from "path";
import airQualityData from "../data/AirQualityData.js"
import validation from '../helpers/validation.js';
import xss from 'xss';
import { getAllNeighborhoods } from "../data/airQuality.js"

const router = Router();

// GET /reports - landing page + all reports
router.get('/', validation.protectRoute, async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');

        const page = parseInt(xss(req.query.page) || 1);
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
router.get('/my', validation.protectRoute, async (req, res) => {
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
router.get('/create', validation.protectRoute, async (req, res) => {
    const neighborhood = xss(req.query.neighborhood || '');
    const borough = xss(req.query.borough || '');
    let neighborhoodData = [];
    if (borough) {
        try {
            neighborhoodData = await getAllNeighborhoods(borough);
        } catch (e) {
            console.error("Error fetching neighborhoods for report form:", e);
        }
    }
    res.render('reports/create', {
        title: 'Submit Report - BreatheWatch',
        neighborhood: neighborhood || '',
        borough: borough || '',
        neighborhoodData
    });
});

// POST /reports/create - AJAX endpoint to create report (protected)
router.post('/create', validation.protectRoute, async (req, res) => {
    try {
        
        const neighborhood = xss(req.body.neighborhood);
        const borough = xss(req.body.borough);
        const description = xss(req.body.description);
        const reportType = xss(req.body.reportType);
        const severity = xss(req.body.severity);

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

router.get("/pollution-map", validation.protectRoute, (req, res) => {
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
router.get("/neighborhoods-geojson", validation.protectRoute, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "data", "neighborhoods.geojson");
    const geoData = await readFile(filePath, "utf-8");
    return res.json(JSON.parse(geoData));
  } catch (error) {
    console.error("Failed to load neighborhoods geojson:", error);
    return res.status(500).json({ error: "Failed to load neighborhood data" });
  }
});

router.get("/airquality/map-data", validation.protectRoute, async (req, res) => {
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
router.get('/:id', validation.protectRoute, async (req, res) => {
    try {
        const reportId = xss(req.params.id);
        const report = await reportsData.getReportById(reportId);

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
router.post('/:id/status', validation.protectRoute, async (req, res) => {
    try {
        const status = xss(req.body.status);
        const reportId = xss(req.params.id);
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updatedReport = await reportsData.updateReportStatus(
            reportId,
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
