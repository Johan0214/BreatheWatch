import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import airQualityRoutes from './routes/airQuality.js';
import pollutionRoutes from './routes/pollutionSources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

/* ===========================
   HANDLEBARS SETUP
   =========================== */
app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: 'main',
    helpers: {
      eq: (a, b) => a === b,
      gt: (a, b) => a > b,
      lt: (a, b) => a < b,
      add: (a, b) => a + b,
      subtract: (a, b) => a - b,
      toString: (value) => (value ? value.toString() : ''),
      ifEquals: function(arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
      }
    }
  })
);
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

/* ===========================
   MIDDLEWARE
   =========================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(join(__dirname, 'public')));

/* ===========================
   SESSION
   =========================== */
app.use(
  session({
    name: 'BreatheWatchSession',
    secret: 'ThisIsASecretKey123!',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
      httpOnly: true,
      secure: false
    }
  })
);

/* ===========================
   EXPOSE SESSION USER TO VIEWS
   =========================== */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/* ===========================
   ROOT REDIRECT
   =========================== */
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  } else {
    return res.redirect('/login');
  }
});

/* ===========================
   ROUTES
   =========================== */
app.use('/', authRoutes);
app.use('/home', (await import('./routes/home.js')).default);
app.use('/dashboard', (await import('./routes/dashboard.js')).default);
app.use('/reports', (await import('./routes/reports.js')).default);
app.use('/airQuality', airQualityRoutes);
app.use('/pollution-sources', pollutionRoutes);


/* ===========================
   GLOBAL ERROR HANDLER
   =========================== */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Error', message: 'Something went wrong!' });
});

/* ===========================
   START SERVER
   =========================== */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
