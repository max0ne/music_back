import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User } from './Models';
import * as serializer from './serializer';

export async function findByTrid(trid: string) {
  const track = (await db.sql('SELECT * FROM t_track WHERE trid = ?', trid))[0] as Track;
  return track;
}

export async function rateTrack(uname: string, trid: string, rate: number) {
  const rated = await db.sql(
    `SELECT * FROM t_rating WHERE trid = ? and uname = ?;`,
    trid, uname,
  );
  if (rated.length > 0) {
    await db.sql(
      `UPDATE t_rating SET rating = ?, SET rated_at = NOW() WHERE uname = ? AND trid = ?;`,
      rate, uname, trid,
    );
  } else {
    await db.sql(
      'INSERT INTO t_rating (uname, trid, rating, rated_at) VALUES (?, ?, ?, NOW());',
      uname, trid, rate,
    );
  }
}

export async function unrateTrack(uname: string, trid: string) {
  await db.sql(
    'DELETE FROM t_rating WHERE uname = ? AND trid = ?;',
    uname, trid,
  );
}

/**
 * get ratings for tracks, return { trid1: 1, trid2: 2 } if `trid` is array, return rating as number if `trid` is string
 * @param trid one trid or list of trids
 * @param uname
 */
export async function getRatingsForTracks(uname: string, trid: string[]) {
  const ratings = {} as { [trid: string]: number };
  if (trid.length === 0) {
    return ratings;
  }
  const sql = `SELECT rating, trid FROM t_rating WHERE trid IN (${trid.map(() => '?').join(',')}) AND uname = ?;`;
  const results = await db.sql(
    sql, ...trid, uname,
  );
  trid.forEach((trid) => ratings[trid] = undefined);
  results.forEach((res) => ratings[res.trid] = res.rating);
  return ratings;
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT * FROM t_track
  INNER JOIN t_artist USING (arid)
  WHERE trtitle LIKE ?
  LIMIT ? OFFSET ?;
  `;
  const countSql = `
  SELECT count(*) as total FROM t_track
  WHERE trtitle LIKE ?;
  `;
  const results = (await db.sql(
    sql, `%${keyword}%`, limit, offset,
  ));
  const total = (await db.sql(countSql, `%${keyword}%`))[0].total;
  const items = results.map(serializer.trackFromResult);
  return {
    items,
    total,
  };
}
