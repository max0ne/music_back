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

import * as PlaylistDB from '../models/Playlist';
import * as FeedDb from '../models/Feed';
import * as PopularDB from '../models/Popular';
import * as util from '../util';
import * as config from '../config/config';

export const router = express.Router();

router.get('/albums', util.catchAsyncError(getAlbums));
router.get('/artists', util.catchAsyncError(getArtists));
router.get('/tracks', util.catchAsyncError(getTracks));

async function getAlbums(req: Request, res: Response, next: NextFunction) {
  const items = await PopularDB.popularAlbums();
  res.status(200).send(items);
}

async function getArtists(req: Request, res: Response, next: NextFunction) {
  const items = await PopularDB.popularArtists();
  res.status(200).send(items);
}

async function getTracks(req: Request, res: Response, next: NextFunction) {
  const items = await PopularDB.popularTracks();
  res.status(200).send(items);
}
