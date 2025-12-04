import {dbConnection} from '../config/mongoConnection.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcryptjs';
import validation from '../validation.js';

const saltRounds = 10;

/**
 * Gets the users collection.
 * @returns {Promise<Collection>} The MongoDB 'users' collection.
 */
const getCollection = async () => {
  const db = await dbConnection.dbConnection();
  return db.collection('users');
};

/**
 * Creates a new user with validation on the server/DB side.
 * @param {string} username 
 * @param {string} password 
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {Promise<{_id: ObjectId, username: string, firstName: string, lastName: string}>} The newly created user.
 */
export const createUser = async (username, password, firstName, lastName) => {
  //DB/Server-side Validation
  username = validation.checkString(username, 'Username');
  password = validation.checkString(password, 'Password');
  firstName = validation.checkString(firstName, 'First Name');
  lastName = validation.checkString(lastName, 'Last Name');

  //Additional username validation (e.g., length, format)
  if (username.length < 4 || username.includes(' ')) {
    throw 'Username must be at least 4 characters long and contain no spaces.';
  }
  
  //Additional password validation (e.g., complexity, length)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|;:'",.<>/?\\~`]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw 'Password must be at least 8 characters long and contain: one lowercase letter, one uppercase letter, one number, and one special character.';
  }

  const usersCollection = await getCollection();
  
  //Check for existing user (case-insensitive for a simple check)
  const existingUser = await usersCollection.findOne({ 
    username: { $regex: new RegExp(`^${username}$`, 'i') } 
  });
  if (existingUser) {
    throw 'A user with that username already exists.';
  }

  //Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = {
    username: username,
    hashedPassword: hashedPassword,
    firstName: firstName,
    lastName: lastName,
    profileDescription: '' 
  };

  const insertInfo = await usersCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw 'Could not add user';
  }

  const newId = insertInfo.insertedId.toString();
  const user = await usersCollection.findOne({_id: new ObjectId(newId)}, {projection: {hashedPassword: 0}});
  if (!user) {
    throw 'User not found after creation.';
  }

  return user;
};

/**
 * Checks a user's credentials for login.
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{_id: ObjectId, username: string, firstName: string, lastName: string}>} The authenticated user.
 */
export const checkUser = async (username, password) => {
  //DB/Server-side Validation
  username = validation.checkString(username, 'Username');
  password = validation.checkString(password, 'Password');

  const usersCollection = await getCollection();
  
  //Find user by username
  const user = await usersCollection.findOne({
    username: { $regex: new RegExp(`^${username}$`, 'i') } 
  });

  if (!user) {
    throw 'Invalid username or password.';
  }

  //Compare the provided password with the stored hash
  const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

  if (!passwordMatch) {
    throw 'Invalid username or password.';
  }

  //Return user without the hash
  const {hashedPassword, ...userWithoutHash} = user;
  return userWithoutHash;
};

/**
 * Gets a user by ID.
 * @param {string} id 
 * @returns {Promise<object>} The user object without the password hash.
 */
export const getUserById = async (id) => {
    //Basic ID validation
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw 'User ID must be a non-empty string.';
    }
};    


/**
 * Updates a user's profile description.
 * @param {string} id 
 * @param {string} description 
 * @returns {Promise<object>} The updated user object without the password hash.
 */
export const updateProfileDescription = async (id, description) => { // <-- THIS IS THE NEW FUNCTION
    //DB-Level Validation for ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) throw 'User ID must be a non-empty string.';
    if (!ObjectId.isValid(id)) throw 'Invalid ObjectId.';

    //DB-Level Validation for Description
    if (typeof description !== 'string') throw 'Profile description must be a string.';
    description = description.trim(); 
    if (description.length > 500) throw 'User description must be 500 characters or less.';

    const usersCollection = await getCollection();
    const updateInfo = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { profileDescription: description } }
    );
    
    if (updateInfo.modifiedCount === 0 && updateInfo.matchedCount === 0) {
        throw 'Could not update profile description or user not found.';
    }
    
    return await getUserById(id);
};