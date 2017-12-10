import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';
import * as testUtil from './testUtil';
import { Fdtype } from '../src/models/Models';
import { request } from './testUtil';

describe('playlist', () => {
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
  let plid;

  const checkFeeds = (message) => {
    it(`check feeds after ${message}`, () =>
      request
        .get(`/feed`)
        .query({ plid })
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

  const isValidPlaylist = (pl) => {
    return ['plid', 'tracks'].every((key) => _.has(pl, key));
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
        const pl = res.body;
        expect(isValidPlaylist(pl)).toBeTruthy();
        plid = pl.plid;

        expectedFdtypes.push(Fdtype.PlaylistCreate);
      }),
  );

  checkFeeds('create playlist');

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

  checkFeeds('change name');

  it('did change name', () =>
    request
      .get(`/playlist`)
      .query({ plid })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200)
      .then((res) => res.body)
      .then((pl) => {
        expect(pl.pltitle).toBe('new title');
      }),
  );

  it('can get mine', () =>
    request
      .get('/playlist/mine')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200)
      .then((res) => {
        expect(_.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(1);
        expect(isValidPlaylist(res.body[0]));
        expect(res.body[0].plid).toBe(plid);
      }),
  );

  it('can get others', () =>
    request
      .get(`/playlist/@${uname1}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok2}`)
      .expect(200)
      .then((res) => {
        expect(_.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(1);
        expect(isValidPlaylist(res.body[0]));
        expect(res.body[0].plid).toBe(plid);
      }),
  );

  it('can addTrack', () =>
    request
      .put(`/playlist/${plid}/addTrack`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({ trid: '001LKjMxQcD7impp1Fxfsj' })
      .expect(200)
      .then(() => {
        expectedFdtypes.push(Fdtype.PlaylistAddTrack);
      }),
  );

  checkFeeds('add track');

  it('can addTrack again', () =>
    request
      .put(`/playlist/${plid}/addTrack`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({ trid: '0021ajfstgNduRZ9N2ak7P' })
      .expect(200)
      .then(() => {
        expectedFdtypes.push(Fdtype.PlaylistAddTrack);
      }),
  );

  checkFeeds('add track');

  it('did addTrack', () =>
    request
      .get(`/playlist`)
      .query({ plid })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200)
      .then((res) => res.body)
      .then((pl) => {
        expect(pl.tracks.length).toBe(4);
        expect(_.map(pl.tracks, 'trid').indexOf('001LKjMxQcD7impp1Fxfsj')).not.toBe(-1);
      }),
  );

  it('can delTrack', () =>
    request
      .put(`/playlist/${plid}/delTrack`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .send({ trid: '001LKjMxQcD7impp1Fxfsj' })
      .expect(200)
      .then(() => {
        expectedFdtypes.push(Fdtype.PlaylistDelTrack);
      }),
  );

  checkFeeds('del track');

  it('did delTrack', () =>
    request
      .get(`/playlist`)
      .query({ plid })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200)
      .then((res) => res.body)
      .then((pl) => {
        expect(pl.tracks.length).toBe(3);
        expect(_.map(pl.tracks, 'trid').indexOf('001LKjMxQcD7impp1Fxfsj')).toBe(-1);
      }),
  );

  it('can delete playlist', () =>
    request
      .delete(`/playlist/${plid}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200),
  );

  it('did delete playlist', () =>
    request
      .get(`/playlist`)
      .query({ plid })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(404),
  );

  checkFeeds('del playlist');

});
