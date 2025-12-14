import { Router } from 'express';
import { getNeighborhoodScore } from '../data/airQuality.js';
import { getHistoricalData } from '../data/airQuality.js';

const router = Router();

router.get('/score', async (req, res) => {
    const neighborhood = req.query.neighborhood;

    if (!neighborhood) {
        return res.render('qualityscore', { title: "Air Quality Score" });
    }

    try {
        const data = await getNeighborhoodScore(neighborhood);

        return res.render('qualityscore', {
            title: "Air Quality Score",
            neighborhood: data.neighborhood,
            pm25: data.pm25,
            no2: data.no2,
            score: data.score
        });
    } catch (e) {
        return res.status(400).render('qualityscore', {
            title: "Air Quality Score",
            error: e.toString()
        });
    }
});

router.get('/trends', async (req, res) => {
    const neighborhood = req.query.neighborhood;

    if (!neighborhood) {
        return res.status(400).render('trends', {
            error: 'You must provide a neighborhood'
        });
    }

    const data = await getHistoricalData(neighborhood);

    if (!data || data.length === 0) {
        return res.status(404).render('trends', {
            error: 'No historical data found for this neighborhood'
        });
    }

    res.render('trends', {
        title: 'Historical Air Quality Trends',
        neighborhood,
        data: JSON.stringify(data)
    });
});

export default router;
