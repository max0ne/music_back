import * as _ from 'lodash';
import * as mysql from 'mysql';
import * as util from '../util';
import { reject } from 'bluebird';

let pool: mysql.Pool | undefined;

function setupPool() {
  pool = mysql.createPool({
    host: util.getEnv('DB_HOST', true),
    user: util.getEnv('DB_USER', true),
    password: util.getEnv('DB_PASS', true),
    database: util.getEnv('DB_DATABASE', true),
    connectionLimit: util.getEnv('DB_POOL_LIMIT', false) || 50,
    multipleStatements: true,
  });
}

export function sql(query: string, ...params: any[]) {
  if (_.isNil(pool)) {
    setupPool();
  }

  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err || !conn) {
        return reject(err || 'cannot get mysql connection');
      }

      const cb = (err: any, result: any) => {
        Object.keys(query);
        Object.keys(params);

        err && console.error(err);
        err ? reject(err) : resolve(result);
        conn && conn.release();
      };

      params = params || [];
      const sqlQuery = conn.query(query, params, cb);
      console.log(sqlQuery.sql);
    });
  }) as Promise<any[]>;
}

export interface TransactionDB {
  sql: (query: string, ...params: any[]) => Promise<any[]>;
}

function TransactionDB(connection: mysql.PoolConnection): TransactionDB {
  return {
    sql: (query: string, ...params: any[]) => new Promise((resolve, reject) => {
      const cb = (err: any, result: any) => {
        Object.keys(query);
        Object.keys(params);

        err && console.error(err);
        err ? reject(err) : resolve(result);
      };

      params = params || [];
      const sqlQuery = connection.query(query, params, cb);
      console.log(sqlQuery.sql);
    }),
  };
}

export function inTransaction<T>(task: (db: TransactionDB) => Promise<T>) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err || !conn) {
        throw (err || new Error('cannot get mysql connection'));
      } else {
        conn.beginTransaction(async () => {
          try {
            const result = await task(TransactionDB(conn));
            conn.commit();
            resolve(result);
            return result;
          } catch (error) {
            conn.rollback();
            reject(error);
          }
        });
      }
    });
  }) as Promise<T>;
}
