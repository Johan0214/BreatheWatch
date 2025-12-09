// BreatheWatch - Main Server File
// app.js 

import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import path from 'path';
import configRoutes from './routes/index.js';

const app = express();

// Handlebars setup
app.engine(
    'handlebars',
    exphbs.engine({
        defaultLayout: 'main',
        helpers: {
            eq: (a, b) => a === b
        }
    })
);

app.set('view engine', 'handlebars');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static public folder WITHOUT __dirname
app.use(
    '/public',
    express.static(
        path.normalize(new URL('./public', import.meta.url).pathname)
    )
);

// Session configuration
app.use(
    session({
        name: 'BreatheWatchSession',
        secret: 'your-secret-key-here-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3600000, // 1 hour
            httpOnly: true,
            secure: false // Set true in production with HTTPS
        }
    })
);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Make session user available to handlebars
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Setup routes
configRoutes(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`BreatheWatch server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
