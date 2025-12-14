import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Checks if a value is a non-empty string and trims it.
 * @param {string} val - The value to check.
 * @param {string} varName - The name of the variable (for error messages).
 * @returns {string} The trimmed string.
 * @throws {Error} If validation fails.
 */
export const checkString = (val, varName) => {
    if (!val) throw `${varName} must be supplied.`;
    if (typeof val !== 'string') throw `${varName} must be a string.`;
    val = val.trim();
    if (val.length === 0) throw `${varName} cannot be an empty string or just spaces.`;
    return val;
};

/**
 * Checks username format: must be 4+ characters, no spaces.
 * @param {string} username - The username to check.
 * @returns {string} The validated and trimmed username.
 * @throws {Error} If validation fails.
 */
export const checkUsername = (username) => {
    username = checkString(username, 'Username');
    if (username.length < 4) throw 'Username must be at least 4 characters long.';
    if (username.includes(' ')) throw 'Username cannot contain spaces.';
    return username;
};

/**
 * Checks password complexity: must be 8+ chars, contain 1 lowercase, 1 uppercase, 1 number, and 1 special character.
 * @param {string} password - The password to check.
 * @returns {string} The validated and trimmed password.
 * @throws {Error} If validation fails.
 */
export const checkPassword = (password) => {
    password = checkString(password, 'Password');

    // 1. Minimum 8 characters
    // 2. At least one lowercase letter (?=.*[a-z])
    // 3. At least one uppercase letter (?=.*[A-Z])
    // 4. At least one number (?=.*[0-9])
    // 5. At least one special character (?=.*[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-])
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-])(?=.{8,})/;

    if (!passwordRegex.test(password)) {
        throw 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character.';
    }

    return password;
};

export const checkNumber = (val, varName) => {
  if (val === null || val === undefined) throw `${varName} is required.`;
  if (typeof val !== 'number' || Number.isNaN(val)) {
    throw `${varName} must be a valid number.`;
  }
  if (val < 0) throw `${varName} cannot be negative.`;
  return val;
};

export const checkAge = (age, varName) => {
    if (age === null || age === undefined || age === '') {
        throw `${varName} must be provided.`;
    }   
    let parsedAge;
    if (typeof age === 'string') {
        parsedAge = parseInt(age.trim());
    } else if (typeof age === 'number') {
        parsedAge = age;
    } else {
        throw `${varName} must be a number or a string representing a number.`;
    }

    if (isNaN(parsedAge)) {
        throw `${varName} must be a valid number.`;
    }

    if (!Number.isInteger(parsedAge)) {
        throw `${varName} must be a whole number (integer).`;
    }
    
    const MIN_AGE = 18;
    const MAX_AGE = 120; 
    
    if (parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
        throw `${varName} must be between ${MIN_AGE} and ${MAX_AGE}.`;
    }

    return parsedAge;
};

/**
 * Checks if a value is a valid MongoDB ObjectId.
 * @param {string} id The ID to check.
 * @param {string} varName The name of the variable being checked.
 * @returns {string} The validated and trimmed ID.
 * @throws {Error} If the ID is invalid.
 */
export const checkId = (id, varName) => {
    if (!id) throw `Error: ${varName} must be provided.`;
    if (typeof id !== 'string') throw `Error: ${varName} must be a string.`;
    id = id.trim();
    if (id.length === 0) throw `Error: ${varName} cannot be an empty string.`;
    if (!ObjectId.isValid(id)) throw `Error: ${varName} is not a valid MongoDB ObjectId.`;
    return id;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEOJSON_FILE_PATH = path.join(__dirname, '..', 'data', 'neighborhoods.geojson');

let GEOJSON_FEATURES = [];
try {
    const rawData = fs.readFileSync(GEOJSON_FILE_PATH, 'utf8');
    const geojson = JSON.parse(rawData);
    if (geojson && Array.isArray(geojson.features)) {
        GEOJSON_FEATURES = geojson.features;
        console.log(`Successfully loaded ${GEOJSON_FEATURES.length} GeoJSON features from ${GEOJSON_FILE_PATH}`);
    } else {
        console.error('Error: GeoJSON file loaded but does not contain a valid "features" array.');
    }
} catch (error) {
    console.error(`ERROR: Could not load neighborhoods.geojson file from ${GEOJSON_FILE_PATH}.`, error.message);
}


let neighborhoodLookupCache = null;

const getNeighborhoodMap = () => {
    if (neighborhoodLookupCache) {
        return neighborhoodLookupCache;
    }

    const map = {};
    for (const feature of GEOJSON_FEATURES) {
        const properties = feature.properties;
        
        const name = properties?.ntaname;
        const borough = properties?.boroname;

        if (!name || !borough) {
            console.warn('Skipping GeoJSON feature due to missing ntaname or boroname property:', properties);
            continue;
        }
        
        const key = name.toLowerCase().trim();

        map[key] = {
            neighborhood: name, 
            borough: borough
        };
    }

    neighborhoodLookupCache = map;
    return map;
};


/**
 * Simplifies the location lookup by validating a user-provided neighborhood name 
 * against a known list and returning the corresponding standardized name and borough.
 * @param {string} rawNeighborhoodName The neighborhood name provided by the user.
 * @returns {object} { neighborhood: string, borough: string }
 */
export const lookupNeighborhoodAndBorough = async (rawNeighborhoodName) => {
    const neighborhoodMap = getNeighborhoodMap();
    
    let neighborhood = checkString(rawNeighborhoodName, "Neighborhood Name");
    
    const normalizedName = neighborhood.toLowerCase().trim();

    const locationData = neighborhoodMap[normalizedName];

    if (!locationData) {
        throw new Error(`The neighborhood "${neighborhood}" is not recognized or supported by BreatheWatch. Please ensure you are entering a valid NYC neighborhood name.`);
    }
    return { 
        neighborhood: locationData.neighborhood, 
        borough: locationData.borough 
    };
};
const exportedMethods = {
    checkString,
    checkUsername,
    checkPassword,
    checkNumber,
    checkPassword,
    checkAge,
    checkId,
    lookupNeighborhoodAndBorough
};

export default exportedMethods;