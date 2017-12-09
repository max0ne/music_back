import * as async from 'async';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as passport from 'passport';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');
import * as jwt from 'jsonwebtoken';

import { Album, Playlist, Track, User } from '../models/Models';
import * as UserDB from '../models/User';
import * as util from '../util';
import { sendErr } from '../util';

export const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.delete('/', del);
router.get('/@:uname', get);
router.put('/update', update);
router.post('/follow', postFollow);
router.post('/unfollow', postUnfollow);
router.get('/following', following);
router.get('/followedBy', followedBy);

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

  const user = await UserDB.findByUname(uname);
  if (_.isNil(user)) {
    return sendErr(res, `uname ${uname} not found`);
  }

  if (user.password !== password) {
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
  const toUser = UserDB.findByUname(to);
  if (_.isNil(to)) {
    return util.sendErr(res, `user ${to} not found`);
  }
  await UserDB.follow(from, to);
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
