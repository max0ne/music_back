import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as _ from 'lodash';
const { check } = require('express-validator/check');

import { Album, Playlist, Track, User } from '../models/Models';
import * as TrackDB from '../models/Track';
import * as util from '../util';
export default (req: Express.Request) => async (whatever: any) => {

  const findTrackObjects = (obj: any, cb: (track: Track) => void) => {
    _.keys(obj).forEach((key) => {
      const val = obj[key];
      if (_.isArray(val)) {
        val.forEach((obj) => findTrackObjects(obj, cb));
      } else if (_.isString(obj) || _.isNumber(obj)) {
        return;
      } else if (_.has(obj, 'trid')) {
        cb(obj);
      }
    });
  };

  const trids = [] as string[];
  findTrackObjects(whatever, (track) => trids.push(track.trid));
  const ratings = await TrackDB.getRatingsForTracks(trids, req.user.uname);
  findTrackObjects(whatever, (track) => track.rating = ratings[track.trid]);
};
