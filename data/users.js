import {dbConnection} from '../config/mongoConnection.js';
import mongoCollections from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcryptjs';
import validation from '../util/validation.js'; // Assumes validation.js is in the parent directory
import xss from 'xss';

const users = mongoCollections.users;
const saltRounds = 10;

/**
 * Creates a new user with validation on the server/DB side.
 * @param {string} username 
 * @param {string} password 
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {Promise<{_id: ObjectId, username: string, firstName: string, lastName: string}>} The newly created user.
 */
export const createUser = async (username, password, firstName, lastName) => {
  //validation.checkString handles the string, type, and trim checks.
  firstName = validation.checkString(firstName, 'First Name');
  lastName = validation.checkString(lastName, 'Last Name');
  username = validation.checkUsername(username); 
  password = validation.checkPassword(password);

  const sanitizedFirstName = xss(firstName);
  const sanitizedLastName = xss(lastName);
  const sanitizedUsername = xss(username.toLowerCase()); 
  const sanitizedPassword = xss(password);

  const usersCollection = await users();
  
  //Check for existing user (case-insensitive)
  const existingUser = await usersCollection.findOne({ 
    username: { $regex: new RegExp(`^${username}$`, 'i') } 
  });
  if (existingUser) {
    throw 'A user with that username already exists.';
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = {
    username: username,
    hashedPassword: hashedPassword,
    firstName: firstName,
    lastName: lastName,
    profileDescription: '',
    dateJoined: new Date()
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
  username = validation.checkString(username, 'Username');
  password = validation.checkString(password, 'Password');

  const sanitizedUsername = xss(username.toLowerCase());
  const sanitizedPassword = xss(password);

  const usersCollection = await users();
  const user = await usersCollection.findOne({
    username: { $regex: new RegExp(`^${username}$`, 'i') } 
  });

  if (!user) {
    throw 'Invalid username or password.';
  }

  const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!passwordMatch) {
    throw 'Invalid username or password.';
  }

  const {_id, username: uName, firstName, lastName} = user;
  return {_id, username: uName, firstName, lastName};
};

/**
 * Gets a user by ID.
 * @param {string} id 
 * @returns {Promise<object>} The user object without the password hash.
 */
export const getUserById = async (id) => {
    id = validation.checkString(id, 'User ID');
    if (!ObjectId.isValid(id)) throw 'Invalid ObjectId.';
    
    const usersCollection = await users();
    const user = await usersCollection.findOne({_id: new ObjectId(id)}, {projection: {hashedPassword: 0}});
    
    if (!user) {
        throw 'User not found.';
    }

    return user;
}; 	

/**
 * Updates a user's profile description.
 * @param {string} id 
 * @param {string} description 
 * @returns {Promise<object>} The updated user object without the password hash.
 */
export const updateProfileDescription = async (id, description) => {
    id = validation.checkString(id, 'User ID');
    if (!ObjectId.isValid(id)) throw 'Invalid ObjectId.';
    
    if (typeof description === 'undefined' || description === null) {
        throw 'Profile description must be supplied.';
    }
    
    let validatedDescription = validation.checkString(String(description), 'Profile Description'); 
    description = validatedDescription;
    
    if (description.length > 500) throw 'User description must be 500 characters or less.';

    const usersCollection = await users();
    const updateInfo = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { profileDescription: description } }
    );
    
    if (updateInfo.modifiedCount === 0 && updateInfo.matchedCount === 0) {
        throw 'Could not update profile description or user not found.';
    }
    
    return await getUserById(id);
};