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
import * as _ from 'lodash';

import * as config from './config/config';
import * as util from './util';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config();

import * as albumRouter from './controllers/album';
import * as playlistRouter from './controllers/playlist';
import * as userRouter from './controllers/user';
import * as artistRouter from './controllers/artist';
import * as feedRouter from './controllers/feed';
import * as trackRouter from './controllers/track';
import * as insertRateStuff from './controllers/insertRateStuff';
import * as popularRouter from './controllers/popular';

import * as UserDB from './models/User';

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

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

const apiRouter = express.Router();

apiRouter.use(
  jwt({
    secret: util.getEnv('JWT_SECRET', true),
  })
  .unless({ path: [
    '/api/user/login',
    '/api/user/register',
  ] }));

apiRouter.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const path = req.baseUrl + req.path;
  const ignored = [
    '/api/album/new',
    '/api/track/search',
    '/api/playlist/search',
    '/api/album/search',
    '/api/album/byArtist',
    '/api/artist/search',
    '/api/popular/albums',
    '/api/popular/artists',
    '/api/popular/tracks',
    '/api/popular/artistTracks',
    '/api/artist/albums',
    '/api/artist/similar',
  ].indexOf(path) !== -1;
  if (!_.isNil(err) && !ignored) {
    next(err);
  } else {
    next();
  }
});

/**
 * inject user
 */
apiRouter.use(async (req, res, next) => {
  const uname = req.user && req.user.uname;
  if (!uname) {
    return next();
  }
  const user = await UserDB.findByUname(uname);
  if (_.isNil(user)) {
    return util.sendErr(res, 'token expired', 401);
  }

  req.user = _.assign({}, req.user, user);
  next();
});

apiRouter.use(insertRateStuff.insertArtistLikeds() as any);
apiRouter.use(insertRateStuff.insertTrackRates() as any);

apiRouter.use('/album', albumRouter.router);
apiRouter.use('/playlist', playlistRouter.router);
apiRouter.use('/user', userRouter.router);
apiRouter.use('/artist', artistRouter.router);
apiRouter.use('/feed', feedRouter.router);
apiRouter.use('/track', trackRouter.router);
apiRouter.use('/popular', popularRouter.router);

app.use('/api', apiRouter);

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * get rid of 304 not modified thing
 */
app.disable('etag');

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log(('  App is running at http://localhost:%d in %s mode'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
