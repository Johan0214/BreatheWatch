import { Router } from 'express';
import * as airQualityData from '../data/AirQualityData.js';
import xss from 'xss';
import validation from '../helpers/validation.js';

const router = Router();


router.get('/', validation.protectRoute, async (req, res) => {
    res.render('compare', {
        title: 'Compare Neighborhoods',
        isLoggedIn: true,
        error: null,
        comparisonResults: null
    });
});

router.post('/', validation.protectRoute, async (req, res) => {
    const n1 = xss(req.body['neighborhood1']); 
    const n2 = xss(req.body['neighborhood2']);

    let errors = [];
    let neighborhoodNames = [];

    try {
        neighborhoodNames.push(validation.checkString(n1, 'Neighborhood 1'));
    } catch (e) {
        errors.push(e.message || 'Neighborhood 1 is required.');
    }
    
    try {
        neighborhoodNames.push(validation.checkString(n2, 'Neighborhood 2'));
    } catch (e) {
        errors.push(e.message || 'Neighborhood 2 is required.');
    }

    if (errors.length > 0) {
        return res.status(400).render('compare', {
            title: 'Compare Neighborhoods',
            isLoggedIn: req.session.user ? true : false,
            errors: errors,
            hasErrors: true,
            n1Input: n1, 
            n2Input: n2 
        });
    }

    if (n1.trim().toLowerCase() === n2.trim().toLowerCase()) {
         errors.push('The two neighborhoods selected must be different for a meaningful comparison.');
    }
    if (errors.length > 0) {
        return res.status(400).render('compare', {
            title: 'Compare Neighborhoods',
            isLoggedIn: req.session.user ? true : false,
            errors: errors,
            hasErrors: true,
            n1Input: n1, 
            n2Input: n2 
        });
    }


    try {
        const comparisonResults = await airQualityData.compareNeighborhoods(neighborhoodNames);

        const successfulResults = comparisonResults.filter(r => r.success);
        const failedQueries = comparisonResults.filter(r => !r.success);

        return res.render('compare', {
            title: 'Comparison Results',
            isLoggedIn: req.session.user ? true : false,
            n1Input: n1, 
            n2Input: n2,
            results: successfulResults,
            failedSearches: failedQueries,
            showResults: successfulResults.length > 0
        });

    } catch (e) {
        errors.push(e.toString());
        return res.status(500).render('compare', {
            title: 'Compare Neighborhoods',
            isLoggedIn: req.session.user ? true : false,
            errors: errors,
            hasErrors: true,
            n1Input: n1, 
            n2Input: n2 
        });
    }
});

export default router;