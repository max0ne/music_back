import * as async from 'async';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as passport from 'passport';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');
import * as util from '../util';

import insertRating from './insertRating';

import * as AlbumDB from '../models/Album';
import { Album, Playlist, Track, User } from '../models/Models';
import * as config from '../config/config';

export const router = express.Router();

router.get('/', getAlbum);
router.get('/new', getNewAlbums);

async function getAlbum(req: Request, res: Response, next: NextFunction) {
  const alid = req.query.id;
  if (!_.isString(alid)) {
    return util.sendErr(res, 'id requied in query');
  }

  const album = await AlbumDB.findById(alid, true);

  await insertRating(req)(album);

  album ? res.json(album) : res.status(404).send('not found');
}

async function getNewAlbums(req: Request, res: Response, next: NextFunction) {
  const { offset, limit } = req.query;
  const albums = await AlbumDB.recentAlbums(offset || 0, limit || config.defaultLimit);

  await insertRating(req)(albums);

  res.status(200).send(albums);
}
