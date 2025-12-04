import {Router} from 'express';
import {userData} from '../data/index.js'; 
import validation from '../validation.js';
import xss from 'xss';

const router = Router();

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    //If user is authenticated, redirect them to the main app page
    return res.redirect('/home'); 
  }
  next();
};

// Middleware to protect routes that require authentication
const protectRoute = (req, res, next) => {
    if (!req.session.user) {
        //Store the original URL in the session so they can be redirected back after login
        req.session.previousUrl = req.originalUrl;
        return res.redirect('/'); //Redirect to login
    }
    next();
};

//GET /Root redirect to login
router.route('/').get(redirectIfAuthenticated, (req, res) => {
    return res.render('login', {title: "Login"});
});

//GET /home - Main application page (requires authentication)
router.route('/home').get(protectRoute, (req, res) => {
    return res.render('index', {
        title: "BreatheWatch Dashboard",
        user: req.session.user, //Pass user info to the view
    });
});

//LOGIN

router.route('/login')
    .get(redirectIfAuthenticated, (req, res) => {
        return res.render('login', {title: "Login"});
    })
    .post(redirectIfAuthenticated, async (req, res) => {
        let {username, password} = req.body;
        
        //XSS Defense (Sanitize the user input)
        username = xss(username);
        password = xss(password);
        
        //Route-Level Validation
        try {
            username = validation.checkString(username, 'Username');
            password = validation.checkString(password, 'Password');
        } catch (e) {
            return res.status(400).render('login', {title: "Login", error: e, formData: {username}});
        }

        try {
            //DB-Level Validation & Check 
            const user = await userData.checkUser(username, password);
            
            //Set session on successful login
            req.session.user = {
                _id: user._id.toString(),
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                profileDescription: user.profileDescription || '' // Include description
            };
            
            //Check if user was trying to access a protected page
            const redirectUrl = req.session.previousUrl || '/home';
            delete req.session.previousUrl; //Clear the saved URL
            return res.redirect(redirectUrl);

        } catch (e) {
            //Invalid credentials or DB error
            return res.status(401).render('login', {title: "Login", error: e, formData: {username}});
        }
    });

//SIGNUP

router.route('/signup')
    .get(redirectIfAuthenticated, (req, res) => {
        return res.render('signup', {title: "Sign Up"});
    })
    .post(redirectIfAuthenticated, async (req, res) => {
        let {username, password, firstName, lastName} = req.body;
        
        //XSS Defense
        username = xss(username);
        password = xss(password);
        firstName = xss(firstName);
        lastName = xss(lastName);

        //Route-Level Validation
        try {
            username = validation.checkString(username, 'Username');
            password = validation.checkString(password, 'Password');
            firstName = validation.checkString(firstName, 'First Name');
            lastName = validation.checkString(lastName, 'Last Name');
            
            //Re-validate complexity checks here too
            if (username.length < 4 || username.includes(' ')) {
                throw 'Username must be at least 4 characters long and contain no spaces.';
            }
            //Password validation moved to createUser for centralized logic, but basic check remains
            if (password.length < 8) { 
                 throw 'Password must be at least 8 characters long.';
            }

        } catch (e) {
            return res.status(400).render('signup', {title: "Sign Up", error: e, formData: {username, firstName, lastName}});
        }
        
        try {
            //DB-Level Validation & Creation (happens inside userData.createUser)
            const user = await userData.createUser(username, password, firstName, lastName);
            
            //Set session on successful signup and redirect to home
            req.session.user = {
                _id: user._id.toString(),
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                profileDescription: user.profileDescription // Include description
            };
            return res.redirect('/home');
        } catch (e) {
            return res.status(500).render('signup', {title: "Sign Up", error: e, formData: {username, firstName, lastName}});
        }
    });

//PROFILE

router.route('/profile')
    //GET /profile: Renders the profile editing page.
    .get(protectRoute, async (req, res) => {
        try {
            //Fetch the latest user data (including profileDescription) using the new data function
            const user = await userData.getUserById(req.session.user._id);
            return res.render('profile', {
                title: "Edit Profile",
                user: user
            });
        } catch (e) {
            console.error(e);
            return res.status(500).render('error', {title: "Error", message: "Could not load user profile."});
        }
    })
    //POST /profile: Handles the AJAX submission to update the description.
    .post(protectRoute, async (req, res) => {
        let { profileDescription } = req.body;
        const userId = req.session.user._id;

        //XSS Defense (Sanitize the input)
        profileDescription = xss(profileDescription);
        
        //Route-Level Validation 
        try {
            if (typeof profileDescription !== 'string') throw 'Invalid input type for description.';
        } catch (e) {
            return res.status(400).json({ success: false, error: e });
        }

        try {
            //DB-Level Validation & Update
            const updatedUser = await userData.updateProfileDescription(userId, profileDescription);
            
            //Update the session with the new description for immediate use
            req.session.user.profileDescription = updatedUser.profileDescription;

            //Send back a success JSON response for the AJAX call
            return res.json({ 
                success: true, 
                message: "Profile description updated successfully!",
                description: updatedUser.profileDescription 
            });
        } catch (e) {
            //Error handling for DB or validation failures
            return res.status(500).json({ success: false, error: e });
        }
    });

//LOGOUT

router.route('/logout').get((req, res) => {
    //Destroy the session
    req.session.destroy();
    res.clearCookie('AuthCookie'); //Clear the cookie used by express-session
    return res.render('logout', {title: "Logged Out"});
});


export default router;