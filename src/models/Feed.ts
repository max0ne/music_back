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
import * as serializer from './serializer';

async function addFeed(uname: string, fdtype: Fdtype, fdvalue: FdvalueType) {
  const copiedFdvalue = JSON.parse(JSON.stringify(fdvalue));
  _.keys(copiedFdvalue).forEach((key) => {
    if (_.isArray(copiedFdvalue[key])) {
      delete copiedFdvalue[key];
    }
  });

  const json = JSON.stringify(copiedFdvalue);
  const sql = `
    INSERT INTO t_feed (uname, created_at, fdtype, fdvalue)
    SELECT follower_uname, NOW(), ?, ? FROM t_follow
    WHERE followee_uname = ?;
  `;
  const result = await db.sql(sql, fdtype, json, uname);
  const fdid = (result as any).insertId;
  return fdid;
}

async function addFeedToSpecificUser(specificUser: string, fdtype: Fdtype, fdvalue: FdvalueType) {
  const json = JSON.stringify(fdvalue);
  const sql = `
    INSERT INTO t_feed (uname, created_at, fdtype, fdvalue) VALUES (?, NOW(), ?, ?);
  `;
  const result = await db.sql(sql, specificUser, fdtype, json);
  const fdid = (result as any).insertId;
  return fdid;
}

export async function addLikeFeed(uname: string, fdvalue: FdvalueLike) {
  return addFeed(uname, Fdtype.Like, fdvalue);
}

export async function addFollowFeed(uname: string, fdvalue: FdvalueFollow) {
  return addFeed(uname, Fdtype.Follow, fdvalue);
}

/**
 * post a `you were followed by this guy` message, this is only supposed to be sent to `followee`
 * insetead of sending to all users followed by `followee`, so this is a rather special one
 * @param followee uname of the user to post this feed to
 */
export async function addFollowedByFeedToSpecificUser(followee: string, fdvalue: FdvalueFollowedBy) {
  return addFeedToSpecificUser(followee, Fdtype.FollowedBy, fdvalue);
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
    SELECT ${[...serializer.feedKeys, ...serializer.userKeys ].join(',')}
    FROM t_feed
    INNER JOIN t_user USING (uname)
    WHERE uname = ?
    ORDER BY fdid DESC LIMIT ? OFFSET ?;
  `;
  const countSql = `
    SELECT count(*) AS total
    FROM t_feed
    WHERE uname = ?;
  `;
  const result = await db.sql(sql, uname, limit, offset);
  const total = (await db.sql(countSql, uname))[0].total;
  return {
    items: result.map(serializer.feedFromResult),
    total,
  };
}
