
export interface Track {
  trid: string;
  trtitle: string;
  trduration: number;
  genre: string;
  arid: string;
  rating: number;
}

export interface Album {
  alid: string;
  altitle: string;
  aldate: Date;
  tracks: Track[];
}

export interface Artist {
  arid: string;
  arname: string;
  ardesc: string;
}

export interface User {
  uname: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  password: string;
}

export interface Playlist {
  plid: string;
  pltitle: string;
  creator: User;
  created_at: Date;
  tracks: Track[];
}

enum Fdtype {
  Like = 1,
  Follow = 2,
  Rate = 3,
}

export interface FdvalueLike {
  artist: Artist;
}

export interface FdvalueFollow {
  followee: User;
}

export interface FdvalueRate {
  track: Track;
  rating: number;
}

export interface Feed {
  fdid: string;
  uname: string;
  created_at: Date;
  fdtype: Fdtype;
  fdvalue: FdvalueLike | FdvalueFollow | FdvalueRate;
}
