import authRoutes from './auth.js';
import homeRoutes from './home.js';
import reportRoutes from './reports.js';
import pollutionRoutes from './pollutionSources.js';

export const configRoutes = (app) => {
  // Homepage and login/signup
  app.use('/', authRoutes);

  // Protected home/dashboard page
  app.use('/home', homeRoutes);

  app.use('/reports', reportRoutes);

  app.use('/pollution-sources', pollutionRoutes);
};
