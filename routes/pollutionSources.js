// routes/pollutionSources.js
// Pollution Source Routes - KOEN'S FEATURE 6

import { Router } from 'express';
const router = Router();
import * as pollutionSourcesData from '../data/pollutionSources.js';
import xss from 'xss';
import { checkString } from '../util/validation.js';

// GET /pollution-sources - View all pollution sources with filters
router.get('/', async (req, res) => {
    try {
        const filters = {
            sourceType: req.query.sourceType ? xss(req.query.sourceType) : undefined,
            borough: req.query.borough ? xss(req.query.borough) : undefined,
            minContribution: req.query.minContribution ? xss(req.query.minContribution) : undefined
        };

        const sources = await pollutionSourcesData.getAllPollutionSources(filters);

        res.render('pollutionSources/list', {
            title: 'Pollution Sources - BreatheWatch',
            sources: sources,
            filters: filters
        });

    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// GET /pollution-sources/neighborhood - View sources for specific neighborhood
router.get('/neighborhood', async (req, res) => {
    let neighborhood, borough;
    try {
        neighborhood = validation.checkString(req.query.neighborhood, 'Neighborhood');
        borough = validation.checkString(req.query.borough, 'Borough');

        neighborhood = xss(neighborhood);
        borough = xss(borough);

        if (!neighborhood || !borough) {
            return res.status(400).render('error', {
                title: 'Error',
                error: 'Neighborhood and borough are required'
            });
        }

        const summary = await pollutionSourcesData.getNeighborhoodPollutionSummary(
            neighborhood,
            borough
        );

        res.render('pollutionSources/neighborhood', {
            title: `Pollution Sources - ${neighborhood}, ${borough}`,
            summary: summary,
            neighborhood: neighborhood,
            borough: borough
        });

    } catch (error) {
        res.status(404).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// GET /pollution-sources/borough/:borough - Top sources by borough
router.get('/borough/:borough', async (req, res) => {
    let borough;
    try {
        borough = validation.checkString(req.params.borough, 'Borough');
        borough = xss(borough);

        if (req.query.limit) {
            limit = validation.checkNumber(parseFloat(req.query.limit), 'Limit');
            // Ensure limit is a positive integer greater than 0
            if (limit <= 0) {
                 throw new Error('Limit must be a positive integer greater than 0.');
            }
            limit = Math.floor(limit);
        }

        const topSources = await pollutionSourcesData.getTopSourcesByBorough(
            borough,
            limit
        );

        res.render('pollutionSources/borough', {
            title: `Top Pollution Sources - ${borough}`,
            borough: borough,
            sources: topSources
        });

    } catch (error) {
        res.status(404).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// GET /pollution-sources/type/:type - Sources by type
router.get('/type/:type', async (req, res) => {
    let sourceType;
    try {
        sourceType = validation.checkString(req.params.type, 'Source Type');
        sourceType = xss(sourceType);

        const sources = await pollutionSourcesData.getSourcesByType(sourceType);

        res.render('pollutionSources/byType', {
            title: `${sourceType} Pollution Sources - BreatheWatch`,
            sourceType: sourceType,
            sources: sources
        });

    } catch (error) {
        res.status(404).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

// GET /pollution-sources/:id - View specific pollution source
router.get('/:id', async (req, res) => {
    let id;
    try {
        id = validation.checkId(req.params.id, 'Pollution Source ID');

        const source = await pollutionSourcesData.getPollutionSourceById(req.params.id);

        res.render('pollutionSources/view', {
            title: 'Pollution Source Details - BreatheWatch',
            source: source
        });

    } catch (error) {
        res.status(404).render('error', {
            title: 'Error',
            error: error.message
        });
    }
});

export default router;