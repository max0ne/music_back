import * as _ from 'lodash';
import * as mysql from 'mysql';
import * as util from '../util';

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

        err ? reject(err) : resolve(result);
        conn && conn.release();
      };

      if (params && params.length > 0) {
        conn.query(query, params, cb);
      } else {
        conn.query(query, cb);
      }
    });
  }) as Promise<any[]>;
}
