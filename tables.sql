CREATE TABLE IF NOT EXISTS users (
	id INTEGER,
	name VARCHAR NOT NULL,
	email VARCHAR,
	location VARCHAR,
	birthdate DATE,
	gender CHARACTER,
	avatar TEXT,
	looknews DATETIME,
	PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS groups (
	id INTEGER,
	name VARCHAR NOT NULL,
	description TEXT,
	created DATETIME,
	PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS events (
	id INTEGER,
	name VARCHAR NOT NULL,
	moment DATE NOT NULL,
	description TEXT,
	created DATETIME,
	PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS messages (
	id INTEGER,
	created DATETIME NOT NULL,
	content TEXT NOT NULL,
	receiver INTEGER NOT NULL,
	sender INTEGER not null,
	deleted_by VARCHAR, --'sender' or 'receiver' (then the message is effectively removed)
	PRIMARY KEY (id),
	FOREIGN KEY (receiver) REFERENCES users(id),
	FOREIGN KEY (sender) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS posts (
	id INTEGER,
	content TEXT NOT NULL,
	created DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
	-- NOTE: reftype = wall, post, group or event (no foreign key check)
	-- Alternative: inherited types ==> one table per type, need more joins...
	reftype VARCHAR NOT NULL,
	reference INTEGER NOT NULL,
	author INTEGER not null,
	PRIMARY KEY (id),
	FOREIGN KEY (author) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS likes (
	user INTEGER,
	post INTEGER,
	timestamp DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
	PRIMARY KEY (user,post),
	FOREIGN KEY (user) REFERENCES users(id),
	FOREIGN KEY (post) REFERENCES posts(id)
);
CREATE TABLE IF NOT EXISTS follow (
	follower INTEGER,
	target INTEGER,
	PRIMARY KEY (follower,target),
	FOREIGN KEY (follower) REFERENCES users(id),
	FOREIGN KEY (target) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS friend_with (
	source INTEGER,
	target INTEGER,
	timestamp DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
	PRIMARY KEY (source,target),
	FOREIGN KEY (source) REFERENCES users(id),
	FOREIGN KEY (target) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS participate (
	event INTEGER,
	user INTEGER,
	creator BOOLEAN,
	timestamp DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
	PRIMARY KEY (event,user),
	FOREIGN KEY (event) REFERENCES events(id),
	FOREIGN KEY (user) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS belong_to (
	grp INTEGER,
	user INTEGER,
	creator BOOLEAN,
	timestamp DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
	PRIMARY KEY (grp,user),
	FOREIGN KEY (grp) REFERENCES groups(id),
	FOREIGN KEY (user) REFERENCES users(id)
);
-- TODO: next table was forgotten...
CREATE TABLE IF NOT EXISTS timelines (
  timestamp DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
  user INTEGER,
  thing TEXT,
  FOREIGN KEY (user) REFERENCES users(id)
);
