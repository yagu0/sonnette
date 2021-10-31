# Sonnette

Attempt to write a small social network for DB learning purpose.
Students were supposed to write the API - see files api.py and api\_skeleton.py.

However, this project is not well written, although I believe the idea isn't bad.
I'll rewrite it someday.

## Steps to run it locally

1. Install [hug](http://www.hug.rest/)
2. Setup database: just run ".read tables.sql" after "sqlite3 data.db". <br>
   Also create a first user with at least a name: <br>
   ```insert into users (name) values ('Bob');```
3. ```hug -f app.py```
4. Navigate to [http://localhost:8000/?login=1](http://localhost:8000/?login=1)

Warning: some routes or tables seem unused, expect some errors...
