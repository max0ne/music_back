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

import * as FeedDB from '../models/Feed';
import * as util from '../util';
import * as config from '../config/config';

export const router = express.Router();
router.get('/feeds', getFeeds);

async function getFeeds(req: Request, res: Response, next: NextFunction) {
  const { offset, limit } = req.query;
  const feeds = await FeedDB.getFeeds(req.user.uname, offset || 0, limit || config.defaultLimit);
  return res.status(200).json(feeds);
}
