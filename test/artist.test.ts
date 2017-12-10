import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';
import * as testUtil from './testUtil';
import { Fdtype } from '../src/models/Models';
import { request } from './testUtil';

describe('artist', () => {
  const uname1 = new Date().toISOString() + '_user1';
  const uname2 = new Date().toISOString() + '_user2';
  const uname3 = new Date().toISOString() + '_user3';
  let tok1 = '';
  let tok2 = '';
  let tok3 = '';

  beforeAll(async (done) => {
    [tok1, tok2, tok3] = await Promise.all([uname1, uname2, uname3].map((uname) =>
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
    await Promise.all([tok1, tok2, tok3].map((tok) =>
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
  const expectedFdtypes = [] as Fdtype[];
  const arid = '026v3mvWdRvVdjL67VBySh';

  const checkFeeds = (message) => {
    it(`check feeds after ${message}`, () =>
      request
        .get(`/feed`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${tok3}`)
        .expect(200)
        .then((res) => {
          const feeds = res.body;
          expect(_.isArray(feeds.items)).toBeTruthy();
          expect(_.map(feeds.items, 'fdtype')).toEqual(_.reverse([...expectedFdtypes]));
          expect(feeds.total).toEqual(expectedFdtypes.length);
        }),
    );
  };

  const expectValidArtist = (ar) => {
    expect(_.has(ar, 'arid')).toBe(true);
    expect(_.has(ar, 'arname')).toBe(true);
    expect(_.has(ar, 'ardesc')).toBe(true);
  };

  it('can follow other with return 200', async () =>
    Promise.all([
      request
        .post('/user/follow')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${tok3}`)
        .send({ uname: uname1 })
        .expect(200),
      request
        .post('/user/follow')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${tok3}`)
        .send({ uname: uname2 })
        .expect(200),
    ]),
  );

  checkFeeds('after followed others');

  it('can get artist', () =>
    request
      .get('/artist')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .query({ arid })
      .expect(200)
      .then((res) => {
        expectValidArtist(res.body);
      }),
  );

  it('can like artist', () =>
    request
      .post(`/artist/like`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({ arid })
      .expect(200)
      .then(() => {
        expectedFdtypes.push(Fdtype.Like);
      }),
  );

  checkFeeds('like artist');

  it('did liked artist', () =>
    request
      .get('/artist')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .query({ arid })
      .expect(200)
      .then((res) => {
        expectValidArtist(res.body);
        expect(res.body.liked).toBe(true);
      }),
  );

  it('can unlike artist', () =>
    request
      .post(`/artist/unlike`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({ arid })
      .expect(200),
  );

  it('did unliked artist', () =>
    request
      .get('/artist')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .query({ arid })
      .expect(200)
      .then((res) => {
        expectValidArtist(res.body);
        expect(res.body.liked).not.toBeTruthy();
      }),
  );

  checkFeeds('after unlike');
});
