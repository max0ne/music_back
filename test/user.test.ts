import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';

const request = supertest('https://c007f22c.ngrok.io/api');

const randomUserName = `test_user_${new Date().toISOString()}`;
const user = {
  uname: randomUserName,
  password: 'hahahhahah',
  first_name: 'fooo',
  email: 'hah@hah.com',
};
const changedUserName = 'hahha';

let token: string | undefined;

describe('POST /user/register', () => {
  it('should return 200', () =>
    request
      .post('/user/register')
      .set('Accept', 'application/json')
      .send(user)
      .expect(200)
      .then((res) => {
        token = res.body.token;
        expect(res.body.token).toBeTruthy();
        expect(res.body.user).toBeTruthy();
      }),
  );
});

describe('POST /user/login', () => {
  it('should return 200', () =>
    request
      .post('/user/login')
      .set('Accept', 'application/json')
      .send(user)
      .expect(200)
      .then((res) => {
        token = res.body.token;
        expect(res.body.token).toBeTruthy();
        expect(res.body.user).toBeTruthy();
      }),
    );
});

describe('GET /user/:uname', () => {
  it('should return 200', () =>
    request
      .get(`/user/${randomUserName}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200),
  );
});

describe('PUT /user/update', () => {
  const updated = JSON.parse(JSON.stringify(user));
  updated.first_name = changedUserName;
  delete updated.password;
  it('should update stuff', () =>
    request
      .put(`/user/update`)
      .send(updated)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((res) => {
        expect(_.eq(res.body, updated));
      }),
  );
});

describe('GET /user/:uname', () => {
  it('should return 200', () =>
    request
      .get(`/user/${randomUserName}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((res) => {
        expect(_.eq(res.body.first_name, changedUserName));
      }),
  );
});

describe('POST /user', () => {
  it('should return 200', () =>
    request
      .delete('/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200),
  );
});

describe('GET /user/:uname', () => {
  it('should return 404 after delete', () =>
    request
      .get(`/user/${randomUserName}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404),
  );
});

// describe('GET /album/whatever', () => {
//   it('should return 404', () =>
//     request
//       .get('/album/whatever')
//       .expect(404),
//   );
// });

// describe('GET /playlist/whatever', () => {
//   it('should return 404', () =>
//     request
//       .get('/playlist/whatever')
//       .expect(404),
//   );
// });

// describe('POST /playlist', () => {
//   it('should return 200', () =>
//     request
//       .post('/playlist')
//       .send({
//         pltitle: 'pltitle',
//         tracks: [1, 2, 3],
//       })
//       .expect(200),
//   );
// });
