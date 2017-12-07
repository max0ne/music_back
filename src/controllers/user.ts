import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as passport from 'passport';
// import { LocalStrategyInfo } from 'passport-local';
const request = require('express-validator');
import { Album, Playlist, Track, User } from '../models/Models';

type AsyncCallback = (err: any, ...data: any[]) => void;

/**
 * POST /login
 * Sign in using email and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err: Error, user: User, info: any /* LocalStrategyInfo */) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('errors', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * POST /signup
 * Create a new local account.
 */
export let postSignup = (req: Request, res: Response, next: NextFunction) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len({ min: 4 });
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  // const errors = req.validationErrors();

  // if (errors) {
  //   req.flash('errors', errors);
  //   return res.redirect('/signup');
  // }

  // const user = new User({
  //   email: req.body.email,
  //   password: req.body.password,
  // });

  // User.findOne({ email: req.body.email }, (err, existingUser) => {
  //   if (err) { return next(err); }
  //   if (existingUser) {
  //     req.flash('errors', { msg: 'Account with that email address already exists.' });
  //     return res.redirect('/signup');
  //   }
  //   user.save((err) => {
  //     if (err) { return next(err); }
  //     req.logIn(user, (err) => {
  //       if (err) {
  //         return next(err);
  //       }
  //       res.redirect('/');
  //     });
  //   });
  // });
};

/**
 * POST /account/profile
 * Update profile information.
 */
export let postUpdateProfile = (req: Request, res: Response, next: NextFunction) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  // const errors = req.validationErrors();

  // if (errors) {
  //   req.flash('errors', errors);
  //   return res.redirect('/account');
  // }

  // User.findById(req.user.id, (err, user: UserModel) => {
  //   if (err) { return next(err); }
  //   user.email = req.body.email || '';
  //   user.profile.name = req.body.name || '';
  //   user.profile.gender = req.body.gender || '';
  //   user.profile.location = req.body.location || '';
  //   user.profile.website = req.body.website || '';
  //   user.save((err: WriteError) => {
  //     if (err) {
  //       if (err.code === 11000) {
  //         req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' });
  //         return res.redirect('/account');
  //       }
  //       return next(err);
  //     }
  //     req.flash('success', { msg: 'Profile information has been updated.' });
  //     res.redirect('/account');
  //   });
  // });
};

/**
 * POST /account/password
 * Update current password.
 */
export let postUpdatePassword = (req: Request, res: Response, next: NextFunction) => {
  req.assert('password', 'Password must be at least 4 characters long').len({ min: 4 });
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  // const errors = req.validationErrors();

  // if (errors) {
  //   req.flash('errors', errors);
  //   return res.redirect('/account');
  // }

  // User.findById(req.user.id, (err, user: UserModel) => {
  //   if (err) { return next(err); }
  //   user.password = req.body.password;
  //   user.save((err: WriteError) => {
  //     if (err) { return next(err); }
  //     req.flash('success', { msg: 'Password has been changed.' });
  //     res.redirect('/account');
  //   });
  // });
};
