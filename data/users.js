import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import xss from 'xss';
import { users as usersCollectionFn } from '../config/mongoCollections.js';
import validation from '../util/validation.js';

const saltRounds = 12;

export const createUser = async (firstName, lastName, username, password) => {
    firstName = xss(firstName);
    lastName = xss(lastName);
    username = xss(username);
    password = xss(password);

    validation.checkString(firstName, 'First Name');
    validation.checkString(lastName, 'Last Name');
    validation.checkUsername(username, 'Username');
    validation.checkPassword(password);

    const usersCollection = await usersCollectionFn();
    const existing = await usersCollection.findOne({ username: username.toLowerCase() });
    if (existing) throw 'Username already exists.';

    const hashed = await bcrypt.hash(password, saltRounds);
    const newUser = { firstName, lastName, username: username.toLowerCase(), password: hashed, 
        profileDescription: '', 
        city: '',
        state: '',
        age: null,
        isProfileConfigured: false, createdAt: new Date() };
    const insertInfo = await usersCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Could not create user.';
    newUser._id = insertInfo.insertedId.toString();
    delete newUser.password;
    return newUser;
};

export const checkUser = async (username, password) => {
    username = validation.checkUsername(username, 'Username');
    password = validation.checkPassword(password);

    const usersCollection = await usersCollectionFn();
    const user = await usersCollection.findOne({ username: username.toLowerCase() });
    if (!user) throw 'No user found with that username.';

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw 'Invalid password.';

    user._id = user._id.toString();
    delete user.password;
    return user;
};

export const getUserById = async (id) => {
    id = validation.checkId(id);
    const usersCollection = await usersCollectionFn();
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) throw 'No user found.';
    user._id = user._id.toString();
    delete user.password;
    return user;
};

export const updateUserProfile = async (userId, city, state, age, description, isProfileConfigured = true) => {
    userId = validation.checkId(userId, 'User ID');
    
    city = validation.checkString(city, 'City', false); 
    state = validation.checkString(state, 'State', false);
    age = validation.checkAge(age, 'Age');
    description = validation.checkString(description, 'Profile Description', true); 

    if (description.length > 500) {
        throw 'Profile description must be 500 characters or less.';
    }
    
    const usersCollection = await usersCollectionFn();
    const updateInfo = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
            $set: { 
                city: city, 
                state: state, 
                age: age,
                profileDescription: description,
                isProfileConfigured: true
            } 
        }
    );

    if (updateInfo.modifiedCount === 0 && updateInfo.matchedCount === 1) {
    } else if (updateInfo.matchedCount === 0) {
        throw 'Could not find user to update.';
    }

    return await getUserById(userId);
};

export default { createUser, checkUser, getUserById, updateUserProfile };
