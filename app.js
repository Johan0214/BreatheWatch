import express from 'express';
import session from 'express-session';
import exphbs from 'express-handlebars';
import { configRoutes } from './routes/index.js';
//import validation from './util/validation.js';

const app = express();
const PORT = 3000;

app.engine('handlebars', exphbs.engine({defaultLayout: 'main',}));
app.set('view engine', 'handlebars');

app.use('/public', express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({extended: true}));

app.use(session({
  name: 'AuthCookie',
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