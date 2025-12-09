import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import { configRoutes } from './routes/index.js';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import path from 'path';

//import validation from './util/validation.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 3000;

app.engine('handlebars', exphbs.engine({defaultLayout: 'main',}));
app.set('view engine', 'handlebars');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({extended: true}));

app.use(session({
  name: 'AuthenticationState',
  secret: 'This is a secret!',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 3600000
  }
}));

configRoutes(app); 


app.listen(PORT, () => {
    console.log("We've got a server!");
    console.log(`Your routes will be running on http://localhost:${PORT}`);
});