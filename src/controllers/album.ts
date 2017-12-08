import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as passport from 'passport';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');

import * as AlbumDB from '../models/Album';
import { Album, Playlist, Track, User } from '../models/Models';

export const router = express.Router();

router.get('/:alid', getAlbum);

async function getAlbum(req: Request, res: Response, next: NextFunction) {
  const alid = req.params.alid as string;
  const album = await AlbumDB.findById(alid, true);

  album ? res.json(album) : res.status(404).send('not found');
}
