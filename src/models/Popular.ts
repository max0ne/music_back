import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User, Artist } from './Models';
import * as TrackDB from './Track';
import * as UserDB from './User';
import * as serializer from './serializer';

export async function popularAlbums() {
  const sql = `
    SELECT ${serializer.prefixKeys('al', serializer.albumKeys).join(',')}, playedMonth, count(*) AS playCount FROM (
      SELECT
        alid,
        concat(DATE_FORMAT(played_at,'%Y-%m')) AS playedMonth
      FROM t_playhist
      INNER JOIN t_album_track USING (trid)
    ) AS _
    INNER JOIN t_album AS al USING (alid)
    GROUP BY al.alid, playedMonth
    ORDER BY playedMonth DESC, playCount DESC
    LIMIT 5;
    `;

  const results = await db.sql(sql);
  return results.map(serializer.albumFromResult);
}

export async function popularTracks() {
  const sql = `
  SELECT ${serializer.prefixKeys('tr', serializer.trackKeys).join(',')}, playedMonth, count(*) AS playCount FROM (
    SELECT
      trid,
      concat(DATE_FORMAT(played_at,'%Y-%m')) AS playedMonth
    FROM t_playhist
  ) AS _
  INNER JOIN t_track AS tr USING (trid)
  GROUP BY tr.trid, playedMonth
  ORDER BY playedMonth DESC, playCount DESC
  LIMIT 10;
  `;

  const result = await db.sql(sql);
  return result.map(serializer.trackFromResult);
}

export async function popularArtists() {
  const sql = `
  SELECT ${serializer.prefixKeys('ar', serializer.artistKeys).join(',')}, playedMonth, count(*) AS playCount FROM (
    SELECT
      arid,
      concat(DATE_FORMAT(played_at,'%Y-%m')) AS playedMonth
    FROM t_playhist
    INNER JOIN t_track USING (trid)
  ) AS _
  INNER JOIN t_artist AS ar USING (arid)
  GROUP BY ar.arid, playedMonth
  ORDER BY playedMonth DESC, playCount DESC
  LIMIT 5;
  `;
  const result = await db.sql(sql);
  return result.map(serializer.artistFromResult);
}

export async function addPlayedHistory(uname: string, trid: string) {
  await db.sql(
    'INSERT INTO t_playhist(uname, trid, played_at) VALUES(?, ?, NOW());',
    uname, trid,
  );
}

export async function popularArtistTracks(arid: string) {
  const sql = `
  SELECT ${serializer.trackKeys.join(', ')}, sum(CASE WHEN uname IS NULL THEN 0 ELSE 1 END) AS playCount
  FROM t_track
    LEFT JOIN t_playhist
    USING (trid)
  WHERE arid = ?
  GROUP BY trid
  ORDER BY playCount DESC
  LIMIT 10;
  `;
  const results = await db.sql(sql, arid);
  const tracks = results.map(serializer.trackFromResult);
  return tracks;
}
