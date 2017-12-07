import * as bcrypt from 'bcrypt-nodejs';
import * as config from '../config/config';
import * as db from './db';
import { Album, Playlist, Track, User } from './Models';
import * as TrackDB from './Track';

export async function findById(alid: string, withTracks: boolean) {
  if (withTracks) {
    const album: Album = (await findById(alid, false)) as Album;
    const tracks = (await db.sql('SELECT trid, trtitle, trduration, genre, arid FROM t_album INNER JOIN t_track WHERE alid = 1;', alid)) as Track[];
    (album as any).tracks = tracks;
    return album;
  } else {
    const album = (await db.sql('SELECT * FROM t_album WHERE alid = ?', alid))[0] as Album;
    return album;
  }
}
