import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User, Artist } from './Models';
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
      `UPDATE t_rating SET rating = ?, rated_at = NOW() WHERE uname = ? AND trid = ?;`,
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

export async function getCommunityRatingForTracks(trids: string[]) {
  const ratings = {} as { [trid: string]: number };
  if (!trids.length) {
    return ratings;
  }
  const sql = `
  SELECT trid, avg(rating) AS rating FROM t_rating
    WHERE trid IN (${trids.map(() => '?').join(', ')})
  GROUP BY trid;`;
  const results = await db.sql(sql, ...trids);
  results.forEach((res) => {
    const { trid, rating } = res;
    ratings[trid] = rating;
  });
  return ratings;
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT * FROM t_track
  INNER JOIN t_artist USING (arid)
  WHERE trtitle LIKE ?
  OR genre LIKE ?
  LIMIT ? OFFSET ?;
  `;
  const countSql = `
  SELECT count(*) as total FROM t_track
  INNER JOIN t_artist USING (arid)
  WHERE trtitle LIKE ?
  OR genre LIKE ?
  ;`;
  const results = (await db.sql(
    sql, `%${keyword}%`, `%${keyword}%`, limit, offset,
  ));
  const total = (await db.sql(countSql, `%${keyword}%`, `%${keyword}%`))[0].total;
  const items = results.map(serializer.trackFromResult);
  return {
    items,
    total,
  };
}

export async function getArtistsForTrids(trids: string[]) {
  if (trids.length === 0) {
    return [] as Artist[];
  }

  const sql = `
  SELECT DISTINCT ${serializer.artistKeys} FROM t_artist
  INNER JOIN t_track USING (arid)
  WHERE trid IN (${_.map(trids, () => '?').join(',')});
  `;
  const results = await db.sql(sql, ...trids);
  return results.map(serializer.artistFromResult);
}

export async function recentTracksFromLikedArtist(uname: string) {
  const sql = `
  SELECT ${serializer.trackKeys.join(',')}, aldate FROM t_track
    INNER JOIN t_album_track USING (trid)
    INNER JOIN t_album USING (alid)
    INNER JOIN t_like USING (arid)
  WHERE uname = ?
  ORDER BY aldate DESC
  LIMIT 10;
  `;

  const results = await db.sql(sql, uname);
  return results.map(serializer.trackFromResult);
}
