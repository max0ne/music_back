import * as async from 'async';
import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as passport from 'passport';
// import { LocalStrategyInfo } from 'passport-local';
const { check } = require('express-validator/check');

import { Album, Playlist, Track, User } from '../models/Models';
import * as PlaylistDB from '../models/Playlist';

export const router = express.Router();

router.get('/:id', get);

async function get(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id as string;
  const pl = await PlaylistDB.findById(id, true);

  pl ? res.json(pl) : res.status(404).send('not found');
}
