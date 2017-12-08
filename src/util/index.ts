import * as _ from 'lodash';
export function getEnv(key: string, must?: boolean) {
  const val = process.env[key];
  if (must && _.isNil(val)) {
    console.error('cannot get env', key);
    process.exit(1);
  }
  return val;
}

export function sendErr(res: any, err: string) {
  console.log(err);
  res.status(400).send({err});
}

export function sendOK(res: any, msg?: string) {
  res.status(200).send({ msg: msg || 'ok' });
}
