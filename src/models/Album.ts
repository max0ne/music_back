import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as db from './db';
import { Album, Artist, Feed, Playlist, Track, User } from './Models';
import * as TrackDB from './Track';
import * as util from '../util';
import * as serializer from './serializer';
import { albumKeys } from './serializer';

export async function findById(alid: string, withTracks: boolean) {
  if (withTracks) {
    const album: Album = (await findById(alid, false)) as Album;
    if (_.isNil(album)) {
      return album;
    }
    const sql = `
      SELECT trid, trtitle, trduration, genre, arid, arname, ardesc, seq
      FROM t_album
        LEFT JOIN t_album_track USING (alid)
        INNER JOIN t_track USING (trid)
        INNER JOIN t_artist USING (arid)
      WHERE alid = ?;
      `;
    const tracks = ((await db.sql(sql, alid)) as Track[]).map((res) => {
      const track = _.pick(res, ['trid', 'trtitle', 'trduration', 'genre', 'arid', 'seq']);
      const artist = _.pick(res, ['arid', 'arname', 'ardesc']);
      (track as any).artist = artist;
      return track;
    });
    (album as any).tracks = tracks;
    return album;
  } else {
    const results = (await db.sql('SELECT * FROM t_album WHERE alid = ?', alid));
    return serializer.albumFromResult(results[0]);
  }
}

export async function recentAlbums(offset: number, limit: number) {

  const albums = (await db.sql(
    'SELECT * FROM t_album ORDER BY aldate DESC LIMIT ? OFFSET ?;',
    parseInt(limit as any, 10),
    parseInt(offset as any, 10),
  )) as Album[];

  const albumIds = albums.map((alb) => alb.alid);

  const sql = `
  SELECT alid, trid, trtitle, trduration, genre, arid, arname, ardesc
  FROM t_track
    INNER JOIN t_album_track USING (trid)
    INNER JOIN t_artist USING (arid)
  WHERE alid IN (${albumIds.map(() => '?')});
  `;

  // put track objects onto albums
  albums.forEach((al) => (al as any).tracks = []);

  // query
  const results = await db.sql(sql, ...albumIds) as any[];
  results.forEach((res) => {
    const { alid, trid, trtitle, trduration, genre, arid, arname, ardesc } = res;
    const track = { trid, trtitle, trduration, genre, arid } as Track;
    (track as any).artist = { arid, arname, ardesc };
    const album =  _.find(albums, (al) => al.alid === alid);
    ((album as any).tracks as Track[]).push(track);
  });

  return albums;
}

export async function search(keyword: string, offset: number, limit: number) {
  const sql = `
  SELECT ${serializer.albumKeys.join(',')} FROM t_album
  WHERE altitle LIKE ?
  LIMIT ? OFFSET ?;
  `;
  const countSql = `
  SELECT count(*) AS total FROM t_album
  WHERE altitle LIKE ?
  `;
  const results = (await db.sql(
    sql, `%${keyword}%`, limit, offset,
  ));
  const total = (await db.sql(countSql, `%${keyword}%`))[0].total;

  return {
    items: results.map(serializer.albumFromResult),
    total,
  };
}

export async function findByArtist(arid: string) {
  const sql = `
  SELECT DISTINCT ${serializer.albumKeys} FROM t_album
  INNER JOIN t_album_track USING (alid)
  INNER JOIN t_track USING (trid)
  WHERE arid = ?;
  `;

  const results = await db.sql(sql, arid);
  return results.map(serializer.albumFromResult);
}

export async function artistAlbums(arid: string) {
  const sql = `
  SELECT DISTINCT ${serializer.albumKeys.join(', ')}
  FROM t_album
  INNER JOIN t_album_track USING (alid)
  INNER JOIN t_track USING (trid)
  WHERE arid = ?
  ORDER BY aldate DESC;
  `;
  const results = await db.sql(sql, arid);
  return results.map(serializer.albumFromResult);
}
