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
import * as ArtistDB from '../models/Artist';
import * as util from '../util';

export function insertArtistLikeds() {
  return util.mungJsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }

    const ids = [] as string[];
    util.findObjectsWithKey('arid')(body, (ar) => ids.push(ar.arid));
    const likeds = await ArtistDB.findLiked(req.user.uname, ids);
    util.findObjectsWithKey('arid')(body, (ar) => ar.liked = likeds[ar.arid]);
    return body;
  });
}

export function insertTrackRates() {
  return util.mungJsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }

    const ids = [] as string[];
    util.findObjectsWithKey('trid')(body, (track) => ids.push(track.trid));
    const [userRatings, communityRatings] = await Promise.all([
      TrackDB.getRatingsForTracks(req.user.uname, ids),
      TrackDB.getCommunityRatingForTracks(ids),
    ]);
    // tslint:disable-next-line:no-null-keyword
    util.findObjectsWithKey('trid')(body, (track) => {
    // tslint:disable-next-line:no-null-keyword
      track.userRating = userRatings[track.trid] || null;
    // tslint:disable-next-line:no-null-keyword
      track.communityRating = communityRatings[track.trid] || null;
    });
    return body;
  });
}
