import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';

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

export const trackKeys = ['trid', 'trtitle', 'trduration', 'genre', 'arid'];

export const userKeys = ['uname', 'first_name', 'last_name', 'email', 'city'];

export const artistKeys = ['arid', 'arname', 'ardesc'];

export const feedKeys = [
  'fdid',
  'uname',
  'created_at',
  'fdtype',
  'fdvalue',
];

export function trackFromResult(result: any) {
  const track = modelFromResult(result, trackKeys) as Track;
  (track as any).artist = artistFromResult(result);
  return track;
}

export function modelFromResult(result: any, keys: string[]) {
  if (_.isNil(result)) {
    return undefined;
  }
  return _.pick(result, keys);
}

export function playlistFromResult(result: any) {
  return modelFromResult(result, ['plid', 'pltitle', 'uname']) as Playlist;
}

export function artistFromResult(result: any) {
  return modelFromResult(result, ['arid', 'arname', 'ardesc']) as Artist;
}

export function userFromResult(result: any, withPassword?: boolean) {
  const keys = withPassword ? userKeys : [...userKeys, 'password'];
  return modelFromResult(result, keys) as User;
}

export function feedFromResult(result: any) {
  const feed = modelFromResult(result, feedKeys) as Feed;
  feed.user = userFromResult(result);
  try {
    feed.fdvalue = JSON.parse(result.fdvalue as string);
  } catch (error) {
    console.error('unable to parse feed.fdvalue', result);
  }
  return feed;
}
