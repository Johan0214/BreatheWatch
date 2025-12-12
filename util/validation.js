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

const exportedMethods = {
    checkString,
    checkUsername,
    checkPassword,
    checkAge
};

export default exportedMethods;