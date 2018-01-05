import * as crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import * as _ from 'lodash';
import * as superagent from 'superagent';

import {
  Album,
  Artist,
  Feed,
  Playlist,
  Track,
  User,
  Fdtype,
  FdvalueLike,
  FdvalueFollow,
  FdvalueFollowedBy,
  FdvalueRate,
  FdvaluePlaylistCreate,
  FdvaluePlaylistAddTrack,
  FdvaluePlaylistDelTrack,
} from '../models/Models';

import * as TrackDB from '../models/Track';
import * as ArtistDB from '../models/Artist';
import * as util from '../util';

export function insertArtistLikeds() {
  return util.mungJsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }

    const artists = util.findObjectsWithKey(body, 'arid') as Artist[];
    const ids = _.map(artists, 'arid');
    const likeds = await ArtistDB.findLiked(req.user.uname, ids);
    artists.forEach((ar) => ar.liked = likeds[ar.arid]);
    return body;
  });
}

export function insertTrackRates() {
  return util.mungJsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }

    const tracks = util.findObjectsWithKey(body, 'trid') as Track[];
    const ids = _.map(tracks, 'trid');
    const [userRatings, communityRatings] = await Promise.all([
      TrackDB.getRatingsForTracks(req.user.uname, ids),
      TrackDB.getCommunityRatingForTracks(ids),
    ]);
    tracks.forEach((track) => {
    // tslint:disable-next-line:no-null-keyword
      track.userRating = userRatings[track.trid] || null;
    // tslint:disable-next-line:no-null-keyword
      track.communityRating = communityRatings[track.trid] || null;
    });
    return body;
  });
}

const SpotifyWebApi = require('spotify-web-api-node');

export function insertCoverUrls() {
  const clientId = util.getEnv('SPOTIFY_CLIENT_ID', false);
  const clientSecret = util.getEnv('SPOTIFY_CLIENT_SECRET', false);
  if (!clientId || !clientSecret) {
    return;
  }
  const spotifyAPI = new SpotifyWebApi({
    clientId, clientSecret,
  });
  const refreshToken = async () => {
    const token = new Buffer(`${clientId}:${clientSecret}`).toString('base64');
    const res = await superagent
      .post('https://accounts.spotify.com/api/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Authorization', `Basic ${token}`)
      .send({ grant_type: 'client_credentials' });
    spotifyAPI.setAccessToken(res.body.access_token);
  };
  // spotify token expires every 60 mins
  setInterval(refreshToken, 1000 * 60 * 30);
  // refresh it on app launch
  refreshToken();

  return util.mungJsonAsync(async (body, req, res) => {
    try {
      const albums = util.findObjectsWithKey(body, 'alid') as Album[];
      const artists = util.findObjectsWithKey(body, 'arid') as Artist[];

      if (albums.length > 0) {
        refreshToken();
        const alids = _.map(albums, 'alid');
        const spotifyAlbums = (await spotifyAPI.getAlbums(alids)).body.albums;
        albums.forEach((al) => {
          al.coverUrl = spotifyAlbums.find((sa: any) => sa.id === al.alid).images[0].url;
        });
      }

      if (artists.length > 0) {
        const arids = _.map(artists, 'arid');
        const spotifyArtists = (await spotifyAPI.getArtists(arids)).body.artists;
        artists.forEach((ar) => {
          ar.coverUrl = spotifyArtists.find((sa: any) => sa.id === ar.arid).images[0].url;
        });
      }
    } catch (error) {
      console.error(error);
    }

    return body;
  });
}
