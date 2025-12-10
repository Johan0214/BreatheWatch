import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { ObjectId } from 'mongodb';
import { users } from './config/mongoCollections.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Handlebars setup
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    helpers: {
        eq: (a, b) => a === b,
        gt: (a, b) => a > b,
        lt: (a, b) => a < b,
        add: (a, b) => a + b,
        subtract: (a, b) => a - b,
        toString: (value) => value ? value.toString() : ''
    }
}));

app.set('view engine', 'handlebars');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    name: 'BreatheWatchSession',
    secret: 'test-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000,
        httpOnly: true,
        secure: false
    }
}));

// Make user available to templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// TEMPORARY: Mock login for testing with multiple users
app.get('/test-login', async (req, res) => {
    try {
        const usersCollection = await users();
        const userParam = req.query.user || 'test'; // default to test user

        let user;
        switch (userParam.toLowerCase()) {
            case 'alice':
                user = await usersCollection.findOne({ email: 'alice@example.com' });
                break;
            case 'bob':
                user = await usersCollection.findOne({ email: 'bob@example.com' });
                break;
            case 'test':
            default:
                user = await usersCollection.findOne({ email: 'test@test.com' });
                break;
        }

        if (!user) {
            return res.status(500).send(`
                <h1>User not found!</h1>
                <p>Please make sure the user exists in the database.</p>
                <a href="/">Go Home</a>
            `);
        }

        // Set session with real user data
        req.session.user = {
            userId: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType
        };

        console.log(`✓ Test login successful for user: ${user.email}`);
        res.redirect('/reports');
    } catch (error) {
        console.error('Test login error:', error);
        res.status(500).send('Error during test login: ' + error.message);
    }
});


// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('Please login first. <a href="/test-login">Click here to test login</a>');
    }
    next();
};

// Import your routes
import reportRoutes from './routes/reports.js';

// Use your routes
app.use('/reports', isAuthenticated, reportRoutes);

// Home route
app.get('/', (req, res) => {
    res.send(`
        <h1>BreatheWatch Testing</h1>
        <a href="/test-login">Login (Test)</a><br>
        <a href="/reports">View Reports</a><br>
        <a href="/reports/create">Create Report</a>
    `);
});


// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Use /test-login to login for testing');
});