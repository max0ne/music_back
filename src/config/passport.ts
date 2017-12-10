// import * as _ from 'lodash';
// import * as passport from 'passport';
// import * as passportFacebook from 'passport-facebook';
// import * as passportLocal from 'passport-local';
// import * as request from 'request';

// import { NextFunction, Request, Response } from 'express';
// import { Album, Artist, Feed, Playlist, Track, User } from './Models';
// import * as UserDB from '../models/User';

// const LocalStrategy = passportLocal.Strategy;
// const FacebookStrategy = passportFacebook.Strategy;

// passport.serializeUser<any, any>((user, done) => {
//   done(undefined, user.uname);
// });

// passport.deserializeUser(async (uname, done) => {
//   try {
//     const user = await UserDB.findByUname(uname as string);
//     done(undefined, user);
//   } catch (e) {
//     done(e, undefined);
//   }
// });

// /**
//  * Sign in using Email and Password.
//  */
// passport.use(new LocalStrategy({ usernameField: 'uname' }, async (uname, password, done) => {

//   const user = await UserDB.findByUname(uname);
//   if (_.isNil(uname) || !_.isString(uname) || uname.length === 0) {
//     return done(undefined, false, { message: `uname required.` });
//   }

//   if (_.isNil(user)) {
//     return done(undefined, false, { message: `User with uname ${uname} not found.` });
//   }

//   if (!UserDB.compareUserPassword(user, password)) {
//     return done(undefined, false, { message: 'Invalid email or password.' });
//   } else {
//     return done(undefined, user);
//   }
// }));

// /**
//  * Login Required middleware.
//  */
// export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/login');
// };

// /**
//  * Authorization Required middleware.
//  */
// export let isAuthorized = (req: Request, res: Response, next: NextFunction) => {
//   const provider = req.path.split('/').slice(-1)[0];

//   if (_.find(req.user.tokens, { kind: provider })) {
//     next();
//   } else {
//     res.redirect(`/auth/${provider}`);
//   }
// };
