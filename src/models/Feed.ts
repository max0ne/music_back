import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
import * as config from '../config/config';
import * as db from './db';
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

import * as TrackDB from './Track';
import * as UserDB from './User';
import { modelFromResult } from './modelUtil';
import { userFromResult } from './User';

export const feedKeys = [
  'fdid',
  'uname',
  'created_at',
  'fdtype',
  'fdvalue',
];

export function feedFromResult(result: any) {
  const feed = modelFromResult(result, feedKeys) as Feed;
  feed.user = userFromResult(result);
  return feed;
}

async function addFeed(uname: string, fdtype: Fdtype, fdvalue: FdvalueType) {
  const json = JSON.stringify(fdvalue);
  const sql = `
    INSERT INTO t_feed (uname, created_at, fdtype, fdvalue)
    SELECT follower_uname, NOW(), ?, ? FROM t_follow
    WHERE followee_uname = ?;
  `;
  const result = await db.sql(sql, fdtype, json, uname);
  const fdid = (result as any).insertId;
  return fdid;
}

export async function addLikeFeed(uname: string, fdvalue: FdvalueLike) {
  return addFeed(uname, Fdtype.Like, fdvalue);
}

export async function addFollowFeed(uname: string, fdvalue: FdvalueFollow) {
  return addFeed(uname, Fdtype.Follow, fdvalue);
}

export async function addFollowedByFeed(uname: string, fdvalue: FdvalueFollowedBy) {
  return addFeed(uname, Fdtype.FollowedBy, fdvalue);
}

export async function addRateFeed(uname: string, fdvalue: FdvalueRate) {
  return addFeed(uname, Fdtype.Rate, fdvalue);
}

export async function addPlaylistCreateFeed(uname: string, fdvalue: FdvaluePlaylistCreate) {
  return addFeed(uname, Fdtype.PlaylistCreate, fdvalue);
}

export async function addPlaylistAddTrackFeed(uname: string, fdvalue: FdvaluePlaylistAddTrack) {
  return addFeed(uname, Fdtype.PlaylistAddTrack, fdvalue);
}

export async function addPlaylistDelTrackFeed(uname: string, fdvalue: FdvaluePlaylistDelTrack) {
  return addFeed(uname, Fdtype.PlaylistDelTrack, fdvalue);
}

export async function getFeeds(uname: string, offset: number, limit: number) {
  const sql = `
    SELECT ${[...feedKeys, ...UserDB.keys ].join(',')}
    FROM t_feed
    INNER JOIN t_user USING (uname)
    WHERE uname = ?
    ORDER BY fdid DESC LIMIT ? OFFSET ?;
  `;
  const result = await db.sql(sql, uname, limit, offset);
  return result.map(feedFromResult);
}
