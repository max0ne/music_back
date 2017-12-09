import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as _ from 'lodash';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');

import { Album, Playlist, Track, User } from '../models/Models';
import * as PlaylistDB from '../models/Playlist';
import * as util from '../util';

export const router = express.Router();

router.get('/', get);
router.get('/mine', getMine);
router.get('/@:uname', getBy);
router.post('/', create);
router.put('/:plid/changeName', changeName);
router.put('/addTrack', addTrack);
router.put('/:plid/delTrack', delTrack);
router.delete('/:plid', del);

const validateTracks = (tracks: any[]) =>
  _.isArray(tracks) &&
  (tracks as string[]).every((id) =>
    _.isString(id) || _.isNumber(id));

async function create(req: Request, res: Response, next: NextFunction) {
  const { pltitle,  tracks } = req.body;

  if (!_.isString(pltitle) || !validateTracks(tracks)) {
    return util.sendErr(res, '');
  }

  const playlist = {
    pltitle, tracks,
  } as Playlist;

  await PlaylistDB.create(req.user.uname, playlist);
}

async function changeName(req: Request, res: Response, next: NextFunction) {
  const { plid } = req.params;
  const { pltitle } = req.body;

  if (!_.isString(plid) || !_.isString(pltitle)) {
    return util.sendErr(res, 'plid & pltitle required');
  }

  const playlist = await PlaylistDB.findById(plid);
  if (_.isNil(playlist)) {
    return util.send404(res, `plid = ${plid}`);
  }

  if (playlist.creator.uname !== req.user.uname) {
    return util.sendUnauthorized(res);
  }
  await PlaylistDB.changeName(plid, pltitle);
  return util.sendOK;
}

async function addTrack(req: Request, res: Response, next: NextFunction) {
  const { plid, trid } = req.body;

  if (!_.isString(plid) || !_.isString(trid)) {
    return util.sendErr(res, 'plid & trid required');
  }

  try {
    await PlaylistDB.addTrack(plid, trid);
    util.sendOK(res);
  } catch (error) {
    util.sendErr(res, error);
  }
}

async function delTrack(req: Request, res: Response, next: NextFunction) {
  const plid = req.params.plid;
  const trid = req.body.plid;

  if (!_.isString(plid) || !_.isString(trid)) {
    return util.sendErr(res, 'plid & trid required');
  }

  try {
    await PlaylistDB.delTrack(plid, trid);
    util.sendOK(res);
  } catch (error) {
    util.sendErr(res, error);
  }
}

async function get(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id as string;
  const pl = await PlaylistDB.findById(id, true);

  pl ? res.json(pl) : res.status(404).send('not found');
}

async function getMine(req: Request, res: Response, next: NextFunction) {
  const pls = await PlaylistDB.findByCreatedBy(req.user.uname);
  res.status(200).json(pls);
}

async function getBy(req: Request, res: Response, next: NextFunction) {
  const uname = req.params.uname;
  if (!_.isString(uname)) {
    util.sendErr(res, 'uname required');
  }
  const pls = await PlaylistDB.findByCreatedBy(uname);
  res.status(200).json(pls);
}

async function del(req: Request, res: Response, next: NextFunction) {
  const plid = req.params.plid;

  if (!_.isString(plid)) {
    return util.sendErr(res, 'plid required');
  }

  try {
    await PlaylistDB.del(plid);
    util.sendOK(res);
  } catch (error) {
    util.sendErr(res, error);
  }
}
