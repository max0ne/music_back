import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User } from './Models';
import * as TrackDB from './Track';
import * as UserDB from './User';

async function __findById(id: string, withTracks: boolean) {
  if (withTracks) {
    const playlist: Playlist = (await __findById(id, false)) as Playlist;
    const tracks = (await db.sql('SELECT trid, trtitle, trduration, genre, arid FROM t_playlist INNER JOIN t_track WHERE plid = ?;', id)) as Track[];
    (playlist as any).tracks = tracks;
    return playlist;
  } else {
    const playlist = (await db.sql('SELECT * FROM t_playlist WHERE plid = ?', id))[0] as Playlist;
    return playlist;
  }
}

export async function findById(id: string, withTracks: boolean) {
  const playlist = await __findById(id, withTracks);
  if (playlist && _.isString(playlist.creator)) {
    playlist.creator = await UserDB.findByUname(playlist.creator as string);
  }
  return playlist;
}

export async function create(uname: string, playlist: Playlist) {
  const trids = playlist.tracks.map((tr) => {
    return (
      _.isString(tr) ? tr :
      _.isNumber(tr) ? tr :
      _.isString(tr.trid) || _.isNumber(tr.trid) ? tr.trid : undefined
    );
  }).filter((tr) => !_.isNil(tr));

  const result = await db.sql(
    `INSERT INTO t_playlist (pltitle, uname) VALUES (?, ?, NOW(), ?)`,
    playlist.pltitle, uname,
  );

  console.log('create result', result);
  const plid = undefined as string;

  await Promise.all(trids.map((trid, idx) =>
    db.sql(`INSERT INTO t_playlist_track (plid, trid, seq) VALUES (?, ?, ?);`, plid, trid, idx),
  ));
}
