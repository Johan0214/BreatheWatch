import { Router } from 'express';
import { getByNeighborhoodYear } from '../data/AirQualityData.js';
import { getHistoricalData } from '../data/airQuality.js';
import { computePollutionScore } from '../data/AirQualityData.js';
import validation from '../helpers/validation.js';

const router = Router();

router.get('/score', validation.protectRoute, async (req, res) => {
    let neighborhoodInput = req.query.neighborhood;

    if (!neighborhoodInput) {
        return res.render('qualityscore', { title: "Air Quality Score" });
    }

    try {
        neighborhoodInput = validation.titleCase(neighborhoodInput);

        const { neighborhood, borough } = validation.lookupNeighborhoodAndBorough(neighborhoodInput);
        const data = await getByNeighborhoodYear(borough, neighborhood, 2023);

        if (!data) {
            throw new Error(`Air quality data not available for ${neighborhood}, ${borough}.`);
        }

        const pmValue = Number(data.pollutants.PM2_5);
        const no2Value = Number(data.pollutants.NO2);
        const riskData = computePollutionScore(pmValue, no2Value);

        return res.render('qualityscore', {
            title: "Air Quality Score",
            neighborhood: data.neighborhood,
            pm25: pmValue.toFixed(2),
            no2: no2Value.toFixed(2),
            overallRisk: riskData
        });
    } catch (e) {
        return res.status(400).render('qualityscore', {
            title: "Air Quality Score",
            error: e.toString()
        });
    }
});

router.get('/trends', validation.protectRoute, async (req, res) => {
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
