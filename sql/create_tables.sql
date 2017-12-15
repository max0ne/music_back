create table t_album
(
    alid varchar(100) not null
        primary key,
    altitle varchar(100) null,
    aldate datetime null
)
;

create table t_album_track
(
    alid varchar(100) not null,
    trid varchar(100) not null,
    seq int null,
    primary key (alid, trid),
    constraint t_album_track_t_album_alid_fk
        foreign key (alid) references t_album (alid)
            on update cascade on delete cascade
)
;

create index t_album_track_t_track_trid_fk
    on t_album_track (trid)
;

create table t_artist
(
    arid varchar(100) not null
        primary key,
    arname varchar(100) null,
    ardesc varchar(1000) null
)
;

create table t_feed
(
    fdid int not null,
    receiver_uname varchar(100) not null,
    primary key (fdid, receiver_uname)
)
;

create index t_feeded_t_user_uname_fk
    on t_feed (receiver_uname)
;

create table t_feed_value
(
    fdid int auto_increment
        primary key,
    poster_uname varchar(100) not null,
    created_at datetime null,
    fdtype int not null,
    fdvalue longtext null
)
;

create index t_feed_t_user_uname_fk
    on t_feed_value (poster_uname)
;

alter table t_feed
    add constraint t_feed_t_feed_value_fdid_fk
        foreign key (fdid) references t_feed_value (fdid)
            on update cascade on delete cascade
;

create table t_follow
(
    follower_uname varchar(100) not null,
    followee_uname varchar(100) not null,
    followed_at datetime not null,
    primary key (follower_uname, followee_uname)
)
;

create index t_follow_t_user_uname_fk_followee
    on t_follow (followee_uname)
;

create table t_like
(
    uname varchar(100) not null,
    arid varchar(100) not null,
    like_at datetime null,
    primary key (uname, arid),
    constraint t_like_t_artist_arid_fk
        foreign key (arid) references t_artist (arid)
            on update cascade on delete cascade
)
;

create index t_like_t_artist_arid_fk
    on t_like (arid)
;

create table t_playhist
(
    uname varchar(100) not null,
    trid varchar(100) not null,
    played_at datetime not null,
    primary key (uname, trid, played_at)
)
;

create index t_playhist_t_track_trid_fk
    on t_playhist (trid)
;

create table t_playlist
(
    plid int auto_increment
        primary key,
    pltitle varchar(100) null,
    created_at datetime null,
    uname varchar(100) not null
)
;

create index t_playlist_t_user_uname_fk
    on t_playlist (uname)
;

create table t_playlist_track
(
    plid int not null,
    trid varchar(100) not null,
    seq int null,
    primary key (plid, trid),
    constraint t_playlist_track_t_playlist_plid_fk
        foreign key (plid) references t_playlist (plid)
            on update cascade on delete cascade
)
;

create index t_playlist_track_t_track_trid_fk
    on t_playlist_track (trid)
;

create table t_rating
(
    uname varchar(100) not null,
    trid varchar(100) not null,
    rating int not null,
    rated_at datetime not null,
    primary key (uname, trid)
)
;

create index t_rating_t_track_trid_fk
    on t_rating (trid)
;

create table t_track
(
    trid varchar(100) not null
        primary key,
    trtitle varchar(1000) null,
    trduration int not null,
    genre varchar(100) null,
    arid varchar(100) null,
    constraint t_track_t_artist_arid_fk
        foreign key (arid) references t_artist (arid)
            on update cascade on delete set null
)
;

create index t_track_t_artist_arid_fk
    on t_track (arid)
;

alter table t_album_track
    add constraint t_album_track_t_track_trid_fk
        foreign key (trid) references t_track (trid)
            on update cascade on delete cascade
;

alter table t_playhist
    add constraint t_playhist_t_track_trid_fk
        foreign key (trid) references t_track (trid)
            on update cascade on delete cascade
;

alter table t_playlist_track
    add constraint t_playlist_track_t_track_trid_fk
        foreign key (trid) references t_track (trid)
            on update cascade on delete cascade
;

alter table t_rating
    add constraint t_rating_t_track_trid_fk
        foreign key (trid) references t_track (trid)
            on update cascade on delete cascade
;

create table t_user
(
    uname varchar(100) not null
        primary key,
    first_name varchar(100) null,
    last_name varchar(100) null,
    email varchar(100) null,
    city varchar(100) null,
    password varchar(100) not null,
    passsalt varchar(100) not null
)
;

alter table t_feed
    add constraint t_feeded_t_user_uname_fk
        foreign key (receiver_uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_feed_value
    add constraint t_feed_t_user_uname_fk
        foreign key (poster_uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_follow
    add constraint t_follow_t_user_uname_fk
        foreign key (follower_uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_follow
    add constraint t_follow_t_user_uname_fk_follower
        foreign key (follower_uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_follow
    add constraint t_follow_t_user_uname_fk_followee
        foreign key (followee_uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_like
    add constraint t_like_t_user_uname_fk
        foreign key (uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_playhist
    add constraint t_playhist_t_user_uname_fk
        foreign key (uname) references t_user (uname)
            on delete cascade
;

alter table t_playlist
    add constraint t_playlist_t_user_uname_fk
        foreign key (uname) references t_user (uname)
            on update cascade on delete cascade
;

alter table t_rating
    add constraint t_rating_t_user_uname_fk
        foreign key (uname) references t_user (uname)
            on update cascade on delete cascade
;

