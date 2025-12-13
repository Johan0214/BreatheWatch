import { MongoClient } from "mongodb";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { computePollutionScore } from "../data/AirQualityData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongoConfig = {
  serverUrl: "mongodb://localhost:27017/",
  database: "breathewatch_database",
};

const main = async () => {
  let client;

  try {
    console.log("========================================");
    console.log("Starting AirQualityData Seed (2023)");
    console.log("========================================");

    console.log("Connecting to MongoDB…");
    client = await MongoClient.connect(mongoConfig.serverUrl);
    const db = client.db(mongoConfig.database);
    console.log("connected to: ", mongoConfig.database);

    const airQualityCollection = db.collection("AirQualityData");
    const deleteResult = await airQualityCollection.deleteMany({ year: 2023 });
    console.log(`Cleared ${deleteResult.deletedCount} existing 2023 records`);

    const dataPath = join(__dirname, "..", "data", "air_quality_2023.json");
    const raw = await readFile(dataPath, "utf-8");

    const records = JSON.parse(raw);
    if (!Array.isArray(records) || records.length === 0) {
      console.log("No records found in pollution json");
      return;
    }

    const geoPath = join(__dirname, "..", "data", "neighborhoods.geojson");
    const geoRaw = await readFile(geoPath, "utf-8");
    const geojson = JSON.parse(geoRaw);
    console.log(Object.keys(geojson.features[0].properties));

    const geoNeighborhoods = geojson.features
      .map((f) => {
        const neighborhood = (
          f.properties.ntaname ||
          f.properties.nta_name ||
          f.properties.neighborhood ||
          f.properties.name ||
          ""
        ).trim();

        const borough = (
            f.properties.boro_name ||
            f.properties.boroname ||
            f.properties.borough || 
            ""
        ).trim();
        const ntaCode = f.properties.nta_code || f.properties.ntacode || null;

        return { neighborhood, borough, ntaCode };
      })
      .filter((x) => x.neighborhood && x.borough);

    const datasetLookup = {};

    records.forEach((r) => {
      const neighborhood = (r.neighborhood || "").trim();
      const borough = (r.borough || "").trim();
      if (!neighborhood || !borough) return;

      const pm25 = Number(r.pm25);
      const no2 = Number(r.no2);

      if (!Number.isNaN(pm25) && !Number.isNaN(no2)) {
        datasetLookup[neighborhood.toLowerCase()] = {
          borough,
          pm25,
          no2,
        };
      }
    });

    const boroughBuckets = {};

    Object.values(datasetLookup).forEach((d) => {
      if (!boroughBuckets[d.borough]) {
        boroughBuckets[d.borough] = { pm25: [], no2: [] };
      }
      boroughBuckets[d.borough].pm25.push(d.pm25);
      boroughBuckets[d.borough].no2.push(d.no2);
    });

    const boroughAverages = {};

    Object.keys(boroughBuckets).forEach((b) => {
      const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
      boroughAverages[b] = {
        pm25: avg(boroughBuckets[b].pm25),
        no2: avg(boroughBuckets[b].no2),
      };
    });

    const docs = geoNeighborhoods.map(({ neighborhood, borough, ntaCode }) => {
      const hit = datasetLookup[neighborhood.toLowerCase()];

      const finalPM25 = hit?.pm25 ?? boroughAverages[borough]?.pm25 ?? 8;

      const finalNO2 = hit?.no2 ?? boroughAverages[borough]?.no2 ?? 25;

      const pollutionScore = computePollutionScore(finalPM25, finalNO2);

      return {
        borough,
        neighborhood,
        ntaCode,
        year: 2023,
        pollutants: {
          PM2_5: Number(finalPM25.toFixed(2)),
          NO2: Number(finalNO2.toFixed(2)),
          Ozone: null,
        },
        pollutionScore,
        dataSource: hit
          ? "NYC Open Data (Neighborhood)"
          : "NYC Open Data (Borough-derived NTA)",
        lastUpdated: new Date(),
      };
    });

    if (!docs.length) {
  throw new Error("No Air Quality Data documents generated.");
}

    const insertResult = await airQualityCollection.insertMany(docs);
    console.log(
      `Inserted ${insertResult.insertedCount} AirQualityData records`
    );
    console.log("NTA neighborhoods:", geoNeighborhoods.length);
    console.log("Dataset neighborhoods:", Object.keys(datasetLookup).length);
    console.log("Docs to insert:", docs.length);

    console.log("========================================");
    console.log("AirQualityData seed completed!");
    console.log("========================================");
  } catch (error) {
    console.error("Error in seeding air quality data: ", error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log("Mongo connection closed");
    }
  }
};

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
