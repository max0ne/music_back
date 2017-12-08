import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';

const request = supertest('http://localhost:3000/api');

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

// describe('POST /playlist/:uname', () => {
//   it('should return 200', () =>
//     request
//       .post(`/playlist`)
//       .set('Authorization', `Bearer ${token}`)
//       .expect(200),
//   );
// });

// describe('GET /playlist/:uname', () => {
//   it('should return 200', () =>
//     request
//       .get(`/user/${randomUserName}`)
//       .set('Authorization', `Bearer ${token}`)
//       .expect(200),
//   );
// });

describe('POST /user', () => {
  it('should return 200', () =>
    request
      .delete('/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200),
  );
});
