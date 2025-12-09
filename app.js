import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { ObjectId } from 'mongodb';
import { Users } from './config/mongoCollections.js';


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
        subtract: (a, b) => a - b
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

// TEMPORARY: Mock login for testing
app.get('/test-login', async (req, res) => {
    try {
        const usersCollection = await Users();
        const user = await usersCollection.findOne({});
        
        if (!user) {
            return res.status(500).send(`
                <h1>No users found in database!</h1>
                <p>Please create a user first. Run this in MongoDB shell:</p>
                <pre>
db.Users.insertOne({
    _id: new ObjectId(),
    firstName: "Test",
    lastName: "User",
    email: "test@test.com",
    city: "Brooklyn",
    state: "NY",
    age: 30,
    hashedPassword: "$2a$10$E5h9uX5fRTrqgqeG8dRfCe...",
    userType: "Renter",
    profileDescription: "Test user for reports",
    savedLocations: [],
    submittedReports: []
})
                </pre>
                <a href="/">Go Home</a>
            `);
        }

        // Set session with real user data
        req.session.user = {
            userId: user._id.toString(),  // Convert ObjectId to string
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType
        };
        
        console.log('✓ Test login successful for user:', user.email);
        console.log('✓ User ID:', user._id.toString());
        
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