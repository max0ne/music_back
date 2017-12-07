
export interface Track {
  trid: String;
  trtitle: String;
  trduration: number;
  genre: String;
  arid: String;
}

export interface Album {
  altitle: String;
  aldate: Date;
  tracks: [Track];
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
  tracks: [Track];
}