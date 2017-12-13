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
import * as mung from 'express-mung';

const findObjectsWithKey = (key: string) => (obj: any, cb: (found: any) => void) => {
  const findIt = (obj: any, cb: (found: any) => void) => {
    if (_.isNil(obj)) {
      return;
    } else if (_.isString(obj) || _.isNumber(obj)) {
      return;
    } else if (_.isArray(obj)) {
      obj.forEach((obj) => findIt(obj, cb));
    } else {
      if (_.has(obj, key)) {
        cb(obj);
      } else {
        _.values(obj).forEach((obj) => findIt(obj, cb));
      }
    }
  };
  findIt(obj, cb);
};

const jsonAsync = (handler: (...params: any[]) => Promise<any>) => {
  return mung.jsonAsync(async (body, req, res) => {
    try {
      return await handler(body, req, res);
    } catch (error) {
      util.handleError(error, req, res, () => { });
    }
  });
};

export function insertArtistLikeds() {
  return jsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }

    const ids = [] as string[];
    findObjectsWithKey('arid')(body, (ar) => ids.push(ar.arid));
    const likeds = await ArtistDB.findLiked(req.user.uname, ids);
    findObjectsWithKey('arid')(body, (ar) => ar.liked = likeds[ar.arid]);
    return body;
  });
}

export function insertTrackRates() {
  return jsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }

    const ids = [] as string[];
    findObjectsWithKey('trid')(body, (track) => ids.push(track.trid));
    const [userRatings, communityRatings] = await Promise.all([
      TrackDB.getRatingsForTracks(req.user.uname, ids),
      TrackDB.getCommunityRatingForTracks(ids),
    ]);
    // tslint:disable-next-line:no-null-keyword
    findObjectsWithKey('trid')(body, (track) => {
    // tslint:disable-next-line:no-null-keyword
      track.userRating = userRatings[track.trid] || null;
    // tslint:disable-next-line:no-null-keyword
      track.communityRating = communityRatings[track.trid] || null;
    });
    return body;
  });
}
