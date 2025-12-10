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
router.get('/signup', redirectIfAuthenticated, (req, res) =>
  res.render('signup', { title: 'Sign Up', user: {} })
);

router.post('/signup', redirectIfAuthenticated, async (req, res) => {
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
        lastName: user.lastName
    };

    return res.redirect('/home');
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

export default router;
