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

async function addFeed(posterUname: string, fdtype: Fdtype, fdvalue: FdvalueType) {
  const copiedFdvalue = JSON.parse(JSON.stringify(fdvalue));
  _.values(copiedFdvalue).forEach((val) => {
    if (_.isObject(val)) {
      _.keys(val).forEach((key) => {
        if (_.isArray((val as any)[key])) {
          delete (val as any)[key];
        }
      });
    }
  });

  const json = JSON.stringify(copiedFdvalue);
  const sql = `
    INSERT INTO t_feed (poster_uname, created_at, fdtype, fdvalue, receiver_uname)
    SELECT ?, NOW(), ?, ?, follower_uname FROM t_follow
    WHERE followee_uname = ?;
  `;
  const result = await db.sql(sql, posterUname, fdtype, json, posterUname);
  const fdid = (result as any).insertId;
  return fdid;
}

async function addFeedToSpecificUser(posterUname: string, receiverUname: string, fdtype: Fdtype, fdvalue: FdvalueType) {
  const json = JSON.stringify(fdvalue);
  const sql = `
    INSERT INTO t_feed (poster_uname, created_at, fdtype, fdvalue, receiver_uname) VALUES (?, NOW(), ?, ?);
  `;
  const result = await db.sql(sql, posterUname, fdtype, json, receiverUname);
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
export async function addFollowedByFeedToSpecificUser(follower: string, followee: string) {
  return addFeedToSpecificUser(follower, followee, Fdtype.FollowedBy, {} as any);
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
    SELECT ${[
    ...serializer.feedKeys,
    ...serializer.prefixKeys('poster_user', serializer.userKeys),
    ].join(',')}
    FROM t_feed
    INNER JOIN t_user AS poster_user ON (poster_user.uname = t_feed.poster_uname)
    WHERE receiver_uname = ?
    ORDER BY fdid DESC LIMIT ? OFFSET ?;
  `;
  const countSql = `
    SELECT count(*) AS total
    FROM t_feed
    WHERE receiver_uname = ?;
  `;
  const result = await db.sql(sql, uname, limit, offset);
  const total = (await db.sql(countSql, uname))[0].total;
  return {
    items: result.map(serializer.feedFromResult),
    total,
  };
}
