import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as _ from 'lodash';
const { check } = require('express-validator/check');
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

import * as ArtistDB from '../models/Artist';
import * as FeedDB from '../models/Feed';
import * as util from '../util';
import * as config from '../config/config';

export const router = express.Router();

router.post('/like', util.catchAsyncError(like));
router.post('/unlike', util.catchAsyncError(unlike));
router.get('/search', util.catchAsyncError(search));
router.get('/', util.catchAsyncError(get));

async function get(req: Request, res: Response, next: NextFunction) {
  const { arid } = req.query;

  if (!util.isValidParam(arid)) {
    return util.sendErr(res, 'arid required');
  }

  const artist = await ArtistDB.findById(arid);
  if (_.isNil(artist)) {
    return util.send404(res, 'artist');
  }

  return res.status(200).send(artist);
}

async function like(req: Request, res: Response, next: NextFunction) {
  const { arid } = req.body;

  if (!util.isValidParam(arid)) {
    return util.sendErr(res, 'arid required');
  }

  const artist = await ArtistDB.findById(arid);
  if (_.isNil(artist)) {
    return util.send404(res, 'artist');
  }

  await ArtistDB.like(req.user.uname, arid);

  // post like feed
  await FeedDB.addLikeFeed(req.user.uname, {
    artist,
  });

  return util.sendOK(res);
}

async function unlike(req: Request, res: Response, next: NextFunction) {
  const { arid } = req.body;

  await ArtistDB.unlike(req.user.uname, arid);
  return util.sendOK(res);
}

async function search(req: Request, res: Response, next: NextFunction) {
  const { keyword, limit, offset } = req.query;
  if (!util.isValidParam(keyword)) {
    return util.sendErr(res, 'keyword as string required');
  }

  const artists = await ArtistDB.search(keyword, parseInt(offset, 10) || 0, parseInt(limit, 10) || config.defaultLimit);
  return res.status(200).send(artists);
}
