import {Router} from 'express';
const router = Router();

router.route('/').get(async (req, res) => {
    res.render('index', { 
        title: 'Welcome to BreatheWatch',
        isLoggedIn: req.session.user ? true : false,
        appName: 'BreatheWatch'
    });
});

export default router;