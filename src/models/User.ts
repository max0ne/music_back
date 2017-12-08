import * as bcrypt from 'bcrypt-nodejs';
import * as crypto from 'crypto';
import * as db from './db';
import { Album, Playlist, Track, User } from './Models';

export async function findByUname(uname: string) {
  const user = (await db.sql('SELECT * FROM t_user WHERE uname = ?', uname))[0] as User;
  return user;
}

export async function register(user: User) {
  const { uname, first_name, last_name, email, city, password } = user;
  await db.sql(
    'INSERT INTO t_user (uname, first_name, last_name, email, city, password) VALUES (?, ?, ?, ?, ?, ?)',
    uname, first_name, last_name, email, city, password);
}

export async function update(user: User) {
  const { uname, first_name, last_name, email, city, password } = user;
  console.log(uname);
  await db.sql(
    'UPDATE t_user SET first_name = ?, last_name = ?, email = ?, city = ? WHERE uname = ?;',
    first_name, last_name, email, city, uname);
}

export async function getFollowing(uname: string) {
  await db.sql(
    'SELECT uname, first_name, last_name, email, city FROM t_user INNER JOIN t_follow WHERE follower_uname = ?',
    uname,
  );
}

export async function getFollowedBy(uname: string) {
  await db.sql(
    'SELECT uname, first_name, last_name, email, city FROM t_user INNER JOIN t_follow WHERE followee_uname = ?',
    uname,
  );
}

export async function follow(from: string, to: string) {
  await db.sql(
    'INSERT INTO t_follow (follower_uname, followee_uname, followed_at) VALUES (?, ?, NOW())',
    from, to,
  );
}

export async function unfollow(from: string, to: string) {
  await db.sql(
    'DELETE FROM t_follow WHERE follower_uname = ? AND followee_uname = ?',
    from, to,
  );
}

export async function del(uname: string) {
  await db.sql(
    'DELETE FROM t_user WHERE uname = ?;',
    uname,
  );
}

export function compareUserPassword(user: User, password: string) {
  return user.password === password;
}

/**
 * Helper method for getting user's gravatar.
 */
function gravatar(uname: string, size: number) {
  if (!size) {
    size = 200;
  }
  const md5 = crypto.createHash('md5').update(uname).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
}
