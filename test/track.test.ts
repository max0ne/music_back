import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';
import * as testUtil from './testUtil';

const request = supertest('http://localhost:3000/api');

describe('follow stuff', async () => {
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

  it('have zero follows after reg', async () =>
    request
      .get('/user/followedBy')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${tok1}`)
      .expect(200)
      .then((res) => {
        const followed = res.body;
        expect(_.isArray(followed)).toBeTruthy();
        expect(followed.length).toBe(0);
      }),
  );
});
