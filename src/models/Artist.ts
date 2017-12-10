import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as db from './db';
import { Album, Playlist, Track, User, Artist } from './Models';
import * as TrackDB from './Track';
import * as util from '../util';
import * as serializer from './serializer';

export async function findById(arid: string) {
  const artist = (await db.sql(`SELECT ${serializer.artistKeys.join(',')} FROM t_artist WHERE arid = ?`, arid))[0] as Artist;
  return artist;
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT ${serializer.artistKeys.join(', ')} FROM t_artist
  WHERE arname LIKE ?
  OR ardesc LIKE ?
  LIMIT ? OFFSET ?;
  `;
  const results = (await db.sql(
    sql, `%${keyword}%`, `%${keyword}%`, limit, offset,
  ));

  return results.map(serializer.artistFromResult);
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

export async function findLiked(uname: string, arids: string[]) {
  const likeds = {} as { [arid: string]: boolean };
  arids.forEach((id) => likeds[id] = false);
  if (arids.length === 0) {
    return likeds;
  }
  const sql = `
  SELECT * FROM t_like WHERE uname = ? AND arid IN (${arids.map(() => '?').join(', ')});
  `;
  const results = await db.sql(sql, uname, ...arids);
  results.forEach((res) => likeds[res.arid] = true);

  return likeds;
}
