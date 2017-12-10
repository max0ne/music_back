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
import * as TrackDB from '../models/Track';
import * as util from '../util';
import * as FeedDB from '../models/Feed';

export const router = express.Router();

router.post('/:trid/rate', rate);
router.post('/:trid/unrate', unrate);
router.post('/:trid/played', played);

async function rate(req: Request, res: Response, next: NextFunction) {
  const { rating } = req.body;
  const { trid } = req.params;

  if (!util.isValidParam(trid, rating)) {
    return util.sendErr(res, 'trid, rating required');
  }
  const parsedRating = parseInt(rating, 10);
  if (parsedRating < 1 || parsedRating > 5 || !_.isInteger(parsedRating) || _.isNaN(parsedRating)) {
    return util.sendErr(res, 'rating must be an integer between 1 to 5');
  }

  const track = await TrackDB.findByTrid(trid);
  if (_.isNil(track)) {
    return util.send404(res, 'track');
  }

  // post feed
  await FeedDB.addRateFeed(req.user.uname, {
    track, rating,
  });

  await TrackDB.rateTrack(req.user.uname, trid, parsedRating);
  return util.sendOK(res);
}

async function unrate(req: Request, res: Response, next: NextFunction) {
  const { trid } = req.params;

  await TrackDB.unrateTrack(req.user.uname, trid);
  return util.sendOK(res);
}

async function played(req: Request, res: Response, next: NextFunction) {
  const { trid } = req.params;

  await TrackDB.addPlayedHistory(req.user.uname, trid);
  return util.sendOK(res);
}
