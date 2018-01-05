import * as _ from 'lodash';
import { Handler, NextFunction, Request, Response } from 'express';
import * as errorHandler from 'errorhandler';
import * as mung from 'express-mung';

export function getEnv(key: string, must?: boolean) {
  const val = process.env[key];
  if (must && _.isNil(val)) {
    console.error('cannot get env', key);
    process.exit(1);
  }
  return val;
}

export function sendErr(res: any, err: string, status?: number) {
  res.status(status || 400).send({ err });
}

export function send404(res: any, whatNotFound?: string) {
  res.status(400).send({ err: `${whatNotFound || 'resource'} not found` });
}

export function sendUnauthorized(res: any) {
  res.status(400).send({ err: 'not allowed' });
}

export function sendOK(res: any, msg?: string) {
  res.status(200).send({ msg: msg || 'ok' });
}

export function isValidParam(...params: any[]) {
  return params.every((param) => _.isString(param) || _.isNumber(param));
}

export function catchAsyncError(handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    }
    catch (error) {
      handleError(error, req, res, next);
    }
  };
}

export function handleError(error: Error, req: Request, res: Response, next: NextFunction) {
  console.error(error);
  errorHandler()(error, req, res, next);
}

export const findObjectsWithKey = (obj: any, key: string) => {
  const findIt = (obj: any, cb: (found: any) => void) => {
    if (_.isNil(obj)) {
      return;
    } else if (_.isString(obj) || _.isNumber(obj)) {
      return;
    } else if (_.isArray(obj)) {
      obj.forEach((obj) => findIt(obj, cb));
    } else {
      if (_.has(obj, key)) {
        cb(obj);
      } else {
        _.values(obj).forEach((obj) => findIt(obj, cb));
      }
    }
  };
  const founds = [] as any[];
  findIt(obj, (found) => founds.push(found));
  return founds;
};

export const mungJsonAsync = (handler: (...params: any[]) => Promise<any>) => {
  return mung.jsonAsync(async (body, req, res) => {
    try {
      return await handler(body, req, res);
    } catch (error) {
      handleError(error, req, res, () => { });
    }
  });
};
