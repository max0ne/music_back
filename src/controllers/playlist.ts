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
import * as TrackDB from '../models/Track';
import * as FeedDb from '../models/Feed';
import * as util from '../util';
import * as config from '../config/config';

export const router = express.Router();

router.get('/', util.catchAsyncError(get));
router.get('/mine', util.catchAsyncError(getMine));
router.get('/@:uname', util.catchAsyncError(getBy));
router.get('/search', util.catchAsyncError(search));
router.post('/', util.catchAsyncError(create));
router.put('/:plid/changeName', util.catchAsyncError(changeName));
router.put('/:plid/addTrack', util.catchAsyncError(addTrack));
router.put('/:plid/delTrack', util.catchAsyncError(delTrack));
router.delete('/:plid', util.catchAsyncError(del));

async function create(req: Request, res: Response, next: NextFunction) {
  const { pltitle } = req.body;

  if (!_.isString(pltitle)) {
    return util.sendErr(res, 'pltitle required');
  }

  const playlist = {
    pltitle,
    tracks: [] as Track[],
  } as Playlist;

  const created = await PlaylistDB.create(req.user.uname, playlist);

  await FeedDb.addPlaylistCreateFeed(req.user.uname, {
    playlist: created,
  });

  res.status(200).send(created);
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
  return util.sendOK(res);
}

async function addTrack(req: Request, res: Response, next: NextFunction) {
  const { plid } = req.params;
  const { trid } = req.body;

  if (!_.isString(plid) || !_.isString(trid)) {
    return util.sendErr(res, 'plid & trid required');
  }

  const playlist = await PlaylistDB.findById(plid);
  if (_.isNil(playlist)) {
    return util.send404(res, 'playlist');
  }

  if (_.map(playlist.tracks, 'trid').indexOf(trid) !== -1) {
    return util.sendOK(res);
  }

  const track = await TrackDB.findByTrid(trid);
  if (_.isNil(track)) {
    return util.send404(res, 'track');
  }

  await FeedDb.addPlaylistAddTrackFeed(req.user.uname, {
    playlist,
    track,
  });
  await FeedDb.addPlaylistAddTrackFeedToArtistLikers(req.user.uname, track, playlist);

  console.log(playlist);

  await PlaylistDB.addTrack(plid, trid);
  util.sendOK(res);
}

async function delTrack(req: Request, res: Response, next: NextFunction) {
  const { plid } = req.params;
  const { trid } = req.body;

  if (!_.isString(plid) || !_.isString(trid)) {
    return util.sendErr(res, 'plid & trid required');
  }

  const playlist = await PlaylistDB.findById(plid);
  if (_.isNil(playlist)) {
    return util.send404(res, 'playlist');
  }

  const track = await TrackDB.findByTrid(trid);
  if (_.isNil(track)) {
    return util.send404(res, 'track');
  }

  await FeedDb.addPlaylistDelTrackFeed(req.user.uname, {
    playlist,
    track,
  });

  try {
    await PlaylistDB.delTrack(plid, trid);
    util.sendOK(res);
  } catch (error) {
    util.sendErr(res, error);
  }
}

async function get(req: Request, res: Response, next: NextFunction) {
  const { plid } = req.query;
  if (!util.isValidParam(plid)) {
    return util.sendErr(res, 'plid required');
  }

  const pl = await PlaylistDB.findById(plid);

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

async function search(req: Request, res: Response, next: NextFunction) {
  const { keyword, limit, offset } = req.query;
  if (!util.isValidParam(keyword)) {
    return util.sendErr(res, 'keyword as string required');
  }

  const playlists = await PlaylistDB.search(keyword, parseInt(offset, 10) || 0, parseInt(limit, 10) || config.defaultLimit);
  return res.status(200).send(playlists);
}

async function del(req: Request, res: Response, next: NextFunction) {
  const { plid } = req.params;

  if (!util.isValidParam(plid)) {
    return util.sendErr(res, 'plid required');
  }

  try {
    await PlaylistDB.del(plid);
    util.sendOK(res);
  } catch (error) {
    util.sendErr(res, error);
  }
}
