# filename: sonnette.py
"""Sonnette social network back-end"""

import hug, sqlite3, json, os, re
from datetime import datetime
DIRECTORY = os.path.dirname(os.path.realpath(__file__))

# Prepare database requests
conn = sqlite3.connect("data.db")
conn.row_factory = sqlite3.Row #enable column access by name: row['column_name']
db = conn.cursor()
#conn.close() #called when script ends (I guess...)

##############
# Static pages

@hug.static("/public")
def staticDirs():
    """Returns static directory names to be served"""
    return ("public/",)

#############################
# HTML main page (1-page app)

@hug.get("/", output=hug.output_format.html)
def app():
    """Main page, lazily loading all required informations from here"""
    with open(os.path.join(DIRECTORY, "index.html")) as document:
        return document.read()

#########################
# API: get,post,update...

def parseData(body):
    """Turn a dictionary into a convenient tuple of question marks, fields & values"""
    tupleFields = tuple(list(body.keys()))
    fields = str(tupleFields) if len(tupleFields) > 1 else "(" + str(tupleFields[0]) + ")"
    qmarks = ("?," * len(body))[:-1] #values placeholders
    values = tuple(list(body.values()))
    return fields, qmarks, values

@hug.post("/users")
def create_user(body):
    fields, qmarks, values = parseData(body)
    cursor = db.execute("""
        INSERT INTO users
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()
    return json.dumps({ "id": cursor.lastrowid })

@hug.get("/users/{id}")
def get_user(id: int):
    row = db.execute("""
        SELECT *
        FROM users
        WHERE id = ?""", (id,)).fetchone()
    conn.commit()
    return json.dumps(dict(row if row else { }))

@hug.put("/users/{id}")
def update_user(id: int, body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        UPDATE users
        SET """ + fields + " = (" + qmarks + """)
        WHERE id = ?""", values+(id,))
    conn.commit()

@hug.get("/users")
def get_users():
    rows = db.execute("SELECT * FROM users").fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.get("/posts")
def get_posts(view: int, type: str):
    rows = db.execute("""
        SELECT *
        FROM posts
        WHERE reference = ? AND reftype = ?""", (view,type)).fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.get("/posts/{id}")
def get_post(id: int):
    row = db.execute("""
        SELECT *
        FROM posts
        WHERE id = ?""", (id,)).fetchone()
    conn.commit()
    return json.dumps( dict(row) if row else { } )

@hug.put("/posts/{id}")
def update_post(body):
    fields, qmarks, values = parseData(body)
    row = db.execute("""
        UPDATE posts
        SET (""" + qmarks + ") VALUES (" + qmarks + """)
        WHERE id = ?""", subst+(id,))
    conn.commit()

@hug.delete("/posts/{id}")
def delete_post(id: int):
    """Delete a post and its comments"""
    db.execute("""
        DELETE FROM posts
        WHERE id = ? OR (reftype = 'post' AND reference = ?)""", (id,id))
    conn.commit()

@hug.post("/posts")
def create_post(body):
    fields, qmarks, values = parseData(body)
    cursor = db.execute("""
        INSERT INTO posts
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()
    return json.dumps({ "id": cursor.lastrowid })

# Return "none", "confirmed", "requested" or "unanswered"
@hug.get("/friend_status")
def get_friend_status(login: int, view: int):
    # "login" user is viewing "view": check both sides of friend_with table
    row = db.execute("""
        WITH friendship AS
            (SELECT *, count(*) AS num_rows
            FROM friend_with
            WHERE (source = ? AND target = ?) OR (source = ? AND target = ?))
        SELECT
            CASE num_rows
                WHEN 0 THEN 'none'
                WHEN 2 THEN 'confirmed'
                WHEN 1 THEN
                    CASE source
                        WHEN ? THEN 'requested'
                        ELSE 'unanswered'
                    END
            END AS status
        FROM friendship
        LIMIT 1""",
        (login,view,view,login,login)).fetchone()
    conn.commit()
    return json.dumps(dict(row))

@hug.get("/friends/{id}")
def get_friends(id: int):
    # NOTE: set additional (varchar) field 'friendship_lvl', equal to
    # 'confirmed', 'requested' or 'unanswered', respectively if friendship is bilateral,
    # request sent by user 'id', or request yet unanswered by user 'id'
    rows = db.execute("""
        WITH friendships AS
            (SELECT
                count(*) AS num_rows,
                CASE source
                    WHEN ? THEN target
                    ELSE source
                END AS id_friend,
                CASE source
                    WHEN ? THEN ?
                    ELSE ?
                END AS tmp_status
            FROM friend_with
            WHERE source = ? OR target = ?
            GROUP BY id_friend)
        SELECT
            CASE num_rows
                WHEN 1 then tmp_status
                ELSE "confirmed"
            END AS friendship_lvl,
            id,name,email,location,birthdate,gender,avatar
        FROM
            friendships JOIN users
            ON id_friend = id""",
        (id,id,"requested","unanswered",id,id,)).fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.post("/friends")
def new_friendship_line(source: int, target: int):
    db.execute("INSERT INTO friend_with VALUES (?,?)", (source,target))
    conn.commit()

@hug.delete("/friends")
def delete_friend(source: int, target: int):
    db.execute("""
        DELETE FROM friend_with
        WHERE source = ? AND target = ?""", (source,target))
    conn.commit()

# Return True if some followed people did something (post somewhere, create group,
# create event) since our last notifications check ('looknews' field)
@hug.get("/something_new/{id}")
def check_news(id: int):
    """Check if something happened in followed people timeline since last check"""
    row = db.execute("""
        SELECT *
        FROM timelines
        WHERE
            user in
                (SELECT target
                FROM follow
                WHERE follower = ?)
            AND timestamp >
                (SELECT looknews
                FROM users
                WHERE id = ?)
        LIMIT 1""", (id,id)).fetchone()
    conn.commit()
    return json.dumps({ "somethingNew": True if row else False })

# Return a list of all actions by followed people, since 'looknews'
@hug.get("/notifications/{id}")
def get_news(id: int):
    rows = db.execute("""
        WITH notifications AS
            (SELECT *
            FROM timelines
            WHERE
                user in
                    (SELECT target
                    FROM follow
                    WHERE follower = ?)
                AND timestamp >
                    (SELECT looknews
                    FROM users
                    WHERE id = ?))
        SELECT name AS user_name
        FROM users
        JOIN notifications
        ON id = user""", (id,id)).fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.post("/groups")
def create_group(body):
    fields, qmarks, values = parseData(body)
    cursor = db.execute("""
        INSERT INTO groups
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()
    return json.dumps({ "id": cursor.lastrowid })

@hug.post("/events")
def create_event(body):
    fields, qmarks, values = parseData(body)
    cursor = db.execute("""
        INSERT INTO events
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()
    return json.dumps({ "id": cursor.lastrowid })

@hug.get("/groups/{id}")
def get_group(id: int):
    row = db.execute("SELECT * FROM groups WHERE id = ?", (id,)).fetchone()
    conn.commit()
    return json.dumps( dict(row) )

@hug.get("/groups")
def get_groups():
    rows = db.execute("SELECT * FROM groups").fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.get("/events/{id}")
def get_event(id: int):
    row = db.execute("SELECT * FROM events WHERE id = ?", (id,)).fetchone()
    conn.commit()
    return json.dumps( dict(row) )

@hug.get("/events")
def get_events():
    rows = db.execute("SELECT * FROM events").fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.delete("/groups/{id}")
def get_event(id: int):
    """Delete a group and its posts"""
    db.execute("DELETE FROM groups WHERE id = ?", (id,))
    db.execute("""
        WITH posts_ids AS
            (SELECT id
            FROM posts
            WHERE reftype = 'group' AND reference = ?)
        DELETE FROM posts
        WHERE (id IN posts_ids OR (reftype = 'post' AND reference IN posts_ids)""", (id,))
    conn.commit()

@hug.delete("/events/{id}")
def get_event(id: int):
    """Delete an event and its posts"""
    db.execute("DELETE FROM events WHERE id = ?", (id,))
    db.execute("""
        WITH posts_ids AS
            (SELECT id
            FROM posts
            WHERE reftype = 'event' AND reference = ?)
        DELETE FROM posts
        WHERE (id IN posts_ids OR (reftype = 'post' AND reference IN posts_ids)""", (id,))
    conn.commit()

@hug.put("/groups/{id}")
def update_group(body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        UPDATE groups
        SET (""" + qmarks + ") VALUES (" + qmarks + """)
        WHERE id = ?""", subst+(id,))
    conn.commit()

@hug.put("/events/{id}")
def update_event(body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        UPDATE events
        SET (""" + qmarks + ") VALUES (" + qmarks + """)
        WHERE id = ?""", subst+(id,))
    conn.commit()

@hug.get("/involved")
def is_involved(user: int, event: int):
    row = db.execute("""
        SELECT *
        FROM participate
        WHERE event = ? AND user = ?""", (event,user)).fetchone()
    conn.commit();
    return json.dumps(dict(row) if row else { })

@hug.get("/belong_to")
def belong_to(user: int, grp: int):
    row = db.execute("""
        SELECT *
        FROM belong_to
        WHERE grp = ? AND user = ?""", (grp,user)).fetchone()
    conn.commit();
    return json.dumps(dict(row) if row else { })

@hug.post("/involved")
def sign_in(body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        INSERT INTO participate
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()

@hug.post("/belong_to")
def join_grp(body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        INSERT INTO belong_to
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()

@hug.delete("/participate")
def sign_out(user: int, event: int):
    db.execute("DELETE FROM participate WHERE user = ? AND event = ?", (user,event))
    conn.commit()

@hug.delete("/belong_to")
def quit_grp(user: int, grp: int):
    db.execute("DELETE FROM belong_to WHERE user = ? AND grp = ?", (user,grp))
    conn.commit()

@hug.get("/conversations/{id}")
def get_conversations(id: int):
    """Find all summaries of exchanges with all people"""
    rows = db.execute("""
        WITH conversations AS
            (SELECT created,
                CASE sender
                    WHEN ? THEN receiver
                    ELSE sender
                END AS user_id
            FROM messages
            WHERE sender = ? OR receiver = ?)
        SELECT name AS user_name
        FROM users
        JOIN conversations
        ON id = user_id""", (id,id,id)).fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.get("/messages")
def get_messages(user1: int, user2: int):
    rows = db.execute("""
        SELECT *
        FROM messages
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)""",
        (user1,user2,user2,user1)).fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )

@hug.delete("/messages")
def delete_messages(user1: int, user2: int):
    db.execute("""
        DELETE FROM messages
        WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)""",
        (user1,user2,user2,user1,))
    conn.commit()

@hug.post("/messages")
def create_message(body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        INSERT INTO messages
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()

@hug.delete("/messages/{id}")
def delete_message():
    db.execute("DELETE FROM messages WHERE id = ?", (id,))

@hug.get("/follow_status")
def get_follow_status(login: int, view: int):
    row = db.execute("""
        SELECT 1
        FROM follow
        WHERE follower = ? AND target = ?""", (login,view)).fetchone();
    conn.commit()
    return json.dumps({"status": True} if row else {})

@hug.post("/follow")
def create_follow(body):
    fields, qmarks, values = parseData(body)
    db.execute("""
        INSERT INTO follow
        """ + fields + " VALUES (" + qmarks + ")", values)
    conn.commit()

@hug.delete("/follow")
def delete_follow(follower: int, target: int):
    db.execute("DELETE FROM follow WHERE follower = ? AND target = ?", (follower,target))
    conn.commit()

@hug.get("/comments/{id}")
def get_comments(id: int):
    rows = db.execute("SELECT * FROM posts WHERE reftype = 'post' AND reference = ?", (id,)).fetchall()
    conn.commit()
    return json.dumps( [dict(ix) for ix in rows] )
