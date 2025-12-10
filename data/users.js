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
    const newUser = { firstName, lastName, username: username.toLowerCase(), password: hashed, createdAt: new Date() };
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

export default { createUser, checkUser, getUserById };
