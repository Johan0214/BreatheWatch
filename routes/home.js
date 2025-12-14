import { Router } from 'express';
const router = Router();
import validation from '../helpers/validation.js';

// GET /home – dashboard
router.get('/', validation.protectRoute, (req, res) => {
  const isLoggedIn = req.session.user ? true : false;
  res.render('index', {
    title: 'Welcome to BreatheWatch',
    isLoggedIn,
    appName: 'BreatheWatch'
  });
});

export default router;
