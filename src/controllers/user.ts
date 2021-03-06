import * as async from 'async';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as passport from 'passport';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');
import * as jwt from 'jsonwebtoken';
import {
  Album,
  Artist,
  Feed,
  Playlist,
  Track,
  User,
  Fdtype,
  FdvalueLike,
  FdvalueFollow,
  FdvalueFollowedBy,
  FdvalueRate,
  FdvaluePlaylistCreate,
  FdvaluePlaylistAddTrack,
  FdvaluePlaylistDelTrack,
} from '../models/Models';
import * as UserDB from '../models/User';
import * as FeedDB from '../models/Feed';
import * as util from '../util';
import { sendErr } from '../util';

export const router = express.Router();

router.post('/login', util.catchAsyncError(login));
router.post('/register', util.catchAsyncError(register));
router.delete('/', util.catchAsyncError(del));
router.get('/@:uname', util.catchAsyncError(get));
router.put('/update', util.catchAsyncError(update));
router.post('/follow', util.catchAsyncError(postFollow));
router.post('/unfollow', util.catchAsyncError(postUnfollow));
router.get('/following', util.catchAsyncError(following));
router.get('/followedBy', util.catchAsyncError(followedBy));

function _genToken(uname: string) {
  return jwt.sign({
    uname,
  }, util.getEnv('JWT_SECRET', true));
}

async function login(req: Request, res: Response, next: NextFunction) {
  const { uname, password } = req.body;
  if (!_.isString(uname) || !_.isString(password)) {
    return sendErr(res, 'uname & password required');
  }

  const user = await UserDB.findByUname(uname, true);
  if (_.isNil(user)) {
    return sendErr(res, `uname ${uname} not found`);
  }

  if (!UserDB.compareUserPassword(user, password)) {
    return sendErr(res, 'password wrong');
  }

  delete user.password;

  return res.status(200).json({ token: _genToken(uname), user });
}

async function register(req: Request, res: Response, next: NextFunction) {
  const user = _.pick(req.body, [
    'uname',
    'password',
    'first_name',
    'last_name',
    'email',
    'city',
  ]) as User;

  const {
    uname,
    password,
    first_name,
    email,
  } = user;

  const emptyFields = _.keys({
    uname,
    password,
    first_name,
    email,
  }).filter((key) => _.isNil(req.body[key]));

  if (emptyFields.length > 0) {
    return sendErr(res, `${emptyFields.join(', ')} required`);
  }

  if (!/^[a-zA-Z0-9]+$/.test(uname)) {
    return util.sendErr(res, 'uname must be alpha numerical');
  }
  if (!/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/.test(email)) {
    return util.sendErr(res, 'email not validate');
  }

  const existsUser = await UserDB.findByUname(uname);
  if (!_.isNil(existsUser)) {
    return util.sendErr(res, `uname ${uname} already registered`);
  }

  await UserDB.register(user);
  delete user.password;
  res.status(200).send({ token: _genToken(uname), user });
}

async function del(req: Request, res: Response, next: NextFunction) {
  const uname = req.user.uname;
  await UserDB.del(req.user.uname);
  util.sendOK(res);
}

async function get(req: Request, res: Response, next: NextFunction) {
  const uname = req.user.uname;
  const user = await UserDB.findByUname(uname);
  if (_.isNil(user)) {
    return res.status(404).send({err: `${uname} not found`});
  }
  res.status(200).json(user);
}

async function update(req: Request, res: Response, next: NextFunction) {
  const uname = req.user && req.user.uname;
  const user = await UserDB.findByUname(uname);
  delete req.body.password;
  const updated = _.merge(user, req.body);
  await UserDB.update(updated);
  res.status(200).json(updated);
}

async function postFollow(req: Request, res: Response, next: NextFunction) {
  const from = req.user.uname;
  const to = req.body.uname;
  if (!_.isString(to)) {
    return util.sendErr(res, 'uname required');
  }
  const toUser = await UserDB.findByUname(to);
  if (_.isNil(toUser)) {
    return util.sendErr(res, `user ${to} not found`);
  }

  try {
    await UserDB.follow(from, to);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {

    } else {
      throw error;
    }
  }

  // post feed
  await FeedDB.addFollowFeed(from, {
    followee: toUser,
  });
  await FeedDB.addFollowedByFeedToSpecificUser(from, to);

  return util.sendOK(res);
}

async function postUnfollow(req: Request, res: Response, next: NextFunction) {
  const from = req.user.uname;
  const to = req.body.uname;
  if (!_.isString(to)) {
    return util.sendErr(res, 'uname required');
  }
  await UserDB.unfollow(from, to);
  return util.sendOK(res);
}

async function following(req: Request, res: Response, next: NextFunction) {
  const users = await UserDB.getFollowing(req.user.uname);
  return res.status(200).json(users);
}

async function followedBy(req: Request, res: Response, next: NextFunction) {
  const users = await UserDB.getFollowedBy(req.user.uname);
  return res.status(200).json(users);
}
