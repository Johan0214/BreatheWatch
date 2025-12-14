import { airQualityData } from "../config/mongoCollections.js";
import validation from "../util/validation.js";
import { lookupNeighborhoodAndBorough } from '../util/validation.js';

const normalizeName = (val, varName) => {
  const s = validation.checkString(val, varName);
  return s.trim();
};

export const computePollutionScore = (pm25, no2) => {
  pm25 = validation.checkNumber(pm25, "PM2.5");
  no2 = validation.checkNumber(no2, "NO2");

  if (pm25 <= 7 && no2 <= 20) {
    return "Safe";
  }

  if (pm25 <= 12 && no2 <= 35) {
    return "Moderate";
  }

  return "High";
};

export const upsertAirQualityRecord = async ({
  borough,
  neighborhood,
  year,
  pm25,
  no2,
  ozone = null,
  dataSource = "NYC Open Data - Air Quality",
  lastUpdated = new Date(),
}) => {
  const collection = await airQualityData();

  borough = normalizeName(borough, "Borough");
  neighborhood = normalizeName(neighborhood, "Neighborhood");

  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw `Year must be an integer`;
  }

  const PM2_5 = validation.checkNumber(pm25, "PM2.5");
  const NO2 = validation.checkNumber(no2, "NO2");

  let Ozone = null;

  if (ozone !== null && ozone !== undefined) {
    Ozone = validation.checkNumber(ozone, "Ozone");
  }

  const pollutionScore = computePollutionScore(PM2_5, NO2);

  const doc = {
    borough,
    neighborhood,
    year,
    pollutants: {
      PM2_5,
      NO2,
      Ozone,
    },
    pollutionScore,
    dataSource,
    lastUpdated: new Date(lastUpdated),
  };

  const existing = await collection.findOne({ borough, neighborhood, year });

   if (existing) {
  await collection.updateOne({ _id: existing._id }, { $set: doc });
  return await collection.findOne({ _id: existing._id });
} else {
  await collection.insertOne(doc);
  return await collection.findOne({ borough, neighborhood, year });
}
};

export const getByNeighborhoodYear = async (borough, neighborhood, year = 2023) => {
  const collection = await airQualityData();

  borough = normalizeName(borough, "Borough");
  neighborhood = normalizeName(neighborhood, "Neighborhood");

  // Use regex for partial, case-insensitive match
  const doc = await collection.findOne({
    borough: { $regex: `^${borough}$`, $options: "i" },
    neighborhood: { $regex: neighborhood, $options: "i" },
    year,
  });

  if (!doc) {
    console.warn(`No air-quality data found for ${neighborhood}, ${borough} for year ${year}`);
    return null;
  }

  return doc;
};

export const compareNeighborhoods = async (neighborhoodNames) => {
    if (!Array.isArray(neighborhoodNames) || neighborhoodNames.length === 0) {
        throw new Error("Neighborhood names array must be provided.");
    }

    const comparisonPromises = neighborhoodNames.map(async (rawName) => {
        try {
            const { neighborhood, borough } = await lookupNeighborhoodAndBorough(rawName);

            const airData = await getByNeighborhoodYear(borough, neighborhood, 2023);
 
            if (!airData) {
                throw new Error(`Air quality data not available for ${neighborhood}, ${borough}.`);
            }

            const pmValue = Number(airData.pollutants.PM2_5);
            const no2Value = Number(airData.pollutants.NO2);

            const riskData = computePollutionScore(pmValue, no2Value);
            
            return {
                success: true,
                inputName: rawName,
                neighborhood: neighborhood,
                borough: borough,
                pm25Value: pmValue.toFixed(2), 
                no2Value: no2Value.toFixed(2), 
                overallRisk: riskData 
            };
        } catch (e) {
            console.error(`Error processing neighborhood "${rawName}": ${e.message}`);
            return {
                success: false,
                inputName: rawName,
                error: e.message || e.toString()
            };
        }
    });

    return Promise.all(comparisonPromises);
};


export const getAllForMap2023 = async () => {
  const collection = await airQualityData();

  const docs = await collection
    .find(
      { year: 2023 },
      {
        projection: {
          _id: 0,
          borough: 1,
          neighborhood: 1,
          pollutants: 1,
          pollutionScore: 1,
        },
      }
    )
    .toArray();

  return docs;
};

const exportedMethods = {
  computePollutionScore,
  upsertAirQualityRecord,
  getByNeighborhoodYear,
  getAllForMap2023,
  compareNeighborhoods
};

export default exportedMethods;
