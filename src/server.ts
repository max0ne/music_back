/**
 * Module dependencies.
 */
import * as bodyParser from 'body-parser';
import * as compression from 'compression';  // compresses requests
import * as dotenv from 'dotenv';
import * as errorHandler from 'errorhandler';
import * as express from 'express';
import * as jwt from 'express-jwt';
import * as session from 'express-session';
import expressValidator = require('express-validator');
import * as lusca from 'lusca';
import * as passport from 'passport';
import * as path from 'path';
import * as morgan from 'morgan';

import * as config from './config/config';
import * as util from './util';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config();

import * as albumRouter from './controllers/album';
import * as playlistRouter from './controllers/playlist';
import * as userRouter from './controllers/user';

/**
 * API keys and Passport configuration.
 */
import * as passportConfig from './config/passport';

/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set('port', util.getEnv('PORT') || 3000);
app.set('view engine', 'pug');
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(expressValidator());
app.use(morgan('dev'));

// app.use(session({
//   resave: true,
//   saveUninitialized: true,
//   secret: util.getEnv('SESSION_SECRET', true),
//   // store: new MongoStore({
//   //   url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
//   //   autoReconnect: true,
//   // }),
// }));
// app.use(passport.initialize());
// app.use(passport.session());

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

const apiRouter = express.Router();

apiRouter.use(jwt({ secret: util.getEnv('JWT_SECRET', true) }).unless({ path: ['/api/user/login', '/api/user/register'] }));

apiRouter.use('/album', albumRouter.router);
apiRouter.use('/playlist', playlistRouter.router);
apiRouter.use('/user', userRouter.router);

app.use('/api', apiRouter);

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log(('  App is running at http://localhost:%d in %s mode'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
