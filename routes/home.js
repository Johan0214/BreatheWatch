import { Router } from 'express';
const router = Router();

// GET /home – dashboard
router.get('/', (req, res) => {
  const isLoggedIn = req.session.user ? true : false;
  res.render('index', {
    title: 'Welcome to BreatheWatch',
    isLoggedIn,
    appName: 'BreatheWatch'
  });
});

export default router;
