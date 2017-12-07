import * as _ from 'lodash';
export function getEnv(key: string, must?: boolean) {
  const val = process.env[key];
  if (must && _.isNil(val)) {
    console.error('cannot get env', key);
    process.exit(1);
  }
  return val;
}
