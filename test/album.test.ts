import * as testUtil from './testUtil';

import { } from 'jest';
import * as supertest from 'supertest';
import * as _ from 'lodash';

const request = supertest('http://localhost:3000/api');

function assertIsArtist(obj) {
  return [
    'arid',
    'arname',
    'ardesc',
  ].every((key) => _.has(obj, key));
}

function assertIsTrack(obj) {
  return [
    'trid',
    'trtitle',
    'trduration',
    'genre',
    'arid',
  ].every((key) => _.has(obj, key));
}

function assertIsAlbum(obj) {
  return [
    'alid', 'aldate', 'altitle', 'aldate', 'tracks',
  ].every((key) => _.has(obj, key));
}

describe('GET /album', () => {
  it('should return 200 with some stuff', () =>
    request
      .get('/album/new')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${testUtil.token}`)
      // .query({ limit: 20, offset: 20 })
      .expect(200)
      .then((res) => {
        const albums = res.body;
        const tracks = albums[0].tracks;
        const atist = tracks[0].artist;
        expect(_.isArray(res.body)).toBeTruthy();
        expect(assertIsAlbum(albums[0])).toBeTruthy();
        expect(assertIsTrack(tracks[0])).toBeTruthy();
        expect(assertIsArtist(tracks[0].artist)).toBeTruthy();
      }),
    );
});

describe('GET /album?id=...', () => {
  it('should get album with a specific id', () =>
    request
      .get('/album')
      .query({ id: '0ETFjACtuP2ADo6LFhL6HN' })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${testUtil.token}`)
      .expect(200)
      .then((res) => {
        const album = res.body;
        expect(assertIsAlbum(album));
        expect(assertIsTrack(album.tracks[0]));
        expect(assertIsArtist(album.tracks[0].artist));
      }),
  );
});
