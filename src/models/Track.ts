import * as bcrypt from 'bcrypt-nodejs';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User } from './Models';

export async function findByTrid(trid: string) {
  const track = (await db.sql('SELECT * FROM t_track WHERE trid = ?', trid))[0] as Track;
  return track;
}

export async function rateTrack(uname: string, trid: string, rate: number) {
  await db.sql(
    'INSERT INTO t_rating (uname, trid, rating, rated_at) VALUES (?, ?, ?, NOW());',
    uname, trid, rate,
  );
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT * FROM t_track
  INNER JOIN t_artist
  WHERE trtitle LIKE "%?%" OR arname LIKE "%?%"
  LIMIT ? OFFSET ?;
  `;
  const tracks = (await db.sql(
    sql, keyword, limit || config.defaultLimit, offset,
  ));
}

export async function addPlayedHistory(uname: string, trid: string) {
  await db.sql(
    'INSERT INTO t_playhist(uname, trid, played_at) VALUES(?, ?, NOW());',
    uname, trid,
  );
}
