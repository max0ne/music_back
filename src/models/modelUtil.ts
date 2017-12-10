import * as bcrypt from 'bcrypt-nodejs';
import * as _ from 'lodash';
export function modelFromResult(result: any, keys: string[]) {
  if (_.isNil(result)) {
    return undefined;
  }
  return _.pick(result, keys);
}
