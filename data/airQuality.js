import { airQualityData as airCollectionFn } from '../config/mongoCollections.js';
import * as validation from '../helpers/validation.js';
import { getPollutionScore } from '../helpers/scoring.js';

export const getNeighborhoodScore = async (neighborhood) => {
    neighborhood = validation.validateLocation(neighborhood, "Neighborhood");

    const airCol = await airCollectionFn();
    
    // Fetching PM2.5 and NO2 data for the neighborhood
    const pmRow = await airCol.findOne({
        pollutant: "Fine particles (PM 2.5)",
        neighborhood: neighborhood
    });

    const no2Row = await airCol.findOne({
        pollutant: "Nitrogen dioxide (NO2)",
        neighborhood: neighborhood
    });

    if (!pmRow || !no2Row) {
        throw `Missing PM2.5 or NO2 data for ${neighborhood}.`;
    }

    const pmValue = Number(pmRow.value);
    const no2Value = Number(no2Row.value);

    if (isNaN(pmValue) || isNaN(no2Value)) {
        throw "Pollutant values must be numeric.";
    }

    // Calculating pollution score
    const score = getPollutionScore(pmValue, no2Value);

    return {
        neighborhood: neighborhood,
        pm25: pmValue,
        no2: no2Value,
        score: score
    };
};

export default { getNeighborhoodScore };
