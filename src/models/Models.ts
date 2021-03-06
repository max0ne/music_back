
export interface Track {
  trid: string;
  trtitle: string;
  trduration: number;
  genre: string;
  arid: string;
  userRating: number;
  communityRating: number;
}

export interface Album {
  alid: string;
  altitle: string;
  aldate: Date;
  tracks: Track[];
  coverUrl: string;
}

export interface Artist {
  arid: string;
  arname: string;
  ardesc: string;
  coverUrl: string;

  /**
   * liked by current user
   */
  liked: boolean;
}

export interface User {
  uname: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  password: string;
  avatar: string;
}

export interface Playlist {
  plid: string;
  pltitle: string;
  creator: User;
  created_at: Date;
  tracks: Track[];
}

export enum Fdtype {
  Like = 1,
  Follow = 2,
  FollowedBy = 3,
  Rate = 4,
  PlaylistCreate = 5,
  PlaylistAddTrack = 6,
  PlaylistDelTrack = 7,
  PlaylistOfLikedArtistAddTrack = 8,
}

export interface FdvalueLike {
  artist: Artist;
}

export interface FdvalueFollow {
  followee: User;
}

// export interface FdvalueFollowedBy {
//   follower: User;
// }
export type FdvalueFollowedBy = undefined;

export interface FdvalueRate {
  track: Track;
  rating: number;
}

export interface FdvaluePlaylistCreate {
  playlist: Playlist;
}

export interface FdvaluePlaylistAddTrack {
  playlist: Playlist;
  track: Track;
}

export interface FdvaluePlaylistDelTrack {
  playlist: Playlist;
  track: Track;
}

export interface FdvaluePlaylistOfLikedArtistAddTrack {
  playlist: Playlist;
  artist: Artist;
  track: Track;
}

export type FdvalueType = (
  FdvalueLike
  | FdvalueFollow
  | FdvalueFollowedBy
  | FdvalueRate
  | FdvaluePlaylistCreate
  | FdvaluePlaylistAddTrack
  | FdvaluePlaylistDelTrack
  | FdvaluePlaylistOfLikedArtistAddTrack
);

export interface Feed {
  fdid: string;
  /**
   * the person that posted this feed
   */
  poster_uname: string;
  poster: User;
  created_at: Date;
  fdtype: Fdtype;
  fdvalue: FdvalueType;
}
