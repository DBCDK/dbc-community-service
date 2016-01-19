# dbc-community-service

[![David](https://img.shields.io/david/DBCDK/dbc-community-service.svg?style=flat-square)](https://david-dm.org/DBCDK/dbc-community-service#info=dependencies)
[![David](https://img.shields.io/david/dev/DBCDK/dbc-community-service.svg?style=flat-square)](https://david-dm.org/DBCDK/dbc-community-service#info=devDependencies)

DBC community web service

## Logging
The dbc-community-service implements the [dbc-node-logger](https://github.com/DBCDK/dbc-node-logger) which makes it possible to log to Kafka among others.
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
CREATE DATABASE dbc_community;
```

Create a new user with name=communitydb and password=loobbackcommunity

```PLpgSQL
CREATE USER communitydb WITH PASSWORD 'loobbackcommunity';
GRANT ALL PRIVILEGES ON DATABASE ‘dbc_community’ TO communitydb;
```

## Environment variables

- __USE_DEFAULT_CONFIG__
This environment variable ensures the config specified in datasources.development.js. This is only supported in development mode.
