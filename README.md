# dbc-profileservice
DBC profile web service

## How to install

#### Postgres

Login with postgres user and open psql client.

```
sudo -i -u postgres
psql
```

Now create a new database

```
CREATE DATABASE profile;
```

Create a new user with name=loopback and password=somerandompassword

```
CREATE USER loopback WITH PASSWORD 'somerandompassword';
GRANT ALL PRIVILEGES ON DATABASE ‘profile’ TO loopback;
```
