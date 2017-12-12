import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as db from './db';
import { Album, Playlist, Track, User, Artist } from './Models';
import * as TrackDB from './Track';
import * as util from '../util';
import * as serializer from './serializer';

export async function findById(arid: string) {
  const artist = (await db.sql(`SELECT ${serializer.artistKeys.join(',')} FROM t_artist WHERE arid = ?`, arid))[0] as Artist;
  return serializer.artistFromResult(artist);
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT ${serializer.artistKeys.join(', ')} FROM t_artist
  WHERE arname LIKE ?
  OR ardesc LIKE ?
  LIMIT ? OFFSET ?;
  `;
  const countSql = `
  SELECT count(*) as total
  FROM t_artist
  WHERE arname LIKE ?
  OR ardesc LIKE ?
  `;
  const results = (await db.sql(
    sql, `%${keyword}%`, `%${keyword}%`, limit, offset,
  ));
  const total = (await db.sql(countSql, `%${keyword}%`, `%${keyword}%`))[0].total;

  return {
    items: results.map(serializer.artistFromResult),
    total,
  };
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

export async function findByIds(arids: string[]) {
  if (arids.length === 0) {
    return [];
  }
  const sql = `SELECT * FROM t_artist WHERE arid in (${arids.map(() => '?')})`;
  const results = await db.sql(sql, ...arids);
  return results.map(serializer.artistFromResult);
}

export async function similarArtists(arid: string) {
  const sql = `
  SELECT
    arid1,
    arid2,
    commonFanCount,
    sum(fanCount) AS undistinctTotalFanCount,
    sum(fanCount) - commonFanCount AS totalFanCount,
    commonFanCount / (sum(fanCount) - commonFanCount) AS commonFansToTotalFansRatio
  FROM
    (
      SELECT
        l1.arid  AS arid1,
        l2.arid  AS arid2,
        count(*) AS commonFanCount
      FROM t_like AS l1, t_like AS l2
      WHERE l1.arid < l2.arid
            AND l1.uname = l2.uname
      GROUP BY arid1, arid2
    ) AS commonFans
  JOIN (
        SELECT arid, count(*) AS fanCount
        FROM t_like
        GROUP BY arid) AS f1
  ON commonFans.arid1 = f1.arid OR commonFans.arid2 = f1.arid
  WHERE arid1 = ?
  OR arid2 = ?
  GROUP BY arid1, arid2
  HAVING commonFansToTotalFansRatio >= 0.5
  ORDER BY commonFansToTotalFansRatio
  LIMIT 5;`;

  const results = await db.sql(sql, arid, arid);
  let arids = _.concat(_.map(results, 'arid1'), _.map(results, 'arid2'));
  arids = arids.filter((ar) => ar !== arid);
  return findByIds(arids);
}
