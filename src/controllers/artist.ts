import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as _ from 'lodash';
const { check } = require('express-validator/check');

import { Album, Playlist, Track, User } from '../models/Models';
import * as ArtistDB from '../models/Artist';
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
  return util.sendOK(res);
}

async function unlike(req: Request, res: Response, next: NextFunction) {
  const { arid } = req.params;

  await ArtistDB.unlike(req.user.uname, arid);
  return util.sendOK(res);
}
