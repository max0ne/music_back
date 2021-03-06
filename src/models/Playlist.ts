import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User, Artist } from './Models';
import * as TrackDB from './Track';
import * as UserDB from './User';
import * as serializer from './serializer';

export async function findById(id: string) {
  const sql = `
  SELECT ${[...serializer.playlistKeys, ...serializer.trackKeys, ...serializer.artistKeys, ...serializer.userKeys].join(', ')} FROM t_playlist
    LEFT JOIN t_playlist_track USING (plid)
    LEFT JOIN t_track USING (trid)
    LEFT JOIN t_artist USING (arid)
    INNER JOIN t_user USING (uname)
  WHERE plid = ?;
  `;
  const res = await db.sql(sql, id);
  if (res.length === 0) {
    return undefined;
  }

  const playlist = serializer.playlistFromResult(res[0]);
  playlist.tracks = res.map(serializer.trackFromResult).filter((tr) => !_.isNil(tr));
  return playlist;
}

export async function findByCreatedBy(uname: string) {
  const sql = `SELECT plid FROM t_playlist WHERE uname = ?;`;
  const plids = (await db.sql(sql, uname)).map((res) => res.plid);
  const playlists = await Promise.all(plids.map(findById));
  return playlists;
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT ${[...serializer.playlistKeys, ...serializer.userKeys].join(',')} FROM t_playlist
  INNER JOIN t_user USING (uname)
  WHERE pltitle LIKE ?
  LIMIT ? OFFSET ?;
  `;
  const countSql = `
  SELECT count(*) AS total FROM t_playlist
  WHERE pltitle LIKE ?;
  `;
  const results = (await db.sql(
    sql, `%${keyword}%`, limit, offset,
  ));
  const total = (await db.sql(countSql, `%${keyword}%`))[0].total;
  return {
    items: results.map(serializer.playlistFromResult),
    total,
  };
}

export async function create(uname: string, playlist: Playlist) {
  return db.inTransaction(async (db) => {
    const trids = playlist.tracks.map((tr) => {
      return (
        _.isString(tr) ? tr :
        _.isNumber(tr) ? tr :
        _.isString(tr.trid) || _.isNumber(tr.trid) ?
        tr.trid : undefined
      );
    }).filter((tr) => !_.isNil(tr));

    const result = await db.sql(
      `INSERT INTO t_playlist (pltitle, created_at, uname) VALUES (?, NOW(), ?)`,
      playlist.pltitle, uname,
    );

    const plid = (result as any).insertId;

    await Promise.all(trids.map((trid, idx) =>
      db.sql(`INSERT INTO t_playlist_track (plid, trid, seq) VALUES (?, ?, ?);`, plid, trid, idx),
    ));

    const inserted = await(findById(plid));
    return inserted;
  });
}

export async function changeName(plid: string, pltitle: string) {
  await db.sql(`UPDATE t_playlist SET pltitle = ? WHERE plid = ?`, pltitle, plid);
}

export async function addTrack(plid: string, trid: string) {
  const sql = `
  INSERT INTO t_playlist_track (plid, trid, seq) VALUES (?, ?, (
      SELECT ifnull(max(seq), 0) + 1 FROM (SELECT * FROM t_playlist_track) AS _ WHERE plid = ?
  ));
  `;
  await db.sql(sql, plid, trid, plid);
}

export async function delTrack(plid: string, trid: string) {
  const sql = `
  DELETE FROM t_playlist_track WHERE plid = ? AND trid = ?;
  `;
  await db.sql(sql, plid, trid);
}

export async function del(plid: string) {
  const sql = `
  DELETE FROM t_playlist WHERE plid = ?;
  `;
  await db.sql(sql, plid);
}
