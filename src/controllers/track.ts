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
import * as PopularDB from '../models/Popular';
import * as util from '../util';
import * as FeedDB from '../models/Feed';
import * as config from '../config/config';

export const router = express.Router();

router.post('/rate', util.catchAsyncError(rate));
router.post('/unrate', util.catchAsyncError(unrate));
router.post('/played', util.catchAsyncError(played));
router.get('/search', util.catchAsyncError(search));

async function rate(req: Request, res: Response, next: NextFunction) {
  const { trid, rating } = req.body;

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
  const { trid } = req.body;

  if (!util.isValidParam(trid)) {
    return util.sendErr(res, 'trid required');
  }
  await TrackDB.unrateTrack(req.user.uname, trid);
  return util.sendOK(res);
}

async function played(req: Request, res: Response, next: NextFunction) {
  const { trid } = req.query;

  if (!util.isValidParam(trid)) {
    return util.sendErr(res, 'trid required');
  }
  await PopularDB.addPlayedHistory(req.user.uname, trid);
  return util.sendOK(res);
}

async function search(req: Request, res: Response, next: NextFunction) {
  const { keyword, limit, offset } = req.query;
  if (!util.isValidParam(keyword)) {
    return util.sendErr(res, 'keyword as string required');
  }

  const tracks = await TrackDB.search(keyword, parseInt(offset, 10) || 0, parseInt(limit, 10) || config.defaultLimit);
  return res.status(200).send(tracks);
}
