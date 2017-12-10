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

import * as config from '../config/config';

export const router = express.Router();

router.get('/', util.catchAsyncError(getAlbum));
router.get('/new', util.catchAsyncError(getNewAlbums));
router.get('/search', util.catchAsyncError(search));

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

  if (req.user && req.user.uname) {
    await insertRating(req)(albums);
  }

  res.status(200).send(albums);
}

async function search(req: Request, res: Response, next: NextFunction) {
  const { keyword, limit, offset } = req.query;
  if (!util.isValidParam(keyword)) {
    return util.sendErr(res, 'keyword as string required');
  }

  const playlists = await AlbumDB.search(keyword, parseInt(offset, 10) || 0, parseInt(limit, 10) || config.defaultLimit);
  return res.status(200).send(playlists);
}
