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
  FdvalueRate,
  FdvaluePlaylistCreate,
  FdvaluePlaylistAddTrack,
  FdvaluePlaylistDelTrack,
} from '../models/Models';

import * as ArtistDB from '../models/Artist';
import * as FeedDB from '../models/Feed';
import * as util from '../util';

export const router = express.Router();

router.post('/:arid/like', like);
router.post('/:arid/unlike', unlike);

async function like(req: Request, res: Response, next: NextFunction) {
  const { arid } = req.params;

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
  const { arid } = req.params;

  await ArtistDB.unlike(req.user.uname, arid);
  return util.sendOK(res);
}
