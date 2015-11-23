# dbc-profileservice

[![David](https://img.shields.io/david/DBCDK/dbc-profileservice.svg?style=flat-square)](https://david-dm.org/DBCDK/dbc-profileservice#info=dependencies)
[![David](https://img.shields.io/david/dev/DBCDK/dbc-profileservice.svg?style=flat-square)](https://david-dm.org/DBCDK/dbc-profileservice#info=devDependencies)

DBC profile web service

## Logging
The dbc-profileservice implements the [dbc-node-logger](https://github.com/DBCDK/dbc-node-logger) which makes it possible to log to Kafka among others.
To enure your logs will be transported to Kafka the following environment variables should be set:

- __KAFKA_TOPIC__
This defines which topic in Kafka the log messages should be associated with

- __KAFKA_HOST__
String that defines the Zookeeper connectionstring. Should be defined as `host:port`.
see [winston-kafka-transport](https://www.npmjs.com/package/winston-kafka-transport)

## How to install

### Postgres

Login with postgres user and open psql client.

```Shell
sudo -i -u postgres
psql
```


Now create a new database

```PLpgSQL
CREATE DATABASE profile;
```

Create a new user with name=loopback and password=somerandompassword

```PLpgSQL
CREATE USER loopback WITH PASSWORD 'somerandompassword';
GRANT ALL PRIVILEGES ON DATABASE ‘profile’ TO loopback;
```
