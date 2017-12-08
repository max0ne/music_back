import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as _ from 'lodash';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');

import { Album, Playlist, Track, User } from '../models/Models';
import * as PlaylistDB from '../models/Playlist';
import * as util from '../util';

export const router = express.Router();

router.get('/byid/:id', get);
router.post('/', create);

async function create(req: Request, res: Response, next: NextFunction) {
  const { pltitle,  tracks } = req.body;

  if (!_.isString(pltitle) || !_.isArray(tracks) || !(tracks as string[]).every((id) => _.isString(id) || _.isNumber(id))) {
    return util.sendErr(res, '');
  }

  const playlist = {
    pltitle, tracks,
  } as Playlist;

  await PlaylistDB.create(req.user.uname, playlist);
}

async function get(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id as string;
  const pl = await PlaylistDB.findById(id, true);

  pl ? res.json(pl) : res.status(404).send('not found');
}

async function getMine(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id as string;
  const pl = await PlaylistDB.findById(id, true);

  pl ? res.json(pl) : res.status(404).send('not found');
}
