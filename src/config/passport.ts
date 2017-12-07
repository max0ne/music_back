import * as _ from 'lodash';
import * as passport from 'passport';
import * as passportFacebook from 'passport-facebook';
import * as passportLocal from 'passport-local';
import * as request from 'request';

// import { User, UserType } from '../models/User';
import { NextFunction, Request, Response } from 'express';
import * as User from '../models/User';

const LocalStrategy = passportLocal.Strategy;
const FacebookStrategy = passportFacebook.Strategy;

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser(async (uname, done) => {
  try {
    const user = await User.findByUname(uname  as string);
    done(undefined, user);
  } catch (e) {
    done(e, undefined);
  }
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  return done(undefined, undefined);
  // User.findOne({ email: email.toLowerCase() }, (err: any, user: any) => {
  //   if (err) { return done(err); }
  //   if (!user) {
  //     return done(undefined, false, { message: `Email ${email} not found.` });
  //   }
  //   user.comparePassword(password, (err: Error, isMatch: boolean) => {
  //     if (err) { return done(err); }
  //     if (isMatch) {
  //       return done(undefined, user);
  //     }
  //     return done(undefined, false, { message: 'Invalid email or password.' });
  //   });
  // });
}));

/**
 * Login Required middleware.
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
export let isAuthorized = (req: Request, res: Response, next: NextFunction) => {
  const provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
