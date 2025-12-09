// helpers/validation.js
// Input Validation Helper Functions
// Used by ALL team members for security and validation

import validator from 'validator';

// XSS Protection - sanitize user input
export const sanitizeString = (str) => {
    if (typeof str !== 'string') throw new Error('Input must be a string');
    return validator.escape(str.trim());
};

// Validate and sanitize email
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        throw new Error('Email must be provided as a string');
    }
    email = email.trim().toLowerCase();
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }
    return email;
};

// Validate password strength
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be provided');
    }
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
    }
    return password;
};

// Validate name (first/last)
export const validateName = (name, fieldName = 'Name') => {
    if (!name || typeof name !== 'string') {
        throw new Error(`${fieldName} must be provided as a string`);
    }
    name = name.trim();
    if (name.length < 2) {
        throw new Error(`${fieldName} must be at least 2 characters long`);
    }
    if (!/^[a-zA-Z\s-]+$/.test(name)) {
        throw new Error(`${fieldName} can only contain letters, spaces, and hyphens`);
    }
    return name;
};

// Validate age
export const validateAge = (age) => {
    age = Number(age);
    if (isNaN(age)) {
        throw new Error('Age must be a valid number');
    }
    if (age < 18 || age > 120) {
        throw new Error('Age must be between 18 and 120');
    }
    return age;
};

// Validate neighborhood/borough names
export const validateLocation = (location, fieldName = 'Location') => {
    if (!location || typeof location !== 'string') {
        throw new Error(`${fieldName} must be provided as a string`);
    }
    location = location.trim();
    if (location.length < 2) {
        throw new Error(`${fieldName} must be at least 2 characters long`);
    }
    return sanitizeString(location);
};

// Validate year
export const validateYear = (year) => {
    year = Number(year);
    if (isNaN(year)) {
        throw new Error('Year must be a valid number');
    }
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear) {
        throw new Error(`Year must be between 2000 and ${currentYear}`);
    }
    return year;
};

// Validate report type - KOEN'S VALIDATION
export const validateReportType = (type) => {
    const validTypes = ['Smoke', 'Odor', 'Dust', 'Other'];
    if (!validTypes.includes(type)) {
        throw new Error('Invalid report type. Must be: Smoke, Odor, Dust, or Other');
    }
    return type;
};

// Validate severity - KOEN'S VALIDATION
export const validateSeverity = (severity) => {
    const validSeverities = ['Low', 'Medium', 'High'];
    if (!validSeverities.includes(severity)) {
        throw new Error('Invalid severity level. Must be: Low, Medium, or High');
    }
    return severity;
};