import { Router } from 'express';
import { userData } from '../data/index.js';
import xss from 'xss';
import validation from '../util/validation.js';

const router = Router();

// Redirect logged-in users to /home
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) return res.redirect('/home');
  next();
};

// Protect routes requiring login
const protectRoute = (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  next();
};

/* ===========================
   LOGIN
=========================== */
router.get('/login', redirectIfAuthenticated, (req, res) =>
  res.render('login', { title: 'Login', user: {} })
);

router.post('/login', redirectIfAuthenticated, async (req, res) => {
  try {
    let { username, password } = req.body;
    username = xss(username);
    password = xss(password);

    username = validation.checkUsername(username);
    password = validation.checkPassword(password);

    const user = await userData.checkUser(username, password);

    // After successful login
    req.session.user = {
        userId: user._id.toString(), // must be string
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
    };
    return res.redirect('/home');
  } catch (e) {
    return res.status(401).render('login', {
      title: 'Login',
      error: e,
      user: { username: req.body.username }
    });
  }
});

/* ===========================
   SIGNUP
=========================== */
router.get('/signup', (req, res) =>
  res.render('signup', { title: 'Sign Up', user: {} })
);

router.post('/signup', async (req, res) => {
  try {
    let { firstName, lastName, username, password, confirmPassword } = req.body;
    firstName = xss(firstName);
    lastName = xss(lastName);
    username = xss(username);
    password = xss(password);
    confirmPassword = xss(confirmPassword);

    if (password !== confirmPassword) throw 'Passwords do not match';

    const user = await userData.createUser(firstName, lastName, username, password);
    req.session.user = {
        userId: user._id.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileDescription: user.profileDescription,
        city: user.city,
        state: user.state,
        age: user.age,
        isProfileConfigured: user.isProfileConfigured
    };

    return res.redirect('/profile/setup');
  } catch (e) {
    return res.status(400).render('signup', {
      title: 'Sign Up',
      error: e,
      user: req.body
    });
  }
});

/* ===========================
   LOGOUT
=========================== */
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('BreatheWatchSession');
  res.render('logout', { title: 'Logged Out' });
});

router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home'); // already logged in
  }
  return res.redirect('/login'); // not logged in
});

/* ========================
PROFILE SETUP
========================== */
router.get('/profile', async (req, res) => {
    if (req.session.user.isProfileConfigured === false) {
        return res.redirect('/profile/setup');
    }

    try {
        const userFromDb = await userData.getUserById(req.session.user.userId);
        return res.render('profileView', {
            title: 'Your Profile',
            user: userFromDb,
            isLoggedIn: true
        });
    } catch (e) {
        return res.status(500).render('error', {
            title: 'Error Loading Profile',
            error: e.toString(),
            isLoggedIn: true
        });
    }
});

router.post('/profile', async (req, res) => {
    const {city, state, age, profileDescription} = req.body;
    let errors = [];

    if (req.session.user.isProfileConfigured === false) {
        return res.status(403).redirect('/profile/setup'); 
    }
    
    try {
        const sanitizedCity = xss(city);
        const sanitizedState = xss(state);
        const parsedAge = age; 

        validation.checkString(sanitizedCity, 'City');
        validation.checkString(sanitizedState, 'State');
        validation.checkAge(parsedAge, 'Age'); 
        validation.checkString(profileDescription, 'Profile Description', true); 

    } catch (e) {
        errors.push(e);
    }
    
    if (errors.length > 0) {
        return res.status(400).render('profileView', {
            title: 'Your Profile',
            errors: errors,
            hasErrors: true,
            user: {...req.session.user, city, state, age, profileDescription},
            isLoggedIn: true
        });
    }

    try {
        const updatedUser = await userData.updateUserProfile(
            req.session.user.userId, 
            xss(city), 
            xss(state), 
            parseInt(age), 
            xss(profileDescription)
        );
        
        req.session.user = {
            userId: updatedUser._id.toString(), 
            firstName: updatedUser.firstName, 
            lastName: updatedUser.lastName, 
            username: updatedUser.username, 
            profileDescription: updatedUser.profileDescription,
            city: updatedUser.city,
            state: updatedUser.state,
            age: updatedUser.age,
            isProfileConfigured: updatedUser.isProfileConfigured
        };
        
        return res.redirect('/profile?success=true');
        
    } catch (e) {
        errors.push(e.toString());
        return res.status(500).render('profileView', {
            title: 'Your Profile',
            errors: errors,
            hasErrors: true,
            user: {...req.session.user, city, state, age, profileDescription},
            isLoggedIn: true
        });
    }
});

router.get('/profile/setup', async (req, res) => {
    return res.render('profileSetup', {
        title: 'Complete Profile Setup',
        user: req.session.user,
        isLoggedIn: true
    });
});

router.post('/profile/setup', async (req, res) => {
    const {city, state, age, profileDescription} = req.body;
    let errors = [];
    
    try {
        const sanitizedCity = xss(city);
        const sanitizedState = xss(state);
        const parsedAge = age; 

        validation.checkString(sanitizedCity, 'City');
        validation.checkString(sanitizedState, 'State');
        validation.checkAge(parsedAge, 'Age'); 
        validation.checkString(profileDescription, 'Profile Description', true); 

    } catch (e) {
        errors.push(e);
    }
    
    if (errors.length > 0) {
        return res.status(400).render('profileSetup', {
            title: 'Complete Profile Setup',
            errors: errors,
            hasErrors: true,
            user: {city, state, age, profileDescription},
            isLoggedIn: true
        });
    }

    try {
        const updatedUser = await userData.updateUserProfile(
            req.session.user.userId, 
            xss(city), 
            xss(state), 
            parseInt(age), 
            xss(profileDescription)
        );
        
        req.session.user = {
            userId: updatedUser._id.toString(), 
            firstName: updatedUser.firstName, 
            lastName: updatedUser.lastName, 
            username: updatedUser.username, 
            profileDescription: updatedUser.profileDescription,
            city: updatedUser.city,
            state: updatedUser.state,
            age: updatedUser.age,
            isProfileConfigured: updatedUser.isProfileConfigured
        };

        return res.redirect('/home');
        
    } catch (e) {
        errors.push(e.toString());
        return res.status(500).render('profileSetup', {
            title: 'Complete Profile Setup',
            errors: errors,
            hasErrors: true,
            user: {city, state, age, profileDescription},
            isLoggedIn: true
        });
    }
});

export default router;