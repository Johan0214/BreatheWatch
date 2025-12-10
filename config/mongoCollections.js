
/* This will allow you to have one reference to each collection per app */
/* Feel free to copy and paste this this */
// config/mongoCollections.js
import { dbConnection } from './mongoConnection.js';

const getCollectionFn = (collection) => {
  let _col;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = db.collection(collection);
    }
    return _col;
  };
};

export const users = getCollectionFn('Users');
export const airQualityData = getCollectionFn('AirQualityData');
export const reports = getCollectionFn('Reports');
export const pollutionSources = getCollectionFn('PollutionSources');
export const recommendations = getCollectionFn('Recommendations');
