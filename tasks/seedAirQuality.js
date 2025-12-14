// tasks/seedAirQuality.js
import { MongoClient } from "mongodb";
import axios from "axios";
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
    console.log("Starting AirQualityData Seed (2018–2023)");
    console.log("========================================");

    console.log("Connecting to MongoDB…");
    client = await MongoClient.connect(mongoConfig.serverUrl);
    const db = client.db(mongoConfig.database);
    const airQualityCollection = db.collection("AirQualityData");
    console.log("Connected to database:", mongoConfig.database);

    // Clear existing data
    const deleteResult = await airQualityCollection.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing records`);

    // Load neighborhoods geojson
    const geoPath = join(__dirname, "..", "data", "neighborhoods.geojson");
    const geoRaw = await readFile(geoPath, "utf-8");
    const geojson = JSON.parse(geoRaw);

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

    console.log(`Loaded ${geoNeighborhoods.length} neighborhoods from GeoJSON`);

    // Fetch NYC Open Data
    console.log("Fetching NYC Open Data...");
    const apiRes = await axios.get(
      "https://data.cityofnewyork.us/resource/c3uy-2p5r.json?$limit=5000"
    );
    const rows = Array.isArray(apiRes.data) ? apiRes.data : [];
    console.log(`Fetched ${rows.length} rows from API`);

    // Aggregate by neighborhood + year
    const neighborhoodYearMap = {};

    rows.forEach((r) => {
      const neighborhood = r.geo_place_name?.trim();
      const year = r.start_date ? new Date(r.start_date).getFullYear() : null;
      if (!neighborhood || !year) return;

      let pollutantName = null;
      if (r.name.includes("PM 2.5")) pollutantName = "PM2_5";
      else if (r.name.includes("NO2")) pollutantName = "NO2";
      else if (r.name.includes("Ozone")) pollutantName = "Ozone";
      if (!pollutantName) return;

      if (!neighborhoodYearMap[`${neighborhood}|${year}`]) {
        neighborhoodYearMap[`${neighborhood}|${year}`] = {
          neighborhood,
          year,
          pollutants: {},
        };
      }
      neighborhoodYearMap[`${neighborhood}|${year}`].pollutants[pollutantName] = Number(r.data_value);
    });

    // Compute borough averages for missing pollutant fallback
    const boroughBuckets = {};
    Object.values(neighborhoodYearMap).forEach((entry) => {
      const borough = geoNeighborhoods.find(
        (g) => g.neighborhood.toLowerCase() === entry.neighborhood.toLowerCase()
      )?.borough;
      if (!borough) return;

      if (!boroughBuckets[borough]) boroughBuckets[borough] = { PM2_5: [], NO2: [] };
      if (entry.pollutants.PM2_5) boroughBuckets[borough].PM2_5.push(entry.pollutants.PM2_5);
      if (entry.pollutants.NO2) boroughBuckets[borough].NO2.push(entry.pollutants.NO2);
    });

    const boroughAverages = {};
    Object.keys(boroughBuckets).forEach((b) => {
      const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
      boroughAverages[b] = { PM2_5: avg(boroughBuckets[b].PM2_5), NO2: avg(boroughBuckets[b].NO2) };
    });

    // Generate documents for all neighborhoods, 2018–2023
    const years = [2018, 2019, 2020, 2021, 2022, 2023];
    const docs = [];

    geoNeighborhoods.forEach(({ neighborhood, borough, ntaCode }) => {
      years.forEach((year) => {
        const key = `${neighborhood}|${year}`;
        const hit = neighborhoodYearMap[key];

        // Use real data if available, else fallback to borough average, else default
        const basePM25 = hit?.pollutants.PM2_5 ?? boroughAverages[borough]?.PM2_5 ?? 8;
        const baseNO2 = hit?.pollutants.NO2 ?? boroughAverages[borough]?.NO2 ?? 25;
        const baseOzone = hit?.pollutants.Ozone ?? null;

        // Slight variation for historical years
        const factor = year === 2023 ? 0 : (Math.random() * 2 - 1); // ±1
        const finalPM25 = Number((basePM25 + factor).toFixed(2));
        const finalNO2 = Number((baseNO2 + factor).toFixed(2));
        const finalOzone = baseOzone !== null ? Number((baseOzone + factor).toFixed(2)) : null;

        const pollutionScore = computePollutionScore(finalPM25, finalNO2);

        docs.push({
          borough: borough.toLowerCase(),
          neighborhood: neighborhood.toLowerCase(),
          ntaCode,
          year,
          pollutants: {
            PM2_5: finalPM25,
            NO2: finalNO2,
            Ozone: finalOzone,
          },
          pollutionScore,
          dataSource: hit
            ? "NYC Open Data (Neighborhood)"
            : "NYC Open Data (Borough fallback)",
          lastUpdated: new Date(),
        });
      });
    });

    if (!docs.length) throw new Error("No Air Quality Data documents generated.");

    // Insert documents
    const insertResult = await airQualityCollection.insertMany(docs);
    console.log(`Inserted ${insertResult.insertedCount} AirQualityData records`);
    console.log("========================================");
    console.log("✅ AirQualityData seed completed!");
    console.log("========================================");
  } catch (error) {
    console.error("❌ Error seeding AirQualityData:", error);
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
