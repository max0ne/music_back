import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';
import * as testUtil from './testUtil';

const request = supertest('http://localhost:3000/api');

describe('playlist', () => {
  const uname1 = new Date().toISOString() + '_user1';
  const uname2 = new Date().toISOString() + '_user2';
  let tok1 = '';
  let tok2 = '';

  beforeAll(async (done) => {
    [tok1, tok2] = await Promise.all([uname1, uname2].map((uname) =>
      request
        .post('/user/register')
        .set('Accept', 'application/json')
        .send(testUtil.makeUser(uname))
        .expect(200)
        .then((res) => res.body.token),
    ));
    done();
  });

  afterAll(async (done) => {
    await Promise.all([tok1, tok2].map((tok) =>
      request
        .delete('/user')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${tok}`)
        .expect(200)
        .then((res) => res.body.token),
    ));
    done();
  });

  const pltitle = new Date().toISOString() + 'test title';
  let plid;

  const isValidPlaylist = (pl) => {
    return ['plid', 'tracks'].every((key) => _.has(pl, key));
  };

  it('can create playlist', () =>
    request
      .post('/playlist/')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({
        tracks: ['000gNUsabGghVECfQJSiww', '000OGC1A8SOrhkaZ5WfkYj'],
        pltitle,
      })
      .expect(200)
      .then((res) => {
        console.log(res.body);
        const pl = res.body;
        expect(isValidPlaylist(pl)).toBeTruthy();
        plid = pl.plid;
      }),
  );

  it('can get', () =>
    request
      .get(`/playlist`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .query({ plid })
      .expect(200)
      .then((res) => res.body)
      .then((pl) => {
        expect(isValidPlaylist(pl)).toBeTruthy();
      }),
  );

  it('can change name', () =>
    request
      .put(`/playlist/${plid}/changeName`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({ pltitle: 'new title' })
      .expect(200),
  );

  return;

  it('did change name', () =>
    request
      .get(`/playlist/${plid}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200)
      .then((res) => res.body)
      .then((pl) => {
        expect(pl.pltitle).toBe('new title');
      }),
  );
});
