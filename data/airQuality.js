import { airQualityData as airCollectionFn,  pollutionSources as pollutionSourcesFn } from '../config/mongoCollections.js';
import * as validation from '../helpers/validation.js';
import { getPollutionScore } from '../helpers/scoring.js';

export const getNeighborhoodScore = async (neighborhood) => {
    neighborhood = validation.validateLocation(neighborhood, "Neighborhood");

    const airCol = await airCollectionFn();

    // Fetch the single document for the neighborhood
    const doc = await airCol.findOne({ neighborhood: neighborhood.toLowerCase(), year: 2023 });

    if (!doc) {
        throw `No data found for ${neighborhood}.`;
    }

    const pmValue = doc.pollutants?.PM2_5;
    const no2Value = doc.pollutants?.NO2;

    if (pmValue == null || no2Value == null) {
        throw `Missing PM2.5 or NO2 data for ${neighborhood}.`;
    }

    // Calculating pollution score
    const score = getPollutionScore(pmValue, no2Value);

    return {
        neighborhood: doc.neighborhood,
        pm25: pmValue,
        no2: no2Value,
        score: score
    };
};

export const getHistoricalData = async (neighborhood) => {
    neighborhood = validation.validateLocation(neighborhood, "Neighborhood");

    const collection = await airCollectionFn();

    const records = await collection
        .find({ neighborhood: neighborhood.toLowerCase() })
        .project({ year: 1, pollutants: 1 })
        .sort({ year: 1 })
        .toArray();

    // Return plain JSON
    return records.map(r => ({
        year: r.year,
        pollutants: r.pollutants
    }));
};

export const getAllNeighborhoods = async(borough) =>{
    const pollutionCol = await pollutionSourcesFn();
    // console.log("pollutionCol", pollutionCol);
    let fetchData = {};
    if (borough) {
        fetchData.borough = borough;
    }

    const neighborhoods = await pollutionCol.distinct('neighborhood', fetchData);
    return neighborhoods.sort();
}
export default { getNeighborhoodScore, getAllNeighborhoods, getHistoricalData };
