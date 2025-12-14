import { Router } from 'express';
import { userData } from '../data/index.js';
import xss from 'xss';
import validation from '../helpers/validation.js';

const router = Router();

// Redirect logged-in users to /home
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) return res.redirect('/home');
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
        _id: user._id.toString(), // must be string
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
        _id: user._id.toString(),
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
router.get('/logout', validation.protectRoute,(req, res) => {
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
// PROFILE ROUTES
router.get('/profile', validation.protectRoute,async (req, res) => {
    if (req.session.user.isProfileConfigured === false) return res.redirect('/profile/setup');

    try {
        const userFromDb = await userData.getUserById(req.session.user._id);
        return res.render('profile', {
            title: 'Your Profile',
            user: userFromDb,
            isLoggedIn: true
        });
    } catch (e) {
        console.error(e);
        return res.status(500).render('error', { title: 'Error Loading Profile', error: e.toString(), isLoggedIn: true });
    }
});

router.post('/profile', validation.protectRoute, async (req, res) => {
    let { borough, neighborhood, age, profileDescription } = req.body;
    let errors = [];

    try {
        borough = xss(borough).trim();
        neighborhood = xss(neighborhood).trim();
        profileDescription = xss(profileDescription).trim();
        age = parseInt(age);

        if (!borough) throw 'Borough is required';
        if (!neighborhood) throw 'Neighborhood is required';
        validation.checkAge(age, 'Age');

    } catch (e) {
        errors.push(e);
    }

    if (errors.length > 0) {
        return res.status(400).render('profile', {
            title: 'Your Profile',
            errors,
            hasErrors: true,
            user: { ...req.session.user, borough, neighborhood, age, profileDescription },
            isLoggedIn: true
        });
    }

    const updatedUser = await userData.updateUserProfile(
        req.session.user._id,
        borough,
        neighborhood,
        age,
        profileDescription
    );

    req.session.user = { ...updatedUser };

    // Existing profile update -> redirect to /dashboard with success query
    return res.redirect('/dashboard?success=true');
});


router.get('/profile/setup', validation.protectRoute, async (req, res) => {
    const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
    return res.render('profileSetup', {
        title: 'Complete Profile Setup',
        user: req.session.user,
        isLoggedIn: true,
        boroughs
    });
});


router.post('/profile/setup', validation.protectRoute, async (req, res) => {
    let { borough, neighborhood, age, profileDescription } = req.body;
    let errors = [];

    try {
        borough = xss(borough).trim();
        neighborhood = xss(neighborhood).trim();
        profileDescription = xss(profileDescription).trim();
        age = parseInt(age);

        if (!borough) throw 'Borough is required';
        if (!neighborhood) throw 'Neighborhood is required';
        validation.checkAge(age, 'Age');

    } catch (e) {
        errors.push(e);
    }

    if (errors.length > 0) {
        return res.status(400).render('profileSetup', {
            title: 'Complete Profile Setup',
            errors,
            hasErrors: true,
            user: { borough, neighborhood, age, profileDescription },
            isLoggedIn: true
        });
    }

    const updatedUser = await userData.updateUserProfile(
        req.session.user._id,
        borough,
        neighborhood,
        age,
        profileDescription
    );

    req.session.user = {
        _id: updatedUser._id.toString(),
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        borough: updatedUser.borough,
        neighborhood: updatedUser.neighborhood,
        age: updatedUser.age,
        profileDescription: updatedUser.profileDescription,
        isProfileConfigured: updatedUser.isProfileConfigured
    };

    // First-time setup -> redirect to /home
    return res.redirect('/home');
});

export default router;