
export interface Track {
  trid: String;
  trtitle: String;
  trduration: number;
  genre: String;
  arid: String;
}

export interface Album {
  alid: string;
  altitle: String;
  aldate: Date;
  tracks: [Track];
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
