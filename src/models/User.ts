import * as bcrypt from 'bcrypt-nodejs';
import * as crypto from 'crypto';
import * as db from './db';
import * as _ from 'lodash';
import { Album, Playlist, Track, User } from './Models';
import * as serializer from './serializer';
import * as util from '../util';

export async function findByUname(uname: string, withPassword?: boolean) {
  const user = (await db.sql('SELECT * FROM t_user WHERE uname = ?', uname))[0] as User;
  if (user) {
    user.avatar = gravatar(uname, 100);
  }
  if (!withPassword) {
    return removePassword(user);
  } else {
    return user;
  }
}

function removePassword<T>(userOrUsers: T): T {
  if (_.isArray(userOrUsers)) {
    (userOrUsers as any as User[]).forEach((user) => {
      delete user.password;
      delete (user as any).passsalt;
    });
  } else if (userOrUsers) {
    delete (userOrUsers as any).password;
    delete (userOrUsers as any).passsalt;
  }
  return userOrUsers;
}

export async function register(user: User) {
  const { uname, first_name, last_name, email, city, password } = user;

  const salt = bcrypt.genSaltSync();
  const passhash = bcrypt.hashSync(password, salt);

  await db.sql(
    'INSERT INTO t_user (uname, first_name, last_name, email, city, password, passsalt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    uname, first_name, last_name, email, city, passhash, salt);
}

export async function update(user: User) {
  const { uname, first_name, last_name, email, city } = user;
  console.log(uname);
  await db.sql(
    'UPDATE t_user SET first_name = ?, last_name = ?, email = ?, city = ? WHERE uname = ?;',
    first_name, last_name, email, city, uname);
}

export async function getFollowing(uname: string) {
  const users = await db.sql(
    'SELECT uname, first_name, last_name, email, city FROM t_user INNER JOIN t_follow ON (uname = followee_uname) WHERE follower_uname = ?',
    uname,
  ) as User[];
  return removePassword(users);
}

export async function getFollowedBy(uname: string) {
  const users = await db.sql(
    'SELECT uname, first_name, last_name, email, city FROM t_user INNER JOIN t_follow ON (uname = follower_uname) WHERE followee_uname = ?',
    uname,
  ) as User[];
  return removePassword(users);
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
  return user.password === bcrypt.hashSync(password, (user as any).passsalt);
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
