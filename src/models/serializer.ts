import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as faker from 'faker';

import {
  Album,
  Playlist,
  Track,
  User,
  Artist,
  Fdtype,
  FdvalueLike,
  FdvalueFollow,
  FdvalueFollowedBy,
  FdvalueRate,
  Feed,
  FdvaluePlaylistCreate,
  FdvaluePlaylistAddTrack,
  FdvalueType,
  FdvaluePlaylistDelTrack,
} from './Models';

const fakeImage = (key: string) => {
  return (faker.image as any).imageUrl(500, 500, undefined, true);
};

export const trackKeys = ['trid', 'trtitle', 'trduration', 'genre'];

export const userKeys = ['uname', 'first_name', 'last_name', 'email', 'city'];

export const artistKeys = ['arid', 'arname', 'ardesc'];

export const playlistKeys = ['plid', 'pltitle', 'created_at', 'uname'];

export const albumKeys = ['alid', 'altitle', 'aldate'];

export const feedKeys = [
  'fdid',
  'created_at',
  'fdtype',
  'fdvalue',
];

export function prefixKeys(prefix: string, keys: string[]) {
  return keys.map((key) => `${prefix}.${key}`);
}

export function trackFromResult(result: any) {
  const track = modelFromResult(result, trackKeys) as Track;
  if (track && track.trid) {
    (track as any).artist = artistFromResult(result);
    return track;
  } else {
    return undefined;
  }
}

export function modelFromResult(result: any, keys: string[]) {
  if (_.isNil(result)) {
    return undefined;
  }
  return _.pick(result, keys);
}

export function playlistFromResult(result: any) {
  const pl = modelFromResult(result, playlistKeys) as Playlist;
  pl.creator = userFromResult(result, false);
  return pl;
}

export function albumFromResult(result: any) {
  const album = modelFromResult(result, albumKeys) as Album;
  album.coverUrl = fakeImage(album.alid);
  return album;
}

export function artistFromResult(result: any) {
  const artist = modelFromResult(result, artistKeys) as Artist;
  artist.coverUrl = fakeImage(artist.arid);
  return artist;
}

export function userFromResult(result: any, withPassword?: boolean) {
  const keys = withPassword ? userKeys : [...userKeys, 'password'];
  return modelFromResult(result, keys) as User;
}

export function feedFromResult(result: any) {
  const feed = modelFromResult(result, feedKeys) as Feed;
  feed.poster = userFromResult(result);
  try {
    feed.fdvalue = JSON.parse(result.fdvalue as string);
  } catch (error) {
    console.error('unable to parse feed.fdvalue', result);
  }
  return feed;
}
