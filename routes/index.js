import reportsRoutes from './reports.js';

const constructorMethod = (app) => {
  // Main routes
  app.use('/reports', reportsRoutes);
};

export default constructorMethod;
