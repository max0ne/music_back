# DB Project - Mingfei Huang
## DB Design
- entity tables
	- t_album 
		- keep tracks of albums info
		- `alid` - unique id of this album, also id of this album in Spotify data, primary key
		- `altitle` - title of album, imported from Spotify
		- `aldate` - date of album, imported from Spotify 
	- t_artist - artists info
		- `arid` - unique id of this artist, also id of this artist in Spotify data, primary key
		- `arname` - name of artist, imported from Spotify
		- `ardesc` - description of artist, imported from Spotify
	- t_playlist - playlist info, foreign key `uname` pointing to `t_user` as creator of this playlist
		- `plid` auto increment id of playlist, primary key
		- `pltitle` title of this play list
		- `uname` user name of owner of this playlist, foreign key of `t_user`, cascade update/delete of `uname` so that when a user is deleted, the playlist he/she created is also deleted
		- `created_at` - NOW() of creation time
	- t_track - tracks info
		- `trid` - unique id of this track, also id of this track in Spotify data, primary key
		- `trtitle` - title of track, imported from Spotify
		- `trduration` duration of track in milliseconds, imported from Spotify
		- `genre` - string representation of genre of this track, imported from Spotify
		- `arid` - artist of this track, foreign key to `t_artist`
	- t_user - users info
		- `uname` - unique identifier of a user
		- `first_name`, `last_name`, `email`, `city` - basic info of a user
		- `passsalt` - a salt used to salt-hash the user password
		- `passhash` - salt-hashed password, encryption of password is explained in the system design section

- relation tables
	- t_album_track - keep track of tracks within an album
		- foreign key `trid` to `t_track`
		- `alid` to `t_album`
		- `seq` - sequence of this track in this album
		- primary key (`alid`, `trid`), assuming that a track can only exist in an album almost once
	- t_follow - keep track of a following relation between a user to another user
		- foreign key `follower_uname`, `followee_uname` pointing to `t_user`
		- composite primary keys (`follower_uname`, `followee_uname`)
		- when a user unfollow another user, the record is dropped for simplicity
	- t_like - keep track a like relation between a user and an artist
		- foreign key `uname` to `t_user`
		- `arid` to `t_artist`
		- `liked_at` NOW() at moment of like
		- when user unlike a track, this item is deleted from db, no historical data is kept for simplicity
	- t_rating - keep track a rate relation between a user and a track
		- foreign key `uname` to `t_user`, `trid` to `t_track`
		- `rated_at` NOW() at moment of rate
		- primary key: (`uname`, `trid`), given that a user can only give a track one certain rate at a certain time. When a user unrated a track, the record is dropped and no historical data is kept for simplicity
> the `like`, `rating`, `follow` tables contains positive information of every action, ie. It only stores when a user did follow, did rate and did like, when the action is undo, the corresponding record is deleted from the table and no history is preserved except the feed item.  

	- t_playlist_track - keep track of tracks within a playlist
		- foreign key `trid` to `t_track`
		- foreign key `plid` to `t_playlist`
		- primary key (`plid`, `trid`), given that a track can only be added to a playlist once
		- `sequence`, sequence represented as an integer of this track in this playlist
			- when application service is trying to select all tracks of a playlist and produce an array of tracks, it would select all `sequence` numbers, order records by `sequence`
			- when to insert a track into a playlist, the track is always inserted to end of the list, so the application service would insert the sequence as `selecting largest seqence number of this plid` + 1
			- when a track is deleted from a playlist, there would be a `hole` in this playlist’s sequence numbers, but this does not produce any foreseeable problem
			- no playlist reorder feature is provided for this project but if to implement, if reorder were to be added, the application service would need to rearranged all sequence numbers when a movement is targeted to two tracks with consecutive sequence
	- t_playhist - keep track of a user played track event to provide `popularity` feature
		- foreign key `uname`, user that generated this play history
		- foreign key `trid`, track id of this history
		- `played_at` date time of this play history record is generated
		- auto incrementing primary key `phid`, serves no other purpose than making items in this list unique
> for history table `t_playhist`, I am only keeping track of a simple `user played track` event, where the track comes from is not recorded.  

![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/01DD4816-3964-4CA8-B22A-3E8229F6E128.png)
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/EFC008E6-5F2C-44B3-BC9F-9B8D7CA0BC27.png)

#### Feed Design
> For simplicity reason all types of actions create same type of feed and are stored in this table. Every time a user perform a like / follow / rate action, a feed record is created, `fdtype` is an enum value of values 1, 2, 3 corresponding to like / follow / rate event, and an application specific info can be placed into `fdvalue` key as a JSON string  

- feed table `t_feeds`
	- `receiver_uname` user name of the receiver of this feed, this is for application service to pull feeds for a specific user, keeping track of a feed item for every user
	- `fdid` foreign key to `t_feed_value` table
	- primary key (`receiver_uname`, `fdid`)
> This table keeps relation of to whom a feed item is for  

- feed contents table `t_feed_value`
	- since when a user perform an action that produces a feed, the same feed value would be pushed to all followers of this user. This t able keep track of value of these feeds
	- 	- `poster_uname` user name of the poster of this feed, this is for final display of this feed
	- 	- `fdtype` - an enum value of values 1, 2, 3 corresponding to like / follow / rate event
	- primary key `fdid` - id of this feed content
	- `fdvalue` - see below for contents of this key
> For a `like` event the application service would store the artist object as JSON into the `fdvalue` column.   
> For a `follow` event the application service would store the followee user object as JSON into the `fdvalue` column  
> For a `rate` event the application service would store the rating value and the track object under two keys of a JSON object and store the JSON string representation into the `fdvalue` column  
> The data stored into this `fdvalue` object is static and does not cascade change of `t_user` or `t_artist` or `t_track` because 1. It is easier to implement 2. Easier to create more feed event types 3. A feed item is consider as a history event, and only reflect data at the time of creation of this event.  
> Meanwhile when the data related to the feed is deleted, the feed still exists as it only represent a history, when the user tries to access information related to the feed by clicking the link, the service will yield a resource not found response.  
>   
> The feed model is designed as a `push` feed model, as that whenever a user performs a feed generating action, the application service selects all follower of this user, and insert a `feed` record to every one of them. So that the every feed item in table would have a `receiver_uname` column, so that when any user would like to see their feed, the application service would select those feeds with `receiver_uname` equal to this user.  


### Changes made in part 2
1. the Spotify data provided had non integer ids (`trid`, `alid`, `arid`) so need to change data type of those from `INT` to `VARCHAR(100)`
2. The `t_feed` I designed in part 1 only kept track of poster of the feed but didn’t kept track of receiver of this track, since the design is a `push` at publishing time, a `receiver` of this feed is also necessary to keep track of to whom this feed is for.


### Prevention of SQL Injection
Prepare statements are used to prevent SQL injection attacks, an example query is as below
```javascript
export async function findByCreatedBy(uname: string) {
  const sql = `SELECT plid FROM t_playlist WHERE uname = ?;`;
  const plids = (await db.sql(sql, uname)).map((res) => res.plid);
  const playlists = await Promise.all(plids.map(findById));
  return playlists;
}
```

### Transactions
Transactions are used to make several SQL executions atomic. An `inTransaction` wrapper function is used to perform such jobs elegantly.
```javascript
export async function create(uname: string, playlist: Playlist) {
  return db.inTransaction(async (db) => {
    const trids = playlist.tracks.map((tr) => {
      return (
        _.isString(tr) ? tr :
        _.isNumber(tr) ? tr :
        _.isString(tr.trid) || _.isNumber(tr.trid) ?
        tr.trid : undefined
      );
    }).filter((tr) => !_.isNil(tr));

    const result = await db.sql(
      `INSERT INTO t_playlist (pltitle, created_at, uname) VALUES (?, NOW(), ?)`,
      playlist.pltitle, uname,
    );

    const plid = (result as any).insertId;

    await Promise.all(trids.map((trid, idx) =>
      db.sql(`INSERT INTO t_playlist_track (plid, trid, seq) VALUES (?, ?, ?);`, plid, trid, idx),
    ));

    const inserted = await(findById(plid));
    return inserted;
  });
}
```

Implementation of `inTransaction`:
```javascript
function TransactionDB(connection: mysql.PoolConnection): TransactionDB {
  return {
    sql: (query: string, ...params: any[]) => new Promise((resolve, reject) => {
      const cb = (err: any, result: any) => {
        err && console.error(err);
        err ? reject(err) : resolve(result);
      };
		connection.query(query, params || [], cb);
    }),
  };
}

export function inTransaction<T>(task: (db: TransactionDB) => Promise<T>) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err || !conn) {
        throw (err || new Error('cannot get mysql connection'));
      } else {
        conn.beginTransaction(async () => {
          try {
            const result = await task(TransactionDB(conn));
            conn.commit();
            resolve(result);
            return result;
          } catch (error) {
            conn.rollback();
			   throw (error || new Error('transaction failed'));
          }
        });
      }
    });
  }) as Promise<T>;
}
```


## System Design
A traditional server/client system is used, with 
	- a `nodejs` backend serving on the `mysql` db, hosting a restful api
	- a  `vue.js` frameworked web frontend

### Password salt
The password in `t_user` is stored in hashed value instead of plain text to avoid exposing user passwords in case of a db data being stolen. The password field is also salted with a randomly generated salt value when the user registers so that the hashed password won’t be vulnerable to hash collision attach.
When the user registers, a salt value is generated and stored to this users’ record, and the password is salt-hashed to a hash value and stored into this users’ record.
When the user tries to login with password, the application service queries for this user’s salt, salt hash the password the user had sent and compare that with the hash salted value in db.

### User profile system
[JSON Web Token](https://jwt.io/introduction/) is used to validate user credentials for api calls. At login / register time the service would issue a JWT with `uname` field and `timeout` field and signed with server credentials to send to frontend application, then the front end application would store this token into browser local storage. When making API calls this token would be carried as `Authorization` field of all requests headers, the backend receives this token, validate signature and timeout, and a request user middleware is used to query user of this request, inject user of this request into request context for all later request handlers to use. When a token is not valid, timeouted, or the user is not found in db, the user context middleware would issue a `403` response, upon receiving this response, the frontend application would redirect its location to homepage of site and terminate all user related actions.
When user would like to logout of application, the frontend simply discards it’s JWT from local storage and redirect itself back to homepage, no request is needed.

All APIs are authentication required other than browse section of homepage for simplicity reason

### Error handling
All backend errors are pushed to frontend by same restful response format with body of response in format of:
```json
{ "err": "<error message>" }
```
For simplicity reason, all frontend shares the same error handler by intercepter of requests, the intercepter observes the request, if a 4** or 5** response code is received, it would read `err` of response body and send an alert with the error message to UI

## User interaction
The front end of the site is composed by these parts:

### Home / Browse page
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/DE70D15D-0133-4E37-8D36-429E9D9472B6.png)

The landing page of the site, does not need login to view, contains `popular albums` and `popular artists` sections, which are albums and artists that recently received most by users. This data is achieved by selecting those albums/artists with tracks having most play count aggregated by every month, sql as below
```javascript
export async function popularArtists() {
  const sql = `
  SELECT ${serializer.prefixKeys('ar', serializer.artistKeys).join(',')}, playedMonth, count(*) AS playCount FROM (
    SELECT
      arid,
      concat(DATE_FORMAT(played_at,'%Y-%m')) AS playedMonth
    FROM t_playhist
    INNER JOIN t_track USING (trid)
  ) AS _
  INNER JOIN t_artist AS ar USING (arid)
  GROUP BY ar.arid, playedMonth
  ORDER BY playedMonth DESC, playCount DESC
  LIMIT 5;
  `;
  const result = await db.sql(sql);
  return result.map(serializer.artistFromResult);
}
```


### Sidebar
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/B2F8B2A1-6ACA-4338-8975-39A506D43099.png)
This is a side menu of the site, user can create / open playlist, go back to browse here. When user is not login the sidebar is not added to ui because no valid action can be performed if the user is not logged into system on sidebar


### Signup and login Model
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/5BBA0005-6684-4BD7-95E3-0045A696AA07.png)
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/30044BF9-9119-4410-B3F2-BD1043C96353.png)
A simple modal is used to do signup, if an error is detected the error message is toasted to ui.

### User Menu
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/75930EC0-ADED-4C5C-896C-BCB451ED7208.png)
A menu is shown below user name with a list of user related actions. When logout is hit the site would be redirected back to `browse` page

### Following / followed by
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/0263069A-87EE-4069-AD72-075374492A8D.png)
After the user had signing, a list of following user is available to see in a list

### User Modal
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/61F420AD-EBCB-4B12-8D03-040561511709.png)
When a user name is clicked a modal with the user’s info is presented, the user can follow other user by this modal


### Feed
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/C3B08790-2656-4026-9403-4A41FF5060FB.png)
A list of user related feed items in `Feed` page. These are actions performed by users that the current user is following

### Playlist Detain
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/00AE6C30-8E75-4627-BCBA-32D0B49DC857.png)
In playlist detail page list of all tracks in this playlist is shown
These playlist related actions are performed
1. Rename playlist
2. Delete track from playlist
3. Delete playlist

### Track Item
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/E5D34B5F-812F-43A8-8EF4-AE1BE7CD1395.png)
All track items at all place of the site have stars shown on the track if the current user had rated the track. An intercepter style middleware is added to application service so that whenever any API response contains any tracks, the intercepter would find all `trid`s, query db for user ratings and average community rating of these tracks and inject ratings onto those response track objects. As code shown below
```javascript
export function insertTrackRates() {
  return util.mungJsonAsync(async (body, req, res) => {
    if (!_.has(req, ['user', 'uname'])) {
      return body;
    }
    const ids = [] as string[];
    util.findObjectsWithKey('trid')(body, (track) => ids.push(track.trid));
    const [userRatings, communityRatings] = await Promise.all([
      TrackDB.getRatingsForTracks(req.user.uname, ids),
      TrackDB.getCommunityRatingForTracks(ids),
    ]);
    // tslint:disable-next-line:no-null-keyword
    util.findObjectsWithKey('trid')(body, (track) => {
    // tslint:disable-next-line:no-null-keyword
      track.userRating = userRatings[track.trid] || null;
    // tslint:disable-next-line:no-null-keyword
      track.communityRating = communityRatings[track.trid] || null;
    });
    return body;
  });
}
```

### Artist Detail
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/2216DFCD-AA11-4D8F-8BD8-20DB4AC8CC34.png)
Detail page of artist consist of three sections
1. Toggle button of current user likeness of this artist
2. Popular Tracks - top at most 10 tracks from this artist that are ordered by number of listen history by users, SQL as below
```javascript
export async function popularArtistTracks(arid: string) {
  const sql = `
  SELECT ${serializer.trackKeys.join(', ')}, sum(CASE WHEN uname IS NULL THEN 0 ELSE 1 END) AS playCount
  FROM t_track
    LEFT JOIN t_playhist
    USING (trid)
  WHERE arid = ?
  GROUP BY trid
  ORDER BY playCount DESC
  LIMIT 10;
  `;
  const results = await db.sql(sql, arid);
  const tracks = results.map(serializer.trackFromResult);
  return tracks;
}
```
3. Albums of this artists
4. Similar artists to this artist. This is done by the sql from part 1
```javascript
export async function similarArtists(arid: string) {
  const sql = `
  SELECT
    arid1,
    arid2,
    commonFanCount,
    sum(fanCount) AS undistinctTotalFanCount,
    sum(fanCount) - commonFanCount AS totalFanCount,
    commonFanCount / (sum(fanCount) - commonFanCount) AS commonFansToTotalFansRatio
  FROM
    (
      SELECT
        l1.arid  AS arid1,
        l2.arid  AS arid2,
        count(*) AS commonFanCount
      FROM t_like AS l1, t_like AS l2
      WHERE l1.arid < l2.arid
            AND l1.uname = l2.uname
      GROUP BY arid1, arid2
    ) AS commonFans
  JOIN (
        SELECT arid, count(*) AS fanCount
        FROM t_like
        GROUP BY arid) AS f1
  ON commonFans.arid1 = f1.arid OR commonFans.arid2 = f1.arid
  WHERE arid1 = ?
  OR arid2 = ?
  GROUP BY arid1, arid2
  HAVING commonFansToTotalFansRatio >= 0.5
  ORDER BY commonFansToTotalFansRatio
  LIMIT 5;`;
  const results = await db.sql(sql, arid, arid);
  let arids = _.concat(_.map(results, 'arid1'), _.map(results, 'arid2'));
  arids = arids.filter((ar) => ar !== arid);
  return findByIds(arids);
}
```

### Album Detail
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/2EA66852-440F-4C42-8D2A-606BE801AB40.png)
This is just copy pasted code from playlist

### Search
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/DD2F8F06-3DC3-41D7-ABF0-0DDA5913C519.png)
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/8BB5C405-5608-445E-97C9-C77FD60388BC.png)
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/7F20F611-A0B7-4864-A743-CDC9995EED15.png)
![](DB%20Project%20-%20Mingfei%20Huang/DB%20Project%20-%20Mingfei%20Huang/25B8162C-BBD8-4668-9983-E200AC0A0117.png)
These are searchable entities
1. Track - search based on track name and genre
2. Album - search based on album name
3. Artist - search based on artist name and artist description
4. Playlist - search based on playlist name
> search results are paginated, each time 10 items are fetched to avoid too much memory/network traffic  
