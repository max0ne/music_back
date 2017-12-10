import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as db from './db';
import { Album, Playlist, Track, User, Artist } from './Models';
import * as TrackDB from './Track';
import * as util from '../util';

export const artistKeys = ['arid', 'arname', 'ardesc' ];

export async function findById(arid: string) {
  const artist = (await db.sql(`SELECT ${artistKeys.join(',')} FROM t_album WHERE alid = ?`, arid))[0] as Artist;
  return artist;
}

export async function like(uname: string, arid: string) {
  const rated = await db.sql(
    `SELECT * FROM t_like WHERE arid = ? AND uname = ?;`,
    arid, uname,
  );
  if (rated.length > 0) {
    await db.sql(
      `UPDATE t_like SET like_at = now() WHERE uname = ? AND arid = ?;`,
      uname, arid,
    );
  } else {
    await db.sql(
      'INSERT INTO t_like (uname, arid, like_at) VALUES (?, ?, now());',
      uname, arid,
    );
  }
}

export async function unlike(uname: string, arid: string) {
  await db.sql(
    'DELETE FROM t_like WHERE arid = ? AND uname = ?;',
    arid, uname,
  );
}
