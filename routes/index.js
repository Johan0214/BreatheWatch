import authRoutes from './auth.js';
//Add other route files here

export const configRoutes = (app) => {
  app.use('/', authRoutes);
  //Future routes will be added here:
  //app.use('/map', mapRoutes);

  // 404 Not Found Handler
  app.use('*', (req, res) => {
    res.status(404).render('error', { 
        title: "404 Not Found", 
        message: "The page you are looking for does not exist." 
    });
  });
};