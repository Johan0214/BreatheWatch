import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import configRoutes from './routes/index.js';
//import validation from './validation.js';

const app = express();
const PORT = 3000;
// ... rest of app.js setup ...

app.use('/public', express.static('public'));