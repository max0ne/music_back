require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const db = require('../dist/models/db');

require('dotenv').config();

let queue = [];
let current;
function insertFile(fname, lineToSqlAndParam) {
  push(__insertFile(fname, lineToSqlAndParam));
}

function push(stuff) {
  if (!current) {
    current = stuff;
  } else {
    queue.push(stuff);
  }
}

function pop() {
  const last = queue.pop();
  current = last;
  last.then(pop);
}

function __insertFile(fname, lineToSqlAndParam) {
  return new Promise((resolve, reject) => {

    const sql = [];
    const sqlParams = [];
    const sqlThens = [];

    const reader = readline.createInterface({
      input: require('fs').createReadStream(fname)
    });

    let firstLine = true;
    let lineNumber = 0;
    reader.on('line', (line) => {
      if (lineNumber ++ % 1000 == 0) {
        console.log(lineNumber);
      }
      if (firstLine) {
        firstLine = false;
        return;
      }
      lineToSqlAndParam(line).then(([ss, pp, then]) => 
        db.sql(ss, ...pp)
          .catch(err => {
            if (err.code === 'ER_DUP_ENTRY') {
              return;
            } else {
              // console.error(err.code, 'failed to insert', ss, ...pp);
            }
          })
      );
    });
  });
}

const albumTrackCount = {};

insertFile('dataset/tracks.csv', (line) => {
  // TrackId,TrackName,TrackDuration,TrackArtist,AlbumId,,,,,,,,,,
  // 4sPmO7WMQUAf45kwMOtONw,Hello,295493,Adele,0K4pIOOsfJ9lK8OjrZfXzd,,,,,,,,,,
  const [trid, trtile, trduration, artistName, alid] = line.split(',');
  const count = albumTrackCount[alid] || 0;
  albumTrackCount[alid] = count + 1;
  return Promise.resolve([
    `
    INSERT INTO t_album_track (alid, trid, seq) VALUES (
      ?, ?, ?
    );
    `,
    [alid, trid, count],
  ]);
});

insertFile('dataset/tracks.csv', (line) => {
  // TrackId,TrackName,TrackDuration,TrackArtist,AlbumId,,,,,,,,,,
  // 4sPmO7WMQUAf45kwMOtONw,Hello,295493,Adele,0K4pIOOsfJ9lK8OjrZfXzd,,,,,,,,,,
  const [trid, trtile, trduration, artistName] = line.split(',');
  return Promise.resolve([
    `
    INSERT INTO t_track (trid, trtitle, trduration, arid) VALUES (?, ?, ?, (
      SELECT arid FROM t_artist WHERE arname = ?
    ));
    `,
    [trid, trtile, trduration / 1000, artistName],
  ]);
});

insertFile('dataset/artists.csv', (line) => {
  // ArtistId,ArtistTitle,ArtistDescription,,
  // 4dpARuHxo51G3z768sgnrY,Adele,dance pop pop post-teen pop ,,
  const [arid, arname, ardesc] = line.split(',');
  return Promise.resolve([
    'INSERT INTO t_artist (arid, arname, ardesc) VALUES (?, ?, ?);',
    [arid, arname, ardesc],
  ]);
});

insertFile('dataset/albums.csv', (line) => {
  // alid,altitle,aldate,,
  // 0K4pIOOsfJ9lK8OjrZfXzd,25,6/24/16,,,
  const [alid, altitle, aldate] = line.split(',');
  const [month, date, year] = (aldate || '').split('/');
  const validAldate = (month && date && year) ? `${year || 2017}/${month || 1}/${date || 1}` : new Date();
  return Promise.resolve([
    'INSERT INTO t_album (alid, altitle, aldate) VALUES (?, ?, ?);',
    [alid, altitle, validAldate],
  ]);
});
